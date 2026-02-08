from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from typing import List


app = FastAPI()

# ---------------- MONGO ----------------

MONGO_URL = "mongodb+srv://bafnalights_db_user:b1a1f1n1a1@cluster0.enljv5h.mongodb.net/stockdb"

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


# ---------------- ADMIN ----------------

ADMIN = {
    "username": "admin",
    "password": "admin"
}


# ---------------- MODELS ----------------

class Login(BaseModel):
    username: str
    password: str


class PartBOM(BaseModel):
    part_name: str
    quantity_needed: int


class Item(BaseModel):
    name: str
    category: str
    opening_stock: int
    parts: List[PartBOM]


class Sale(BaseModel):
    item_name: str
    quantity: int
    party_name: str


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

    if items_col.find_one({"name": item.name}):
        raise HTTPException(400, "Item already exists")

    doc = {
        "name": item.name,
        "category": item.category,
        "current_stock": item.opening_stock,
        "parts": [p.dict() for p in item.parts]
    }

    items_col.insert_one(doc)

    return {"msg": "Item added"}


# ---------------- PARTS / PURCHASE ----------------

@app.post("/api/purchases")
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

    item = items_col.find_one({"name": p.item_name})

    if not item:
        raise HTTPException(404, "Item not found")

    # Check parts stock
    for part in item["parts"]:

        need = part["quantity_needed"] * p.quantity

        stock = parts_col.find_one({"part_name": part["part_name"]})

        if not stock or stock["stock"] < need:
            raise HTTPException(
                400,
                f"Not enough {part['part_name']}"
            )

    # Deduct parts
    for part in item["parts"]:

        need = part["quantity_needed"] * p.quantity

        parts_col.update_one(
            {"part_name": part["part_name"]},
            {"$inc": {"stock": -need}}
        )

    # Add finished stock
    items_col.update_one(
        {"name": p.item_name},
        {"$inc": {"current_stock": p.quantity}}
    )

    production_col.insert_one(p.dict())

    return {"msg": "Production saved"}


# ---------------- SALES ----------------

@app.post("/api/sales")
def sale(s: Sale):

    item = items_col.find_one({"name": s.item_name})

    if not item:
        raise HTTPException(404, "Item not found")

    if item["current_stock"] < s.quantity:
        raise HTTPException(400, "Not enough stock")

    items_col.update_one(
        {"name": s.item_name},
        {"$inc": {"current_stock": -s.quantity}}
    )

    sales_col.insert_one(s.dict())

    return {"msg": "Sale saved"}
