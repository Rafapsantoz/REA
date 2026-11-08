import type { Product, Sale, Expense, CartItem, Ingredient, Recipe, ImportedInvoice, Customer, PaymentMethod } from './types'

const STORAGE_KEYS = {
  PRODUCTS: 'rpsec_balcao_products',
  SALES: 'rpsec_balcao_sales',
  EXPENSES: 'rpsec_balcao_expenses',
  ACTIVE_CART: 'rpsec_balcao_active_cart',
  INGREDIENTS: 'rpsec_balcao_ingredients',
  RECIPES: 'rpsec_balcao_recipes',
  INVOICES: 'rpsec_balcao_invoices',
  CUSTOMERS: 'rpsec_balcao_customers',
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

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Seu Zé (Oficina do Lado)', phone: '11 98765-4321', notes: 'Acerta toda sexta-feira', createdAt: new Date().toISOString() },
  { id: 'c2', name: 'Dona Maria (Costura)', phone: '11 97654-3210', notes: 'Paga no dia 10', createdAt: new Date().toISOString() },
  { id: 'c3', name: 'Marcos (Obra)', phone: '', notes: 'Café e salgado matinal', createdAt: new Date().toISOString() },
]

export const INITIAL_INGREDIENTS: Ingredient[] = [
  { id: 'ing_1', name: 'Farinha de Trigo Especial', unit: 'kg', unitCost: 4.50, category: 'Massas' },
  { id: 'ing_2', name: 'Peito de Frango (desfiado/cru)', unit: 'kg', unitCost: 18.00, category: 'Carnes' },
  { id: 'ing_3', name: 'Óleo de Soja para Fritura', unit: 'l', unitCost: 6.50, category: 'Gorduras' },
  { id: 'ing_4', name: 'Margarina / Manteiga', unit: 'kg', unitCost: 14.00, category: 'Gorduras' },
  { id: 'ing_5', name: 'Requeijão Cremoso (Catupiry)', unit: 'kg', unitCost: 22.00, category: 'Laticínios' },
  { id: 'ing_6', name: 'Carne Moída Bovina (Acém/Patinho)', unit: 'kg', unitCost: 28.00, category: 'Carnes' },
  { id: 'ing_7', name: 'Trigo para Kibe', unit: 'kg', unitCost: 11.00, category: 'Massas' },
  { id: 'ing_8', name: 'Queijo Mussarela', unit: 'kg', unitCost: 36.00, category: 'Laticínios' },
  { id: 'ing_9', name: 'Salsicha Hot Dog', unit: 'kg', unitCost: 10.00, category: 'Carnes' },
  { id: 'ing_10', name: 'Palmito em Pedaços', unit: 'kg', unitCost: 24.00, category: 'Vegetais' },
]

export const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rec_1',
    productId: '1', // Coxinha de Frango
    yieldQuantity: 50,
    additionalCostPerBatch: 5.00,
    ingredients: [
      { ingredientId: 'ing_1', quantity: 2, unit: 'kg' },
      { ingredientId: 'ing_2', quantity: 1.5, unit: 'kg' },
      { ingredientId: 'ing_4', quantity: 200, unit: 'g' },
      { ingredientId: 'ing_3', quantity: 500, unit: 'ml' },
    ],
  },
  {
    id: 'rec_2',
    productId: '2', // Kibe c/ Catupiry
    yieldQuantity: 40,
    additionalCostPerBatch: 5.00,
    ingredients: [
      { ingredientId: 'ing_7', quantity: 1, unit: 'kg' },
      { ingredientId: 'ing_6', quantity: 1.5, unit: 'kg' },
      { ingredientId: 'ing_5', quantity: 400, unit: 'g' },
      { ingredientId: 'ing_3', quantity: 500, unit: 'ml' },
    ],
  },
  {
    id: 'rec_3',
    productId: '3', // Enroladinho de Salsicha
    yieldQuantity: 40,
    additionalCostPerBatch: 4.00,
    ingredients: [
      { ingredientId: 'ing_1', quantity: 1.5, unit: 'kg' },
      { ingredientId: 'ing_9', quantity: 1.8, unit: 'kg' },
      { ingredientId: 'ing_4', quantity: 150, unit: 'g' },
      { ingredientId: 'ing_3', quantity: 400, unit: 'ml' },
    ],
  },
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

