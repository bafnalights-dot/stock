from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# ---------------- CORS ----------------

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
    party_name: str   # FIXED


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
        "id": str(len(ITEMS) + 1),
        "name": item.name,
        "category": item.category,
        "current_stock": item.opening_stock,
        "parts": []
    })

    return {"msg": "Item added"}


# ---------------- PARTS / PURCHASE ----------------

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

    item["current_stock"] += p.quantity

    PRODUCTION.append(p.dict())

    return {"msg": "Production saved"}


# ---------------- SALES ----------------

@app.post("/api/sales")
def sale(s: Sale):

    item = next((i for i in ITEMS if i["name"] == s.item_name), None)

    if not item:
        raise HTTPException(404, "Item not found")

    if item["current_stock"] < s.quantity:
        raise HTTPException(400, "Not enough stock")

    item["current_stock"] -= s.quantity

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
