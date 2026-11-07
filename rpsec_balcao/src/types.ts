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

export type UnitType = 'kg' | 'g' | 'l' | 'ml' | 'un'

export interface Ingredient {
  id: string
  name: string
  unit: UnitType
  unitCost: number // Custo por unidade padrão (ex: por kg, por litro, por un)
  category?: string
}

export interface RecipeIngredient {
  ingredientId: string
  quantity: number // Quantidade usada na fornada (ex: 2.5 kg ou 500 g)
  unit: UnitType
}

export interface Recipe {
  id: string
  productId: string // ID do produto correspondente
  yieldQuantity: number // Rendimento da receita (quantos salgados saem)
  ingredients: RecipeIngredient[]
  additionalCostPerBatch: number // Estimativa de gás, óleo e temperos por fornada
}

export interface InvoiceItem {
  code: string
  name: string
  unit: string
  quantity: number
  unitPrice: number
  total: number
}

export interface ImportedInvoice {
  id: string
  supplier: string
  cnpj?: string
  date: string
  totalAmount: number
  items: InvoiceItem[]
}

