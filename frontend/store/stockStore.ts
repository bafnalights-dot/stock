import { create } from 'zustand';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Part {
  id: string;
  name: string;
  category: string;
  quantity: number;
  supplier_id?: string;
  supplier_name?: string;
  purchase_price: number;
  low_stock_threshold: number;
  last_purchase_date: string;
  is_low_stock: boolean;
}

interface FinishedProduct {
  id: string;
  name: string;
  category: string;
  quantity: number;
  has_recipe: boolean;
}

interface Supplier {
  id: string;
  name: string;
  contact_info: string;
}

interface StockStore {
  parts: Part[];
  products: FinishedProduct[];
  suppliers: Supplier[];
  loading: boolean;
  
  loadParts: () => Promise<void>;
  loadProducts: () => Promise<void>;
  loadSuppliers: () => Promise<void>;
  
  addPart: (part: any) => Promise<void>;
  addProduct: (product: any) => Promise<void>;
  addSupplier: (supplier: any) => Promise<void>;
  
  assembleProduct: (productId: string, quantity: number) => Promise<any>;
}

export const useStockStore = create<StockStore>((set, get) => ({
  parts: [],
  products: [],
  suppliers: [],
  loading: false,
  
  loadParts: async () => {
    try {
      set({ loading: true });
      const response = await axios.get(`${API_URL}/api/parts`);
      set({ parts: response.data, loading: false });
    } catch (error) {
      console.error('Error loading parts:', error);
      set({ loading: false });
      throw error;
    }
  },
  
  loadProducts: async () => {
    try {
      set({ loading: true });
      const response = await axios.get(`${API_URL}/api/finished-products`);
      set({ products: response.data, loading: false });
    } catch (error) {
      console.error('Error loading products:', error);
      set({ loading: false });
      throw error;
    }
  },
  
  loadSuppliers: async () => {
    try {
      set({ loading: true });
      const response = await axios.get(`${API_URL}/api/suppliers`);
      set({ suppliers: response.data, loading: false });
    } catch (error) {
      console.error('Error loading suppliers:', error);
      set({ loading: false });
      throw error;
    }
  },
  
  addPart: async (part: any) => {
    try {
      await axios.post(`${API_URL}/api/parts`, part);
      await get().loadParts();
    } catch (error) {
      console.error('Error adding part:', error);
      throw error;
    }
  },
  
  addProduct: async (product: any) => {
    try {
      await axios.post(`${API_URL}/api/finished-products`, product);
      await get().loadProducts();
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  },
  
  addSupplier: async (supplier: any) => {
    try {
      await axios.post(`${API_URL}/api/suppliers`, supplier);
      await get().loadSuppliers();
    } catch (error) {
      console.error('Error adding supplier:', error);
      throw error;
    }
  },
  
  assembleProduct: async (productId: string, quantity: number) => {
    try {
      const response = await axios.post(`${API_URL}/api/assemble`, {
        finished_product_id: productId,
        quantity,
      });
      
      // Reload parts and products after assembly
      await get().loadParts();
      await get().loadProducts();
      
      return response.data;
    } catch (error: any) {
      console.error('Error assembling product:', error);
      throw new Error(error.response?.data?.detail || 'Failed to assemble product');
    }
  },
}));
