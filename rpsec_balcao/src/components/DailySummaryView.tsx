import React from 'react'
import { Sale, Expense } from '../types'
import { formatCurrency } from '../storage'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Banknote, 
  QrCode, 
  CreditCard, 
  UserCheck,
  Award,
  Clock
} from 'lucide-react'

interface DailySummaryViewProps {
  sales: Sale[]
  expenses: Expense[]
}

export const DailySummaryView: React.FC<DailySummaryViewProps> = ({ sales, expenses }) => {
  const todayStr = new Date().toISOString().split('T')[0]

  // Vendas de hoje
  const todaySales = sales.filter(s => s.createdAt.startsWith(todayStr))
  const totalSalesAmount = todaySales.reduce((sum, s) => sum + s.totalAmount, 0)

  // Despesas de hoje
  const todayExpenses = expenses.filter(e => e.createdAt.startsWith(todayStr))
  const totalExpensesAmount = todayExpenses.reduce((sum, e) => sum + e.amount, 0)

  // Saldo Líquido
  const netBalance = totalSalesAmount - totalExpensesAmount

  // Quebra por pagamento
  const cashTotal = todaySales
    .filter(s => s.paymentMethod === 'dinheiro')
    .reduce((sum, s) => sum + s.totalAmount, 0)

  const pixTotal = todaySales
    .filter(s => s.paymentMethod === 'pix')
    .reduce((sum, s) => sum + s.totalAmount, 0)

  const cardDebitTotal = todaySales
    .filter(s => s.paymentMethod === 'cartao_debito')
    .reduce((sum, s) => sum + s.totalAmount, 0)

  const cardCreditTotal = todaySales
    .filter(s => s.paymentMethod === 'cartao_credito')
    .reduce((sum, s) => sum + s.totalAmount, 0)

  const creditPendingTotal = todaySales
    .filter(s => s.paymentMethod === 'fiado')
    .reduce((sum, s) => sum + s.totalAmount, 0)

  // Ranking de itens vendidos hoje
  const itemCounts: { [name: string]: { count: number; total: number } } = {}
  todaySales.forEach(s => {
    s.items.forEach(item => {
      if (!itemCounts[item.productName]) {
        itemCounts[item.productName] = { count: 0, total: 0 }
      }
      itemCounts[item.productName].count += item.quantity
      itemCounts[item.productName].total += item.total
    })
  })

  const topItems = Object.entries(itemCounts)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)

  return (
    <div className="flex flex-col gap-6">
      {/* 3 Grandes Cartões Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Entradas */}
        <div className="bg-white p-6 rounded-2xl border-2 border-emerald-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Entradas Hoje ({todaySales.length} vendas)
            </span>
            <span className="text-3xl font-black text-emerald-600 mt-1 block">
              {formatCurrency(totalSalesAmount)}
            </span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <TrendingUp className="w-8 h-8" />
          </div>
        </div>

        {/* Saídas */}
        <div className="bg-white p-6 rounded-2xl border-2 border-rose-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Saídas Hoje ({todayExpenses.length} despesas)
            </span>
            <span className="text-3xl font-black text-rose-600 mt-1 block">
              {formatCurrency(totalExpensesAmount)}
            </span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
            <TrendingDown className="w-8 h-8" />
          </div>
        </div>

        {/* Saldo Líquido do Dia */}
        <div className={`p-6 rounded-2xl border-2 shadow-sm flex items-center justify-between ${
          netBalance >= 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-rose-50 border-rose-200'
        }`}>
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
              Saldo Líquido de Hoje
            </span>
            <span className={`text-3xl font-black mt-1 block ${
              netBalance >= 0 ? 'text-amber-900' : 'text-rose-700'
            }`}>
              {formatCurrency(netBalance)}
            </span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white shadow-xs flex items-center justify-center text-amber-700">
            <Wallet className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Seção Central: Onde está o dinheiro (Conferência de Caixa) + Top Produtos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Conferência por Meio de Pagamento (7 colunas) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-amber-600" />
            Conferência de Caixa (Onde está o dinheiro de hoje)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                <Banknote className="w-4 h-4 text-emerald-600" />
                Dinheiro na Gaveta
              </div>
              <p className="text-2xl font-black text-slate-800 mt-2">
                {formatCurrency(cashTotal)}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Notas e moedas físicas</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                <QrCode className="w-4 h-4 text-emerald-600" />
                PIX Recebido
              </div>
              <p className="text-2xl font-black text-slate-800 mt-2">
                {formatCurrency(pixTotal)}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Caiu na conta do banco</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Cartões (Déb./Créd.)
              </div>
              <p className="text-2xl font-black text-slate-800 mt-2">
                {formatCurrency(cardDebitTotal + cardCreditTotal)}
              </p>
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Déb: {formatCurrency(cardDebitTotal)} | Créd: {formatCurrency(cardCreditTotal)}
              </span>
            </div>

            {creditPendingTotal > 0 && (
              <div className="col-span-2 sm:col-span-3 p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                  <UserCheck className="w-4 h-4 text-amber-700" />
                  Total a Receber (Fiados Anotados):
                </div>
                <span className="text-xl font-black text-amber-900">
                  {formatCurrency(creditPendingTotal)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Top Salgados Mais Vendidos Hoje (5 colunas) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Campeões de Venda Hoje
            </h3>

            {topItems.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">Nenhuma venda registrada ainda hoje.</p>
            ) : (
              <div className="space-y-3">
                {topItems.map(([name, data], idx) => (
                  <div key={name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        idx === 0 ? 'bg-amber-400 text-amber-950' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-bold text-sm text-slate-800">{name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm text-slate-900 block">{data.count} un.</span>
                      <span className="text-xs text-slate-400">{formatCurrency(data.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Histórico das Vendas de Hoje */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-slate-600" />
          Últimas Vendas Registradas Hoje
        </h3>
        {todaySales.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center">Nenhuma venda realizada hoje.</p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
            {todaySales.map(sale => (
              <div key={sale.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                      {sale.paymentMethod.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    {sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                  </p>
                </div>
                <span className="text-lg font-black text-emerald-600">
                  {formatCurrency(sale.totalAmount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
