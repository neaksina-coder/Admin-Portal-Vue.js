import { ref } from 'vue'

// Types
export interface Product {
  id: number
  name: string
  sku: string
  description: string
  category: string
  price: number
  cost: number
  stock: number
  unit: string
  status: 'active' | 'inactive' | 'discontinued'
  createdAt: string
}

// LocalStorage key
const STORAGE_KEY = 'products_catalog'

// Load products from localStorage
const loadProducts = (): Product[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch (error) {
    console.error('Error loading products:', error)
  }

  // Default products
  return [
    {
      id: 1,
      name: 'Professional Services Package',
      sku: 'SRV-001',
      description: 'Monthly professional consulting services',
      category: 'services',
      price: 2500,
      cost: 1200,
      stock: 999,
      unit: 'hour',
      status: 'active',
      createdAt: '2024-01-01',
    },
    {
      id: 2,
      name: 'Cloud Hosting Plan',
      sku: 'HOST-001',
      description: 'Premium cloud hosting with 99.9% uptime',
      category: 'hosting',
      price: 99.00,
      cost: 45.00,
      stock: 999,
      unit: 'month',
      status: 'active',
      createdAt: '2024-01-02',
    },
    {
      id: 3,
      name: 'Software License',
      sku: 'LIC-001',
      description: 'Annual enterprise software license',
      category: 'software',
      price: 1200.00,
      cost: 600.00,
      stock: 50,
      unit: 'license',
      status: 'active',
      createdAt: '2024-01-03',
    },
    {
      id: 4,
      name: 'Technical Support',
      sku: 'SUP-001',
      description: '24/7 technical support service',
      category: 'services',
      price: 800.00,
      cost: 350.00,
      stock: 999,
      unit: 'month',
      status: 'active',
      createdAt: '2024-01-04',
    },
    {
      id: 5,
      name: 'Custom Development',
      sku: 'DEV-001',
      description: 'Custom software development',
      category: 'services',
      price: 175.00,
      cost: 85.00,
      stock: 999,
      unit: 'hour',
      status: 'active',
      createdAt: '2024-01-05',
    },
  ]
}

export function useProducts() {
  const products = ref<Product[]>(loadProducts())

  return {
    products,
  }
}
