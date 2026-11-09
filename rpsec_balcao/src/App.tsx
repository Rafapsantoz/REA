import { useState, useEffect } from 'react'
import type { Product, Sale, Expense, CartItem, Ingredient, Recipe, ImportedInvoice, Customer, PaymentMethod, Comanda, CashShift, CashMovementType } from './types'
import {
  loadProducts,
  saveProducts,
  loadSales,
  saveSale,
  loadExpenses,
  saveExpense,
  loadActiveCart,
  saveActiveCart,
  loadIngredients,
  loadRecipes,
  loadInvoices,
  loadCustomers,
  saveCustomer,
  loadComandas,
  saveComanda,
  removeComanda,
  markCreditAsPaid,
  getCurrentShift,
  openShift,
  addShiftMovement,
  closeShift,
  loadShiftHistory,
  formatCurrency,
} from './storage'
import { PDVView } from './components/PDVView'
import { ExpensesView } from './components/ExpensesView'
import { DailySummaryView } from './components/DailySummaryView'
import { ProductsView } from './components/ProductsView'
import { ProductionCostView } from './components/ProductionCostView'
import { 
  ShoppingBag, 
  ArrowDownCircle, 
  BarChart3, 
  Tags, 
  Store, 
  Clock, 
  ChefHat, 
  Sun, 
  Moon,
  UtensilsCrossed,
  Lock,
  Unlock
} from 'lucide-react'

