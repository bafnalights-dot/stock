#!/usr/bin/env python3
"""
Stock Management System Backend API Tests
Tests all backend APIs according to the review request specifications.
"""

import requests
import json
import sys
from datetime import datetime
import os

# Get backend URL from frontend .env
BACKEND_URL = "https://inventory-pro-158.preview.emergentagent.com/api"

class StockManagementTester:
    def __init__(self):
        self.base_url = BACKEND_URL
        self.session = requests.Session()
        self.test_data = {}
        self.results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "details": details or {}
        }
        self.results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def test_suppliers_api(self):
        """Test Suppliers API endpoints"""
        print("\n=== Testing Suppliers API ===")
        
        # Test 1: Create supplier
        try:
            supplier_data = {
                "name": "ABC Supplier",
                "contact_info": "123-456-7890"
            }
            
            response = self.session.post(f"{self.base_url}/suppliers", json=supplier_data)
            
            if response.status_code == 200:
                supplier = response.json()
                self.test_data['supplier_id'] = supplier['id']
                self.test_data['supplier_name'] = supplier['name']
                
                # Verify response structure
                required_fields = ['id', 'name', 'contact_info', 'created_at']
                missing_fields = [f for f in required_fields if f not in supplier]
                
                if missing_fields:
                    self.log_result("Create Supplier", False, f"Missing fields: {missing_fields}", supplier)
                else:
                    self.log_result("Create Supplier", True, f"Created supplier: {supplier['name']}")
            else:
                self.log_result("Create Supplier", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Create Supplier", False, f"Exception: {str(e)}")
        
        # Test 2: Get all suppliers
        try:
            response = self.session.get(f"{self.base_url}/suppliers")
            
            if response.status_code == 200:
                suppliers = response.json()
                if isinstance(suppliers, list) and len(suppliers) > 0:
                    # Verify our created supplier is in the list
                    found_supplier = any(s['name'] == 'ABC Supplier' for s in suppliers)
                    if found_supplier:
                        self.log_result("Get Suppliers", True, f"Retrieved {len(suppliers)} suppliers")
                    else:
                        self.log_result("Get Suppliers", False, "Created supplier not found in list", suppliers)
                else:
                    self.log_result("Get Suppliers", False, "No suppliers returned or invalid format", suppliers)
            else:
                self.log_result("Get Suppliers", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Get Suppliers", False, f"Exception: {str(e)}")
    
    def test_parts_api(self):
        """Test Parts API endpoints"""
        print("\n=== Testing Parts API ===")
        
        # Test 1: Create part with supplier
        try:
            part_data = {
                "name": "Screw",
                "quantity": 100,
                "purchase_price": 0.50,
                "supplier_id": self.test_data.get('supplier_id')
            }
            
            response = self.session.post(f"{self.base_url}/parts", json=part_data)
            
            if response.status_code == 200:
                part = response.json()
                self.test_data['screw_id'] = part['id']
                
                # Verify response structure and low stock calculation
                required_fields = ['id', 'name', 'quantity', 'purchase_price', 'is_low_stock']
                missing_fields = [f for f in required_fields if f not in part]
                
                if missing_fields:
                    self.log_result("Create Part (Screw)", False, f"Missing fields: {missing_fields}", part)
                elif part['is_low_stock'] != False:  # 100 > 10 threshold
                    self.log_result("Create Part (Screw)", False, "Incorrect low_stock calculation", part)
                else:
                    self.log_result("Create Part (Screw)", True, f"Created part: {part['name']} (qty: {part['quantity']})")
            else:
                self.log_result("Create Part (Screw)", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Create Part (Screw)", False, f"Exception: {str(e)}")
        
        # Test 2: Create part without supplier
        try:
            part_data = {
                "name": "Bolt",
                "quantity": 50,
                "purchase_price": 0.75
            }
            
            response = self.session.post(f"{self.base_url}/parts", json=part_data)
            
            if response.status_code == 200:
                part = response.json()
                self.test_data['bolt_id'] = part['id']
                self.log_result("Create Part (Bolt)", True, f"Created part: {part['name']} (qty: {part['quantity']})")
            else:
                self.log_result("Create Part (Bolt)", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Create Part (Bolt)", False, f"Exception: {str(e)}")
        
        # Test 3: Create low stock part
        try:
            part_data = {
                "name": "Washer",
                "quantity": 5,  # Below default threshold of 10
                "purchase_price": 0.25
            }
            
            response = self.session.post(f"{self.base_url}/parts", json=part_data)
            
            if response.status_code == 200:
                part = response.json()
                self.test_data['washer_id'] = part['id']
                
                # Verify low stock flag is set correctly
                if part.get('is_low_stock') == True:
                    self.log_result("Create Part (Washer - Low Stock)", True, f"Created low stock part: {part['name']}")
                else:
                    self.log_result("Create Part (Washer - Low Stock)", False, "Low stock flag not set correctly", part)
            else:
                self.log_result("Create Part (Washer - Low Stock)", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Create Part (Washer - Low Stock)", False, f"Exception: {str(e)}")
        
        # Test 4: Get all parts and verify low_stock flags
        try:
            response = self.session.get(f"{self.base_url}/parts")
            
            if response.status_code == 200:
                parts = response.json()
                if isinstance(parts, list) and len(parts) >= 3:
                    # Check low stock calculations
                    low_stock_parts = [p for p in parts if p.get('is_low_stock') == True]
                    normal_stock_parts = [p for p in parts if p.get('is_low_stock') == False]
                    
                    # Verify our washer is marked as low stock
                    washer_low_stock = any(p['name'] == 'Washer' and p['is_low_stock'] for p in parts)
                    screw_normal_stock = any(p['name'] == 'Screw' and not p['is_low_stock'] for p in parts)
                    
                    if washer_low_stock and screw_normal_stock:
                        self.log_result("Get Parts with Low Stock Flags", True, 
                                      f"Retrieved {len(parts)} parts, {len(low_stock_parts)} low stock")
                    else:
                        self.log_result("Get Parts with Low Stock Flags", False, 
                                      "Low stock flags not calculated correctly", 
                                      {"parts": parts, "low_stock_count": len(low_stock_parts)})
                else:
                    self.log_result("Get Parts with Low Stock Flags", False, "Insufficient parts returned", parts)
            else:
                self.log_result("Get Parts with Low Stock Flags", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Get Parts with Low Stock Flags", False, f"Exception: {str(e)}")
    
    def test_finished_products_api(self):
        """Test Finished Products API endpoints"""
        print("\n=== Testing Finished Products API ===")
        
        # Test 1: Create finished product
        try:
            product_data = {
                "name": "Assembly Kit",
                "category": "Kits"
            }
            
            response = self.session.post(f"{self.base_url}/finished-products", json=product_data)
            
            if response.status_code == 200:
                product = response.json()
                self.test_data['product_id'] = product['id']
                
                # Verify response structure
                required_fields = ['id', 'name', 'category', 'quantity', 'has_recipe']
                missing_fields = [f for f in required_fields if f not in product]
                
                if missing_fields:
                    self.log_result("Create Finished Product", False, f"Missing fields: {missing_fields}", product)
                elif product['has_recipe'] != False:  # Should be False initially
                    self.log_result("Create Finished Product", False, "has_recipe should be False initially", product)
                else:
                    self.log_result("Create Finished Product", True, f"Created product: {product['name']}")
            else:
                self.log_result("Create Finished Product", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Create Finished Product", False, f"Exception: {str(e)}")
        
        # Test 2: Get all finished products
        try:
            response = self.session.get(f"{self.base_url}/finished-products")
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list) and len(products) > 0:
                    # Verify our created product is in the list
                    found_product = any(p['name'] == 'Assembly Kit' for p in products)
                    if found_product:
                        self.log_result("Get Finished Products", True, f"Retrieved {len(products)} products")
                    else:
                        self.log_result("Get Finished Products", False, "Created product not found in list", products)
                else:
                    self.log_result("Get Finished Products", False, "No products returned or invalid format", products)
            else:
                self.log_result("Get Finished Products", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Get Finished Products", False, f"Exception: {str(e)}")
    
    def test_recipe_api(self):
        """Test Recipe API endpoints"""
        print("\n=== Testing Recipe API ===")
        
        # Test 1: Create recipe
        try:
            # Update washer quantity to 200 for assembly testing
            washer_update = {
                "name": "Washer",
                "quantity": 200,
                "purchase_price": 0.25
            }
            self.session.put(f"{self.base_url}/parts/{self.test_data['washer_id']}", json=washer_update)
            
            recipe_data = {
                "finished_product_id": self.test_data.get('product_id'),
                "parts": [
                    {"part_id": self.test_data.get('screw_id'), "quantity_needed": 5},
                    {"part_id": self.test_data.get('bolt_id'), "quantity_needed": 2},
                    {"part_id": self.test_data.get('washer_id'), "quantity_needed": 3}
                ]
            }
            
            response = self.session.post(f"{self.base_url}/recipes", json=recipe_data)
            
            if response.status_code == 200:
                recipe = response.json()
                self.test_data['recipe_id'] = recipe['id']
                
                # Verify response structure
                required_fields = ['id', 'finished_product_id', 'finished_product_name', 'parts']
                missing_fields = [f for f in required_fields if f not in recipe]
                
                if missing_fields:
                    self.log_result("Create Recipe", False, f"Missing fields: {missing_fields}", recipe)
                elif len(recipe['parts']) != 3:
                    self.log_result("Create Recipe", False, f"Expected 3 parts, got {len(recipe['parts'])}", recipe)
                else:
                    self.log_result("Create Recipe", True, f"Created recipe for {recipe['finished_product_name']}")
            else:
                self.log_result("Create Recipe", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Create Recipe", False, f"Exception: {str(e)}")
        
        # Test 2: Get recipe by product ID
        try:
            product_id = self.test_data.get('product_id')
            response = self.session.get(f"{self.base_url}/recipes/{product_id}")
            
            if response.status_code == 200:
                recipe = response.json()
                if recipe['finished_product_id'] == product_id and len(recipe['parts']) == 3:
                    self.log_result("Get Recipe by Product ID", True, f"Retrieved recipe for {recipe['finished_product_name']}")
                else:
                    self.log_result("Get Recipe by Product ID", False, "Recipe data mismatch", recipe)
            else:
                self.log_result("Get Recipe by Product ID", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Get Recipe by Product ID", False, f"Exception: {str(e)}")
        
        # Test 3: Get all recipes
        try:
            response = self.session.get(f"{self.base_url}/recipes")
            
            if response.status_code == 200:
                recipes = response.json()
                if isinstance(recipes, list) and len(recipes) > 0:
                    # Verify our created recipe is in the list
                    found_recipe = any(r['finished_product_name'] == 'Assembly Kit' for r in recipes)
                    if found_recipe:
                        self.log_result("Get All Recipes", True, f"Retrieved {len(recipes)} recipes")
                    else:
                        self.log_result("Get All Recipes", False, "Created recipe not found in list", recipes)
                else:
                    self.log_result("Get All Recipes", False, "No recipes returned or invalid format", recipes)
            else:
                self.log_result("Get All Recipes", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Get All Recipes", False, f"Exception: {str(e)}")
    
    def test_assembly_api(self):
        """Test Assembly API endpoints"""
        print("\n=== Testing Assembly API ===")
        
        # Test 1: Successful assembly
        try:
            assembly_data = {
                "finished_product_id": self.test_data.get('product_id'),
                "quantity": 2
            }
            
            # Get initial quantities
            parts_response = self.session.get(f"{self.base_url}/parts")
            initial_parts = {p['id']: p['quantity'] for p in parts_response.json()}
            
            products_response = self.session.get(f"{self.base_url}/finished-products")
            initial_products = {p['id']: p['quantity'] for p in products_response.json()}
            
            response = self.session.post(f"{self.base_url}/assemble", json=assembly_data)
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('success') == True:
                    # Verify parts were deducted correctly
                    parts_response = self.session.get(f"{self.base_url}/parts")
                    final_parts = {p['id']: p['quantity'] for p in parts_response.json()}
                    
                    # Expected deductions: Screw: 10 (5*2), Bolt: 4 (2*2), Washer: 6 (3*2)
                    screw_deducted = initial_parts[self.test_data['screw_id']] - final_parts[self.test_data['screw_id']]
                    bolt_deducted = initial_parts[self.test_data['bolt_id']] - final_parts[self.test_data['bolt_id']]
                    washer_deducted = initial_parts[self.test_data['washer_id']] - final_parts[self.test_data['washer_id']]
                    
                    if screw_deducted == 10 and bolt_deducted == 4 and washer_deducted == 6:
                        # Verify finished product quantity increased
                        products_response = self.session.get(f"{self.base_url}/finished-products")
                        final_products = {p['id']: p['quantity'] for p in products_response.json()}
                        
                        product_increase = final_products[self.test_data['product_id']] - initial_products[self.test_data['product_id']]
                        
                        if product_increase == 2:
                            self.log_result("Assembly Success", True, f"Assembled 2 units successfully")
                        else:
                            self.log_result("Assembly Success", False, f"Product quantity increase incorrect: {product_increase}", result)
                    else:
                        self.log_result("Assembly Success", False, 
                                      f"Parts deduction incorrect - Screw: {screw_deducted}, Bolt: {bolt_deducted}, Washer: {washer_deducted}", 
                                      result)
                else:
                    self.log_result("Assembly Success", False, "Assembly reported failure", result)
            else:
                self.log_result("Assembly Success", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Assembly Success", False, f"Exception: {str(e)}")
        
        # Test 2: Assembly with insufficient parts
        try:
            assembly_data = {
                "finished_product_id": self.test_data.get('product_id'),
                "quantity": 50  # This should exceed available parts
            }
            
            response = self.session.post(f"{self.base_url}/assemble", json=assembly_data)
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('success') == False and 'insufficient_parts' in result:
                    self.log_result("Assembly Insufficient Parts", True, "Correctly handled insufficient parts")
                else:
                    self.log_result("Assembly Insufficient Parts", False, "Should have failed with insufficient parts", result)
            else:
                self.log_result("Assembly Insufficient Parts", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Assembly Insufficient Parts", False, f"Exception: {str(e)}")
    
    def test_transactions_api(self):
        """Test Transactions API endpoints"""
        print("\n=== Testing Transactions API ===")
        
        try:
            response = self.session.get(f"{self.base_url}/transactions")
            
            if response.status_code == 200:
                transactions = response.json()
                if isinstance(transactions, list):
                    # Should have purchase and assembly transactions
                    purchase_transactions = [t for t in transactions if t.get('type') == 'purchase_part']
                    assembly_transactions = [t for t in transactions if t.get('type') == 'assembly']
                    
                    if len(purchase_transactions) >= 3 and len(assembly_transactions) >= 1:
                        self.log_result("Get Transactions", True, 
                                      f"Retrieved {len(transactions)} transactions ({len(purchase_transactions)} purchases, {len(assembly_transactions)} assemblies)")
                    else:
                        self.log_result("Get Transactions", False, 
                                      f"Expected transactions not found - Purchases: {len(purchase_transactions)}, Assemblies: {len(assembly_transactions)}", 
                                      transactions)
                else:
                    self.log_result("Get Transactions", False, "Invalid transaction format", transactions)
            else:
                self.log_result("Get Transactions", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Get Transactions", False, f"Exception: {str(e)}")
    
    def test_export_api(self):
        """Test Export API endpoints"""
        print("\n=== Testing Export API ===")
        
        try:
            response = self.session.get(f"{self.base_url}/export/excel")
            
            if response.status_code == 200:
                # Check if response is Excel file
                content_type = response.headers.get('content-type', '')
                content_disposition = response.headers.get('content-disposition', '')
                
                if 'spreadsheet' in content_type and 'attachment' in content_disposition:
                    # Check file size (should be > 0)
                    content_length = len(response.content)
                    if content_length > 1000:  # Reasonable minimum for Excel file
                        self.log_result("Excel Export", True, f"Generated Excel file ({content_length} bytes)")
                    else:
                        self.log_result("Excel Export", False, f"Excel file too small ({content_length} bytes)")
                else:
                    self.log_result("Excel Export", False, f"Invalid content type or disposition: {content_type}, {content_disposition}")
            else:
                self.log_result("Excel Export", False, f"HTTP {response.status_code}", response.text)
                
        except Exception as e:
            self.log_result("Excel Export", False, f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all test suites"""
        print(f"Starting Stock Management System Backend Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Run tests in order
        self.test_suppliers_api()
        self.test_parts_api()
        self.test_finished_products_api()
        self.test_recipe_api()
        self.test_assembly_api()
        self.test_transactions_api()
        self.test_export_api()
        
        # Summary
        print("\n" + "=" * 60)
        print("TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.results if r['success'])
        failed = len(self.results) - passed
        
        print(f"Total Tests: {len(self.results)}")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        
        if failed > 0:
            print("\nFAILED TESTS:")
            for result in self.results:
                if not result['success']:
                    print(f"  ❌ {result['test']}: {result['message']}")
        
        return failed == 0

if __name__ == "__main__":
    tester = StockManagementTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)