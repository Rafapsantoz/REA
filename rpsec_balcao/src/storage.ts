import type { 
  Product, 
  Sale, 
  Expense, 
  CartItem, 
  Ingredient, 
  Recipe, 
  ImportedInvoice, 
  Customer, 
  PaymentMethod,
  Comanda,
  CashShift,
  CashMovement,
  CashMovementType
} from './types'

const STORAGE_KEYS = {
  PRODUCTS: 'rpsec_balcao_products',
  SALES: 'rpsec_balcao_sales',
  EXPENSES: 'rpsec_balcao_expenses',
  ACTIVE_CART: 'rpsec_balcao_active_cart',
  INGREDIENTS: 'rpsec_balcao_ingredients',
  RECIPES: 'rpsec_balcao_recipes',
  INVOICES: 'rpsec_balcao_invoices',
  CUSTOMERS: 'rpsec_balcao_customers',
  COMANDAS: 'rpsec_balcao_comandas',
  DAILY_ORDER_COUNTER: 'rpsec_balcao_daily_order_counter',
  CURRENT_SHIFT: 'rpsec_balcao_current_shift',
  SHIFT_HISTORY: 'rpsec_balcao_shift_history',
}

export const INITIAL_PRODUCTS: Product[] = []

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'c1', name: 'Seu Zé (Oficina do Lado)', phone: '11 98765-4321', notes: 'Acerta toda sexta-feira', createdAt: new Date().toISOString() },
  { id: 'c2', name: 'Dona Maria (Costura)', phone: '11 97654-3210', notes: 'Paga no dia 10', createdAt: new Date().toISOString() },
  { id: 'c3', name: 'Marcos (Obra)', phone: '', notes: 'Café e salgado matinal', createdAt: new Date().toISOString() },
]

export const INITIAL_COMANDAS: Comanda[] = []

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

const DEMO_PRODUCT_IDS = new Set(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'])

export function loadProducts(): Product[] {
  const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS)
  if (!data) {
    saveProducts([])
    return []
  }
  try {
    const parsed: Product[] = JSON.parse(data)
    // Limpeza automática dos produtos de demonstração caso ainda sejam os 12 padrões
    const isOnlyDemo = parsed.length > 0 && parsed.every(p => DEMO_PRODUCT_IDS.has(p.id))
    const alreadyCleared = localStorage.getItem('rpsec_balcao_demo_cleared')
    if (isOnlyDemo && !alreadyCleared) {
      saveProducts([])
      localStorage.setItem('rpsec_balcao_demo_cleared', 'true')
      return []
    }
    return parsed
  } catch {
    return []
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

export function loadComandas(): Comanda[] {
  const data = localStorage.getItem(STORAGE_KEYS.COMANDAS)
  if (!data) {
    saveComandas(INITIAL_COMANDAS)
    return INITIAL_COMANDAS
  }
  let comandas: Comanda[] = []
  try {
    comandas = JSON.parse(data)
  } catch {
    return []
  }

  // Sanitização automática: garantir que não existam comandas com números duplicados ou sem número
  const seen = new Set<number>()
  let hasDuplicatesOrInvalid = false
  for (const c of comandas) {
    if (!c.number || typeof c.number !== 'number' || seen.has(c.number)) {
      hasDuplicatesOrInvalid = true
      break
    }
    seen.add(c.number)
  }

  if (hasDuplicatesOrInvalid && comandas.length > 0) {
    // Ordena do mais antigo para o mais novo
    const sorted = [...comandas].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    let currentSeq = 1
    const repaired = sorted.map(c => ({
      ...c,
      number: currentSeq++,
    }))
    saveComandas(repaired)

    // Atualiza o DAILY_ORDER_COUNTER para que o próximo pedido seja estritamente superior
    const todayStr = new Date().toISOString().split('T')[0]
    const nextCount = currentSeq - 1
    const stored = localStorage.getItem(STORAGE_KEYS.DAILY_ORDER_COUNTER)
    let maxCount = nextCount
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (parsed.date === todayStr && parsed.count > maxCount) {
          maxCount = parsed.count
        }
      } catch {}
    }
    localStorage.setItem(STORAGE_KEYS.DAILY_ORDER_COUNTER, JSON.stringify({ date: todayStr, count: maxCount }))
    return repaired
  }

  return comandas
}