type TabType = 'pdv' | 'expenses' | 'summary' | 'products' | 'costs'

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('pdv')
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [comandas, setComandas] = useState<Comanda[]>(() => loadComandas())
  const [currentShift, setCurrentShift] = useState<CashShift | null>(() => getCurrentShift())
  const [shiftHistory, setShiftHistory] = useState<CashShift[]>(() => loadShiftHistory())
  const [cart, setCart] = useState<CartItem[]>(() => loadActiveCart())
  const [customers, setCustomers] = useState<Customer[]>(() => loadCustomers())
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => loadIngredients())
  const [recipes, setRecipes] = useState<Recipe[]>(() => loadRecipes())
  const [invoices, setInvoices] = useState<ImportedInvoice[]>(() => loadInvoices())
  const [currentTime, setCurrentTime] = useState<string>('')

  // Tema Claro / Escuro com persistência
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('rpsec_balcao_theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('rpsec_balcao_theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
  }

  useEffect(() => {
    setProducts(loadProducts())
    setSales(loadSales())
    setExpenses(loadExpenses())
    setComandas(loadComandas())

    const updateTimer = () => {
      const now = new Date()
      setCurrentTime(
        now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }) +
        ' • ' +
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      )
    }
    updateTimer()
    const interval = setInterval(updateTimer, 10000)
    return () => clearInterval(interval)
  }, [])

  // Persiste o carrinho ativo automaticamente sempre que houver alteração
  useEffect(() => {
    saveActiveCart(cart)
  }, [cart])

  const handleCompleteSale = (sale: Sale) => {
    const updated = saveSale(sale)
    setSales(updated)
    setCart([])
    saveActiveCart([])
  }

  const handleAddCustomer = (customer: Customer) => {
    const updated = saveCustomer(customer)
    setCustomers(updated)
  }

  const handleMarkCreditPaid = (saleId: string, method: PaymentMethod) => {
    const updated = markCreditAsPaid(saleId, method)
    setSales(updated)
  }

  const handleAddExpense = (expense: Expense) => {
    const updated = saveExpense(expense)
    setExpenses(updated)
  }

  const handleDeleteExpense = (id: string) => {
    const updated = expenses.filter(e => e.id !== id)
    setExpenses(updated)
    localStorage.setItem('rpsec_balcao_expenses', JSON.stringify(updated))
  }

  const handleSaveComanda = (comanda: Comanda) => {
    const updated = saveComanda(comanda)
    setComandas(updated)
  }

  const handleRemoveComanda = (id: string) => {
    const updated = removeComanda(id)
    setComandas(updated)
  }

  const handleUpdateProducts = (updatedProds: Product[]) => {
    setProducts(updatedProds)
    saveProducts(updatedProds)
  }

  const handleOpenShift = (initialFloat: number, notes?: string) => {
    const shift = openShift(initialFloat, notes)
    setCurrentShift(shift)
  }

  const handleAddMovement = (type: CashMovementType, amount: number, description: string) => {
    const updated = addShiftMovement(type, amount, description)
    setCurrentShift(updated)
  }

  const handleCloseShift = (
    countedCash: number, 
    expectedCash: number, 
    notes?: string,
    extraData?: { cashSalesTotal?: number; totalSalesAmount?: number }
  ) => {
    const result = closeShift(countedCash, expectedCash, notes, extraData)
    if (result) {
      setCurrentShift(null)
      setShiftHistory(result.history)
    }
  }

  const handleRestoreData = (newProducts: Product[], newSales: Sale[], newExpenses: Expense[]) => {
    setProducts(newProducts)
    setSales(newSales)
    setExpenses(newExpenses)
    setComandas(loadComandas())
    setCurrentShift(getCurrentShift())
    setShiftHistory(loadShiftHistory())
  }

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-[#fbf9f5] dark:bg-[#13110e] text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-200">
      {/* Topo / Cabeçalho Gastronômico VIBRANTE em Vermelho e Amarelo */}
      <header className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 dark:from-[#540d0d] dark:via-[#6e1515] dark:to-[#451e08] text-white shadow-lg sticky top-0 z-30 border-b-4 border-amber-400 dark:border-amber-500/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo e Título com Identidade Vermelha & Amarela de Comida */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400 text-red-950 font-black shadow-md shadow-red-950/40 border-2 border-amber-300 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6 text-red-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-2xl tracking-tight text-white drop-shadow-sm">RPsec Balcão</h1>
                <span className="bg-amber-400 text-red-950 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-amber-300 shadow-xs uppercase tracking-wide">
                  Salgaderia & Sabor
                </span>
              </div>
              <p className="text-xs text-amber-100 font-bold drop-shadow-xs">Controle Ágil e Ficha Técnica</p>
            </div>
          </div>

          {/* Abas Principais em Vermelho & Amarelo com Alto Contraste */}
          <nav className="flex items-center gap-1.5 bg-red-950/60 dark:bg-black/60 p-1.5 rounded-2xl border border-amber-400/40 flex-wrap backdrop-blur-xs shadow-inner">
            <button
              onClick={() => setActiveTab('pdv')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all cursor-pointer relative ${
                activeTab === 'pdv'
                  ? 'bg-amber-400 text-red-950 shadow-md font-black scale-102'
                  : 'text-amber-100 hover:text-white hover:bg-white/15 font-bold'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Caixa / Vender
              {totalCartItems > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-black ml-1 ${
                  activeTab === 'pdv' ? 'bg-red-700 text-amber-300' : 'bg-amber-400 text-red-950'
                }`}>
                  {totalCartItems}
                </span>
              )}
              {comandas.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[11px] font-black bg-amber-400 text-red-950 flex items-center gap-0.5 shadow-xs" title={`${comandas.length} comandas abertas no local`}>
                  <UtensilsCrossed className="w-3 h-3" />
                  {comandas.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                activeTab === 'expenses'
                  ? 'bg-amber-400 text-red-950 shadow-md font-black scale-102'
                  : 'text-amber-100 hover:text-white hover:bg-white/15 font-bold'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              Saídas / Gastos
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                activeTab === 'summary'
                  ? 'bg-amber-400 text-red-950 shadow-md font-black scale-102'
                  : 'text-amber-100 hover:text-white hover:bg-white/15 font-bold'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Resumo do Dia
            </button>

            <button
              onClick={() => setActiveTab('costs')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                activeTab === 'costs'
                  ? 'bg-amber-400 text-red-950 shadow-md font-black scale-102'
                  : 'text-amber-100 hover:text-white hover:bg-white/15 font-bold'
              }`}
            >
              <ChefHat className="w-4 h-4" />
              Custos & Produção
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-amber-400 text-red-950 shadow-md font-black scale-102'
                  : 'text-amber-100 hover:text-white hover:bg-white/15 font-bold'
              }`}
            >
              <Tags className="w-4 h-4" />
              Cardápio
            </button>
          </nav>

          {/* Lado Direito: Status do Caixa, Alternador Claro/Escuro & Relógio */}
          <div className="flex items-center gap-2">
            {/* Indicador de Status do Caixa */}
            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs border ${
                currentShift
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-400/60 hover:bg-emerald-900/90'
                  : 'bg-amber-950/70 text-amber-200 border-amber-400/50 hover:bg-amber-900/80'
              }`}
              title={currentShift ? `Caixa Aberto (Fundo: ${formatCurrency(currentShift.initialFloat)}) — Clique para gerenciar ou fechar` : 'Caixa Fechado — Clique para abrir o caixa do dia com fundo de troco'}
            >
              {currentShift ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="hidden sm:inline text-emerald-200">Caixa Aberto:</span>
                  <span className="text-white font-black">{formatCurrency(currentShift.initialFloat)}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>Caixa Fechado</span>
                </>
              )}
            </button>

            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-red-950/70 dark:bg-black/70 hover:bg-red-900 text-amber-300 border border-amber-400/50 transition-all cursor-pointer shadow-xs active:scale-95"
              title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-amber-200" />}
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-amber-200 bg-red-950/70 dark:bg-black/70 px-3 py-2 rounded-xl border border-amber-400/50 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>{currentTime}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal com Preservação de Estado entre Abas */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        <div className={activeTab === 'pdv' ? 'block' : 'hidden'}>
          <PDVView
            products={products}
            cart={cart}
            setCart={setCart}
            onCompleteSale={handleCompleteSale}
            customers={customers}
            onAddCustomer={handleAddCustomer}
            sales={sales}
            comandas={comandas}
            onSaveComanda={handleSaveComanda}
            onRemoveComanda={handleRemoveComanda}
            currentShift={currentShift}
            onOpenShiftClick={() => setActiveTab('summary')}
          />
        </div>

        <div className={activeTab === 'expenses' ? 'block' : 'hidden'}>
          <ExpensesView
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        </div>

        <div className={activeTab === 'summary' ? 'block' : 'hidden'}>
          <DailySummaryView 
            sales={sales} 
            expenses={expenses} 
            products={products}
            comandas={comandas}
            currentShift={currentShift}
            shiftHistory={shiftHistory}
            onOpenShift={handleOpenShift}
            onAddMovement={handleAddMovement}
            onCloseShift={handleCloseShift}
            onRestoreData={handleRestoreData}
            onMarkCreditPaid={handleMarkCreditPaid}
          />
        </div>

        <div className={activeTab === 'costs' ? 'block' : 'hidden'}>
          <ProductionCostView
            products={products}
            ingredients={ingredients}
            setIngredients={setIngredients}
            recipes={recipes}
            setRecipes={setRecipes}
            invoices={invoices}
            setInvoices={setInvoices}
          />
        </div>

        <div className={activeTab === 'products' ? 'block' : 'hidden'}>
          <ProductsView products={products} onUpdateProducts={handleUpdateProducts} />
        </div>
      </main>
    </div>
  )
}

export default App
