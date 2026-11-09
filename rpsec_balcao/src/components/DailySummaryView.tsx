import React, { useState, useRef } from 'react'
import type { Sale, Expense, Product, PaymentMethod, Comanda, CashShift, CashMovementType } from '../types'
import { 
  formatCurrency, 
  exportBackupJSON, 
  importBackupJSON,
  getHourlySalesStats 
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
  AlertCircle,
  CheckCircle2,
  BookOpen,
  Users,
  Flame,
  UtensilsCrossed,
  Lock,
  Unlock,
  ArrowDownRight,
  ArrowUpRight,
  Calculator,
  History
} from 'lucide-react'

interface DailySummaryViewProps {
  sales: Sale[]
  expenses: Expense[]
  products?: Product[]
  comandas?: Comanda[]
  currentShift: CashShift | null
  shiftHistory: CashShift[]
  onOpenShift: (initialFloat: number, notes?: string) => void
  onAddMovement: (type: CashMovementType, amount: number, description: string) => void
  onCloseShift: (countedCash: number, expectedCash: number, notes?: string) => void
  onRestoreData?: (products: Product[], sales: Sale[], expenses: Expense[]) => void
  onMarkCreditPaid?: (saleId: string, method: PaymentMethod) => void
}

export const DailySummaryView: React.FC<DailySummaryViewProps> = ({ 
  sales, 
  expenses, 
  comandas = [],
  currentShift,
  shiftHistory = [],
  onOpenShift,
  onAddMovement,
  onCloseShift,
  onRestoreData,
  onMarkCreditPaid
}) => {
  const [copied, setCopied] = useState(false)
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [settlingSaleId, setSettlingSaleId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Estados de Fechamento de Caixa e Gaveta
  const [countedCashInput, setCountedCashInput] = useState<string>('')
  const [closingNotes, setClosingNotes] = useState<string>('')
  const [showOpenShiftModal, setShowOpenShiftModal] = useState<boolean>(false)
  const [openShiftFloatInput, setOpenShiftFloatInput] = useState<string>('50')
  const [openShiftNotesInput, setOpenShiftNotesInput] = useState<string>('')
  const [showMovementModal, setShowMovementModal] = useState<boolean>(false)
  const [movementType, setMovementType] = useState<CashMovementType>('sangria')
  const [movementAmount, setMovementAmount] = useState<string>('')
  const [movementDescription, setMovementDescription] = useState<string>('')
  const [showHistoryAccordion, setShowHistoryAccordion] = useState<boolean>(false)
  const [closedShiftReceipt, setClosedShiftReceipt] = useState<CashShift | null>(null)

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
    .filter(s => s.paymentMethod === 'dinheiro' || (s.paymentMethod === 'fiado' && s.isCreditPaid && s.creditPaidMethod === 'dinheiro'))
    .reduce((sum, s) => sum + s.totalAmount, 0)

  const pixTotal = todaySales
    .filter(s => s.paymentMethod === 'pix' || (s.paymentMethod === 'fiado' && s.isCreditPaid && s.creditPaidMethod === 'pix'))
    .reduce((sum, s) => sum + s.totalAmount, 0)

  const cardDebitTotal = todaySales
    .filter(s => s.paymentMethod === 'cartao_debito')
    .reduce((sum, s) => sum + s.totalAmount, 0)

  const cardCreditTotal = todaySales
    .filter(s => s.paymentMethod === 'cartao_credito')
    .reduce((sum, s) => sum + s.totalAmount, 0)

  // Fiados em aberto (não pagos)
  const openFiados = sales.filter(s => s.paymentMethod === 'fiado' && !s.isCreditPaid)
  const totalOpenFiadosAmount = openFiados.reduce((sum, s) => sum + s.totalAmount, 0)

  // Estatísticas de fluxo e picos de horário
  const totalCustomersToday = todaySales.length
  const averageTicket = totalCustomersToday > 0 ? totalSalesAmount / totalCustomersToday : 0
  const hourlyStats = getHourlySalesStats(sales, todayStr)
  const peakStat = hourlyStats.find(h => h.isPeak && h.customerCount > 0)
  const maxHourlyCount = Math.max(...hourlyStats.map(h => h.customerCount), 1)

  // Cálculos do Caixa Físico (Fundo de Troco, Sangrias, Suprimentos e Esperado)
  const initialFloat = currentShift ? currentShift.initialFloat : 0
  const sangriasTotal = currentShift 
    ? currentShift.movements.filter(m => m.type === 'sangria').reduce((s, m) => s + m.amount, 0) 
    : 0
  const suprimentosTotal = currentShift 
    ? currentShift.movements.filter(m => m.type === 'suprimento').reduce((s, m) => s + m.amount, 0) 
    : 0
  const expectedDrawerCash = initialFloat + cashTotal + suprimentosTotal - sangriasTotal

  // Diferença em tempo real da contagem
  const countedNum = parseFloat(countedCashInput.replace(',', '.'))
  const isCountedValid = !isNaN(countedNum)
  const countedDifference = isCountedValid ? countedNum - expectedDrawerCash : 0

  const handleConfirmOpenShift = () => {
    const floatNum = parseFloat(openShiftFloatInput.replace(',', '.')) || 0
    onOpenShift(floatNum, openShiftNotesInput)
    setShowOpenShiftModal(false)
    setOpenShiftFloatInput('50')
    setOpenShiftNotesInput('')
  }

  const handleConfirmMovement = () => {
    const amountNum = parseFloat(movementAmount.replace(',', '.'))
    if (isNaN(amountNum) || amountNum <= 0) return
    onAddMovement(movementType, amountNum, movementDescription)
    setShowMovementModal(false)
    setMovementAmount('')
    setMovementDescription('')
  }

  const handleConfirmCloseShift = () => {
    if (!isCountedValid) return
    onCloseShift(countedNum, expectedDrawerCash, closingNotes)
    if (currentShift) {
      setClosedShiftReceipt({
        ...currentShift,
        status: 'closed',
        closedAt: new Date().toISOString(),
        closingCashCounted: countedNum,
        closingCashExpected: expectedDrawerCash,
        closingDifference: countedDifference,
        notes: closingNotes,
      })
    }
    setCountedCashInput('')
    setClosingNotes('')
  }

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
  const generateReportText = (targetShift?: CashShift | null): string => {
    const shift = targetShift !== undefined ? targetShift : currentShift
    let msg = `📊 *FECHAMENTO DO CAIXA — RPSEC BALCÃO*\n`
    msg += `🗓 *Data:* ${formattedTodayDate}\n`
    if (shift) {
      msg += `⏰ *Abertura:* ${new Date(shift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      if (shift.closedAt) {
        msg += ` | *Fechamento:* ${new Date(shift.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      }
      msg += `\n`
    }
    msg += `\n💰 *Entradas Totais:* ${formatCurrency(totalSalesAmount)} (${todaySales.length} vendas)\n`
    msg += `👥 *Clientes Atendidos:* ${totalCustomersToday} (Ticket Médio: ${formatCurrency(averageTicket)})\n`
    if (peakStat) {
      msg += `🔥 *Horário de Pico:* ${peakStat.label} (${peakStat.customerCount} clientes / ${formatCurrency(peakStat.totalAmount)})\n`
    }
    if (comandas.length > 0) {
      msg += `🍽️ *Comandas Abertas no Local:* ${comandas.length} em consumo agora\n`
    }

    // Extrato da Gaveta Física
    msg += `\n💵 *--- CONFERÊNCIA DA GAVETA (DINHEIRO) ---*\n`
    msg += `(+) Fundo de Troco Inicial: ${formatCurrency(shift ? shift.initialFloat : initialFloat)}\n`
    msg += `(+) Vendas em Dinheiro: ${formatCurrency(cashTotal)}\n`
    if (suprimentosTotal > 0) msg += `(+) Troco Adicionado (Suprimento): +${formatCurrency(suprimentosTotal)}\n`
    if (sangriasTotal > 0) msg += `(-) Retiradas da Gaveta (Sangria): -${formatCurrency(sangriasTotal)}\n`
    msg += `(=) *Dinheiro Esperado na Gaveta:* ${formatCurrency(expectedDrawerCash)}\n`
    if (shift?.closingCashCounted !== undefined) {
      msg += `🔎 *Dinheiro Contado na Gaveta:* ${formatCurrency(shift.closingCashCounted)}\n`
      const diff = shift.closingDifference || 0
      if (diff === 0) msg += `✅ *Batimento:* Caixa bateu 100%! (Diferença: R$ 0,00)\n`
      else if (diff > 0) msg += `🟢 *Batimento:* Sobra de Caixa: +${formatCurrency(diff)}\n`
      else msg += `⚠️ *Batimento:* Falta de Troco: ${formatCurrency(diff)}\n`
    }

    msg += `\n📱 *PIX Recebido:* ${formatCurrency(pixTotal)}\n`
    msg += `💳 *Cartões (Déb/Créd):* ${formatCurrency(cardDebitTotal + cardCreditTotal)}\n`
    if (totalOpenFiadosAmount > 0) {
      msg += `📝 *Fiados Pendentes:* ${formatCurrency(totalOpenFiadosAmount)} (${openFiados.length} clientes)\n`
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
      // Fallback
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
      <div className="bg-[#241c15] dark:bg-[#1a1410] border border-amber-950/40 text-stone-100 p-4 sm:p-5 rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-amber-400 tracking-wider block">
            Ações de Fechamento Diário
          </span>
          <h2 className="text-xl font-black text-amber-50">Relatório do Balcão ({formattedTodayDate})</h2>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleCopyReport()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-stone-800/90 hover:bg-stone-700 text-stone-200 font-bold text-sm transition-all border border-stone-700 cursor-pointer shadow-sm active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            {copied ? 'Copiado para o Celular!' : 'Copiar Texto'}
          </button>

          <button
            onClick={() => handleShareWhatsApp()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-stone-950 font-black text-sm transition-all cursor-pointer shadow-md active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            Enviar no WhatsApp
          </button>
        </div>
      </div>

      {/* Cartão de Status do Turno: Abertura / Sangria / Suprimento */}
      {!currentShift ? (
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-red-500/15 border-2 border-amber-400 dark:border-amber-600/80 p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-xs shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs uppercase font-black text-amber-800 dark:text-amber-300 tracking-wider block">
                Controle de Caixa
              </span>
              <h3 className="text-lg font-black text-stone-900 dark:text-stone-100">
                Caixa Fechado no Momento
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400">
                Abra o caixa informando o troco inicial colocado na gaveta para acompanhar o batimento no fim do dia.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowOpenShiftModal(true)}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
          >
            <Unlock className="w-4 h-4" />
            ABRIR CAIXA DO DIA (FUNDO DE TROCO)
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1a1613] border-2 border-emerald-300 dark:border-emerald-800/80 p-4 sm:p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-xs shrink-0">
              <Unlock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  CAIXA ABERTO
                </span>
                <span className="text-xs text-stone-500 dark:text-stone-400 font-bold">
                  Aberto às {new Date(currentShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <h3 className="text-base font-black text-stone-900 dark:text-stone-100 mt-1">
                Fundo de Troco: <span className="text-emerald-700 dark:text-emerald-400">{formatCurrency(currentShift.initialFloat)}</span>
                {currentShift.movements.length > 0 && (
                  <span className="text-xs text-stone-500 font-bold ml-2">
                    ({currentShift.movements.length} {currentShift.movements.length === 1 ? 'movimentação' : 'movimentações'})
                  </span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setMovementType('sangria'); setShowMovementModal(true); }}
              className="px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-all border border-rose-200 dark:border-rose-900 cursor-pointer active:scale-95"
            >
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
              Retirar da Gaveta (Sangria)
            </button>

            <button
              onClick={() => { setMovementType('suprimento'); setShowMovementModal(true); }}
              className="px-3.5 py-2.5 rounded-xl bg-stone-50 dark:bg-stone-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1.5 transition-all border border-emerald-200 dark:border-emerald-900 cursor-pointer active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              Adicionar Troco (Suprimento)
            </button>
          </div>
        </div>
      )}

      {/* 3 Grandes Cartões Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Entradas */}
        <div className="bg-white dark:bg-[#1a1613] p-6 rounded-2xl border-2 border-emerald-100 dark:border-emerald-950/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
              Entradas Hoje ({todaySales.length} vendas)
            </span>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              {formatCurrency(totalSalesAmount)}
            </span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-8 h-8" />
          </div>
        </div>

        {/* Saídas */}
        <div className="bg-white dark:bg-[#1a1613] p-6 rounded-2xl border-2 border-rose-100 dark:border-rose-950/60 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider block">
              Saídas Hoje ({todayExpenses.length} despesas)
            </span>
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
              {formatCurrency(totalExpensesAmount)}
            </span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <TrendingDown className="w-8 h-8" />
          </div>
        </div>

        {/* Saldo Líquido do Dia */}
        <div className={`p-6 rounded-2xl border-2 shadow-sm flex items-center justify-between ${
          netBalance >= 0 
            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/50' 
            : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
        }`}>
          <div>
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block">
              Saldo Líquido de Hoje
            </span>
            <span className={`text-3xl font-black mt-1 block ${
              netBalance >= 0 ? 'text-amber-950 dark:text-amber-300' : 'text-rose-700 dark:text-rose-400'
            }`}>
              {formatCurrency(netBalance)}
            </span>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-stone-800 shadow-xs flex items-center justify-center text-amber-700 dark:text-amber-400">
            <Wallet className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Fluxo de Clientes & Picos de Horário de Atendimento */}
      <div className="bg-white dark:bg-[#1a1613] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-red-500 text-white flex items-center justify-center shadow-xs">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                Movimento de Clientes & Horários de Pico
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Acompanhe o ritmo de atendimento da salgaderia ao longo do dia
              </p>
            </div>
          </div>

          {peakStat && (
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-red-500/15 border border-amber-400/50 dark:border-amber-600/50 px-3.5 py-1.5 rounded-xl">
              <Flame className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="text-xs font-black text-amber-950 dark:text-amber-200">
                Pico de Atendimento: {peakStat.label} ({peakStat.customerCount} clientes • {formatCurrency(peakStat.totalAmount)})
              </span>
            </div>
          )}
        </div>

        {/* 4 Indicadores Rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-500 dark:text-stone-400">
              <Users className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Clientes Atendidos
            </div>
            <p className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-1">
              {totalCustomersToday}
            </p>
            <span className="text-[11px] text-stone-400 dark:text-stone-500">Vendas concluídas hoje</span>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-500 dark:text-stone-400">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              Ticket Médio
            </div>
            <p className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-1">
              {formatCurrency(averageTicket)}
            </p>
            <span className="text-[11px] text-stone-400 dark:text-stone-500">Gasto médio por cliente</span>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-500 dark:text-stone-400">
              <Clock className="w-4 h-4 text-red-500" />
              Hora Mais Movimentada
            </div>
            <p className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-1">
              {peakStat ? peakStat.label : '--:--'}
            </p>
            <span className="text-[11px] text-stone-400 dark:text-stone-500">
              {peakStat ? `${peakStat.customerCount} atendimentos` : 'Sem vendas ainda'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
              <UtensilsCrossed className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Comendo no Local Agora
            </div>
            <p className="text-2xl font-black text-amber-950 dark:text-amber-200 mt-1">
              {comandas.length}
            </p>
            <span className="text-[11px] text-amber-800/80 dark:text-amber-400/80">Comandas em aberto</span>
          </div>
        </div>

        {/* Gráfico de Barras por Faixa de Horário */}
        <div className="mt-1">
          <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block mb-3">
            Distribuição de Atendimentos por Hora (06h às 22h):
          </span>

          <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-16 gap-2">
            {hourlyStats.map(stat => {
              const hasActivity = stat.customerCount > 0
              const heightPercent = hasActivity ? Math.max(Math.round((stat.customerCount / maxHourlyCount) * 100), 20) : 8

              return (
                <div
                  key={stat.hour}
                  className={`flex flex-col items-center justify-end p-2 rounded-xl transition-all border ${
                    stat.isPeak && hasActivity
                      ? 'bg-amber-500/15 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/50'
                      : hasActivity
                      ? 'bg-stone-50 dark:bg-stone-900/60 border-stone-200 dark:border-stone-800'
                      : 'bg-stone-50/40 dark:bg-stone-900/20 border-transparent opacity-60'
                  }`}
                >
                  {/* Etiqueta de Pico ou Contagem */}
                  <div className="text-center mb-1.5">
                    {stat.isPeak && hasActivity ? (
                      <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                        Pico
                      </span>
                    ) : hasActivity ? (
                      <span className="text-xs font-black text-stone-900 dark:text-stone-100">
                        {stat.customerCount}
                      </span>
                    ) : (
                      <span className="text-[10px] text-stone-300 dark:text-stone-700">-</span>
                    )}
                  </div>

                  {/* Barra Visual */}
                  <div className="w-full h-16 bg-stone-100 dark:bg-stone-800 rounded-lg overflow-hidden flex flex-col justify-end p-0.5">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-md transition-all duration-500 ${
                        stat.isPeak && hasActivity
                          ? 'bg-gradient-to-t from-red-600 to-amber-500'
                          : hasActivity
                          ? 'bg-gradient-to-t from-amber-600 to-amber-400'
                          : 'bg-stone-200 dark:bg-stone-700/50'
                      }`}
                    />
                  </div>

                  {/* Hora */}
                  <span className={`text-[11px] font-bold mt-2 ${
                    stat.isPeak && hasActivity 
                      ? 'text-red-700 dark:text-amber-300 font-black' 
                      : 'text-stone-600 dark:text-stone-400'
                  }`}>
                    {stat.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Caderninho de Fiados em Aberto (A Receber) */}
      {openFiados.length > 0 && (
        <div className="bg-amber-50/70 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-800/80 p-5 rounded-2xl shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber-200 dark:border-amber-900/60">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-700 dark:text-amber-400" />
              <h3 className="font-black text-lg text-amber-950 dark:text-amber-200">
                Caderninho de Fiados em Aberto ({openFiados.length})
              </h3>
            </div>
            <div className="text-right">
              <span className="text-xs text-amber-900/70 dark:text-amber-300/70 block uppercase font-bold">Total a Receber:</span>
              <span className="text-xl font-black text-amber-950 dark:text-amber-200">
                {formatCurrency(totalOpenFiadosAmount)}
              </span>
            </div>
          </div>

          <div className="divide-y divide-amber-200/60 dark:divide-amber-900/40 max-h-[280px] overflow-y-auto">
            {openFiados.map(sale => (
              <div key={sale.id} className="py-2.5 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-stone-900 dark:text-stone-100 text-base">
                      {sale.customerName || 'Cliente não identificado'}
                    </span>
                    <span className="text-xs text-stone-400 dark:text-stone-500">
                      {new Date(sale.createdAt).toLocaleDateString()} às {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                    {sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="font-black text-lg text-amber-900 dark:text-amber-300">
                    {formatCurrency(sale.totalAmount)}
                  </span>

                  {/* Botão de Dar Baixa */}
                  {settlingSaleId === sale.id ? (
                    <div className="flex items-center gap-1.5 bg-white dark:bg-stone-900 p-1 rounded-xl border border-amber-300 dark:border-amber-700 shadow-sm animate-fadeIn">
                      <span className="text-[11px] font-bold text-stone-600 dark:text-stone-300 pl-1">
                        Recebeu em:
                      </span>
                      <button
                        onClick={() => {
                          if (onMarkCreditPaid) onMarkCreditPaid(sale.id, 'dinheiro')
                          setSettlingSaleId(null)
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-all"
                      >
                        💵 Dinheiro
                      </button>
                      <button
                        onClick={() => {
                          if (onMarkCreditPaid) onMarkCreditPaid(sale.id, 'pix')
                          setSettlingSaleId(null)
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-all"
                      >
                        ⚡ PIX
                      </button>
                      <button
                        onClick={() => setSettlingSaleId(null)}
                        className="px-1.5 py-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-xs font-bold cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSettlingSaleId(sale.id)}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-95"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Receber / Dar Baixa
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Seção Central: Onde está o dinheiro (Conferência de Caixa) + Top Produtos */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Conferência por Meio de Pagamento (7 colunas) */}
        <div className="lg:col-span-7 bg-white dark:bg-[#1a1613] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            Conferência de Caixa (Onde está o dinheiro de hoje)
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-bold">
                <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Dinheiro na Gaveta
              </div>
              <p className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-2">
                {formatCurrency(expectedDrawerCash)}
              </p>
              <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 block">
                {currentShift 
                  ? `Vendas: ${formatCurrency(cashTotal)} • Fundo: ${formatCurrency(initialFloat)}`
                  : 'Notas e moedas físicas'}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-bold">
                <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                PIX Recebido
              </div>
              <p className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-2">
                {formatCurrency(pixTotal)}
              </p>
              <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 block">Caiu na conta do banco</span>
            </div>

            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-900/70 border border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2 text-stone-500 dark:text-stone-400 text-xs font-bold">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Cartões (Déb./Créd.)
              </div>
              <p className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-2">
                {formatCurrency(cardDebitTotal + cardCreditTotal)}
              </p>
              <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5 block">
                Déb: {formatCurrency(cardDebitTotal)} | Créd: {formatCurrency(cardCreditTotal)}
              </span>
            </div>

            {totalOpenFiadosAmount > 0 && (
              <div className="col-span-2 sm:col-span-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 text-xs font-bold">
                  <UserCheck className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                  Total a Receber no Caderninho:
                </div>
                <span className="text-xl font-black text-amber-900 dark:text-amber-300">
                  {formatCurrency(totalOpenFiadosAmount)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Top Salgados Mais Vendidos Hoje (5 colunas) */}
        <div className="lg:col-span-5 bg-white dark:bg-[#1a1613] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Campeões de Venda Hoje
            </h3>

            {topItems.length === 0 ? (
              <p className="text-sm text-stone-400 dark:text-stone-500 py-8 text-center">Nenhuma venda registrada ainda hoje.</p>
            ) : (
              <div className="space-y-3">
                {topItems.map(([name, data], idx) => (
                  <div key={name} className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-100 dark:border-stone-800/60">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        idx === 0 ? 'bg-amber-400 text-amber-950' : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="font-bold text-sm text-stone-800 dark:text-stone-200">{name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm text-stone-900 dark:text-stone-100 block">{data.count} un.</span>
                      <span className="text-xs text-stone-400 dark:text-stone-500">{formatCurrency(data.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Módulo Especial: Fechamento de Turno & Batimento de Gaveta */}
      {currentShift && (
        <div className="bg-white dark:bg-[#1a1613] p-6 rounded-2xl border-2 border-amber-400 dark:border-amber-700/80 shadow-md flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-red-600 text-white flex items-center justify-center font-black shadow-xs shrink-0">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs uppercase font-black text-amber-800 dark:text-amber-300 tracking-wider block">
                  Conferência Cega de Fechamento
                </span>
                <h3 className="text-xl font-black text-stone-900 dark:text-stone-100">
                  Batimento da Gaveta & Fechamento de Caixa
                </h3>
              </div>
            </div>

            <span className="text-xs font-bold text-stone-500 dark:text-stone-400">
              Turno iniciado às {new Date(currentShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Equação de Conferência da Gaveta */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
              <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block uppercase">
                (+) Fundo Inicial
              </span>
              <p className="text-lg font-black text-stone-900 dark:text-stone-100 mt-1">
                {formatCurrency(currentShift.initialFloat)}
              </p>
              <span className="text-[10px] text-stone-400">Troco de abertura</span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase">
                (+) Vendas Dinheiro
              </span>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">
                +{formatCurrency(cashTotal)}
              </p>
              <span className="text-[10px] text-stone-400">Recebido no caixa</span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
              <span className="text-[11px] font-bold text-sky-700 dark:text-sky-400 block uppercase">
                (+) Suprimentos
              </span>
              <p className="text-lg font-black text-sky-600 dark:text-sky-400 mt-1">
                +{formatCurrency(suprimentosTotal)}
              </p>
              <span className="text-[10px] text-stone-400">Trocos adicionados</span>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-800">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 block uppercase">
                (-) Sangrias
              </span>
              <p className="text-lg font-black text-rose-600 dark:text-rose-400 mt-1">
                -{formatCurrency(sangriasTotal)}
              </p>
              <span className="text-[10px] text-stone-400">Retiradas da gaveta</span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-xl bg-amber-500/15 border-2 border-amber-400 dark:border-amber-600">
              <span className="text-[11px] font-black text-amber-950 dark:text-amber-200 block uppercase">
                (=) Esperado Gaveta
              </span>
              <p className="text-xl font-black text-amber-950 dark:text-amber-200 mt-1">
                {formatCurrency(expectedDrawerCash)}
              </p>
              <span className="text-[10px] text-amber-900/80 dark:text-amber-300/80 font-bold">Total a conferir</span>
            </div>
          </div>

          {/* Lista de Movimentações (Sangrias e Suprimentos) */}
          {currentShift.movements.length > 0 && (
            <div className="p-3.5 bg-stone-50 dark:bg-stone-900/40 rounded-xl border border-stone-200 dark:border-stone-800">
              <span className="text-xs font-black text-stone-700 dark:text-stone-300 uppercase tracking-wider block mb-2">
                Movimentações Realizadas no Turno ({currentShift.movements.length}):
              </span>
              <div className="divide-y divide-stone-200 dark:divide-stone-800 max-h-[140px] overflow-y-auto">
                {currentShift.movements.map(m => (
                  <div key={m.id} className="py-1.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                        m.type === 'sangria' 
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' 
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}>
                        {m.type === 'sangria' ? 'Sangria' : 'Suprimento'}
                      </span>
                      <span className="font-bold text-stone-800 dark:text-stone-200">{m.description}</span>
                      <span className="text-stone-400 text-[10px]">
                        às {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className={`font-black ${
                      m.type === 'sangria' ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      {m.type === 'sangria' ? '-' : '+'}{formatCurrency(m.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campo de Contagem Física e Botão de Encerramento */}
          <div className="bg-stone-50 dark:bg-stone-900/80 p-5 rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-700 flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex-1 w-full">
              <label className="block text-xs font-black text-stone-700 dark:text-stone-200 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-amber-600" />
                Quanto dinheiro físico você contou na gaveta agora?
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-base">R$</span>
                  <input
                    type="number"
                    step="0.05"
                    placeholder="0,00"
                    value={countedCashInput}
                    onChange={e => setCountedCashInput(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-stone-900 border-2 border-amber-300 dark:border-amber-600 rounded-xl font-black text-xl text-stone-900 dark:text-stone-100 focus:outline-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setCountedCashInput(expectedDrawerCash.toFixed(2))}
                  className="px-3.5 py-3 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 dark:hover:bg-amber-900 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-xl text-xs font-black cursor-pointer whitespace-nowrap active:scale-95 transition-all shadow-xs"
                >
                  Copiar Esperado ({formatCurrency(expectedDrawerCash)})
                </button>
              </div>

              {/* Feedback em Tempo Real da Diferença */}
              {isCountedValid && (
                <div className="mt-3">
                  {countedDifference === 0 ? (
                    <div className="flex items-center gap-2 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-200 p-3 rounded-xl font-black text-sm border border-emerald-300 dark:border-emerald-800 shadow-xs">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>✅ Caixa Bateu 100%! Nenhuma diferença de troco.</span>
                    </div>
                  ) : countedDifference > 0 ? (
                    <div className="flex items-center gap-2 bg-sky-100 dark:bg-sky-950/70 text-sky-900 dark:text-sky-200 p-3 rounded-xl font-black text-sm border border-sky-300 dark:border-sky-800 shadow-xs">
                      <TrendingUp className="w-5 h-5 text-sky-600 shrink-0" />
                      <span>🟢 Sobra de Caixa: +{formatCurrency(countedDifference)} a mais que o esperado.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-rose-100 dark:bg-rose-950/70 text-rose-900 dark:text-rose-200 p-3 rounded-xl font-black text-sm border border-rose-300 dark:border-rose-800 shadow-xs">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                      <span>⚠️ Quebra de Caixa: Faltam {formatCurrency(Math.abs(countedDifference))} em relação ao esperado.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Ação de Encerrar */}
            <div className="w-full md:w-auto shrink-0">
              <button
                onClick={handleConfirmCloseShift}
                disabled={!isCountedValid}
                className={`w-full md:w-auto px-7 py-4 rounded-xl font-black text-base flex items-center justify-center gap-2.5 cursor-pointer transition-all shadow-lg active:scale-95 ${
                  !isCountedValid
                    ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white shadow-red-950/20'
                }`}
              >
                <Lock className="w-5 h-5" />
                ENCERRAR E FECHAR CAIXA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accordion de Histórico de Caixas Fechados */}
      {shiftHistory.length > 0 && (
        <div className="bg-white dark:bg-[#1a1613] p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <button
            type="button"
            onClick={() => setShowHistoryAccordion(prev => !prev)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="font-black text-base text-stone-900 dark:text-stone-100">
                Histórico de Caixas Fechados ({shiftHistory.length})
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
              {showHistoryAccordion ? 'Recolher ▲' : 'Ver Turnos Anteriores ▼'}
            </span>
          </button>

          {showHistoryAccordion && (
            <div className="mt-4 divide-y divide-stone-100 dark:divide-stone-800/80 max-h-[350px] overflow-y-auto">
              {shiftHistory.map(s => {
                const diff = s.closingDifference || 0
                const openTime = new Date(s.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                const closeTime = s.closedAt ? new Date(s.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'
                const shiftDate = new Date(s.openedAt).toLocaleDateString()

                return (
                  <div key={s.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-stone-900 dark:text-stone-100">
                          {shiftDate}
                        </span>
                        <span className="text-xs text-stone-400">
                          ({openTime} às {closeTime})
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          diff === 0 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : diff > 0
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        }`}>
                          {diff === 0 ? '✓ Bateu' : diff > 0 ? `+${formatCurrency(diff)} Sobra` : `${formatCurrency(diff)} Falta`}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        Fundo: {formatCurrency(s.initialFloat)} • Esperado: {formatCurrency(s.closingCashExpected || 0)} • Contado: {formatCurrency(s.closingCashCounted || 0)}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const txt = encodeURIComponent(generateReportText(s))
                        window.open(`https://api.whatsapp.com/send?text=${txt}`, '_blank')
                      }}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      WhatsApp
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Histórico das Vendas de Hoje */}
      <div className="bg-white dark:bg-[#1a1613] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <h3 className="text-lg font-black text-stone-900 dark:text-stone-100 mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          Últimas Vendas Registradas Hoje
        </h3>
        {todaySales.length === 0 ? (
          <p className="text-sm text-stone-400 dark:text-stone-500 py-6 text-center">Nenhuma venda realizada hoje.</p>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800/80 max-h-[300px] overflow-y-auto">
            {todaySales.map(sale => (
              <div key={sale.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {sale.orderNumber && (
                      <span className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-400 text-stone-950 shadow-xs">
                        Cliente #{sale.orderNumber}
                      </span>
                    )}
                    {sale.comandaLabel && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900/60">
                        {sale.comandaLabel}
                      </span>
                    )}
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 uppercase">
                      {sale.paymentMethod.replace('_', ' ')}
                      {sale.paymentMethod === 'fiado' && sale.customerName && ` (${sale.customerName})`}
                    </span>
                    {sale.paymentMethod === 'fiado' && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        sale.isCreditPaid 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}>
                        {sale.isCreditPaid ? '✓ Pago' : '⏳ Em aberto'}
                      </span>
                    )}
                    <span className="text-xs text-stone-400 dark:text-stone-500">
                      {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-300 mt-1">
                    {sale.items.map(i => `${i.quantity}x ${i.productName}`).join(', ')}
                  </p>
                </div>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(sale.totalAmount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seção de Backup & Segurança dos Dados */}
      <div className="bg-white dark:bg-[#1a1613] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-700 dark:text-amber-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-stone-900 dark:text-stone-100 text-base">Segurança & Backup do Balcão</h4>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Baixe uma cópia dos seus produtos, vendas, despesas e clientes do fiado para garantir que nada se perca ao limpar o navegador.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadBackup}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs transition-all cursor-pointer border border-stone-300 dark:border-stone-700"
            >
              <Download className="w-4 h-4 text-stone-600 dark:text-stone-400" />
              Baixar Backup (.json)
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs transition-all cursor-pointer border border-stone-300 dark:border-stone-700"
            >
              <Upload className="w-4 h-4 text-stone-600 dark:text-stone-400" />
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
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
          }`}>
            {backupMessage.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            )}
            {backupMessage.text}
          </div>
        )}
      </div>

      {/* Modal 1: Abertura de Caixa (Fundo de Troco) */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#1c1815] w-full max-w-md rounded-2xl border-2 border-emerald-400 p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-500 text-white font-black">
                  <Unlock className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-lg text-stone-900 dark:text-stone-100">
                    Abertura de Caixa do Dia
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Informe o dinheiro que você colocou para troco
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowOpenShiftModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-black text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Sugestões Rápidas de 1 Toque */}
            <div>
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block mb-2">
                Valores Rápidos de Troco:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[0, 30, 50, 100, 150, 200].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setOpenShiftFloatInput(val.toString())}
                    className={`py-2.5 px-2 rounded-xl font-black text-xs transition-all border cursor-pointer text-center active:scale-95 ${
                      openShiftFloatInput === val.toString()
                        ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                        : 'bg-stone-100 dark:bg-stone-800 hover:bg-emerald-100 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    {val === 0 ? 'Sem Troco (R$ 0)' : `R$ ${val},00`}
                  </button>
                ))}
              </div>
            </div>

            {/* Input de Valor */}
            <div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider block mb-1">
                Ou digite o valor exato (R$):
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-base">R$</span>
                <input
                  type="number"
                  step="0.05"
                  value={openShiftFloatInput}
                  onChange={e => setOpenShiftFloatInput(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-stone-900 border-2 border-emerald-300 dark:border-emerald-700 rounded-xl font-black text-xl text-stone-900 dark:text-stone-100 focus:outline-emerald-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Observação Opcional */}
            <div>
              <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block mb-1">
                Observação (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: Notas miúdas de 2 e 5 reais + moedas"
                value={openShiftNotesInput}
                onChange={e => setOpenShiftNotesInput(e.target.value)}
                className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3.5 py-2 text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowOpenShiftModal(false)}
                className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-sm rounded-xl cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmOpenShift}
                className="flex-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-xl cursor-pointer shadow-md transition-all active:scale-95"
              >
                ABRIR CAIXA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: Sangria ou Suprimento */}
      {showMovementModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#1c1815] w-full max-w-md rounded-2xl border-2 border-amber-400 p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <span className={`p-2 rounded-xl text-white font-black ${
                  movementType === 'sangria' ? 'bg-rose-500' : 'bg-emerald-500'
                }`}>
                  {movementType === 'sangria' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className="font-black text-lg text-stone-900 dark:text-stone-100">
                    {movementType === 'sangria' ? 'Retirada da Gaveta (Sangria)' : 'Adicionar Troco (Suprimento)'}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {movementType === 'sangria' ? 'Tirar dinheiro da gaveta com registro' : 'Colocar mais troco durante o dia'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMovementModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-black text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Alternador de Tipo */}
            <div className="grid grid-cols-2 gap-2 bg-stone-100 dark:bg-stone-900 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setMovementType('sangria')}
                className={`py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  movementType === 'sangria'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                💸 Sangria (Retirar)
              </button>
              <button
                type="button"
                onClick={() => setMovementType('suprimento')}
                className={`py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  movementType === 'suprimento'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900'
                }`}
              >
                📥 Suprimento (Adicionar)
              </button>
            </div>

            {/* Valor */}
            <div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider block mb-1">
                Valor da Movimentação (R$): *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-base">R$</span>
                <input
                  type="number"
                  step="0.05"
                  placeholder="0,00"
                  value={movementAmount}
                  onChange={e => setMovementAmount(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white dark:bg-stone-900 border-2 border-stone-300 dark:border-stone-700 rounded-xl font-black text-xl text-stone-900 dark:text-stone-100 focus:outline-amber-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Motivos Rápidos */}
            <div>
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block mb-2">
                Motivo Rápido:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {(movementType === 'sangria' 
                  ? ['Retirada de Segurança', 'Pagamento de Fornecedor', 'Levar pro Banco', 'Despesa Avulsa']
                  : ['Troco Adicional', 'Moedas do Banco', 'Troca de Cédulas', 'Entrada Extra']
                ).map(motivo => (
                  <button
                    key={motivo}
                    type="button"
                    onClick={() => setMovementDescription(motivo)}
                    className="py-1.5 px-2 bg-stone-100 dark:bg-stone-800 hover:bg-amber-400 hover:text-stone-950 rounded-lg font-bold text-[11px] text-stone-700 dark:text-stone-300 text-center transition-all cursor-pointer"
                  >
                    {motivo}
                  </button>
                ))}
              </div>
            </div>

            {/* Descrição Personalizada */}
            <div>
              <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block mb-1">
                Descrição / Detalhe:
              </label>
              <input
                type="text"
                placeholder={movementType === 'sangria' ? "Ex: Pagamento do entregador de gás" : "Ex: R$ 50 em moedas de 1 real"}
                value={movementDescription}
                onChange={e => setMovementDescription(e.target.value)}
                className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3.5 py-2 text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMovementModal(false)}
                className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-sm rounded-xl cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmMovement}
                disabled={!movementAmount || parseFloat(movementAmount) <= 0}
                className={`flex-2 py-3 font-black text-sm rounded-xl cursor-pointer shadow-md transition-all active:scale-95 text-white ${
                  movementType === 'sangria'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                CONFIRMAR {movementType.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Comprovante de Caixa Fechado */}
      {closedShiftReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#1c1815] w-full max-w-lg rounded-2xl border-2 border-emerald-400 p-6 shadow-2xl flex flex-col gap-4 text-center">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs uppercase font-black text-emerald-700 dark:text-emerald-400 tracking-wider">
                Turno Concluído com Sucesso
              </span>
              <h2 className="text-2xl font-black text-stone-900 dark:text-stone-100 mt-0.5">
                Caixa do Dia Fechado!
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                O caixa foi arquivado no histórico. O extrato está pronto para enviar no WhatsApp.
              </p>
            </div>

            {/* Resumo Rápido */}
            <div className="bg-stone-50 dark:bg-stone-900 p-4 rounded-xl border border-stone-200 dark:border-stone-800 text-left text-xs space-y-1.5">
              <div className="flex justify-between font-bold">
                <span className="text-stone-500">Fundo Inicial:</span>
                <span className="text-stone-900 dark:text-stone-100">{formatCurrency(closedShiftReceipt.initialFloat)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-stone-500">Vendas em Dinheiro:</span>
                <span className="text-emerald-600">{formatCurrency(cashTotal)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-stone-500">Dinheiro Esperado na Gaveta:</span>
                <span className="text-stone-900 dark:text-stone-100 font-black">{formatCurrency(closedShiftReceipt.closingCashExpected || 0)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-stone-500">Dinheiro Físico Contado:</span>
                <span className="text-stone-900 dark:text-stone-100 font-black">{formatCurrency(closedShiftReceipt.closingCashCounted || 0)}</span>
              </div>
              <div className="flex justify-between font-black pt-1 border-t border-stone-200 dark:border-stone-800 text-sm">
                <span>Resultado do Batimento:</span>
                <span className={
                  (closedShiftReceipt.closingDifference || 0) === 0
                    ? 'text-emerald-600'
                    : (closedShiftReceipt.closingDifference || 0) > 0
                    ? 'text-sky-600'
                    : 'text-rose-600'
                }>
                  {(closedShiftReceipt.closingDifference || 0) === 0 
                    ? '✓ Caixa Bateu 100%' 
                    : (closedShiftReceipt.closingDifference || 0) > 0
                    ? `+${formatCurrency(closedShiftReceipt.closingDifference || 0)} (Sobra)`
                    : `${formatCurrency(closedShiftReceipt.closingDifference || 0)} (Falta)`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setClosedShiftReceipt(null)}
                className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-sm rounded-xl cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
              >
                Concluir
              </button>
              <button
                type="button"
                onClick={() => {
                  const txt = encodeURIComponent(generateReportText(closedShiftReceipt))
                  window.open(`https://api.whatsapp.com/send?text=${txt}`, '_blank')
                }}
                className="flex-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-xl cursor-pointer shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-4 h-4" />
                Enviar Extrato no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
