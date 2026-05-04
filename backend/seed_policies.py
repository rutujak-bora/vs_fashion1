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
            "id": "terms",
            "content": """
Welcome to VS Fashion. By accessing our website, you agree to these Terms & Conditions.

1. Website Use: This website is for personal use only. Unauthorized use of this website may give rise to a claim for damages and/or be a criminal offense.
2. Product Information: We make every effort to display as accurately as possible the colors and images of our products. However, we cannot guarantee that your monitor's display will be accurate.
3. Pricing: All prices are subject to change without notice. We reserve the right to modify or discontinue any product.
4. Intellectual Property: All content on this site, including text, graphics, and logos, is the property of VS Fashion and is protected by copyright laws.
5. Limitation of Liability: VS Fashion shall not be liable for any direct, indirect, incidental, or consequential damages resulting from the use or inability to use our services.
            """,
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "privacy",
            "content": """
At VS Fashion, we respect your privacy and are committed to protecting your personal data.

1. Information Collection: We collect information you provide when placing an order, including name, email, phone number, and address.
2. Use of Information: We use your information to process orders, improve our website, and send promotional emails if you have opted in.
3. Data Security: We implement variety of security measures to maintain the safety of your personal information. We do not sell, trade, or otherwise transfer your personally identifiable information to outside parties.
4. Cookies: We use cookies to enhance your experience and gather data about site traffic and interaction.
5. Consent: By using our site, you consent to our privacy policy.
            """,
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "refund",
            "content": """
We want you to be completely satisfied with your purchase from VS Fashion.

1. Returns: You have 7 calendar days to return an item from the date you received it. To be eligible for a return, your item must be unused and in the same condition that you received it.
2. Refunds: Once we receive your item, we will inspect it and notify you that we have received your returned item. If your return is approved, we will initiate a refund to your original method of payment.
3. Shipping: You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable.
4. Damaged Items: If you receive a damaged product, please contact us immediately at vsfashiiiion@gmail.com with photos of the damage.
            """,
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "faq",
            "content": """
Q: How long does shipping take?
A: Standard shipping takes 5-7 business days within Maharashtra.

Q: Do you offer international shipping?
A: Currently, we only ship within Maharashtra.

Q: How can I track my order?
A: Once your order is shipped, you will receive an email with the tracking details.

Q: Can I change my delivery address after placing an order?
A: Address changes are only possible if the order has not been dispatched. Please contact us immediately.
            """,
            "updated_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "id": "shipping",
            "content": """
VS Fashion Shipping & Delivery Policy:

1. Processing Time: Orders are processed within 1-2 business days.
2. Delivery Time: Standard delivery takes 5-7 business days depending on your location.
3. Shipping Charges: We offer free shipping on orders above ₹1999. For orders below this, a flat shipping fee of ₹99 applies.
4. Delivery Partners: We use reliable courier services to ensure your package reaches you safely.
5. Order Tracking: You will receive a tracking link via email once your order is dispatched.
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
