import React, { useState, useRef } from 'react'
import type { Sale, Expense, Product } from '../types'
import { 
  formatCurrency, 
  exportBackupJSON, 
  importBackupJSON 
} from '../storage'
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Banknote, 
  QrCode, 
  CreditCard, 
  UserCheck,
  Award,
  Clock,
  Share2,
  Copy,
  Check,
  Download,
  Upload,
  ShieldCheck,
  AlertCircle
} from 'lucide-react'

interface DailySummaryViewProps {
  sales: Sale[]
  expenses: Expense[]
  products?: Product[]
  onRestoreData?: (products: Product[], sales: Sale[], expenses: Expense[]) => void
}

export const DailySummaryView: React.FC<DailySummaryViewProps> = ({ 
  sales, 
  expenses, 
  onRestoreData 
}) => {
  const [copied, setCopied] = useState(false)
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const formattedTodayDate = today.toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric' 
  })

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

  // Gerador de Mensagem para WhatsApp
  const generateReportText = (): string => {
    let msg = `📊 *FECHAMENTO DO CAIXA — RPSEC BALCÃO*\n`
    msg += `🗓 *Data:* ${formattedTodayDate}\n\n`
    msg += `💰 *Entradas Totais:* ${formatCurrency(totalSalesAmount)} (${todaySales.length} vendas)\n`
    msg += `💵 *Dinheiro na Gaveta:* ${formatCurrency(cashTotal)}\n`
    msg += `📱 *PIX Recebido:* ${formatCurrency(pixTotal)}\n`
    msg += `💳 *Cartões (Déb/Créd):* ${formatCurrency(cardDebitTotal + cardCreditTotal)}\n`
    if (creditPendingTotal > 0) {
      msg += `📝 *Fiados Anotados:* ${formatCurrency(creditPendingTotal)}\n`
    }
    msg += `\n🔻 *Saídas / Despesas:* ${formatCurrency(totalExpensesAmount)} (${todayExpenses.length} despesas)\n`
    msg += `\n⚖️ *SALDO LÍQUIDO DO DIA:* ${formatCurrency(netBalance)}\n`
    
    if (topItems.length > 0) {
      msg += `\n🏆 *Mais Vendidos de Hoje:*\n`
      topItems.forEach(([name, data], idx) => {
        msg += `${idx + 1}. ${name} — ${data.count} un. (${formatCurrency(data.total)})\n`
      })
    }
    msg += `\n_RPsec Balcão — Gestão Inteligente de Salgaderia_`
    return msg
  }

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(generateReportText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback simples
    }
  }

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateReportText())
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  // Backup handlers
  const handleDownloadBackup = () => {
    const json = exportBackupJSON()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup_rpsec_balcao_${todayStr}.json`
    a.click()
    URL.revokeObjectURL(url)
    setBackupMessage({ type: 'success', text: 'Backup baixado com sucesso!' })
    setTimeout(() => setBackupMessage(null), 3000)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const result = importBackupJSON(content)
      if (result.success && result.data) {
        if (onRestoreData) {
          onRestoreData(result.data.products, result.data.sales, result.data.expenses)
        }
        setBackupMessage({ type: 'success', text: 'Dados restaurados com sucesso!' })
      } else {
        setBackupMessage({ type: 'error', text: result.error || 'Falha ao restaurar arquivo.' })
      }
      setTimeout(() => setBackupMessage(null), 4000)
    }
    reader.readAsText(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Barra de Ações Rápidas: Enviar Fechamento / Compartilhar WhatsApp */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-amber-400 tracking-wider block">
            Ações de Fechamento Diário
          </span>
          <h2 className="text-xl font-black text-white">Relatório do Balcão ({formattedTodayDate})</h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-sm transition-all border border-slate-700 cursor-pointer shadow-sm active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            {copied ? 'Copiado para o Celular!' : 'Copiar Texto'}
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-sm transition-all cursor-pointer shadow-md active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            Enviar no WhatsApp
          </button>
        </div>
      </div>

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

      {/* Seção de Backup & Segurança dos Dados */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-base">Segurança & Backup do Balcão</h4>
              <p className="text-xs text-slate-500">
                Baixe uma cópia dos seus produtos, vendas e despesas para garantir que nada se perca ao limpar o navegador.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadBackup}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer border border-slate-300"
            >
              <Download className="w-4 h-4 text-slate-600" />
              Baixar Backup (.json)
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-all cursor-pointer border border-slate-300"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              Restaurar Backup
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>

        {backupMessage && (
          <div className={`mt-4 p-3 rounded-xl flex items-center gap-2 text-sm font-semibold ${
            backupMessage.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {backupMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            {backupMessage.text}
          </div>
        )}
      </div>
    </div>
  )
}
