from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from datetime import date

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DATA ----------------

ITEMS = []
PARTS = {}
SALES = []
PRODUCTION = []

ADMIN = {"username": "admin", "password": "admin"}


# ---------------- MODELS ----------------

class Login(BaseModel):
    username: str
    password: str


class Item(BaseModel):
    name: str
    category: str
    opening_stock: int


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
    return ITEMS


@app.post("/api/items")
def add_item(item: Item):

    ITEMS.append({
        "name": item.name,
        "category": item.category,
        "stock": item.opening_stock
    })

    return {"msg": "Item added"}


# ---------------- PARTS ----------------

@app.get("/api/parts")
def get_parts():
    return PARTS


@app.post("/api/purchase")
def purchase(p: Purchase):

    if p.part_name not in PARTS:
        PARTS[p.part_name] = 0

    PARTS[p.part_name] += p.quantity

    return {"msg": "Part added"}


# ---------------- PRODUCTION ----------------

@app.post("/api/production")
def production(p: Production):

    item = next((i for i in ITEMS if i["name"] == p.item_name), None)

    if not item:
        raise HTTPException(404, "Item not found")

    item["stock"] += p.quantity

    return {"msg": "Production saved"}


# ---------------- SALES ----------------

@app.post("/api/sales")
def sale(s: Sale):

    item = next((i for i in ITEMS if i["name"] == s.item_name), None)

    if not item:
        raise HTTPException(404, "Item not found")

    if item["stock"] < s.quantity:
        raise HTTPException(400, "Not enough stock")

    item["stock"] -= s.quantity

    SALES.append(s.dict())

    return {"msg": "Sale saved"}


# ---------------- RESET ----------------

@app.post("/api/reset")
def reset():

    ITEMS.clear()
    PARTS.clear()
    SALES.clear()
    PRODUCTION.clear()

    return {"msg": "Reset done"}
