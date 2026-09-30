from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form, Depends, Request
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import logging
from pathlib import Path
from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from typing import List, Optional, Any, Union
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
from jose import JWTError, jwt
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import shutil
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
import razorpay
import logging
from io import BytesIO
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
try:
    from PIL import Image as PILImage
    PIL_AVAILABLE = True
    try:
        from pillow_heif import register_heif_opener
        register_heif_opener()
        logging.info("HEIF/HEIC support enabled for image compression.")
    except ImportError:
        logging.warning("pillow-heif not installed. HEIC image compression disabled.")
except ImportError:
    PIL_AVAILABLE = False
    logging.warning("Pillow not installed. Server-side image compression disabled.")

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# ============================================================
# SECURITY: All secrets MUST come from environment variables.
# Refuse to start if critical secrets are missing.
# ============================================================
_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "")
if not _SECRET_KEY or _SECRET_KEY == "your-secret-key-change-in-production":
    raise RuntimeError("SECURITY ERROR: JWT_SECRET_KEY env var is not set or is using the insecure default. Set a strong random secret.")
SECRET_KEY = _SECRET_KEY

_RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
_RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
if not _RAZORPAY_KEY_ID or not _RAZORPAY_KEY_SECRET:
    raise RuntimeError("SECURITY ERROR: RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables.")
KEY_ID = _RAZORPAY_KEY_ID
KEY_SECRET = _RAZORPAY_KEY_SECRET

ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 30
security = HTTPBearer()

UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
api_router = APIRouter(prefix="/api")

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Razorpay Client
rzp_client = razorpay.Client(auth=(KEY_ID, KEY_SECRET))

# WhatsApp Config (Business Number)
BUSINESS_WHATSAPP = "+918421968737"
WHATSAPP_API_KEY = os.environ.get("WHATSAPP_API_KEY", "")


