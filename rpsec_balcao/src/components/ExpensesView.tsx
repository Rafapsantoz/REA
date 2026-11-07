import React, { useState } from 'react'
import { Expense, ExpenseCategory } from '../types'
import { formatCurrency } from '../storage'
import { ArrowDownCircle, Plus, Trash2, Receipt } from 'lucide-react'

interface ExpensesViewProps {
  expenses: Expense[]
  onAddExpense: (expense: Expense) => void
  onDeleteExpense: (id: string) => void
}

const QUICK_EXPENSE_PRESETS = [
  { label: 'Gás de Cozinha', category: 'contas_fixas' as ExpenseCategory },
  { label: 'Farinha / Fritura / Óleo', category: 'insumos' as ExpenseCategory },
  { label: 'Peito de Frango / Carnes', category: 'insumos' as ExpenseCategory },
  { label: 'Queijo / Requeijão', category: 'insumos' as ExpenseCategory },
  { label: 'Sacolas e Guardanapos', category: 'embalagens' as ExpenseCategory },
  { label: 'Conta de Energia / Água', category: 'contas_fixas' as ExpenseCategory },
  { label: 'Compras de Mercado Avulso', category: 'insumos' as ExpenseCategory },
]

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [description, setDescription] = useState('')
  const [amountStr, setAmountStr] = useState('')
  const [category, setCategory] = useState<ExpenseCategory>('insumos')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(amountStr.replace(',', '.'))
    if (!description.trim() || isNaN(amount) || amount <= 0) return

    const newExpense: Expense = {
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      description: description.trim(),
      amount,
      category,
    }

    onAddExpense(newExpense)
    setDescription('')
    setAmountStr('')
  }

  // Filtrar despesas lançadas hoje
  const todayStr = new Date().toISOString().split('T')[0]
  const todayExpenses = expenses.filter(e => e.createdAt.startsWith(todayStr))
  const totalTodayExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Formulário de Lançamento (5 colunas) */}
      <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <ArrowDownCircle className="w-6 h-6 text-rose-600" />
          <h2 className="text-xl font-black text-slate-800">Lançar Saída / Gasto</h2>
        </div>

        {/* Atalhos Rápidos com 1 clique */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Atalhos Frequentes (Clique para preencher):
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_EXPENSE_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setDescription(preset.label)
                  setCategory(preset.category)
                }}
                className="text-xs bg-slate-100 hover:bg-amber-100 hover:text-amber-900 border border-slate-200 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-4 mt-2">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
              Descrição do Gasto:
            </label>
            <input
              type="text"
              placeholder="Ex: Compra de 5kg de frango"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-base text-slate-800 font-semibold focus:outline-amber-600 focus:bg-white"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Valor Pago (R$):
              </label>
              <input
                type="text"
                placeholder="Ex: 85,00"
                value={amountStr}
                onChange={e => setAmountStr(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-lg font-black text-rose-600 focus:outline-amber-600 focus:bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Categoria:
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ExpenseCategory)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 focus:outline-amber-600 focus:bg-white cursor-pointer"
              >
                <option value="insumos">Insumos & Ingredientes</option>
                <option value="contas_fixas">Contas (Gás, Luz, Água)</option>
                <option value="embalagens">Embalagens & Descartáveis</option>
                <option value="outros">Outros Gastos</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-lg rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
          >
            <Plus className="w-5 h-5" />
            REGISTRAR SAÍDA
          </button>
        </form>
      </div>

      {/* Lista de Saídas do Dia (7 colunas) */}
      <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-black text-slate-800">Saídas Registradas Hoje</h3>
            </div>
            <span className="text-sm font-bold text-slate-500">
              Total Saído: <span className="text-rose-600 font-black">{formatCurrency(totalTodayExpenses)}</span>
            </span>
          </div>

          <div className="divide-y divide-slate-100 my-2 overflow-y-auto max-h-[420px]">
            {todayExpenses.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <p className="font-semibold text-slate-500">Nenhum gasto registrado hoje.</p>
                <p className="text-xs text-slate-400 mt-1">Preencha o formulário ao lado quando pagar alguma conta ou compra.</p>
              </div>
            ) : (
              todayExpenses.map(expense => (
                <div key={expense.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-slate-800">{expense.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">
                        {expense.category.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(expense.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-lg text-rose-600">
                      - {formatCurrency(expense.amount)}
                    </span>
                    <button
                      onClick={() => onDeleteExpense(expense.id)}
                      className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors cursor-pointer"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
