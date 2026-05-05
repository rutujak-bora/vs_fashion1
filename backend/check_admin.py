import os
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def check_admin():
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    admin_email = "vsfashiiiion@gmail.com"
    admin = await db.admins.find_one({"email": admin_email})
    
    if admin:
        print(f"Admin found: {admin_email}")
        print(f"ID: {admin.get('id')}")
        print(f"Has password_hash: {'password_hash' in admin}")
        print(f"Data keys: {list(admin.keys())}")
    else:
        print(f"Admin NOT found: {admin_email}")
        
    client.close()

if __name__ == "__main__":
    asyncio.run(check_admin())
