from pymongo import MongoClient
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()
# MongoDB Connection
MONGO_URL = "mongodb+srv://bafnalights_db_user:b1a1f1n1a1@cluster0.enljv5h.mongodb.net/stockdb?appName=Cluster0"

client = MongoClient(MONGO_URL)
db = client["stockdb"]

items_col = db["items"]
parts_col = db["parts"]
sales_col = db["sales"]
production_col = db["production"]

# ---------------- CORS ----------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DATA ----------------


ADMIN = {"username": "admin", "password": "admin"}


# ---------------- MODELS ----------------

class Login(BaseModel):
    username: str
    password: str


class PartBOM(BaseModel):
    name: str
    qty: int


class Item(BaseModel):
    name: str
    category: str
    opening_stock: int
    parts: List[PartBOM]


class Sale(BaseModel):
    item_name: str
    quantity: int
    party: str


class Purchase(BaseModel):
    part_name: str
    quantity: int


class Production(BaseModel):
    item_name: str
    quantity: int



# ---------------- LOGIN ----------------

@app.post("/api/login")
def login(data: Login):

    if data.username == ADMIN["username"] and data.password == ADMIN["password"]:
        return {"access_token": "demo-token"}

    raise HTTPException(401, "Invalid login")


# ---------------- ITEMS ----------------

@app.get("/api/items")
def get_items():
    items = list(items_col.find({}, {"_id": 0}))
    return items


@app.post("/api/items")
def add_item(item: Item):

    ITEMS.append({
        "name": item.name,
        "category": item.category,
        "stock": item.opening_stock,
        "parts": [p.dict() for p in item.parts]
    })

    return {"msg": "Item added"}

@app.get("/api/items/{name}/parts")
def get_item_parts(name: str):

    item = next((i for i in ITEMS if i["name"] == name), None)

    if not item:
        raise HTTPException(404, "Item not found")

    return item["parts"]



# ---------------- PARTS / PURCHASE ----------------

@app.get("/api/parts")
def get_parts():
    return PARTS


@app.post("/api/purchase")
def purchase(p: Purchase):

    parts_col.update_one(
        {"part_name": p.part_name},
        {"$inc": {"stock": p.quantity}},
        upsert=True
    )

    return {"msg": "Part added"}



# ---------------- PRODUCTION ----------------

@app.post("/api/production")
def production(p: Production):

    item = next((i for i in ITEMS if i["name"] == p.item_name), None)

    if not item:
        raise HTTPException(404, "Item not found")

    # Check & deduct parts
    for part in item["parts"]:

        part_name = part["name"]
        need = part["qty"] * p.quantity

        if part_name not in PARTS:
            raise HTTPException(400, f"{part_name} not in stock")

        if PARTS[part_name] < need:
            raise HTTPException(400, f"Not enough {part_name}")

        PARTS[part_name] -= need

    # Increase finished stock
    item["stock"] += p.quantity

    PRODUCTION.append(p.dict())

    return {"msg": "Production saved"}
# ---------------- SALES ----------------

@app.post("/api/sales")
def sale(s: Sale):

    item = items_col.find_one({"name": s.item_name})

    if not item:
        raise HTTPException(404, "Item not found")

    if item["stock"] < s.quantity:
        raise HTTPException(400, "Not enough stock")

    items_col.update_one(
        {"name": s.item_name},
        {"$inc": {"stock": -s.quantity}}
    )

    sales_col.insert_one(s.dict())

    return {"msg": "Sale saved"}



# ---------------- RESET ----------------

@app.post("/api/reset")
def reset():

    ITEMS.clear()
    PARTS.clear()
    SALES.clear()
    PRODUCTION.clear()

    return {"msg": "Reset done"}
