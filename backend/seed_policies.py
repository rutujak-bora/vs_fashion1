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
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]

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
            "updated_at": datetime.now(timezone.utc).isoformat()
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
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "shipping",
            "content": """
Orders are processed and shipped within 4 days after order confirmation.
Shipping charges are ₹70 for deliveries across Maharashtra.
Delivery time may vary depending on location and courier services.
            """,
            "updated_at": datetime.now(timezone.utc).isoformat()
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
