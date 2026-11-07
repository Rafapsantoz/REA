export type PaymentMethod = 'dinheiro' | 'pix' | 'cartao_debito' | 'cartao_credito' | 'fiado'

export type ProductCategory = 'salgados' | 'bebidas' | 'doces' | 'outros'

export interface Product {
  id: string
  name: string
  price: number
  category: ProductCategory
  color?: string
  active: boolean
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface SaleItem {
  productId: string
  productName: string
  unitPrice: number
  quantity: number
  total: number
}

export interface Sale {
  id: string
  createdAt: string // ISO string
  items: SaleItem[]
  totalAmount: number
  paymentMethod: PaymentMethod
  notes?: string
}

export type ExpenseCategory = 'insumos' | 'contas_fixas' | 'embalagens' | 'outros'

export interface Expense {
  id: string
  createdAt: string // ISO string
  description: string
  amount: number
  category: ExpenseCategory
}
