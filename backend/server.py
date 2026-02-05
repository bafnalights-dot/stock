from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Dict
from datetime import datetime
from bson import ObjectId
import os
import jwt
from passlib.context import CryptContext
from dotenv import load_dotenv
from pathlib import Path
from starlette.middleware.cors import CORSMiddleware

# ================= ENV =================

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME")

SECRET_KEY = "CHANGE_THIS_SECRET"
ALGORITHM = "HS256"

# ================= APP =================

app = FastAPI()
router = APIRouter(prefix="/api")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= DATABASE =================

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ================= AUTH =================

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def hash_password(pw):
    return pwd_context.hash(pw)


def verify_password(pw, hash_pw):
    return pwd_context.verify(pw, hash_pw)


def create_token(username):
    return jwt.encode({"sub": username}, SECRET_KEY, algorithm=ALGORITHM)


async def get_user(
    cred: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        token = cred.credentials
        data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return data["sub"]
    except:
        raise HTTPException(401, "Invalid Token")

# ============= ITEM PART TEMPLATES =============

ITEM_TEMPLATES = {

    "50w fl": [
        {"part_name": "50w fl body", "quantity_needed": 1},
        {"part_name": "50w fl handle", "quantity_needed": 1},
        {"part_name": "50w fl frame", "quantity_needed": 1},
        {"part_name": "50w driver", "quantity_needed": 1},
        {"part_name": "50w fl pcb", "quantity_needed": 1},
        {"part_name": "50w fl gasket", "quantity_needed": 1},
        {"part_name": "50w fl reflector", "quantity_needed": 1},
        {"part_name": "50w fl bscrew", "quantity_needed": 2},
    ],

    "100w fl": [
        {"part_name": "100w fl body", "quantity_needed": 1},
        {"part_name": "100w fl handle", "quantity_needed": 1},
        {"part_name": "100w fl frame", "quantity_needed": 1},
        {"part_name": "50w driver", "quantity_needed": 2},
        {"part_name": "100w fl pcb", "quantity_needed": 1},
        {"part_name": "100w fl gasket", "quantity_needed": 1},
        {"part_name": "100w fl reflector", "quantity_needed": 1},
        {"part_name": "100w fl bscrew", "quantity_needed": 2},
    ],

    "24w sl": [
        {"part_name": "24w sl body", "quantity_needed": 1},
        {"part_name": "24w sl lens", "quantity_needed": 1},
        {"part_name": "24w sl gasket", "quantity_needed": 1},
        {"part_name": "24w sl pcb", "quantity_needed": 1},
        {"part_name": "24w sl driver", "quantity_needed": 1},
        {"part_name": "24w sl bscrew", "quantity_needed": 2},
    ],

}

# ================= MODELS =================

class AdminLogin(BaseModel):
    username: str
    password: str


class PartSpec(BaseModel):
    part_name: str
    quantity_needed: float


class Item(BaseModel):
    name: str
    category: str
    parts: List[PartSpec]
    opening_stock: float = 0


class Production(BaseModel):
    date: str
    item_id: str
    quantity: int


class Sale(BaseModel):
    date: str
    item_id: str
    quantity: int
    party_name: str


class Purchase(BaseModel):
    date: str
    part_name: str
    quantity: float


# ================= HELPERS =================

def serialize(d):
    if "_id" in d:
        d["id"] = str(d["_id"])
        del d["_id"]
    return d


# ================= AUTH API =================

@router.post("/login")
async def login(data: AdminLogin):

    admin = await db.admins.find_one({"username": data.username})

    if not admin:
        raise HTTPException(401, "Wrong username")

    if not verify_password(data.password, admin["password"]):
        raise HTTPException(401, "Wrong password")

    token = create_token(data.username)

    return {"access_token": token}


# ================= ITEMS =================

@api_router.post("/items", response_model=ItemResponse)
async def create_item(item: Item):

    name_key = item.name.lower().strip()

    if name_key not in ITEM_TEMPLATES:
        raise HTTPException(
            status_code=400,
            detail="This item does not have predefined parts"
        )

    item_dict = item.dict()

    # Auto add parts
    item_dict["parts"] = ITEM_TEMPLATES[name_key]

    item_dict["current_stock"] = item.opening_stock

    result = await db.items.insert_one(item_dict)

    # Create part stocks
    for part in item_dict["parts"]:
        existing = await db.part_stocks.find_one({"part_name": part["part_name"]})

        if not existing:
            await db.part_stocks.insert_one({
                "part_name": part["part_name"],
                "opening_stock": 0,
                "current_stock": 0,
                "created_at": datetime.utcnow()
            })

    created = await db.items.find_one({"_id": result.inserted_id})

    return serialize_doc(created)



# ================= PART STOCK =================

@router.get("/parts")
async def get_parts():

    parts = await db.part_stocks.find().to_list(1000)
    return [serialize(p) for p in parts]


# ================= PRODUCTION =================

@router.post("/production")
async def add_production(p: Production):

    item = await db.items.find_one({"_id": ObjectId(p.item_id)})

    if not item:
        raise HTTPException(404, "Item not found")

    for part in item["parts"]:

        stock = await db.part_stocks.find_one(
            {"part_name": part["part_name"]}
        )

        need = part["quantity_needed"] * p.quantity

        if not stock or stock["current_stock"] < need:
            raise HTTPException(400, "Not enough parts")

    for part in item["parts"]:

        stock = await db.part_stocks.find_one(
            {"part_name": part["part_name"]}
        )

        need = part["quantity_needed"] * p.quantity

        await db.part_stocks.update_one(
            {"_id": stock["_id"]},
            {"$inc": {"current_stock": -need}}
        )

    await db.items.update_one(
        {"_id": ObjectId(p.item_id)},
        {"$inc": {"current_stock": p.quantity}}
    )

    await db.production.insert_one(p.dict())

    return {"message": "Production Added"}


# ================= SALES =================

@router.post("/sales")
async def create_sale(s: Sale):

    item = await db.items.find_one({"_id": ObjectId(s.item_id)})

    if not item:
        raise HTTPException(404, "Item not found")

    if item["current_stock"] < s.quantity:
        raise HTTPException(400, "No stock")

    await db.items.update_one(
        {"_id": ObjectId(s.item_id)},
        {"$inc": {"current_stock": -s.quantity}}
    )

    data = s.dict()
    data["created_at"] = datetime.utcnow()

    await db.sales.insert_one(data)

    return {"message": "Sale Added"}


@router.get("/sales")
async def get_sales():

    sales = await db.sales.find().to_list(1000)
    return [serialize(s) for s in sales]


# ================= PURCHASE =================

@router.post("/purchase")
async def add_purchase(p: Purchase):

    stock = await db.part_stocks.find_one(
        {"part_name": p.part_name}
    )

    if not stock:

        await db.part_stocks.insert_one({
            "part_name": p.part_name,
            "current_stock": p.quantity
        })

    else:

        await db.part_stocks.update_one(
            {"_id": stock["_id"]},
            {"$inc": {"current_stock": p.quantity}}
        )

    await db.purchases.insert_one(p.dict())

    return {"message": "Purchase Added"}


# ================= RESET =================

@router.post("/reset")
async def reset_db():

    await db.items.delete_many({})
    await db.part_stocks.delete_many({})
    await db.production.delete_many({})
    await db.sales.delete_many({})
    await db.purchases.delete_many({})

    return {"message": "Database Reset"}


# ================= ADMIN =================

@app.on_event("startup")
async def create_admin():

    admin = await db.admins.find_one({"username": "admin"})

    if not admin:

        await db.admins.insert_one({
            "username": "admin",
            "password": hash_password("admin123")
        })


# ================= START =================

app.include_router(router)


@app.on_event("shutdown")
async def close_db():
    client.close()