export function saveComandas(comandas: Comanda[]): void {
  localStorage.setItem(STORAGE_KEYS.COMANDAS, JSON.stringify(comandas))
}

export function saveComanda(comanda: Comanda): Comanda[] {
  const current = loadComandas()
  const existsIndex = current.findIndex(c => c.id === comanda.id)
  let updated: Comanda[]
  if (existsIndex >= 0) {
    updated = [...current]
    updated[existsIndex] = comanda
  } else {
    // Garantia absoluta contra números duplicados em comandas simultâneas
    const existingNumbers = new Set(current.map(c => c.number).filter(n => typeof n === 'number' && !isNaN(n)))
    let finalNumber = comanda.number
    if (!finalNumber || existingNumbers.has(finalNumber)) {
      finalNumber = Math.max(0, ...Array.from(existingNumbers)) + 1
    }
    const safeComanda = { ...comanda, number: finalNumber }
    updated = [safeComanda, ...current]
  }
  saveComandas(updated)
  return updated
}

export function removeComanda(comandaId: string): Comanda[] {
  const current = loadComandas()
  const updated = current.filter(c => c.id !== comandaId)
  saveComandas(updated)
  return updated
}

export function peekNextDailyOrderNumber(): number {
  const todayStr = new Date().toISOString().split('T')[0]

  // 1. Maior número entre as vendas de hoje
  const sales = loadSales()
  const todaySales = sales.filter(s => s.createdAt.startsWith(todayStr))
  const maxSaleNumber = todaySales.reduce((max, s) => Math.max(max, s.orderNumber || 0), 0)

  // 2. Maior número entre as comandas abertas atualmente
  let maxComandaNumber = 0
  const cmdData = localStorage.getItem(STORAGE_KEYS.COMANDAS)
  if (cmdData) {
    try {
      const cmds = JSON.parse(cmdData) as Comanda[]
      maxComandaNumber = cmds.reduce((max, c) => Math.max(max, c.number || 0), 0)
    } catch {}
  }

  // 3. Maior número salvo no contador diário
  const stored = localStorage.getItem(STORAGE_KEYS.DAILY_ORDER_COUNTER)
  let storedCount = 0
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      if (parsed.date === todayStr && typeof parsed.count === 'number') {
        storedCount = parsed.count
      }
    } catch {}
  }

  return Math.max(maxSaleNumber, maxComandaNumber, storedCount) + 1
}

export function getNextDailyOrderNumber(): number {
  const todayStr = new Date().toISOString().split('T')[0]
  const nextNumber = peekNextDailyOrderNumber()
  localStorage.setItem(
    STORAGE_KEYS.DAILY_ORDER_COUNTER,
    JSON.stringify({ date: todayStr, count: nextNumber })
  )
  return nextNumber
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

export function getCurrentShift(): CashShift | null {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_SHIFT)
  if (!data) return null
  try {
    const parsed = JSON.parse(data) as CashShift
    return parsed && parsed.status === 'open' ? parsed : null
  } catch {
    return null
  }
}

export function saveCurrentShift(shift: CashShift | null): void {
  if (shift) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SHIFT, JSON.stringify(shift))
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SHIFT)
  }
}

export function openShift(initialFloat: number, notes?: string): CashShift {
  const newShift: CashShift = {
    id: `shift_${Date.now()}`,
    openedAt: new Date().toISOString(),
    status: 'open',
    initialFloat: Math.max(0, initialFloat),
    movements: [],
    notes: notes?.trim() || undefined,
  }
  saveCurrentShift(newShift)
  return newShift
}

export function addShiftMovement(type: CashMovementType, amount: number, description: string): CashShift | null {
  const current = getCurrentShift()
  if (!current) return null
  const movement: CashMovement = {
    id: `mov_${Date.now()}`,
    type,
    amount: Math.max(0, amount),
    description: description.trim() || (type === 'sangria' ? 'Retirada de Dinheiro' : 'Entrada de Troco'),
    createdAt: new Date().toISOString(),
  }
  const updated: CashShift = {
    ...current,
    movements: [...current.movements, movement],
  }
  saveCurrentShift(updated)
  return updated
}

