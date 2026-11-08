import { useState, useEffect } from 'react'
import type { Product, Sale, Expense, CartItem, Ingredient, Recipe, ImportedInvoice, Customer, PaymentMethod } from './types'
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
  markCreditAsPaid,
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
  Moon 
} from 'lucide-react'

type TabType = 'pdv' | 'expenses' | 'summary' | 'products' | 'costs'

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('pdv')
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
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

  const handleUpdateProducts = (updatedProds: Product[]) => {
    setProducts(updatedProds)
    saveProducts(updatedProds)
  }

  const handleRestoreData = (newProducts: Product[], newSales: Sale[], newExpenses: Expense[]) => {
    setProducts(newProducts)
    setSales(newSales)
    setExpenses(newExpenses)
  }

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="min-h-screen bg-[#fbf9f5] dark:bg-[#13110e] text-stone-900 dark:text-stone-100 flex flex-col transition-colors duration-200">
      {/* Topo / Barra de Navegação Superior (Estilo Gastronômico Quente) */}
      <header className="bg-[#1f1a16] dark:bg-[#14110e] text-stone-100 shadow-md sticky top-0 z-30 border-b border-amber-950/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo e Título com Cores Gastronômicas */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-stone-950 font-black shadow-md shadow-amber-950/30">
              <Store className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-xl tracking-tight text-amber-50">RPsec Balcão</h1>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
                  Salgaderia & Sabor
                </span>
              </div>
              <p className="text-xs text-stone-400">Controle Ágil e Ficha Técnica</p>
            </div>
          </div>

          {/* Abas Principais (Botões Grandes com Cores Vivas de Comida) */}
          <nav className="flex items-center gap-1.5 bg-stone-900/90 dark:bg-stone-950/90 p-1 rounded-xl border border-stone-800/80 flex-wrap">
            <button
              onClick={() => setActiveTab('pdv')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer relative ${
                activeTab === 'pdv'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-stone-950 shadow-sm font-black'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Caixa / Vender
              {totalCartItems > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-black ml-1 ${
                  activeTab === 'pdv' ? 'bg-stone-950 text-amber-300' : 'bg-amber-500 text-stone-950'
                }`}>
                  {totalCartItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                activeTab === 'expenses'
                  ? 'bg-rose-600 text-white shadow-sm font-black'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              Saídas / Gastos
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                activeTab === 'summary'
                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Resumo do Dia
            </button>

            <button
              onClick={() => setActiveTab('costs')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                activeTab === 'costs'
                  ? 'bg-amber-600 text-white shadow-sm font-black'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <ChefHat className="w-4 h-4 text-amber-300" />
              Custos & Produção
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-stone-200 text-stone-900 shadow-sm font-black'
                  : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
              }`}
            >
              <Tags className="w-4 h-4" />
              Cardápio
            </button>
          </nav>

          {/* Lado Direito: Alternador Claro/Escuro & Relógio */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-stone-800/90 hover:bg-stone-700/80 text-amber-300 border border-stone-700/80 transition-all cursor-pointer shadow-xs"
              title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-amber-200" />}
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-stone-300 bg-stone-800/90 px-3 py-1.5 rounded-lg border border-stone-700/80">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
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
