"""
MongoDB Atlas Database Configuration
"""
 
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv
 
load_dotenv()
 
class Database:
    client: AsyncIOMotorClient = None
    db = None
 
db = Database()
 
async def connect_to_mongo():
    """Connect to MongoDB Atlas"""
    mongo_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    db_name = os.getenv("DATABASE_NAME", "ai_logistics_platform")
   
    try:
        db.client = AsyncIOMotorClient(
            mongo_url,
            server_api=ServerApi('1')
        )
        db.db = db.client[db_name]
       
        # Verify connection
        await db.client.admin.command('ping')
        print(f"✅ Connected to MongoDB Atlas - Database: {db_name}")
       
        # Create indexes for better performance
        await create_indexes()
       
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        raise e
 
async def close_mongo_connection():
    """Close MongoDB connection"""
    if db.client:
        db.client.close()
        print("MongoDB connection closed")
 
async def create_indexes():
    """Create database indexes for optimal performance"""
    try:
        # Partners collection indexes
        await db.db.partners.create_index("email", unique=True)
        await db.db.partners.create_index("company_name")
        await db.db.partners.create_index("compliance_status")
       
        # Communications collection indexes
        await db.db.communications.create_index("customer_email")
        await db.db.communications.create_index("category")
        await db.db.communications.create_index("created_at")
       
        # Shipments collection indexes
        await db.db.shipments.create_index("tracking_number", unique=True)
        await db.db.shipments.create_index("status")
        await db.db.shipments.create_index("estimated_delivery")
       
        # POD collection indexes
        await db.db.pod_records.create_index("shipment_id")
        await db.db.pod_records.create_index("status")
       
        # Invoices collection indexes
        await db.db.invoices.create_index("invoice_number", unique=True)
        await db.db.invoices.create_index("status")
        await db.db.invoices.create_index("due_date")
       
        # Users collection indexes
        await db.db.users.create_index("email", unique=True)
       
        print("✅ Database indexes created successfully")
    except Exception as e:
        print(f"Warning: Index creation issue - {e}")
 
def get_database():
    """Get database instance"""
    return db.db
 
def get_collection(collection_name: str):
    """Get specific collection"""
    return db.db[collection_name]
 
 