export function loadShiftHistory(): CashShift[] {
  const data = localStorage.getItem(STORAGE_KEYS.SHIFT_HISTORY)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

export function saveShiftHistory(history: CashShift[]): void {
  localStorage.setItem(STORAGE_KEYS.SHIFT_HISTORY, JSON.stringify(history))
}

export function closeShift(
  countedCash: number, 
  expectedCash: number, 
  notes?: string,
  extraData?: { cashSalesTotal?: number; totalSalesAmount?: number }
): { closedShift: CashShift; history: CashShift[] } | null {
  const current = getCurrentShift()
  if (!current) return null
  const diff = countedCash - expectedCash
  const closed: CashShift = {
    ...current,
    status: 'closed',
    closedAt: new Date().toISOString(),
    closingCashCounted: countedCash,
    closingCashExpected: expectedCash,
    closingDifference: diff,
    cashSalesTotal: extraData?.cashSalesTotal,
    totalSalesAmount: extraData?.totalSalesAmount,
    notes: notes?.trim() || current.notes,
  }
  saveCurrentShift(null)
  const history = [closed, ...loadShiftHistory()]
  saveShiftHistory(history)
  return { closedShift: closed, history }
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

// Estatísticas por Faixa de Horário
export interface HourlyStat {
  hour: number
  label: string
  customerCount: number
  totalAmount: number
  isPeak: boolean
}

export function getHourlySalesStats(sales: Sale[], dateStr: string): HourlyStat[] {
  const daySales = sales.filter(s => s.createdAt.startsWith(dateStr))
  const hourMap: { [hour: number]: { count: number; total: number } } = {}

  for (let h = 6; h <= 21; h++) {
    hourMap[h] = { count: 0, total: 0 }
  }

  daySales.forEach(s => {
    const saleDate = new Date(s.createdAt)
    const hour = saleDate.getHours()
    if (hourMap[hour]) {
      hourMap[hour].count += 1
      hourMap[hour].total += s.totalAmount
    }
  })

  const counts = Object.values(hourMap).map(v => v.count)
  const maxCount = Math.max(...counts, 0)

  const stats: HourlyStat[] = []
  for (let h = 6; h <= 21; h++) {
    const data = hourMap[h]
    stats.push({
      hour: h,
      label: `${h.toString().padStart(2, '0')}:00`,
      customerCount: data.count,
      totalAmount: data.total,
      isPeak: maxCount > 0 && data.count === maxCount,
    })
  }

  return stats
}

export interface BackupData {
  version: string
  exportedAt: string
  products: Product[]
  sales: Sale[]
  expenses: Expense[]
  customers?: Customer[]
  comandas?: Comanda[]
  currentShift?: CashShift | null
  shiftHistory?: CashShift[]
}

export function exportBackupJSON(): string {
  const backup: BackupData = {
    version: '1.3.0',
    exportedAt: new Date().toISOString(),
    products: loadProducts(),
    sales: loadSales(),
    expenses: loadExpenses(),
    customers: loadCustomers(),
    comandas: loadComandas(),
    currentShift: getCurrentShift(),
    shiftHistory: loadShiftHistory(),
  }
  return JSON.stringify(backup, null, 2)
}

export function importBackupJSON(jsonStr: string): {
  success: boolean
  error?: string
  data?: { 
    products: Product[]
    sales: Sale[]
    expenses: Expense[]
    customers?: Customer[]
    comandas?: Comanda[]
    currentShift?: CashShift | null
    shiftHistory?: CashShift[]
  }
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
    if (Array.isArray(parsed.comandas)) {
      localStorage.setItem(STORAGE_KEYS.COMANDAS, JSON.stringify(parsed.comandas))
    }
    if (parsed.currentShift !== undefined) {
      saveCurrentShift(parsed.currentShift)
    }
    if (Array.isArray(parsed.shiftHistory)) {
      saveShiftHistory(parsed.shiftHistory)
    }

    return {
      success: true,
      data: {
        products: parsed.products,
        sales: parsed.sales,
        expenses: parsed.expenses,
        customers: parsed.customers,
        comandas: parsed.comandas,
        currentShift: parsed.currentShift,
        shiftHistory: parsed.shiftHistory,
      },
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro ao processar arquivo JSON'
    return { success: false, error: message }
  }
}
