import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from dotenv import load_dotenv
from pathlib import Path

# Load env
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def seed_policies():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    print(f"Connecting to MongoDB at {mongo_url.split('@')[-1]}...")
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    print(f"Using database: {db_name}")

    # Test connection
    try:
        await client.admin.command('ping')
        print("MongoDB connection successful!")
    except Exception as e:
        print(f"MongoDB connection failed: {e}")
        return

    policies = [
        {
            "id": "privacy",
            "content": """
At vs-fashion.com, we value your privacy and are committed to protecting your personal information.

We collect personal details such as your name, contact number, email address, shipping address, and payment information when you place an order on our website. This information is used solely for order processing, delivery, and customer support.

We do not sell, trade, or share your personal information with third parties except as required for payment processing (e.g., Razorpay) and shipping services.

All online payments are securely processed through trusted payment gateways, and we do not store your card or banking details.

By using our website, you consent to our Privacy Policy.
            """,
            "updated_at": f"{datetime.now(timezone.utc).isoformat()} - LocalUpdate"
        },
        {
            "id": "refund",
            "content": """
At vs-fashion.com, we do not offer refunds.

We only provide product exchange in case of size issues or defective items.
Customers must request an exchange within 5 days of delivery.
The product must be unused, unwashed, and in original condition with packaging.

Cancellation Policy:

Once the payment is successfully completed, order cancellation is not allowed.

Payment Mode:

We accept online payments only.
Cash on Delivery (COD) is not available.
            """,
            "updated_at": f"{datetime.now(timezone.utc).isoformat()} - LocalUpdate"
        },
        {
            "id": "shipping",
            "content": """
Orders are processed and shipped within 4 days after order confirmation.
Shipping charges are ₹70 for deliveries across Maharashtra. For other states, shipping charges may vary and will be calculated at checkout.
Delivery time may vary depending on location and courier services.
            """,
            "updated_at": f"{datetime.now(timezone.utc).isoformat()} - LocalUpdate"
        },
        {
            "id": "contact",
            "content": """
If you have any questions, concerns, or support requests, you can reach us at:

Email: vsfashiiiion@gmail.com
Phone: +91 84219 68737
Address:
Gulab shrushti by Rajendra buttepatil
3rd floor 301,Kothrud Pune
maharashtra 411038
            """,
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "terms",
            "content": """
Welcome to vs-fashion.com. By using our website, you agree to comply with and be bound by the following terms and conditions of use.

1. General:
The content of the pages of this website is for your general information and use only. It is subject to change without notice.

2. Intellectual Property:
This website contains material which is owned by or licensed to us. This material includes, but is not limited to, the design, layout, look, appearance, and graphics. Reproduction is prohibited other than in accordance with the copyright notice.

3. User Conduct:
You must not use this website in any way that causes, or may cause, damage to the website or impairment of the availability or accessibility of the website.

4. Limitation of Liability:
Your use of any information or materials on this website is entirely at your own risk, for which we shall not be liable.

5. Governing Law:
Your use of this website and any dispute arising out of such use of the website is subject to the laws of India.
            """,
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "faq",
            "content": """
1. How do I place an order?
You can place an order by selecting the products you like, adding them to your cart, and proceeding to checkout.

2. What are the shipping charges?
Shipping charges are ₹70 for deliveries across Maharashtra.

3. Do you offer Cash on Delivery (COD)?
No, we accept online payments only.

4. Can I exchange my product?
Yes, we offer exchanges for size issues or defective items within 5 days of delivery.

5. How can I contact customer support?
You can reach us at vsfashiiiion@gmail.com or +91 84219 68737.
            """,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    ]

    for policy in policies:
        print(f"Seeding policy: {policy['id']}")
        await db.content_pages.update_one(
            {"id": policy["id"]},
            {"$set": policy},
            upsert=True
        )
    
    print("Policies seeded successfully!")

if __name__ == "__main__":
    asyncio.run(seed_policies())
