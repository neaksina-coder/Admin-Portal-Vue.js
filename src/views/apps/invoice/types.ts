import type { Invoice, PaymentDetails } from '@db/apps/invoice/types'

export interface PurchasedProduct {
  id: number | null
  name: string
  sku: string
  description: string
  category: string
  price: number
  cost: number
  stock: number
  unit: string
  status: 'active' | 'inactive' | 'discontinued'
  quantity: number
}

export interface InvoiceData {
  invoice: Invoice
  paymentDetails: PaymentDetails
  purchasedProducts: PurchasedProduct[]
  note: string
  paymentMethod: string
  salesperson: string
  thanksNote: string
}

export interface InvoiceParams {
  q?: string
  status?: string
  startDate?: string
  endDate?: string
  options?: object
}
