from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
from datetime import datetime
from bson import ObjectId
import io
from fastapi.responses import StreamingResponse
import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Helper function to convert ObjectId to string
def serialize_doc(doc):
    if doc and '_id' in doc:
        doc['id'] = str(doc['_id'])
        del doc['_id']
    return doc

# ============= MODELS =============

class Supplier(BaseModel):
    name: str
    contact_info: Optional[str] = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

class SupplierResponse(BaseModel):
    id: str
    name: str
    contact_info: Optional[str] = ""
    created_at: datetime

class Part(BaseModel):
    name: str
    category: Optional[str] = ""
    quantity: float
    supplier_id: Optional[str] = None
    purchase_price: float
    low_stock_threshold: float = 10
    last_purchase_date: datetime = Field(default_factory=datetime.utcnow)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PartResponse(BaseModel):
    id: str
    name: str
    category: Optional[str] = ""
    quantity: float
    supplier_id: Optional[str] = None
    supplier_name: Optional[str] = None
    purchase_price: float
    low_stock_threshold: float
    last_purchase_date: datetime
    created_at: datetime
    is_low_stock: bool = False

class FinishedProduct(BaseModel):
    name: str
    category: Optional[str] = ""
    quantity: float = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class FinishedProductResponse(BaseModel):
    id: str
    name: str
    category: Optional[str] = ""
    quantity: float
    created_at: datetime
    has_recipe: bool = False

class RecipePart(BaseModel):
    part_id: str
    quantity_needed: float

class Recipe(BaseModel):
    finished_product_id: str
    parts: List[RecipePart]
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RecipeResponse(BaseModel):
    id: str
    finished_product_id: str
    finished_product_name: str
    parts: List[Dict]
    created_at: datetime

class AssembleRequest(BaseModel):
    finished_product_id: str
    quantity: int = 1

class Transaction(BaseModel):
    type: str  # 'purchase_part' or 'assembly'
    date: datetime = Field(default_factory=datetime.utcnow)
    details: Dict
    cost: float = 0

# ============= SUPPLIER ROUTES =============

@api_router.post("/suppliers", response_model=SupplierResponse)
async def create_supplier(supplier: Supplier):
    try:
        result = await db.suppliers.insert_one(supplier.dict())
        created = await db.suppliers.find_one({"_id": result.inserted_id})
        return serialize_doc(created)
    except Exception as e:
        logger.error(f"Error creating supplier: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/suppliers", response_model=List[SupplierResponse])
