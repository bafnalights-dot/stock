from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
from pydantic import BaseModel
from datetime import datetime
from bson import ObjectId
import jwt, os

# ================= CONFIG =================

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")

SECRET_KEY = "CHANGE_ME_123456"
ALGORITHM = "HS256"

# ================= APP =================

app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all websites
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

router = APIRouter(prefix="/api")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

pwd = CryptContext(schemes=["bcrypt"])
security = HTTPBearer()

# ================= AUTH =================


def hash_pass(p):
    return pwd.hash(p)


def verify_pass(p, h):
    return pwd.verify(p, h)


def make_token(user):
    return jwt.encode({"sub": user}, SECRET_KEY, algorithm=ALGORITHM)


async def get_user(
    cred: HTTPAuthorizationCredentials = Depends(security)
):
    try:
        data = jwt.decode(
            cred.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        return data["sub"]
    except:
        raise HTTPException(401, "Invalid Token")


# ================= MODELS =================

class Login(BaseModel):
    username: str
    password: str


class Item(BaseModel):
    name: str
    category: str
    opening_stock: int


class Part(BaseModel):
    name: str
    quantity: int


class Production(BaseModel):
    item_id: str
    quantity: int


class Sale(BaseModel):
    item_id: str
    quantity: int
    party: str


# ================= UTILS =================


def clean(d):
    d["id"] = str(d["_id"])
    del d["_id"]
    return d


# ================= LOGIN =================

@router.post("/login")
async def login(data: Login):

    admin = await db.admin.find_one(
        {"username": data.username}
    )

    if not admin:
        raise HTTPException(401, "Wrong User")

    if not verify_pass(
        data.password,
        admin["password"]
    ):
        raise HTTPException(401, "Wrong Pass")

    return {
        "access_token": make_token(data.username)
    }


# ================= ITEMS =================

@router.post("/items")
async def add_item(item: Item, user=Depends(get_user)):

    item_data = item.dict()
    item_data["current_stock"] = item.opening_stock
    item_data["created"] = datetime.utcnow()

    await db.items.insert_one(item_data)

    return {"msg": "Item Added"}


@router.get("/items")
async def get_items():

    items = await db.items.find().to_list(1000)

    return [clean(i) for i in items]


# ================= PARTS =================

@router.post("/parts")
async def buy_part(p: Part, user=Depends(get_user)):

    old = await db.parts.find_one(
        {"name": p.name}
    )

    if old:
        new = old["stock"] + p.quantity

        await db.parts.update_one(
            {"_id": old["_id"]},
            {"$set": {"stock": new}}
        )
    else:
        await db.parts.insert_one({
            "name": p.name,
            "stock": p.quantity
        })

    return {"msg": "Part Added"}


@router.get("/parts")
async def get_parts():

    parts = await db.parts.find().to_list(1000)

    return [clean(p) for p in parts]


# ================= DRIVERS =================

@router.post("/drivers")
async def add_driver(p: Part, user=Depends(get_user)):

    old = await db.drivers.find_one(
        {"name": p.name}
    )

    if old:
        new = old["stock"] + p.quantity

        await db.drivers.update_one(
            {"_id": old["_id"]},
            {"$set": {"stock": new}}
        )
    else:
        await db.drivers.insert_one({
            "name": p.name,
            "stock": p.quantity
        })

    return {"msg": "Driver Added"}


@router.get("/drivers")
async def get_drivers():

    drivers = await db.drivers.find().to_list(1000)

    return [clean(d) for d in drivers]


# ================= PRODUCTION =================

# PART RULES
PART_RULES = {

    "50W FL": {
        "50W Driver": 1,
        "50W PCB": 1,
        "Body": 1
    },

    "100W FL": {
        "50W Driver": 2,
        "100W PCB": 1,
        "Body": 1
    },

    "24W SL": {
        "24W Driver": 1,
        "PCB": 1,
        "Body": 1
    }

}


@router.post("/production")
async def produce(p: Production, user=Depends(get_user)):

    item = await db.items.find_one(
        {"_id": ObjectId(p.item_id)}
    )

    if not item:
        raise HTTPException(404, "Item Not Found")

    rules = PART_RULES.get(item["name"])

    if not rules:
        raise HTTPException(
            400,
            "No Part Rule For This Item"
        )

    # CHECK PARTS

    for part, qty in rules.items():

        db_part = await db.parts.find_one(
            {"name": part}
        )

        need = qty * p.quantity

        if not db_part or db_part["stock"] < need:
            raise HTTPException(
                400,
                f"Not enough {part}"
            )

    # DEDUCT PARTS

    for part, qty in rules.items():

        db_part = await db.parts.find_one(
            {"name": part}
        )

        need = qty * p.quantity

        await db.parts.update_one(
            {"_id": db_part["_id"]},
            {"$inc": {"stock": -need}}
        )

    # ADD ITEM STOCK

    await db.items.update_one(
        {"_id": item["_id"]},
        {"$inc": {"current_stock": p.quantity}}
    )

    return {"msg": "Production Done"}


# ================= SALES =================

@router.post("/sales")
async def sale(s: Sale, user=Depends(get_user)):

    item = await db.items.find_one(
        {"_id": ObjectId(s.item_id)}
    )

    if not item:
        raise HTTPException(404, "Item Not Found")

    if item["current_stock"] < s.quantity:
        raise HTTPException(400, "No Stock")

    await db.items.update_one(
        {"_id": item["_id"]},
        {"$inc": {"current_stock": -s.quantity}}
    )

    await db.sales.insert_one({
        "item": s.item_id,
        "qty": s.quantity,
        "party": s.party,
        "date": datetime.utcnow()
    })

    return {"msg": "Sale Saved"}


# ================= RESET =================

@router.post("/reset")
async def reset(user=Depends(get_user)):

    await db.items.delete_many({})
    await db.parts.delete_many({})
    await db.drivers.delete_many({})
    await db.sales.delete_many({})

    return {"msg": "System Reset"}


# ================= ADMIN =================

@app.on_event("startup")
async def admin():

    a = await db.admin.find_one(
        {"username": "admin"}
    )

    if not a:
        await db.admin.insert_one({
            "username": "admin",
            "password": hash_pass("admin123")
        })


# ================= START =================

app.include_router(router)