export function loadCustomers(): Customer[] {
  const data = localStorage.getItem(STORAGE_KEYS.CUSTOMERS)
  if (!data) {
    saveCustomers(INITIAL_CUSTOMERS)
    return INITIAL_CUSTOMERS
  }
  try {
    return JSON.parse(data)
  } catch {
    return INITIAL_CUSTOMERS
  }
}

export function saveCustomers(customers: Customer[]): void {
  localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers))
}

export function saveCustomer(customer: Customer): Customer[] {
  const current = loadCustomers()
  const updated = [customer, ...current]
  saveCustomers(updated)
  return updated
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

export function markCreditAsPaid(saleId: string, paidMethod: PaymentMethod): Sale[] {
  const current = loadSales()
  const updated = current.map(s => {
    if (s.id === saleId) {
      return {
        ...s,
        isCreditPaid: true,
        creditPaidAt: new Date().toISOString(),
        creditPaidMethod: paidMethod,
      }
    }
    return s
  })
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

export function loadIngredients(): Ingredient[] {
  const data = localStorage.getItem(STORAGE_KEYS.INGREDIENTS)
  if (!data) {
    saveIngredients(INITIAL_INGREDIENTS)
    return INITIAL_INGREDIENTS
  }
  try {
    return JSON.parse(data)
  } catch {
    return INITIAL_INGREDIENTS
  }
}

export function saveIngredients(ingredients: Ingredient[]): void {
  localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients))
}

export function loadRecipes(): Recipe[] {
  const data = localStorage.getItem(STORAGE_KEYS.RECIPES)
  if (!data) {
    saveRecipes(INITIAL_RECIPES)
    return INITIAL_RECIPES
  }
  try {
    return JSON.parse(data)
  } catch {
    return INITIAL_RECIPES
  }
}

export function saveRecipes(recipes: Recipe[]): void {
  localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes))
}

export function loadInvoices(): ImportedInvoice[] {
  const data = localStorage.getItem(STORAGE_KEYS.INVOICES)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function saveInvoice(invoice: ImportedInvoice): ImportedInvoice[] {
  const current = loadInvoices()
  const updated = [invoice, ...current]
  localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(updated))
  return updated
}

// Funções de Cálculo de Custo e Lucro
export function calculateBatchCost(recipe: Recipe, ingredients: Ingredient[]): number {
  const ingMap = new Map(ingredients.map(i => [i.id, i]))
  let total = recipe.additionalCostPerBatch || 0

  for (const item of recipe.ingredients) {
    const ing = ingMap.get(item.ingredientId)
    if (!ing) continue

    let factor = 1
    if (item.unit === 'g' && ing.unit === 'kg') factor = 0.001
    else if (item.unit === 'kg' && ing.unit === 'g') factor = 1000
    else if (item.unit === 'ml' && ing.unit === 'l') factor = 0.001
    else if (item.unit === 'l' && ing.unit === 'ml') factor = 1000

    total += item.quantity * factor * ing.unitCost
  }

  return total
}

export function calculateUnitCost(recipe: Recipe, ingredients: Ingredient[]): number {
  if (!recipe.yieldQuantity || recipe.yieldQuantity <= 0) return 0
  return calculateBatchCost(recipe, ingredients) / recipe.yieldQuantity
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
  customers?: Customer[]
}

export function exportBackupJSON(): string {
  const backup: BackupData = {
    version: '1.1.0',
    exportedAt: new Date().toISOString(),
    products: loadProducts(),
    sales: loadSales(),
    expenses: loadExpenses(),
    customers: loadCustomers(),
  }
  return JSON.stringify(backup, null, 2)
}

export function importBackupJSON(jsonStr: string): {
  success: boolean
  error?: string
  data?: { products: Product[]; sales: Sale[]; expenses: Expense[]; customers?: Customer[] }
} {
  try {
    const parsed = JSON.parse(jsonStr) as Partial<BackupData>
    if (!Array.isArray(parsed.products) || !Array.isArray(parsed.sales) || !Array.isArray(parsed.expenses)) {
      return { success: false, error: 'Formato de arquivo inválido. O backup deve conter listas de produtos, vendas e despesas.' }
    }
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(parsed.products))
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(parsed.sales))
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(parsed.expenses))
    if (Array.isArray(parsed.customers)) {
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(parsed.customers))
    }

    return {
      success: true,
      data: {
        products: parsed.products,
        sales: parsed.sales,
        expenses: parsed.expenses,
        customers: parsed.customers,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar arquivo JSON'
    return { success: false, error: message }
  }
}