class Address(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    label: str = "Home"  # Home, Office, etc.
    full_name: str
    mobile: str
    address_line: str
    city: str
    state: str
    pincode: str
    is_default: bool = False


class AddressCreate(BaseModel):
    label: str = "Home"
    full_name: str
    mobile: str
    address_line: str
    city: str
    state: str
    pincode: str
    is_default: bool = False


class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    email: EmailStr
    mobile: str
    address: str = ""  # Legacy support
    addresses: List[Address] = []
    password_hash: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    mobile: str
    address: str
    password: str

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one number')
        return v

    @field_validator('mobile')
    @classmethod
    def validate_mobile(cls, v):
        digits = ''.join(c for c in v if c.isdigit())
        if len(digits) < 10:
            raise ValueError('Mobile number must be at least 10 digits')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Admin(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str


class Collection(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    is_active: bool = True
    show_on_home: bool = False
    home_image_url: Optional[str] = ""
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class CollectionCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    is_active: bool = True
    show_on_home: bool = False
    home_image_url: Optional[str] = ""


class Product(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    collection_id: str
    description: str
    sizes: List[str]
    color: str
    size_guide: Optional[str] = ""
    quantity: int
    size_quantities: Optional[dict] = Field(default_factory=dict)
    price: float
    discount_price: Optional[float] = None
    is_trending: bool = False
    is_new_arrival: bool = False
    is_best_seller: bool = False
    images: List[str] = []
    video_url: Optional[str] = ""
    is_active: bool = True
    weight: float = 0.5
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ProductResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    name: str
    collection_id: str
    collection_name: Optional[str] = ""
    description: str
    sizes: List[str]
    color: str
    size_guide: Optional[str] = ""
    quantity: int
    size_quantities: Optional[dict] = Field(default_factory=dict)
    price: float
    discount_price: Optional[float] = None
    is_trending: bool
    is_new_arrival: bool
    is_best_seller: bool
    images: List[str]
    video_url: Optional[str] = ""
    is_active: bool
    weight: float = 0.5
    created_at: datetime


class BulkProductItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    name: str
    collection_id: Optional[str] = ""
    collection_name: Optional[str] = ""
    description: Optional[str] = ""
    sizes: Optional[Any] = None
    color: Optional[str] = "Default"
    size_guide: Optional[str] = ""
    quantity: Optional[int] = 1
    size_quantities: Optional[dict] = Field(default_factory=dict)
    price: float
    discount_price: Optional[float] = None
    is_trending: Optional[bool] = False
    is_new_arrival: Optional[bool] = False
    is_best_seller: Optional[bool] = False
    images: Optional[List[str]] = Field(default_factory=list)
    video_url: Optional[str] = ""
    weight: Optional[float] = 0.5


class BulkProductsRequest(BaseModel):
    products: List[BulkProductItem]


class CartItem(BaseModel):
    product_id: str
    quantity: int
    size: str


class Cart(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    items: List[CartItem] = []
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OrderItem(BaseModel):
    product_id: str
    product_name: str
    size: str
    quantity: int
    price: float
    color: Optional[str] = ""
    image_url: Optional[str] = ""


class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    customer_name: str
    customer_email: str
    customer_mobile: str
    delivery_address: str
    items: List[OrderItem]
    total_amount: float
    status: str = "Pending"
    payment_id: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class OrderCreate(BaseModel):
    items: List[OrderItem]
    total_amount: float
    delivery_address: Optional[str] = None


class Banner(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    image_url: str
    title: str
    content: str
    order: int = 0
    is_active: bool = True


class BannerCreate(BaseModel):
    image_url: str
    title: str
    content: str
    order: int = 0
    is_active: bool = True


class ContentPage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    content: str
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ContentUpdate(BaseModel):
    content: str


class PaymentCreate(BaseModel):
    amount: float = Field(..., ge=1)


class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    product_id: str
    user_id: Optional[str] = None
    user_name: str
    rating: int = Field(..., ge=1, le=5)
    comment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReviewCreate(BaseModel):
    rating: int = Field(..., ge=1, le=5)
    comment: str
    user_name: Optional[str] = None


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except ValueError:
        return False


def create_token(data: dict, expires_days: int = TOKEN_EXPIRE_DAYS) -> str:
    """Create a JWT token with an expiry claim for security."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=expires_days)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_user_from_db(user_id: str):
    """Robustly fetch user by id string or MongoDB _id with self-healing."""
    if not user_id:
        return None
    # 1. Direct query by string 'id'
    user = await db.users.find_one({"id": user_id})
    if user:
        return user
    # 2. Try ObjectId query on '_id'
    try:
        if ObjectId.is_valid(user_id):
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            if user:
                canon_id = user.get("id") or str(user["_id"])
                await db.users.update_one({"_id": user["_id"]}, {"$set": {"id": canon_id}})
                user["id"] = canon_id
                return user
    except Exception:
        pass
    # 3. Try string query on '_id'
    user = await db.users.find_one({"_id": user_id})
    if user:
        canon_id = user.get("id") or str(user["_id"])
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"id": canon_id}})
        user["id"] = canon_id
        return user
    return None


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        user_type: str = payload.get("type")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        if user_type == "admin":
            admin = await db.admins.find_one({"$or": [{"id": user_id}, {"_id": user_id}]})
            if not admin:
                raise HTTPException(status_code=401, detail="Admin session expired. Please log in again.")
            return {"id": user_id, "type": "admin"}
        else:
            user = await get_user_from_db(user_id)
            if not user:
                raise HTTPException(status_code=401, detail="User account not found or session expired. Please log in again.")
            canonical_id = user.get("id") or str(user.get("_id"))
            return {"id": canonical_id, "type": "user"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired session. Please log in again.")


async def get_current_admin(current_user: dict = Depends(get_current_user)):
    if current_user["type"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


async def send_whatsapp_message(to_number: str, message: str):
    try:
        # Ensure number has + prefix
        if not to_number.startswith('+'):
            if len(to_number) == 10:
                to_number = '+91' + to_number
            else:
                to_number = '+' + to_number
                
        print(f"Sending WhatsApp to {to_number}: {message}")
        
        # Here you would typically integrate with a provider like Twilio, Gupshup, or Meta Cloud API
        if not WHATSAPP_API_KEY:
            # For now, just logging since we don't have a provider yet
            logging.info(f"WHATSAPP LOG: To {to_number} -> {message}")
            return
            
    except Exception as e:
        logging.error(f"Error sending WhatsApp: {e}")


async def send_order_email(order: Order):
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_password = os.environ.get("SMTP_PASSWORD", "")
    
    if not smtp_user or not smtp_password:
        logging.warning("SMTP credentials not configured. Skipping email.")
        return
    
    message = MIMEMultipart()
    message["From"] = smtp_user
    message["To"] = "vsfashiiiion@gmail.com"
    message["Subject"] = f"New Order #{order.id[:8]}"
    
    items_html = ""
    for item in order.items:
        img_url = item.image_url or ""
        if img_url and not img_url.startswith("http"):
            img_url = f"https://vs-fashion.com{img_url}"
            
        img_cell = f'<img src="{img_url}" alt="{item.product_name}" style="width: 55px; height: 70px; object-fit: cover; border-radius: 4px;" />' if img_url else '<div style="width:55px;height:70px;background:#f0f0f0;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#888;">No Img</div>'
        color_str = item.color or "-"

        items_html += f"""
        <tr>
            <td style="padding: 8px; border: 1px solid #ddd; text-align: center; vertical-align: middle;">{img_cell}</td>
            <td style="padding: 10px; border: 1px solid #ddd; vertical-align: middle;"><strong>{item.product_name}</strong></td>
            <td style="padding: 10px; border: 1px solid #ddd; vertical-align: middle;">{color_str}</td>
            <td style="padding: 10px; border: 1px solid #ddd; vertical-align: middle;">{item.size}</td>
            <td style="padding: 10px; border: 1px solid #ddd; vertical-align: middle;">{item.quantity}</td>
            <td style="padding: 10px; border: 1px solid #ddd; vertical-align: middle;">₹{item.price:.2f}</td>
            <td style="padding: 10px; border: 1px solid #ddd; vertical-align: middle;">₹{item.price * item.quantity:.2f}</td>
        </tr>
        """
    
    html = f"""
    <html>
        <body style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #8B1B4A;">New Order Received!</h2>
            <h3>Order Details</h3>
            <p><strong>Order ID:</strong> {order.id}</p>
            <p><strong>Order Date:</strong> {order.created_at.strftime('%Y-%m-%d %H:%M:%S')}</p>
            
            <h3>Customer Information</h3>
            <p><strong>Name:</strong> {order.customer_name}</p>
            <p><strong>Email:</strong> {order.customer_email}</p>
            <p><strong>Mobile:</strong> {order.customer_mobile}</p>
            <p><strong>Delivery Address:</strong> {order.delivery_address}</p>
            
            <h3>Order Items</h3>
            <table style="border-collapse: collapse; width: 100%;">
                <thead>
                    <tr style="background-color: #8B1B4A; color: white;">
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: center;">Image</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Product</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Color</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Size</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Quantity</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Price</th>
                        <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                </tbody>
            </table>
            
            <h3 style="color: #8B1B4A; margin-top: 20px;">Total Amount: ₹{order.total_amount:.2f}</h3>
        </body>
    </html>
    """
    
    message.attach(MIMEText(html, "html"))
    
    try:
        await aiosmtplib.send(
            message,
            hostname=smtp_host,
            port=smtp_port,
            username=smtp_user,
            password=smtp_password,
            start_tls=True,
        )
        logging.info(f"Order email sent for order {order.id}")
    except Exception as e:
        logging.error(f"Failed to send order email: {str(e)}")


@api_router.get("/")
async def root():
    return {"message": "VS Fashion API"}


@api_router.post("/auth/register")
@limiter.limit("5/hour")
async def register(request: Request, user_data: UserRegister):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create initial address entry
    initial_address = Address(
        label="Home",
        full_name=user_data.full_name,
        mobile=user_data.mobile,
        address_line=user_data.address,
        city="", # Would be better if we split this in frontend later
        state="", # Would be better if we split this in frontend later
        pincode="",
        is_default=True
    )
    
    user = User(
        full_name=user_data.full_name,
        email=user_data.email,
        mobile=user_data.mobile,
        address=user_data.address,
        addresses=[initial_address],
        password_hash=hash_password(user_data.password)
    )
    
    doc = user.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    # Convert sub-models in list to dict
    doc['addresses'] = [addr.model_dump() for addr in user.addresses]
    await db.users.insert_one(doc)
    
    token = create_token({"sub": user.id, "type": "user"})
    return {"token": token, "user": {
        "id": user.id, 
        "email": user.email, 
        "full_name": user.full_name, 
        "mobile": user.mobile, 
        "address": user.address,
        "addresses": doc['addresses']
    }}


@api_router.post("/auth/login")
@limiter.limit("10/hour")
async def login(request: Request, user_data: UserLogin):
    try:
        email = str(user_data.email).lower().strip()
        user = await db.users.find_one({"email": email})
        if not user:
            user = await db.users.find_one({"email": {"$regex": f"^{re.escape(email)}$", "$options": "i"}})
            
        if not user or not verify_password(user_data.password, user.get("password_hash", "")):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        
        user_id = user.get("id")
        if not user_id:
            user_id = str(user.get("_id") or uuid.uuid4())
            await db.users.update_one({"_id": user["_id"]}, {"$set": {"id": user_id}})
            
        token = create_token({"sub": user_id, "type": "user"})
        return {"token": token, "user": {
            "id": user_id, 
            "email": user.get("email", ""), 
            "full_name": user.get("full_name", ""), 
            "mobile": user.get("mobile", ""), 
            "address": user.get("address", ""),
            "addresses": user.get("addresses") or []
        }}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in user login: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred. Please try again.")


@api_router.get("/user/addresses", response_model=List[Address])
async def get_addresses(current_user: dict = Depends(get_current_user)):
    user = await get_user_from_db(current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user.get("addresses") or []


@api_router.post("/user/addresses", response_model=Address)
async def add_address(addr_data: AddressCreate, current_user: dict = Depends(get_current_user)):
    user = await get_user_from_db(current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    new_address = Address(**addr_data.model_dump())
    addresses = user.get("addresses") or []
    
    # If this is the first address or set as default, unset others
    if not addresses or new_address.is_default:
        for addr in addresses:
            addr["is_default"] = False
        new_address.is_default = True
        
    addresses.append(new_address.model_dump())
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"addresses": addresses}}
    )
    return new_address


@api_router.put("/user/addresses/{address_id}", response_model=Address)
async def update_address(address_id: str, addr_data: AddressCreate, current_user: dict = Depends(get_current_user)):
    user = await get_user_from_db(current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    addresses = user.get("addresses") or []
    found = False
    updated_address = None
    for i, addr in enumerate(addresses):
        if addr.get("id") == address_id:
            updated_address = Address(id=address_id, **addr_data.model_dump())
            # If this address is being set as default, unset others first
            if updated_address.is_default:
                for other in addresses:
                    other["is_default"] = False
            addresses[i] = updated_address.model_dump()
            found = True
            break

    if not found:
        raise HTTPException(status_code=404, detail="Address not found")

    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"addresses": addresses}}
    )
    return updated_address


@api_router.delete("/user/addresses/{address_id}")
async def delete_address(address_id: str, current_user: dict = Depends(get_current_user)):
    user = await get_user_from_db(current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    addresses = user.get("addresses") or []
    new_addresses = [addr for addr in addresses if addr.get("id") != address_id]
    
    if len(new_addresses) == len(addresses):
        raise HTTPException(status_code=404, detail="Address not found")
        
    # If we deleted the default address, set another one as default
    if any(addr.get("id") == address_id and addr.get("is_default") for addr in addresses) and new_addresses:
        new_addresses[0]["is_default"] = True
        
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"addresses": new_addresses}}
    )
    return {"message": "Address deleted"}


@api_router.patch("/user/addresses/{address_id}/default")
async def set_default_address(address_id: str, current_user: dict = Depends(get_current_user)):
    user = await get_user_from_db(current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    addresses = user.get("addresses") or []
    found = False
    for addr in addresses:
        if addr.get("id") == address_id:
            addr["is_default"] = True
            found = True
        else:
            addr["is_default"] = False
            
    if not found:
        raise HTTPException(status_code=404, detail="Address not found")
        
    await db.users.update_one(
        {"id": current_user["id"]},
        {"$set": {"addresses": addresses}}
    )
    return {"message": "Default address updated"}


@api_router.get("/health")
async def health_check():
    try:
        await client.admin.command('ping')
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}


@api_router.post("/auth/admin/login")
@limiter.limit("5/hour")
async def admin_login(request: Request, user_data: UserLogin):
    try:
        email = str(user_data.email).lower().strip()
        logger.info(f"Admin login attempt for: {email}")
        
        admin = await db.admins.find_one({"email": email})
        if not admin:
            logger.warning(f"Admin not found: {email}")
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
            
        password_hash = admin.get("password_hash")
        if not password_hash:
            logger.error(f"Admin {email} is missing password_hash in DB")
            raise HTTPException(status_code=500, detail="Admin account misconfigured")

        if not verify_password(user_data.password, password_hash):
            logger.warning(f"Invalid password for admin: {email}")
            raise HTTPException(status_code=401, detail="Invalid admin credentials")
        
        admin_id = admin.get("id") or admin.get("_id")
        if not admin_id:
            admin_id = str(uuid.uuid4())
            logger.warning(f"Admin {email} missing ID, generated temporary: {admin_id}")
        else:
            admin_id = str(admin_id)
        
        try:
            token = create_token({"sub": admin_id, "type": "admin"})
        except Exception as token_err:
            logger.error(f"Token creation failed: {str(token_err)}")
            raise HTTPException(status_code=500, detail="Failed to generate authentication token")
            
        logger.info(f"Admin logged in successfully: {email}")
        return {"token": token, "admin": {"id": admin_id, "email": email}}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"CRITICAL: Unexpected error in admin_login: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred. Please try again.")


@api_router.get("/collections", response_model=List[Collection])
async def get_collections(show_on_home: Optional[bool] = None, all_collections: Optional[bool] = False):
    query = {}
    if not all_collections:
        query["is_active"] = True
    if show_on_home is not None:
        query["show_on_home"] = show_on_home
    
    collections = await db.collections.find(query, {"_id": 0}).to_list(1000)
    for coll in collections:
        if isinstance(coll.get('created_at'), str):
            coll['created_at'] = datetime.fromisoformat(coll['created_at'])
    return collections


@api_router.post("/collections", response_model=Collection)
async def create_collection(coll_data: CollectionCreate, current_user: dict = Depends(get_current_admin)):
    collection = Collection(**coll_data.model_dump())
    doc = collection.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.collections.insert_one(doc)
    return collection


@api_router.put("/collections/{collection_id}", response_model=Collection)
async def update_collection(collection_id: str, coll_data: CollectionCreate, current_user: dict = Depends(get_current_admin)):
    doc = coll_data.model_dump()
    await db.collections.update_one({"id": collection_id}, {"$set": doc})
    updated = await db.collections.find_one({"id": collection_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return updated


@api_router.delete("/collections/{collection_id}")
async def delete_collection(collection_id: str, current_user: dict = Depends(get_current_admin)):
    await db.collections.delete_one({"id": collection_id})
    return {"message": "Collection deleted"}


def compress_image_bytes(contents: bytes, content_type: str) -> tuple[bytes, str]:
    """
    Smart server-side image compression using Pillow.
    Target: always <= 3 MB output — no visible blur.
    Strategy:
      1. Convert to RGB JPEG
      2. Scale to max 2400px using LANCZOS (best quality, no blur)
      3. Iteratively reduce quality (88 -> 50) until <= 3 MB
      4. If still too big, reduce dimensions by 20% steps and retry
    """
    TARGET_SIZE   = 3 * 1024 * 1024   # 3 MB hard target
    MAX_DIMENSION = 2400               # Max px width/height
    MIN_QUALITY   = 50                 # Never go below 50% quality

    if not PIL_AVAILABLE or len(contents) <= TARGET_SIZE:
        return contents, content_type

    try:
        img = PILImage.open(BytesIO(contents))

        # Convert RGBA / palette / other modes to RGB for JPEG compatibility
        if img.mode in ('RGBA', 'P', 'LA'):
            background = PILImage.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = background
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        # Step 1: Scale down if dimensions are too large (LANCZOS = no blur)
        w, h = img.size
        if w > MAX_DIMENSION or h > MAX_DIMENSION:
            ratio = min(MAX_DIMENSION / w, MAX_DIMENSION / h)
            img = img.resize((round(w * ratio), round(h * ratio)), PILImage.LANCZOS)

        original_mb = len(contents) / (1024 * 1024)
        compressed = contents  # fallback default

        # Step 2: Iteratively reduce quality until <= 3 MB
        for quality in range(88, MIN_QUALITY - 1, -5):
            output = BytesIO()
            img.save(output, format='JPEG', quality=quality, optimize=True)
            compressed = output.getvalue()
            if len(compressed) <= TARGET_SIZE:
                compressed_mb = len(compressed) / (1024 * 1024)
                logging.info(f"Image compressed (quality={quality}%): {original_mb:.1f} MB -> {compressed_mb:.1f} MB")
                return compressed, 'image/jpeg'

        # Step 3: Quality floor hit — shrink dimensions by 20% steps and retry
        current_img = img
        for _ in range(6):  # Max 6 shrink steps
            w, h = current_img.size
            if w < 400 or h < 400:
                break
            new_w = round(w * 0.80)
            new_h = round(h * 0.80)
            current_img = current_img.resize((new_w, new_h), PILImage.LANCZOS)
            output = BytesIO()
            current_img.save(output, format='JPEG', quality=65, optimize=True)
            compressed = output.getvalue()
            if len(compressed) <= TARGET_SIZE:
                break

        compressed_mb = len(compressed) / (1024 * 1024)
        logging.info(f"Image compressed (final): {original_mb:.1f} MB -> {compressed_mb:.1f} MB")
        return compressed, 'image/jpeg'

    except Exception as e:
        logging.warning(f"Server-side compression failed, using original: {e}")
        return contents, content_type


@api_router.post("/products/upload")
async def upload_image(file: UploadFile = File(...), current_user: dict = Depends(get_current_admin)):
    contents = await file.read()

    # Auto-compress large images server-side (safety net)
    compressed_contents, compressed_content_type = compress_image_bytes(contents, file.content_type or 'image/jpeg')

    # Use .jpg extension if image was compressed to JPEG
    original_ext = Path(file.filename).suffix
    file_ext = '.jpg' if compressed_content_type == 'image/jpeg' else original_ext
    filename = f"{uuid.uuid4()}{file_ext}"

    s3_bucket = os.environ.get("AWS_S3_BUCKET_NAME")
    aws_access_key = os.environ.get("AWS_ACCESS_KEY_ID")
    aws_secret_key = os.environ.get("AWS_SECRET_ACCESS_KEY")
    aws_region = os.environ.get("AWS_REGION", "ap-south-1")
    s3_endpoint = os.environ.get("S3_ENDPOINT_URL")
    s3_public_url = os.environ.get("S3_PUBLIC_URL")

    if s3_bucket and aws_access_key and aws_secret_key:
        try:
            client_kwargs = {
                "service_name": "s3",
                "aws_access_key_id": aws_access_key,
                "aws_secret_access_key": aws_secret_key,
                "region_name": aws_region,
            }
            if s3_endpoint:
                client_kwargs["endpoint_url"] = s3_endpoint

            s3_client = boto3.client(**client_kwargs)

            put_kwargs = {
                "Bucket": s3_bucket,
                "Key": f"images/{filename}",
                "Body": compressed_contents,
                "ContentType": compressed_content_type,
                "CacheControl": "public, max-age=31536000"
            }
            if not s3_endpoint:
                put_kwargs["ACL"] = "public-read"

            s3_client.put_object(**put_kwargs)

            if s3_public_url:
                s3_url = f"{s3_public_url.rstrip('/')}/images/{filename}"
            else:
                s3_url = f"https://{s3_bucket}.s3.{aws_region}.amazonaws.com/images/{filename}"

            return {"url": s3_url}
        except Exception as e:
            logging.error(f"Failed to upload to S3: {str(e)}. Falling back to local storage.")
            file_path = UPLOAD_DIR / filename
            with open(file_path, "wb") as buffer:
                buffer.write(compressed_contents)
            return {"url": f"/uploads/{filename}"}
    else:
        file_path = UPLOAD_DIR / filename
        with open(file_path, "wb") as buffer:
            buffer.write(compressed_contents)
        return {"url": f"/uploads/{filename}"}



@api_router.get("/products", response_model=List[ProductResponse])
async def get_products(
    collection_id: Optional[str] = None,
    is_trending: Optional[bool] = None,
    is_new_arrival: Optional[bool] = None,
    is_best_seller: Optional[bool] = None
):
    query = {"is_active": True}
    if collection_id:
        query["collection_id"] = collection_id
    if is_trending is not None:
        query["is_trending"] = is_trending
    if is_new_arrival is not None:
        query["is_new_arrival"] = is_new_arrival
    if is_best_seller is not None:
        query["is_best_seller"] = is_best_seller
    
    products = await db.products.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
        
        collection = await db.collections.find_one({"id": product["collection_id"]}, {"_id": 0})
        product["collection_name"] = collection["name"] if collection else ""
    
    return products


@api_router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    if isinstance(product.get('created_at'), str):
        product['created_at'] = datetime.fromisoformat(product['created_at'])
    
    collection = await db.collections.find_one({"id": product["collection_id"]}, {"_id": 0})
    product["collection_name"] = collection["name"] if collection else ""
    
    return product


@api_router.post("/products")
async def create_product(
    name: str = Form(...),
    collection_id: str = Form(...),
    description: str = Form(...),
    sizes: str = Form(...),
    color: str = Form(...),
    size_guide: str = Form(""),
    quantity: int = Form(...),
    size_quantities: str = Form("{}"),
    price: float = Form(...),
    discount_price: Optional[float] = Form(None),
    is_trending: bool = Form(False),
    is_new_arrival: bool = Form(False),
    is_best_seller: bool = Form(False),
    images: str = Form("[]"),
    video_url: str = Form(""),
    current_user: dict = Depends(get_current_admin)
):
    import json
    sizes_list = json.loads(sizes) if isinstance(sizes, str) else sizes
    images_list = json.loads(images) if isinstance(images, str) else images
    
    product = Product(
        name=name,
        collection_id=collection_id,
        description=description,
        sizes=sizes_list,
        color=color,
        size_guide=size_guide,
        quantity=quantity,
        size_quantities=json.loads(size_quantities) if isinstance(size_quantities, str) else size_quantities,
        price=price,
        discount_price=discount_price,
        is_trending=is_trending,
        is_new_arrival=is_new_arrival,
        is_best_seller=is_best_seller,
        images=images_list,
        video_url=video_url
    )
    
    doc = product.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.products.insert_one(doc)
    
    return {"id": product.id, "message": "Product created"}


@api_router.post("/products/bulk")
async def create_products_bulk(
    payload: BulkProductsRequest,
    current_user: dict = Depends(get_current_admin)
):
    if not payload.products:
        raise HTTPException(status_code=400, detail="No products provided")

    # Load existing collections for matching
    collections = await db.collections.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(1000)
    collection_map = {c.get("name", "").strip().lower(): c.get("id") for c in collections if c.get("name") and c.get("id")}
    default_collection_id = collections[0]["id"] if collections else ""

    docs_to_insert = []
    created_products = []

    for item in payload.products:
        target_coll_id = (item.collection_id or "").strip()

        # If no valid ID provided, resolve by collection_name
        if not target_coll_id and item.collection_name:
            c_name = item.collection_name.strip().lower()
            if c_name in collection_map:
                target_coll_id = collection_map[c_name]
            else:
                # Create collection on the fly if needed
                new_coll = Collection(name=item.collection_name.strip())
                new_coll_doc = new_coll.model_dump()
                new_coll_doc["created_at"] = new_coll_doc["created_at"].isoformat()
                await db.collections.insert_one(new_coll_doc)
                collection_map[c_name] = new_coll.id
                target_coll_id = new_coll.id

        if not target_coll_id:
            target_coll_id = default_collection_id

        # Normalize sizes list
        if isinstance(item.sizes, list):
            sizes_list = [str(s).strip() for s in item.sizes if str(s).strip()]
        elif isinstance(item.sizes, str):
            sizes_list = [s.strip() for s in item.sizes.split(",") if s.strip()]
        else:
            sizes_list = ["Free Size"]
        if not sizes_list:
            sizes_list = ["Free Size"]

        total_qty = int(item.quantity) if item.quantity is not None else 1
        sq = item.size_quantities if isinstance(item.size_quantities, dict) else {}
        if sq:
            sq_sum = sum(int(v) for v in sq.values() if isinstance(v, (int, float, str)) and str(v).isdigit())
            if sq_sum > 0:
                total_qty = sq_sum
        else:
            per_size = max(1, total_qty // len(sizes_list))
            sq = {s: per_size for s in sizes_list}

        disc_price = float(item.discount_price) if item.discount_price not in (None, "", 0) else None

        new_prod = Product(
            name=item.name.strip(),
            collection_id=target_coll_id,
            description=item.description or "",
            sizes=sizes_list,
            color=item.color or "Default",
            size_guide=item.size_guide or "",
            quantity=total_qty,
            size_quantities=sq,
            price=float(item.price),
            discount_price=disc_price,
            is_trending=bool(item.is_trending),
            is_new_arrival=bool(item.is_new_arrival),
            is_best_seller=bool(item.is_best_seller),
            images=item.images if isinstance(item.images, list) else [],
            video_url=item.video_url or "",
            weight=float(item.weight) if item.weight else 0.5
        )

        doc = new_prod.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        docs_to_insert.append(doc)
        created_products.append({"id": new_prod.id, "name": new_prod.name})

    if docs_to_insert:
        await db.products.insert_many(docs_to_insert)

    return {
        "success": True,
        "count": len(created_products),
        "products": created_products,
        "message": f"Successfully created {len(created_products)} products"
    }


@api_router.put("/products/{product_id}")
async def update_product(
    product_id: str,
    name: str = Form(...),
    collection_id: str = Form(...),
    description: str = Form(...),
    sizes: str = Form(...),
    color: str = Form(...),
    size_guide: str = Form(""),
    quantity: int = Form(...),
    size_quantities: str = Form("{}"),
    price: float = Form(...),
    discount_price: Optional[float] = Form(None),
    is_trending: bool = Form(False),
    is_new_arrival: bool = Form(False),
    is_best_seller: bool = Form(False),
    is_active: bool = Form(True),
    images: str = Form("[]"),
    video_url: str = Form(""),
    current_user: dict = Depends(get_current_admin)
):
    import json
    sizes_list = json.loads(sizes) if isinstance(sizes, str) else sizes
    images_list = json.loads(images) if isinstance(images, str) else images
    
    update_data = {
        "name": name,
        "collection_id": collection_id,
        "description": description,
        "sizes": sizes_list,
        "size_quantities": json.loads(size_quantities) if isinstance(size_quantities, str) else size_quantities,
        "color": color,
        "size_guide": size_guide,
        "quantity": quantity,
        "price": price,
        "discount_price": discount_price,
        "is_trending": is_trending,
        "is_new_arrival": is_new_arrival,
        "is_best_seller": is_best_seller,
        "is_active": is_active,
        "images": images_list,
        "video_url": video_url
    }
    
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    return {"message": "Product updated"}


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_admin)):
    await db.products.delete_one({"id": product_id})
    return {"message": "Product deleted"}


@api_router.get("/products/{product_id}/reviews")
async def get_product_reviews(product_id: str):
    reviews = await db.reviews.find({"product_id": product_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    for r in reviews:
        if isinstance(r.get("created_at"), str):
            r["created_at"] = datetime.fromisoformat(r["created_at"])
    
    avg_rating = 0.0
    if reviews:
        avg_rating = round(sum(r["rating"] for r in reviews) / len(reviews), 1)
    
    return {
        "reviews": reviews,
        "total": len(reviews),
        "average_rating": avg_rating
    }


@api_router.post("/products/{product_id}/reviews")
async def add_product_review(
    product_id: str,
    review_data: ReviewCreate,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
):
    user_id = None
    user_name = review_data.user_name.strip() if review_data.user_name else "Verified Buyer"
    
    if credentials:
        try:
            payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
            uid = payload.get("sub")
            user = await get_user_from_db(uid)
            if user:
                user_id = user.get("id")
                user_name = user.get("full_name") or user_name
        except Exception:
            pass

    review = Review(
        product_id=product_id,
        user_id=user_id,
        user_name=user_name,
        rating=review_data.rating,
        comment=review_data.comment.strip()
    )
    doc = review.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.reviews.insert_one(doc)
    return review


@api_router.get("/cart")
async def get_cart(current_user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not cart:
        return {"items": []}
    
    if isinstance(cart.get('updated_at'), str):
        cart['updated_at'] = datetime.fromisoformat(cart['updated_at'])
    
    items_with_details = []
    for item in cart.get("items", []):
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            price = product.get("discount_price") or product.get("price", 0)
            items_with_details.append({
                "product_id": item["product_id"],
                "quantity": item["quantity"],
                "size": item["size"],
                "product_name": product["name"],
                "product_price": float(price),
                "product_weight": product.get("weight", 0.5),
                "product_image": product["images"][0] if product.get("images") else ""
            })
    
    return {"items": items_with_details}


@api_router.post("/cart")
async def add_to_cart(item: CartItem, current_user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user["id"]}, {"_id": 0})
    
    if not cart:
        cart = Cart(user_id=current_user["id"], items=[item.model_dump()])
        doc = cart.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.carts.insert_one(doc)
    else:
        items = cart.get("items", [])
        found = False
        for i, existing_item in enumerate(items):
            if existing_item["product_id"] == item.product_id and existing_item["size"] == item.size:
                items[i]["quantity"] += item.quantity
                found = True
                break
        
        if not found:
            items.append(item.model_dump())
        
        await db.carts.update_one(
            {"user_id": current_user["id"]},
            {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    return {"message": "Item added to cart"}


@api_router.delete("/cart/remove/{product_id}")
async def remove_item_from_cart(product_id: str, size: str, current_user: dict = Depends(get_current_user)):
    cart = await db.carts.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if cart:
        items = [item for item in cart.get("items", []) if not (item["product_id"] == product_id and item["size"] == size)]
        await db.carts.update_one(
            {"user_id": current_user["id"]},
            {"$set": {"items": items, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    # Return updated cart with details
    updated_cart = await db.carts.find_one({"user_id": current_user["id"]}, {"_id": 0})
    if not updated_cart:
        return {"items": []}
        
    items_with_details = []
    for item in updated_cart.get("items", []):
        product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
        if product:
            price = product.get("discount_price") or product.get("price", 0)
            items_with_details.append({
                "product_id": item["product_id"],
                "quantity": item["quantity"],
                "size": item["size"],
                "product_name": product["name"],
                "product_price": float(price),
                "product_weight": product.get("weight", 0.5),
                "product_image": product["images"][0] if product.get("images") else ""
            })
    return {"items": items_with_details}


@api_router.delete("/cart/{product_id}")
async def remove_from_cart(product_id: str, size: str, current_user: dict = Depends(get_current_user)):
    return await remove_item_from_cart(product_id, size, current_user)


@api_router.post("/orders")
async def create_order(order_data: OrderCreate, current_user: dict = Depends(get_current_user)):
    user = await get_user_from_db(current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    enriched_items = []
    for item in order_data.items:
        product = await db.products.find_one({"id": item.product_id}, {"_id": 0})
        if product:
            if not item.color:
                item.color = product.get("color", "")
            if not item.image_url:
                images = product.get("images") or []
                item.image_url = images[0] if images else ""

            # Deduct from specific size if available
            size_quantities = product.get("size_quantities") or {}
            if item.size in size_quantities and size_quantities[item.size] >= item.quantity:
                size_quantities[item.size] -= item.quantity
                
                # Update total quantity
                new_total = sum(size_quantities.values()) if size_quantities else max(0, product["quantity"] - item.quantity)
                
                await db.products.update_one(
                    {"id": item.product_id},
                    {"$set": {"quantity": new_total, "size_quantities": size_quantities}}
                )
            # Fallback to global quantity if size_quantities not configured properly
            elif product["quantity"] >= item.quantity:
                new_quantity = product["quantity"] - item.quantity
                await db.products.update_one(
                    {"id": item.product_id},
                    {"$set": {"quantity": new_quantity}}
                )
        enriched_items.append(item)

    order = Order(
        user_id=current_user["id"],
        customer_name=user["full_name"],
        customer_email=user["email"],
        customer_mobile=user["mobile"],
        delivery_address=order_data.delivery_address or user["address"],
        items=enriched_items,
        total_amount=order_data.total_amount
    )
    
    doc = order.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.orders.insert_one(doc)
    
    await db.carts.update_one(
        {"user_id": current_user["id"]},
        {"$set": {"items": []}}
    )
    
    await send_order_email(order)
    
    whatsapp_msg = (
        f"Hello {user['full_name']},\n\n"
        f"Your order #{order.id[:8]} at VS Fashion has been placed successfully!\n"
        f"Total Amount: ₹{order.total_amount:.2f}\n"
        f"Status: {order.status}\n\n"
        f"Thank you for shopping with us!"
    )
    await send_whatsapp_message(user['mobile'], whatsapp_msg)
    
    return {"order_id": order.id, "message": "Order placed successfully"}


class PaymentCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    state: str = ""
    pincode: str = ""
    amount: Optional[float] = None

@api_router.post("/payments/create-order")
async def create_razorpay_order(payment_data: PaymentCreate, current_user: dict = Depends(get_current_user)):
    logger.info(f"Incoming payment request for user {current_user['id']}, state: {payment_data.state}")
    logger.info(f"Received amount: {payment_data.amount}")
    
    try:
        if payment_data.amount is not None:
            final_amount = payment_data.amount
            product_total = final_amount
            shipping = 0
        else:
            cart = await db.carts.find_one({"user_id": current_user["id"]}, {"_id": 0})
            if not cart or not cart.get("items"):
                raise HTTPException(status_code=400, detail="Cart is empty")
            
            product_total = 0.0
            total_quantity = 0
            total_weight = 0.0
            
            for item in cart.get("items", []):
                product = await db.products.find_one({"id": item["product_id"]}, {"_id": 0})
                if product:
                    price = product.get("discount_price") or product.get("price", 0)
                    qty = item["quantity"]
                    weight = product.get("weight", 0.5)
                    
                    product_total += float(price) * qty
                    total_quantity += qty
                    total_weight += float(weight) * qty

            state_lower = payment_data.state.lower()
            pincode_str = str(payment_data.pincode).strip()
            
            import re
            pincode_match = re.search(r'\b(40|41|42|43|44)\d{4}\b', state_lower) or re.search(r'^(40|41|42|43|44)', pincode_str)
            is_maharashtra = bool(pincode_match) or "maharashtra" in state_lower
            
            if is_maharashtra:
                shipping = total_quantity * 80
            else:
                shipping = total_weight * 220
                
            final_amount = product_total + shipping
            
        if final_amount <= 0:
            raise HTTPException(status_code=400, detail="Invalid total amount")

        # Amount in paise (multiply by 100)
        data = {
            "amount": int(final_amount * 100),
            "currency": "INR",
            "receipt": f"receipt_{uuid.uuid4().hex[:10]}",
            "payment_capture": 1
        }
        logger.info(f"Sending Razorpay payload: {data}")
        order = rzp_client.order.create(data=data)
        
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "productTotal": product_total,
            "shipping": shipping,
            "finalAmount": final_amount
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Razorpay Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/payments/verify")
async def verify_payment(
    order_id: str = Form(...),
    razorpay_order_id: str = Form(...),
    razorpay_payment_id: str = Form(...),
    razorpay_signature: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        params_dict = {
            'razorpay_order_id': razorpay_order_id,
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_signature': razorpay_signature
        }
        rzp_client.utility.verify_payment_signature(params_dict)

        # SECURITY: Verify the order belongs to the authenticated user
        existing_order = await db.orders.find_one({"id": order_id})
        if not existing_order:
            raise HTTPException(status_code=404, detail="Order not found")
        if existing_order.get("user_id") != current_user["id"]:
            logger.warning(f"SECURITY ALERT: User {current_user['id']} attempted to verify payment for order {order_id} belonging to user {existing_order.get('user_id')}")
            raise HTTPException(status_code=403, detail="You are not authorized to verify this order")

        # SECURITY: Prevent double-payment on already paid orders
        if existing_order.get("status") == "Paid":
            return {"status": "success", "message": "Order already paid"}

        # Update order status
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {"status": "Paid", "payment_id": razorpay_payment_id, "razorpay_order_id": razorpay_order_id}}
        )
        
        # Send Payment Confirmation WhatsApp
        order = await db.orders.find_one({"id": order_id})
        if order:
            user = await db.users.find_one({"id": order["user_id"]})
            if user:
                whatsapp_msg = (
                    f"Hello {user['full_name']},\n\n"
                    f"Payment for order #{order_id[:8]} at VS Fashion is successful!\n"
                    f"Transaction ID: {razorpay_payment_id}\n\n"
                    f"We will process and ship your order within 4 days. Thank you!"
                )
                await send_whatsapp_message(user['mobile'], whatsapp_msg)

        return {"status": "success"}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payment signature")


@api_router.get("/orders")
async def get_user_orders(current_user: dict = Depends(get_current_user)):
    orders = await db.orders.find({"user_id": current_user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    return orders


@api_router.get("/admin/orders")
async def get_all_orders(current_user: dict = Depends(get_current_admin)):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for order in orders:
        if isinstance(order.get('created_at'), str):
            order['created_at'] = datetime.fromisoformat(order['created_at'])
    return orders


@api_router.put("/admin/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str = Form(...), current_user: dict = Depends(get_current_admin)):
    await db.orders.update_one({"id": order_id}, {"$set": {"status": status}})
    return {"message": "Order status updated"}


@api_router.get("/admin/customers")
async def get_all_customers(current_user: dict = Depends(get_current_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
        
        orders = await db.orders.find({"user_id": user["id"]}, {"_id": 0}).to_list(1000)
        user["total_orders"] = len(orders)
        user["last_order_date"] = orders[0]["created_at"] if orders else None
    
    return users


@api_router.get("/admin/inventory")
async def get_inventory(current_user: dict = Depends(get_current_admin)):
    products = await db.products.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for product in products:
        if isinstance(product.get('created_at'), str):
            product['created_at'] = datetime.fromisoformat(product['created_at'])
        
        collection = await db.collections.find_one({"id": product["collection_id"]}, {"_id": 0})
        product["collection_name"] = collection["name"] if collection else ""
    
    return products


@api_router.get("/banners")
async def get_banners():
    banners = await db.banners.find({"is_active": True}, {"_id": 0}).sort("order", 1).to_list(10)
    return banners


@api_router.post("/banners")
async def create_banner(banner_data: BannerCreate, current_user: dict = Depends(get_current_admin)):
    banner = Banner(**banner_data.model_dump())
    await db.banners.insert_one(banner.model_dump())
    return banner


@api_router.put("/banners/{banner_id}")
async def update_banner(banner_id: str, banner_data: BannerCreate, current_user: dict = Depends(get_current_admin)):
    await db.banners.update_one({"id": banner_id}, {"$set": banner_data.model_dump()})
    return {"message": "Banner updated"}


@api_router.delete("/banners/{banner_id}")
async def delete_banner(banner_id: str, current_user: dict = Depends(get_current_admin)):
    await db.banners.delete_one({"id": banner_id})
    return {"message": "Banner deleted"}


@api_router.get("/content/{page_id}")
async def get_content(page_id: str):
    content = await db.content_pages.find_one({"id": page_id}, {"_id": 0})
    if not content:
        return {"id": page_id, "content": "", "updated_at": datetime.now(timezone.utc).isoformat()}
    if isinstance(content.get('updated_at'), str):
        try:
            content['updated_at'] = datetime.fromisoformat(content['updated_at'])
        except Exception:
            pass
    return content


@api_router.get("/debug/seed")
async def debug_seed():
    import subprocess
    import os
    try:
        result = subprocess.run(
            ["python3", "seed_policies.py"],
            capture_output=True,
            text=True,
            cwd=ROOT_DIR
        )
        # Mask Mongo URL
        raw_url = os.environ.get("MONGO_URL", "NOT_FOUND")
        masked_url = raw_url.split("@")[-1] if "@" in raw_url else "HIDDEN"
        
        return {
            "stdout": result.stdout,
            "stderr": result.stderr,
            "returncode": result.returncode,
            "db_name": os.environ.get("DB_NAME"),
            "mongo_host": masked_url
        }
    except Exception as e:
        return {"error": str(e)}


@api_router.put("/content/{page_id}")
async def update_content(page_id: str, content_data: ContentUpdate, current_user: dict = Depends(get_current_admin)):
    existing = await db.content_pages.find_one({"id": page_id}, {"_id": 0})
    
    if existing:
        await db.content_pages.update_one(
            {"id": page_id},
            {"$set": {"content": content_data.content, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        page = ContentPage(id=page_id, content=content_data.content)
        doc = page.model_dump()
        doc['updated_at'] = doc['updated_at'].isoformat()
        await db.content_pages.insert_one(doc)
    
    return {"message": "Content updated"}


@api_router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    user = await get_user_from_db(current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.pop("password_hash", None)
    user.pop("_id", None)
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return user


@api_router.put("/profile")
async def update_profile(
    full_name: str = Form(...),
    mobile: str = Form(...),
    address: str = Form(""),
    current_user: dict = Depends(get_current_user)
):
    user = await get_user_from_db(current_user["id"])
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_fields = {"full_name": full_name, "mobile": mobile}
    if address:  # Only update legacy address field if provided
        update_fields["address"] = address
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": update_fields}
    )
    return {"message": "Profile updated"}


app.include_router(api_router)

# Build CORS origins: always include the production domains + any env-configured extras
_env_origins = [o.strip() for o in os.environ.get('CORS_ORIGINS', '').split(',') if o.strip()]
_required_origins = [
    "https://vs-fashion.com",
    "https://www.vs-fashion.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
_all_origins = list(set(_env_origins + _required_origins)) if _env_origins else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=_all_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# End of router definitions


@app.on_event("startup")
async def startup_db():
    # SECURITY: Admin email and password read from environment variables only.
    # Never hardcode admin credentials in source code.
    admin_email = os.environ.get("ADMIN_EMAIL", "vsfashiiiion@gmail.com")
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    admin = await db.admins.find_one({"email": admin_email})

    if not admin:
        if not admin_password:
            logger.warning("SECURITY WARNING: ADMIN_PASSWORD env var not set. Admin account NOT created. Set ADMIN_PASSWORD in .env to enable admin login.")
        else:
            admin_obj = Admin(
                email=admin_email,
                password_hash=hash_password(admin_password)
            )
            await db.admins.insert_one(admin_obj.model_dump())
            logger.info(f"Default admin account created: {admin_email}")
    else:
        updates = {}
        # Self-healing: ensure existing admin has an 'id' field
        if "id" not in admin:
            new_id = str(uuid.uuid4())
            updates["id"] = new_id
            logger.info(f"Updated existing admin {admin_email} with missing ID: {new_id}")
        # Self-healing: re-hash password if ADMIN_PASSWORD env var updated
        if admin_password and not bcrypt.checkpw(admin_password.encode(), admin.get("password_hash", "").encode()):
            updates["password_hash"] = hash_password(admin_password)
            logger.info(f"Admin password updated from ADMIN_PASSWORD env var for: {admin_email}")
        if updates:
            await db.admins.update_one({"_id": admin["_id"]}, {"$set": updates})


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
