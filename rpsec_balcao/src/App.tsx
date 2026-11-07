import { useState, useEffect } from 'react'
import type { Product, Sale, Expense } from './types'
import {
  loadProducts,
  saveProducts,
  loadSales,
  saveSale,
  loadExpenses,
  saveExpense,
} from './storage'
import { PDVView } from './components/PDVView'
import { ExpensesView } from './components/ExpensesView'
import { DailySummaryView } from './components/DailySummaryView'
import { ProductsView } from './components/ProductsView'
import { 
  ShoppingBag, 
  ArrowDownCircle, 
  BarChart3, 
  Tags, 
  Store,
  Clock
} from 'lucide-react'

type TabType = 'pdv' | 'expenses' | 'summary' | 'products'

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('pdv')
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [currentTime, setCurrentTime] = useState<string>('')

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

  const handleCompleteSale = (sale: Sale) => {
    const updated = saveSale(sale)
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

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Topo / Barra de Navegação Superior */}
      <header className="bg-slate-900 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Logo e Título */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-inner">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-xl tracking-tight text-white">RPsec Balcão</h1>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
                  MVP Alfa
                </span>
              </div>
              <p className="text-xs text-slate-400">Gestão Fácil para Salgaderia</p>
            </div>
          </div>

          {/* Abas Principais (Botões Grandes) */}
          <nav className="flex items-center gap-1.5 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              onClick={() => setActiveTab('pdv')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                activeTab === 'pdv'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Caixa / Vender
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                activeTab === 'expenses'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <ArrowDownCircle className="w-4 h-4" />
              Saídas / Gastos
            </button>

            <button
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                activeTab === 'summary'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Resumo do Dia
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-slate-100 text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Tags className="w-4 h-4" />
              Produtos
            </button>
          </nav>

          {/* Relógio & Indicador */}
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentTime}</span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'pdv' && (
          <PDVView products={products} onCompleteSale={handleCompleteSale} />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeTab === 'summary' && (
          <DailySummaryView sales={sales} expenses={expenses} />
        )}

        {activeTab === 'products' && (
          <ProductsView products={products} onUpdateProducts={handleUpdateProducts} />
        )}
      </main>
    </div>
  )
}

export default App
