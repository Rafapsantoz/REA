import type { Product, Sale, Expense, CartItem } from './types'

const STORAGE_KEYS = {
  PRODUCTS: 'rpsec_balcao_products',
  SALES: 'rpsec_balcao_sales',
  EXPENSES: 'rpsec_balcao_expenses',
  ACTIVE_CART: 'rpsec_balcao_active_cart',
}

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', name: 'Coxinha de Frango', price: 7.00, category: 'salgados', active: true, color: 'bg-amber-100 border-amber-300 text-amber-900' },
  { id: '2', name: 'Kibe c/ Catupiry', price: 7.50, category: 'salgados', active: true, color: 'bg-amber-100 border-amber-300 text-amber-900' },
  { id: '3', name: 'Enroladinho de Salsicha', price: 6.50, category: 'salgados', active: true, color: 'bg-amber-100 border-amber-300 text-amber-900' },
  { id: '4', name: 'Pastel de Carne', price: 8.00, category: 'salgados', active: true, color: 'bg-amber-100 border-amber-300 text-amber-900' },
  { id: '5', name: 'Pastel de Queijo', price: 8.00, category: 'salgados', active: true, color: 'bg-amber-100 border-amber-300 text-amber-900' },
  { id: '6', name: 'Empada de Palmito', price: 7.50, category: 'salgados', active: true, color: 'bg-amber-100 border-amber-300 text-amber-900' },
  { id: '7', name: 'Refrigerante Lata', price: 6.00, category: 'bebidas', active: true, color: 'bg-sky-100 border-sky-300 text-sky-900' },
  { id: '8', name: 'Suco Natural Copo', price: 7.00, category: 'bebidas', active: true, color: 'bg-orange-100 border-orange-300 text-orange-900' },
  { id: '9', name: 'Água Mineral 500ml', price: 4.00, category: 'bebidas', active: true, color: 'bg-blue-100 border-blue-300 text-blue-900' },
  { id: '10', name: 'Café Expresso / Coado', price: 3.50, category: 'bebidas', active: true, color: 'bg-amber-200 border-amber-400 text-amber-950' },
  { id: '11', name: 'Brigadeiro Tradicional', price: 4.00, category: 'doces', active: true, color: 'bg-pink-100 border-pink-300 text-pink-900' },
  { id: '12', name: 'Bolo no Pote', price: 10.00, category: 'doces', active: true, color: 'bg-rose-100 border-rose-300 text-rose-900' },
]

export function loadProducts(): Product[] {
  const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS)
  if (!data) {
    saveProducts(INITIAL_PRODUCTS)
    return INITIAL_PRODUCTS
  }
  try {
    return JSON.parse(data)
  } catch {
    return INITIAL_PRODUCTS
  }
}

export function saveProducts(products: Product[]): void {
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products))
}

export function loadSales(): Sale[] {
  const data = localStorage.getItem(STORAGE_KEYS.SALES)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function saveSale(sale: Sale): Sale[] {
  const current = loadSales()
  const updated = [sale, ...current]
  localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(updated))
  return updated
}

export function loadExpenses(): Expense[] {
  const data = localStorage.getItem(STORAGE_KEYS.EXPENSES)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function saveExpense(expense: Expense): Expense[] {
  const current = loadExpenses()
  const updated = [expense, ...current]
  localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(updated))
  return updated
}

export function loadActiveCart(): CartItem[] {
  const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_CART)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function saveActiveCart(cart: CartItem[]): void {
  localStorage.setItem(STORAGE_KEYS.ACTIVE_CART, JSON.stringify(cart))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export interface BackupData {
  version: string
  exportedAt: string
  products: Product[]
  sales: Sale[]
  expenses: Expense[]
}

export function exportBackupJSON(): string {
  const backup: BackupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    products: loadProducts(),
    sales: loadSales(),
    expenses: loadExpenses(),
  }
  return JSON.stringify(backup, null, 2)
}

export function importBackupJSON(jsonStr: string): {
  success: boolean
  error?: string
  data?: { products: Product[]; sales: Sale[]; expenses: Expense[] }
} {
  try {
    const parsed = JSON.parse(jsonStr) as Partial<BackupData>
    if (!Array.isArray(parsed.products) || !Array.isArray(parsed.sales) || !Array.isArray(parsed.expenses)) {
      return { success: false, error: 'Formato de arquivo inválido. O backup deve conter listas de produtos, vendas e despesas.' }
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(parsed.products))
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(parsed.sales))
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(parsed.expenses))

    return {
      success: true,
      data: {
        products: parsed.products,
        sales: parsed.sales,
        expenses: parsed.expenses,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar arquivo JSON'
    return { success: false, error: message }
  }
}