async def get_suppliers():
    try:
        suppliers = await db.suppliers.find().sort("name", 1).to_list(1000)
        return [serialize_doc(s) for s in suppliers]
    except Exception as e:
        logger.error(f"Error fetching suppliers: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= PARTS ROUTES =============

@api_router.post("/parts", response_model=PartResponse)
async def add_part(part: Part):
    try:
        result = await db.parts.insert_one(part.dict())
        created = await db.parts.find_one({"_id": result.inserted_id})
        
        # Log transaction
        transaction = Transaction(
            type="purchase_part",
            details={
                "part_name": part.name,
                "quantity": part.quantity,
                "price": part.purchase_price
            },
            cost=part.quantity * part.purchase_price
        )
        await db.transactions.insert_one(transaction.dict())
        
        return await format_part_response(created)
    except Exception as e:
        logger.error(f"Error adding part: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/parts", response_model=List[PartResponse])
async def get_parts():
    try:
        parts = await db.parts.find().sort("name", 1).to_list(1000)
        return [await format_part_response(p) for p in parts]
    except Exception as e:
        logger.error(f"Error fetching parts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/parts/{part_id}", response_model=PartResponse)
async def update_part(part_id: str, part: Part):
    try:
        result = await db.parts.update_one(
            {"_id": ObjectId(part_id)},
            {"$set": part.dict()}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Part not found")
        
        updated = await db.parts.find_one({"_id": ObjectId(part_id)})
        return await format_part_response(updated)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating part: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def format_part_response(part):
    response = serialize_doc(part)
    response['is_low_stock'] = part['quantity'] <= part.get('low_stock_threshold', 10)
    
    if part.get('supplier_id'):
        try:
            supplier = await db.suppliers.find_one({"_id": ObjectId(part['supplier_id'])})
            if supplier:
                response['supplier_name'] = supplier['name']
        except:
            response['supplier_name'] = None
    
    return response

# ============= FINISHED PRODUCTS ROUTES =============

@api_router.post("/finished-products", response_model=FinishedProductResponse)
async def create_finished_product(product: FinishedProduct):
    try:
        result = await db.finished_products.insert_one(product.dict())
        created = await db.finished_products.find_one({"_id": result.inserted_id})
        return await format_product_response(created)
    except Exception as e:
        logger.error(f"Error creating finished product: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/finished-products", response_model=List[FinishedProductResponse])
async def get_finished_products():
    try:
        products = await db.finished_products.find().sort("name", 1).to_list(1000)
        return [await format_product_response(p) for p in products]
    except Exception as e:
        logger.error(f"Error fetching finished products: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def format_product_response(product):
    response = serialize_doc(product)
    recipe = await db.recipes.find_one({"finished_product_id": response['id']})
    response['has_recipe'] = recipe is not None
    return response

# ============= RECIPE ROUTES =============

@api_router.post("/recipes", response_model=RecipeResponse)
async def create_recipe(recipe: Recipe):
    try:
        # Check if recipe already exists
        existing = await db.recipes.find_one({"finished_product_id": recipe.finished_product_id})
        if existing:
            # Update existing recipe
            await db.recipes.update_one(
                {"finished_product_id": recipe.finished_product_id},
                {"$set": recipe.dict()}
            )
            updated = await db.recipes.find_one({"finished_product_id": recipe.finished_product_id})
            return await format_recipe_response(updated)
        else:
            result = await db.recipes.insert_one(recipe.dict())
            created = await db.recipes.find_one({"_id": result.inserted_id})
            return await format_recipe_response(created)
    except Exception as e:
        logger.error(f"Error creating recipe: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/recipes/{product_id}", response_model=RecipeResponse)
async def get_recipe(product_id: str):
    try:
        recipe = await db.recipes.find_one({"finished_product_id": product_id})
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        return await format_recipe_response(recipe)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching recipe: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/recipes", response_model=List[RecipeResponse])
async def get_all_recipes():
    try:
        recipes = await db.recipes.find().to_list(1000)
        return [await format_recipe_response(r) for r in recipes]
    except Exception as e:
        logger.error(f"Error fetching recipes: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def format_recipe_response(recipe):
    response = serialize_doc(recipe)
    
    # Get product name
    product = await db.finished_products.find_one({"_id": ObjectId(recipe['finished_product_id'])})
    response['finished_product_name'] = product['name'] if product else "Unknown"
    
    # Get part details
    parts_details = []
    for rp in recipe['parts']:
        part = await db.parts.find_one({"_id": ObjectId(rp['part_id'])})
        if part:
            parts_details.append({
                "part_id": rp['part_id'],
                "part_name": part['name'],
                "quantity_needed": rp['quantity_needed'],
                "available_quantity": part['quantity']
            })
    response['parts'] = parts_details
    
    return response

# ============= ASSEMBLY ROUTE =============

@api_router.post("/assemble")
async def assemble_product(request: AssembleRequest):
    try:
        # Get product
        product = await db.finished_products.find_one({"_id": ObjectId(request.finished_product_id)})
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Get recipe
        recipe = await db.recipes.find_one({"finished_product_id": request.finished_product_id})
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found for this product")
        
        # Check if enough parts are available
        insufficient_parts = []
        for rp in recipe['parts']:
            part = await db.parts.find_one({"_id": ObjectId(rp['part_id'])})
            if not part:
                raise HTTPException(status_code=404, detail=f"Part not found: {rp['part_id']}")
            
            required = rp['quantity_needed'] * request.quantity
            if part['quantity'] < required:
                insufficient_parts.append({
                    "part_name": part['name'],
                    "required": required,
                    "available": part['quantity']
                })
        
        if insufficient_parts:
            return {
                "success": False,
                "message": "Insufficient parts",
                "insufficient_parts": insufficient_parts
            }
        
        # Deduct parts
        parts_used = []
        total_cost = 0
        for rp in recipe['parts']:
            part = await db.parts.find_one({"_id": ObjectId(rp['part_id'])})
            quantity_to_deduct = rp['quantity_needed'] * request.quantity
            new_quantity = part['quantity'] - quantity_to_deduct
            
            await db.parts.update_one(
                {"_id": ObjectId(rp['part_id'])},
                {"$set": {"quantity": new_quantity}}
            )
            
            parts_used.append({
                "part_name": part['name'],
                "quantity_used": quantity_to_deduct
            })
            total_cost += quantity_to_deduct * part['purchase_price']
        
        # Add finished product
        new_product_quantity = product['quantity'] + request.quantity
        await db.finished_products.update_one(
            {"_id": ObjectId(request.finished_product_id)},
            {"$set": {"quantity": new_product_quantity}}
        )
        
        # Log transaction
        transaction = Transaction(
            type="assembly",
            details={
                "product_name": product['name'],
                "quantity_produced": request.quantity,
                "parts_used": parts_used
            },
            cost=total_cost
        )
        await db.transactions.insert_one(transaction.dict())
        
        return {
            "success": True,
            "message": f"Successfully assembled {request.quantity} {product['name']}",
            "new_quantity": new_product_quantity,
            "parts_used": parts_used,
            "cost": total_cost
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assembling product: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= TRANSACTION ROUTES =============

@api_router.get("/transactions")
async def get_transactions(limit: int = 100):
    try:
        transactions = await db.transactions.find().sort("date", -1).limit(limit).to_list(limit)
        return [serialize_doc(t) for t in transactions]
    except Exception as e:
        logger.error(f"Error fetching transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= EXCEL EXPORT ROUTE =============

@api_router.get("/export/excel")
async def export_excel():
    try:
        # Create workbook
        wb = openpyxl.Workbook()
        
        # Remove default sheet
        wb.remove(wb.active)
        
        # ===== PARTS SHEET =====
        ws_parts = wb.create_sheet("Parts Inventory")
        
        # Headers
        headers_parts = ["Part Name", "Category", "Quantity", "Supplier", "Purchase Price", 
                        "Low Stock Threshold", "Status", "Last Purchase Date"]
        ws_parts.append(headers_parts)
        
        # Style headers
        header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        header_font = Font(bold=True, color="FFFFFF")
        for cell in ws_parts[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center")
        
        # Data
        parts = await db.parts.find().sort("name", 1).to_list(1000)
        for part in parts:
            supplier_name = ""
            if part.get('supplier_id'):
                supplier = await db.suppliers.find_one({"_id": ObjectId(part['supplier_id'])})
                supplier_name = supplier['name'] if supplier else ""
            
            status = "LOW STOCK" if part['quantity'] <= part.get('low_stock_threshold', 10) else "OK"
            ws_parts.append([
                part['name'],
                part.get('category', ''),
                part['quantity'],
                supplier_name,
                part['purchase_price'],
                part.get('low_stock_threshold', 10),
                status,
                part.get('last_purchase_date', '').strftime('%Y-%m-%d') if part.get('last_purchase_date') else ''
            ])
        
        # ===== FINISHED PRODUCTS SHEET =====
        ws_products = wb.create_sheet("Finished Products")
        
        # Headers
        headers_products = ["Product Name", "Category", "Quantity", "Has Recipe", "Created Date"]
        ws_products.append(headers_products)
        
        # Style headers
        for cell in ws_products[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center")
        
        # Data
        products = await db.finished_products.find().sort("name", 1).to_list(1000)
        for product in products:
            recipe = await db.recipes.find_one({"finished_product_id": str(product['_id'])})
            has_recipe = "Yes" if recipe else "No"
            
            ws_products.append([
                product['name'],
                product.get('category', ''),
                product['quantity'],
                has_recipe,
                product.get('created_at', '').strftime('%Y-%m-%d') if product.get('created_at') else ''
            ])
        
        # ===== TRANSACTIONS SHEET =====
        ws_transactions = wb.create_sheet("Transactions")
        
        # Headers
        headers_transactions = ["Date", "Type", "Details", "Cost"]
        ws_transactions.append(headers_transactions)
        
        # Style headers
        for cell in ws_transactions[1]:
            cell.fill = header_fill
            cell.font = header_font
            cell.alignment = Alignment(horizontal="center")
        
        # Data
        transactions = await db.transactions.find().sort("date", -1).to_list(1000)
        for trans in transactions:
            details_str = str(trans.get('details', {}))
            ws_transactions.append([
                trans.get('date', '').strftime('%Y-%m-%d %H:%M:%S') if trans.get('date') else '',
                trans.get('type', ''),
                details_str,
                trans.get('cost', 0)
            ])
        
        # Auto-adjust column widths
        for ws in [ws_parts, ws_products, ws_transactions]:
            for column in ws.columns:
                max_length = 0
                column_letter = column[0].column_letter
                for cell in column:
                    try:
                        if len(str(cell.value)) > max_length:
                            max_length = len(str(cell.value))
                    except:
                        pass
                adjusted_width = min(max_length + 2, 50)
                ws.column_dimensions[column_letter].width = adjusted_width
        
        # Save to bytes
        excel_file = io.BytesIO()
        wb.save(excel_file)
        excel_file.seek(0)
        
        return StreamingResponse(
            excel_file,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=stock_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"}
        )
    except Exception as e:
        logger.error(f"Error exporting excel: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============= DASHBOARD STATS =============

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    try:
        total_parts = await db.parts.count_documents({})
        total_products = await db.finished_products.count_documents({})
        
        # Low stock count
        parts = await db.parts.find().to_list(1000)
        low_stock_count = sum(1 for p in parts if p['quantity'] <= p.get('low_stock_threshold', 10))
        
        # Recent transactions
        recent_transactions = await db.transactions.find().sort("date", -1).limit(5).to_list(5)
        
        return {
            "total_parts": total_parts,
            "total_products": total_products,
            "low_stock_count": low_stock_count,
            "recent_transactions": [serialize_doc(t) for t in recent_transactions]
        }
    except Exception as e:
        logger.error(f"Error fetching dashboard stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
