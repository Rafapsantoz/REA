import React, { useState } from 'react'
import type { Product, PaymentMethod, CartItem, Sale, Customer, Comanda, CashShift, CashMovementType } from '../types'
import { formatCurrency, getNextDailyOrderNumber, peekNextDailyOrderNumber } from '../storage'
import { 
  Plus, 
  Minus, 
  Trash2, 
  CheckCircle2, 
  Banknote, 
  QrCode, 
  CreditCard, 
  UserCheck,
  ShoppingBag,
  Sparkles,
  UserPlus,
  Users,
  AlertTriangle,
  Phone,
  UtensilsCrossed,
  Clock,
  Save,
  XCircle,
  Lock,
  Unlock,
  ArrowDownRight,
  Share2
} from 'lucide-react'

interface PDVViewProps {
  products: Product[]
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  onCompleteSale: (sale: Sale) => void
  customers: Customer[]
  onAddCustomer: (customer: Customer) => void
  sales: Sale[]
  comandas: Comanda[]
  onSaveComanda: (comanda: Comanda) => void
  onRemoveComanda: (comandaId: string) => void
  currentShift?: CashShift | null
  onOpenShift?: (initialFloat: number, notes?: string) => void
  onAddMovement?: (type: CashMovementType, amount: number, description: string) => void
  onCloseShift?: (countedCash: number, expectedCash: number, notes?: string, extraData?: { cashSalesTotal?: number; totalSalesAmount?: number }) => void
  onGoToProducts?: () => void
}

export const PDVView: React.FC<PDVViewProps> = ({ 
  products, 
  cart, 
  setCart, 
  onCompleteSale,
  customers,
  onAddCustomer,
  sales,
  comandas,
  onSaveComanda,
  onRemoveComanda,
  currentShift,
  onOpenShift,
  onAddMovement,
  onCloseShift,
  onGoToProducts
}) => {
  // Estados dos Modais Rápidos de Caixa no PDV (3 botões solicitados)
  const [showOpenShiftModal, setShowOpenShiftModal] = useState<boolean>(false)
  const [openShiftFloatInput, setOpenShiftFloatInput] = useState<string>('50')
  const [openShiftNotesInput, setOpenShiftNotesInput] = useState<string>('')

  const [showSangriaModal, setShowSangriaModal] = useState<boolean>(false)
  const [sangriaAmountInput, setSangriaAmountInput] = useState<string>('')
  const [sangriaReasonInput, setSangriaReasonInput] = useState<string>('Entrega de Gás')

  const [showCloseShiftModal, setShowCloseShiftModal] = useState<boolean>(false)
  const [closeCountedInput, setCloseCountedInput] = useState<string>('')
  const [closeNotesInput, setCloseNotesInput] = useState<string>('')
  const [closedShiftReceipt, setClosedShiftReceipt] = useState<CashShift | null>(null)
  // Cálculos da Gaveta em Tempo Real no PDV
  const todayStr = new Date().toISOString().split('T')[0]
  const cashSalesTotal = sales
    .filter(s => {
      if (s.paymentMethod === 'dinheiro' && s.createdAt.startsWith(todayStr)) return true
      if (s.paymentMethod === 'fiado' && s.isCreditPaid && s.creditPaidMethod === 'dinheiro') {
        const paidDate = s.creditPaidAt ? s.creditPaidAt.split('T')[0] : s.createdAt.split('T')[0]
        return paidDate === todayStr
      }
      return false
    })
    .reduce((sum, s) => sum + s.totalAmount, 0)

  const initialFloat = currentShift ? currentShift.initialFloat : 0
  const sangriasTotal = currentShift 
    ? currentShift.movements.filter(m => m.type === 'sangria').reduce((s, m) => s + m.amount, 0) 
    : 0
  const suprimentosTotal = currentShift 
    ? currentShift.movements.filter(m => m.type === 'suprimento').reduce((s, m) => s + m.amount, 0) 
    : 0
  const expectedDrawerCash = initialFloat + cashSalesTotal + suprimentosTotal - sangriasTotal

  const closeCountedNum = parseFloat(closeCountedInput.replace(',', '.'))
  const isCloseCountedValid = !isNaN(closeCountedNum) && closeCountedNum >= 0
  const closeDiff = isCloseCountedValid ? closeCountedNum - expectedDrawerCash : 0

  const handleConfirmOpenShift = () => {
    const floatNum = parseFloat(openShiftFloatInput.replace(',', '.'))
    if (isNaN(floatNum) || floatNum < 0) return
    if (onOpenShift) {
      onOpenShift(floatNum, openShiftNotesInput || undefined)
    }
    setShowOpenShiftModal(false)
    setOpenShiftFloatInput('50')
    setOpenShiftNotesInput('')
    setShowSuccessToast({
      title: 'Caixa Aberto!',
      subtitle: `Fundo de troco inicial: ${formatCurrency(floatNum)}.`,
    })
  }

  const handleConfirmSangria = () => {
    const amount = parseFloat(sangriaAmountInput.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) return
    if (onAddMovement) {
      onAddMovement('sangria', amount, sangriaReasonInput || 'Retirada da Gaveta')
    }
    setShowSangriaModal(false)
    setSangriaAmountInput('')
    setShowSuccessToast({
      title: 'Sangria Realizada!',
      subtitle: `Retirada de ${formatCurrency(amount)} registrada no caixa.`,
    })
  }

  const handleConfirmCloseShift = () => {
    if (!isCloseCountedValid) return
    const todaySales = sales.filter(s => s.createdAt.startsWith(todayStr))
    const totalSalesAmount = todaySales.reduce((sum, s) => sum + s.totalAmount, 0)
    if (onCloseShift) {
      onCloseShift(closeCountedNum, expectedDrawerCash, closeNotesInput || undefined, {
        cashSalesTotal,
        totalSalesAmount,
      })
    }
    if (currentShift) {
      setClosedShiftReceipt({
        ...currentShift,
        status: 'closed',
        closedAt: new Date().toISOString(),
        closingCashCounted: closeCountedNum,
        closingCashExpected: expectedDrawerCash,
        closingDifference: closeDiff,
        cashSalesTotal,
        totalSalesAmount,
        notes: closeNotesInput || undefined,
      })
    }
    setShowCloseShiftModal(false)
    setCloseCountedInput('')
    setCloseNotesInput('')
  }

  const generateWhatsAppReceiptText = (receipt: CashShift) => {
    const todaySales = sales.filter(s => s.createdAt.startsWith(todayStr))
    const totalSalesAmount = todaySales.reduce((sum, s) => sum + s.totalAmount, 0)
    const formattedDate = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    const sangrias = receipt.movements.filter(m => m.type === 'sangria').reduce((s, m) => s + m.amount, 0)
    const suprimentos = receipt.movements.filter(m => m.type === 'suprimento').reduce((s, m) => s + m.amount, 0)

    let msg = `📊 *FECHAMENTO DIÁRIO — RPSEC BALCÃO*\n`
    msg += `🗓 *Data:* ${formattedDate}\n`
    msg += `⏰ *Abertura:* ${new Date(receipt.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    if (receipt.closedAt) {
      msg += ` | *Fechamento:* ${new Date(receipt.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    }
    msg += `\n\n💰 *Entradas Totais:* ${formatCurrency(totalSalesAmount)} (${todaySales.length} vendas)\n\n`
    msg += `💵 *--- CONFERÊNCIA DA GAVETA (DINHEIRO) ---*\n`
    msg += `(+) Fundo de Troco Inicial: ${formatCurrency(receipt.initialFloat)}\n`
    msg += `(+) Vendas em Dinheiro: ${formatCurrency(receipt.cashSalesTotal || 0)}\n`
    if (suprimentos > 0) msg += `(+) Troco Adicionado (Suprimento): +${formatCurrency(suprimentos)}\n`
    if (sangrias > 0) msg += `(-) Retiradas da Gaveta (Sangria): -${formatCurrency(sangrias)}\n`
    msg += `(=) *Dinheiro Esperado na Gaveta:* ${formatCurrency(receipt.closingCashExpected || 0)}\n`
    msg += `🔎 *Dinheiro Contado na Gaveta:* ${formatCurrency(receipt.closingCashCounted || 0)}\n`
    const diff = receipt.closingDifference || 0
    if (diff === 0) msg += `✅ *Batimento:* Caixa bateu 100%! (Diferença: R$ 0,00)\n`
    else if (diff > 0) msg += `🟢 *Batimento:* Sobra de Caixa: +${formatCurrency(diff)}\n`
    else msg += `⚠️ *Batimento:* Falta de Troco: ${formatCurrency(diff)}\n`
    msg += `\n_RPsec Balcão — Gestão Inteligente de Salgaderia_`
    return msg
  }

  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [cashGiven, setCashGiven] = useState<string>('')
  const [showSuccessToast, setShowSuccessToast] = useState<{ title: string; subtitle: string } | null>(null)

  // Estado da Comanda Ativa em Edição
  const [activeComanda, setActiveComanda] = useState<Comanda | null>(null)
  const [showComandaModal, setShowComandaModal] = useState<boolean>(false)
  const [comandaLabelInput, setComandaLabelInput] = useState<string>('')

  // Estados do Fiado
  const [fiadoMode, setFiadoMode] = useState<'select' | 'new'>('select')
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('')
  const [newCustomerName, setNewCustomerName] = useState<string>('')
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('')
  const [fiadoError, setFiadoError] = useState<string | null>(null)

  // Filtragem de produtos ativos
  const filteredProducts = products.filter(p => {
    if (!p.active) return false
    if (selectedCategory === 'todos') return true
    return p.category === selectedCategory
  })

  // Adicionar produto ao carrinho
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  // Alterar quantidade
  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean) as CartItem[]
    })
  }

  const clearCart = () => {
    setCart([])
    setActiveComanda(null)
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Cálculo de troco
  const cashNum = parseFloat(cashGiven.replace(',', '.')) || 0
  const change = paymentMethod === 'dinheiro' && cashNum > totalAmount ? cashNum - totalAmount : 0

  // Cliente selecionado e dívida em aberto
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId)
  const customerOpenDebt = selectedCustomer
    ? sales
        .filter(s => s.paymentMethod === 'fiado' && !s.isCreditPaid && (s.customerId === selectedCustomer.id || s.customerName === selectedCustomer.name))
        .reduce((sum, s) => sum + s.totalAmount, 0)
    : 0

  // Carregar comanda na tela para adicionar itens ou cobrar
  const handleSelectComanda = (comanda: Comanda) => {
    setActiveComanda(comanda)
    setCart(comanda.items)
  }

  // Desvincular comanda ativa (volta pro balcão rápido sem apagar a comanda)
  const handleDetachComanda = () => {
    setActiveComanda(null)
    setCart([])
  }

  // Salvar alterações na comanda existente (cliente pediu mais salgados/bebidas)
  const handleUpdateExistingComanda = () => {
    if (!activeComanda) return
    const updated: Comanda = {
      ...activeComanda,
      items: cart,
    }
    onSaveComanda(updated)
    setActiveComanda(null)
    setCart([])
    setShowSuccessToast({
      title: 'Comanda Atualizada!',
      subtitle: `${updated.label} agora possui ${updated.items.reduce((s, i) => s + i.quantity, 0)} itens. Balcão liberado.`,
    })
    setTimeout(() => setShowSuccessToast(null), 2500)
  }

  // Salvar novo carrinho como Comanda / Comer no local
  const handleSaveNewComanda = (label: string) => {
    if (cart.length === 0) return
    const nextNum = getNextDailyOrderNumber()
    const chosenLabel = label.trim() || `Comanda #${nextNum}`
    const newComanda: Comanda = {
      id: `cmd_${Date.now()}`,
      number: nextNum,
      label: chosenLabel,
      createdAt: new Date().toISOString(),
      items: cart,
    }
    onSaveComanda(newComanda)
    setActiveComanda(null)
    setCart([])
    setShowComandaModal(false)
    setComandaLabelInput('')
    setShowSuccessToast({
      title: `Comanda #${nextNum} Aberta!`,
      subtitle: `"${chosenLabel}" guardada na fila. Carrinho liberado para o próximo cliente.`,
    })
    setTimeout(() => setShowSuccessToast(null), 2500)
  }

  // Cancelar / Excluir comanda aberta
  const handleDeleteComanda = (comandaId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm('Deseja realmente cancelar e remover esta comanda aberta?')) {
      onRemoveComanda(comandaId)
      if (activeComanda?.id === comandaId) {
        setActiveComanda(null)
        setCart([])
      }
    }
  }

  // Finalizar venda
  const handleFinalize = () => {
    if (cart.length === 0) return
    setFiadoError(null)

    let finalCustomerId: string | undefined = undefined
    let finalCustomerName: string | undefined = undefined

    if (paymentMethod === 'fiado') {
      if (fiadoMode === 'new') {
        if (!newCustomerName.trim()) {
          setFiadoError('Por favor, digite o nome do cliente para anotar o fiado.')
          return
        }
        // Cadastra cliente na hora
        const newCust: Customer = {
          id: `c_${Date.now()}`,
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim() || undefined,
          createdAt: new Date().toISOString(),
        }
        onAddCustomer(newCust)
        finalCustomerId = newCust.id
        finalCustomerName = newCust.name
      } else {
        if (!selectedCustomerId) {
          setFiadoError('Selecione o cliente na lista ou clique em "Cadastrar Novo na Hora".')
          return
        }
        finalCustomerId = selectedCustomer?.id
        finalCustomerName = selectedCustomer?.name
      }
    }

    const orderNum = activeComanda ? activeComanda.number : getNextDailyOrderNumber()
    const orderLabel = activeComanda ? activeComanda.label : 'Balcão Rápido'

    const newSale: Sale = {
      id: Date.now().toString(),
      orderNumber: orderNum,
      comandaLabel: orderLabel,
      createdAt: new Date().toISOString(),
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        unitPrice: item.product.price,
        quantity: item.quantity,
        total: item.product.price * item.quantity,
      })),
      totalAmount,
      paymentMethod,
      customerId: finalCustomerId,
      customerName: finalCustomerName,
      isCreditPaid: paymentMethod === 'fiado' ? false : undefined,
    }

    onCompleteSale(newSale)

    // Se estava atendendo uma comanda existente, remove-a da fila
    if (activeComanda) {
      onRemoveComanda(activeComanda.id)
      setActiveComanda(null)
    }

    setCart([])
    setCashGiven('')
    setNewCustomerName('')
    setNewCustomerPhone('')
    setSelectedCustomerId('')
    setFiadoError(null)
    setShowSuccessToast({
      title: `Venda #${orderNum} Finalizada!`,
      subtitle: activeComanda 
        ? `Comanda "${orderLabel}" finalizada com sucesso e liberada.` 
        : `Atendimento computado no resumo do caixa.`,
    })
    setTimeout(() => setShowSuccessToast(null), 2500)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 h-full">
      {/* BARRA SUPERIOR DE OPERAÇÕES DO CAIXA: 3 BOTÕES CLAROS E DIRETOS */}
      <div className="col-span-1 lg:col-span-12 bg-white dark:bg-[#1a1613] p-3 sm:p-4 rounded-2xl border-2 border-amber-300 dark:border-amber-900/60 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Status do Caixa */}
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black shadow-xs shrink-0 ${
            currentShift 
              ? 'bg-emerald-500 text-white' 
              : 'bg-amber-500 text-stone-950'
          }`}>
            {currentShift ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`w-2.5 h-2.5 rounded-full ${currentShift ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <h2 className="font-black text-base sm:text-lg text-stone-900 dark:text-stone-100">
                {currentShift ? 'Caixa Aberto' : 'Caixa Fechado'}
              </h2>
              {currentShift && (
                <span className="bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 font-black text-xs px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  Fundo: {formatCurrency(currentShift.initialFloat)}
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {currentShift 
                ? `Aberto às ${new Date(currentShift.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Gaveta pronta para vendas e trocos`
                : 'Abra o caixa informando o troco inicial para começar o dia'}
            </p>
          </div>
        </div>

        {/* Os 3 Botões de Ação Simples */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Botão 1: Abrir o Caixa */}
          {!currentShift ? (
            <button
              type="button"
              onClick={() => setShowOpenShiftModal(true)}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Unlock className="w-4 h-4" />
              🟢 Abrir o Caixa
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setShowSuccessToast({
                  title: 'Caixa Aberto!',
                  subtitle: `Fundo atual de troco: ${formatCurrency(currentShift.initialFloat)}.`,
                })
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-black text-xs flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800 cursor-pointer hover:bg-emerald-100"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              Caixa Aberto
            </button>
          )}

          {/* Botão 2: Sangria (Retirar Dinheiro) */}
          <button
            type="button"
            onClick={() => {
              if (!currentShift) {
                setShowOpenShiftModal(true)
                return
              }
              setShowSangriaModal(true)
            }}
            className="px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 border-2 border-rose-400 dark:border-rose-600/80 text-rose-700 dark:text-rose-300 font-black text-sm shadow-xs flex items-center gap-2 transition-all cursor-pointer active:scale-95"
          >
            <ArrowDownRight className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            💸 Sangria (Retirar)
          </button>

          {/* Botão 3: Fechar o Caixa */}
          <button
            type="button"
            onClick={() => {
              if (!currentShift) {
                alert('O caixa já está fechado!')
                return
              }
              setShowCloseShiftModal(true)
            }}
            disabled={!currentShift}
            className={`px-4 py-2.5 rounded-xl font-black text-sm shadow-xs flex items-center gap-2 transition-all ${
              currentShift
                ? 'bg-amber-400 hover:bg-amber-500 text-stone-950 border-2 border-amber-500 cursor-pointer active:scale-95'
                : 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-600 border border-stone-300 dark:border-stone-700 cursor-not-allowed opacity-60'
            }`}
          >
            <Lock className="w-4 h-4" />
            🔴 Fechar o Caixa
          </button>
        </div>
      </div>

      {/* Toast de Sucesso */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl animate-bounce">
          <CheckCircle2 className="w-8 h-8 shrink-0" />
          <div>
            <h4 className="font-bold text-lg">{showSuccessToast.title}</h4>
            <p className="text-emerald-100 text-sm">{showSuccessToast.subtitle}</p>
          </div>
        </div>
      )}

      {/* Lado Esquerdo: Catálogo de Produtos e Fila de Comandas (7 ou 8 colunas) */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-3">


        {/* Fila Visual de Comandas Abertas / Comer no Local */}
        <div className="bg-white dark:bg-[#1a1613] p-3.5 rounded-2xl border-2 border-amber-300 dark:border-amber-800/80 shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-200/80 dark:border-amber-900/60">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500 text-stone-950 font-black">
                <UtensilsCrossed className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-black text-sm text-stone-900 dark:text-stone-100 flex items-center gap-2">
                  Comandas Abertas (Consumo no Local)
                  <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                    comandas.length > 0 
                      ? 'bg-amber-500 text-stone-950' 
                      : 'bg-stone-100 dark:bg-stone-800 text-stone-500'
                  }`}>
                    {comandas.length}
                  </span>
                </h3>
                <p className="text-[11px] text-stone-500 dark:text-stone-400">
                  Clientes que estão comendo e vão pagar ao sair
                </p>
              </div>
            </div>

            {cart.length > 0 && !activeComanda && (
              <button
                type="button"
                onClick={() => setShowComandaModal(true)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 border border-amber-300"
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                + Novo Consumo Local
              </button>
            )}
          </div>

          {/* Lista Horizontal de Comandas */}
          {comandas.length === 0 ? (
            <div className="py-2 text-center text-xs text-stone-400 dark:text-stone-500 italic">
              Nenhuma comanda aberta no momento. O balcão está livre para atendimento rápido!
            </div>
          ) : (
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5">
              {comandas.map(cmd => {
                const isSelected = activeComanda?.id === cmd.id
                const totalCmd = cmd.items.reduce((s, i) => s + i.product.price * i.quantity, 0)
                const itemsCount = cmd.items.reduce((s, i) => s + i.quantity, 0)
                const createdTime = new Date(cmd.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

                return (
                  <div
                    key={cmd.id}
                    onClick={() => handleSelectComanda(cmd)}
                    className={`shrink-0 flex items-center justify-between gap-3 px-3.5 py-2 rounded-xl cursor-pointer transition-all border-2 ${
                      isSelected
                        ? 'bg-amber-100 dark:bg-amber-950/70 border-amber-500 shadow-md ring-2 ring-amber-400/80 scale-102'
                        : 'bg-stone-50 dark:bg-stone-900/60 hover:bg-amber-50/50 dark:hover:bg-stone-800/80 border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-amber-800 dark:text-amber-400 bg-amber-200/80 dark:bg-amber-900/60 px-1.5 py-0.2 rounded">
                          #{cmd.number}
                        </span>
                        <span className="font-black text-sm text-stone-900 dark:text-stone-100">
                          {cmd.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          {formatCurrency(totalCmd)}
                        </span>
                        <span className="text-stone-400 text-[11px]">
                          • {itemsCount} {itemsCount === 1 ? 'item' : 'itens'}
                        </span>
                        <span className="text-stone-400 text-[10px] flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {createdTime}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteComanda(cmd.id, e)}
                      title="Cancelar/Apagar Comanda"
                      className="text-stone-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 rounded-lg hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Abas de Categorias Gastronômicas */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: 'todos', label: 'Todos os Itens' },
            { id: 'salgados', label: '🥟 Salgados & Fritos' },
            { id: 'bebidas', label: '🥤 Bebidas & Cafés' },
            { id: 'doces', label: '🍰 Doces & Sobremesas' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-3 rounded-xl font-bold text-base transition-all whitespace-nowrap shadow-xs cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-md scale-102 font-black'
                  : 'bg-white dark:bg-[#1a1613] text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/80 border border-stone-200 dark:border-stone-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grade de Produtos (Botões Grandes com Paleta Gastronômica) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-14 px-6 bg-white dark:bg-[#1a1613] rounded-2xl border-2 border-dashed border-amber-300 dark:border-amber-800/80 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shadow-xs">
                <UtensilsCrossed className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-black text-lg text-stone-900 dark:text-stone-100">
                  Cardápio Limpo para Cadastro
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-md mx-auto">
                  Nenhum produto cadastrado nesta categoria. Acesse a aba <strong>"Produtos & Cardápio"</strong> para cadastrar os salgados, sucos e doces reais da sua mãe!
                </p>
              </div>
              {onGoToProducts && (
                <button
                  type="button"
                  onClick={onGoToProducts}
                  className="mt-1 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-stone-950 font-black text-xs shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-95 border border-amber-300"
                >
                  <Plus className="w-4 h-4" />
                  Cadastrar Primeiros Produtos
                </button>
              )}
            </div>
          ) : (
            filteredProducts.map(product => {
            const isSalgado = product.category === 'salgados'
            const isBebida = product.category === 'bebidas'
            const isDoce = product.category === 'doces'

            return (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className={`flex flex-col justify-between p-3.5 bg-white dark:bg-[#1a1613] rounded-2xl border-2 transition-all text-left cursor-pointer active:scale-95 min-h-[125px] shadow-xs hover:shadow-md ${
                  isSalgado
                    ? 'border-amber-200/80 dark:border-amber-950/60 hover:border-amber-500 dark:hover:border-amber-500'
                    : isBebida
                    ? 'border-sky-200/80 dark:border-sky-950/60 hover:border-sky-500 dark:hover:border-sky-500'
                    : isDoce
                    ? 'border-rose-200/80 dark:border-rose-950/60 hover:border-rose-500 dark:hover:border-rose-500'
                    : 'border-stone-200 dark:border-stone-800 hover:border-amber-500'
                }`}
              >
                <div className="font-bold text-stone-900 dark:text-stone-100 text-sm sm:text-base leading-snug break-words">
                  {product.name}
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-stone-100 dark:border-stone-800/80">
                  <span className={`text-[11px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    isSalgado
                      ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                      : isBebida
                      ? 'bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-300'
                      : isDoce
                      ? 'bg-rose-100 text-rose-900 dark:bg-rose-950/60 dark:text-rose-300'
                      : 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-300'
                  }`}>
                    {product.category}
                  </span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(product.price)}
                  </span>
                </div>
              </button>
            )
          })
        )}
        </div>
      </div>

      {/* Lado Direito: Comanda e Fechamento (4 ou 5 colunas) */}
      <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-[#1a1613] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-md flex flex-col justify-between p-5">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h2 className="font-black text-xl text-stone-900 dark:text-stone-100">
                {activeComanda ? `Comanda #${activeComanda.number}` : 'Carrinho / Balcão'}
              </h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> {activeComanda ? 'Desocupar' : 'Limpar'}
              </button>
            )}
          </div>

          {/* Banner de Edição de Comanda Existente */}
          {activeComanda && (
            <div className="mt-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 p-2.5 rounded-xl shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-stone-950 shrink-0" />
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-950 block">Cliente Consumindo no Local</span>
                  <span className="text-xs font-black text-stone-950 leading-tight">
                    {activeComanda.label}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleUpdateExistingComanda}
                  className="px-2 py-1 bg-amber-950 hover:bg-black text-amber-300 font-black text-xs rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-xs active:scale-95"
                  title="Salvar itens adicionados na comanda"
                >
                  <Save className="w-3.5 h-3.5" />
                  Salvar
                </button>
                <button
                  type="button"
                  onClick={handleDetachComanda}
                  className="p-1 text-stone-950 hover:text-rose-900 rounded-lg cursor-pointer"
                  title="Voltar ao balcão rápido sem alterar esta comanda"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Lista de Itens do Carrinho */}
          <div className="overflow-y-auto max-h-[190px] divide-y divide-stone-100 dark:divide-stone-800/80 my-2">
            {cart.length === 0 ? (
              <div className="text-center py-8 text-stone-400 dark:text-stone-500">
                <Sparkles className="w-10 h-10 mx-auto text-amber-400/60 mb-2" />
                <p className="font-semibold text-stone-500 dark:text-stone-400">Nenhum item selecionado</p>
                <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">Toque nos salgados ao lado para adicionar</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="py-2 flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-bold text-stone-900 dark:text-stone-100 text-sm">{item.product.name}</p>
                    <p className="text-xs text-stone-400 dark:text-stone-500">
                      {item.quantity}x {formatCurrency(item.product.price)} = <span className="font-semibold text-stone-700 dark:text-stone-300">{formatCurrency(item.product.price * item.quantity)}</span>
                    </p>
                  </div>
                  {/* Controles de Quantidade */}
                  <div className="flex items-center gap-2 bg-stone-100 dark:bg-stone-800 rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-7 h-7 flex items-center justify-center bg-white dark:bg-stone-700 rounded shadow-xs text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-black text-sm w-5 text-center text-stone-900 dark:text-stone-100">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-7 h-7 flex items-center justify-center bg-white dark:bg-stone-700 rounded shadow-xs text-stone-700 dark:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-600 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Bloco de Pagamento e Total */}
        <div className="border-t border-stone-200 dark:border-stone-800 pt-3 flex flex-col gap-2.5">
          {/* Subtotal */}
          <div className="flex items-baseline justify-between">
            <span className="text-stone-500 dark:text-stone-400 font-semibold text-sm">
              Total ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'}):
            </span>
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          {/* Formas de Pagamento (Botões Grandes) */}
          <div>
            <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1">
              Forma de Pagamento:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setPaymentMethod('pix')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl font-bold text-xs cursor-pointer border-2 transition-all ${
                  paymentMethod === 'pix'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <QrCode className="w-4 h-4 mb-1 text-emerald-600 dark:text-emerald-400" />
                PIX
              </button>
              <button
                onClick={() => setPaymentMethod('dinheiro')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl font-bold text-xs cursor-pointer border-2 transition-all ${
                  paymentMethod === 'dinheiro'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <Banknote className="w-4 h-4 mb-1 text-emerald-600 dark:text-emerald-400" />
                Dinheiro
              </button>
              <button
                onClick={() => setPaymentMethod('cartao_debito')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl font-bold text-xs cursor-pointer border-2 transition-all ${
                  paymentMethod === 'cartao_debito'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <CreditCard className="w-4 h-4 mb-1 text-emerald-600 dark:text-emerald-400" />
                Débito
              </button>
              <button
                onClick={() => setPaymentMethod('cartao_credito')}
                className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl font-bold text-xs cursor-pointer border-2 transition-all ${
                  paymentMethod === 'cartao_credito'
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 shadow-xs'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <CreditCard className="w-4 h-4 mb-1 text-emerald-600 dark:text-emerald-400" />
                Crédito
              </button>
              <button
                onClick={() => setPaymentMethod('fiado')}
                className={`col-span-2 flex items-center justify-center gap-2 py-2 px-1 rounded-xl font-bold text-xs cursor-pointer border-2 transition-all ${
                  paymentMethod === 'fiado'
                    ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 shadow-xs'
                    : 'border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/60 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Anotar Fiado (Cliente)
              </button>
            </div>
          </div>

          {/* Seção Inteligente do FIADO (Selecionar ou Cadastrar na Hora) */}
          {paymentMethod === 'fiado' && (
            <div className="bg-amber-50/80 dark:bg-amber-950/30 p-3 rounded-2xl border-2 border-amber-300 dark:border-amber-800/80 flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-1 border-b border-amber-200/80 dark:border-amber-900/60">
                <span className="text-xs font-black text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Quem está levando fiado?
                </span>
                
                {/* Abas Alternar: Selecionar vs Novo */}
                <div className="flex items-center gap-1 bg-white dark:bg-stone-900 p-0.5 rounded-lg border border-amber-300 dark:border-amber-800 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => { setFiadoMode('select'); setFiadoError(null); }}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                      fiadoMode === 'select'
                        ? 'bg-amber-600 text-white'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                  >
                    <Users className="w-3 h-3" />
                    Lista ({customers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => { setFiadoMode('new'); setFiadoError(null); }}
                    className={`px-2 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                      fiadoMode === 'new'
                        ? 'bg-amber-600 text-white'
                        : 'text-stone-600 dark:text-stone-300 hover:text-stone-900'
                    }`}
                  >
                    <UserPlus className="w-3 h-3" />
                    + Novo
                  </button>
                </div>
              </div>

              {/* Modo 1: Selecionar Cliente Existente */}
              {fiadoMode === 'select' && (
                <div className="flex flex-col gap-1.5">
                  <select
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-2 text-sm font-bold text-stone-900 dark:text-stone-100 focus:outline-amber-600 cursor-pointer"
                  >
                    <option value="">-- Toque para escolher o cliente --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                  </select>

                  {/* Informações do Cliente Selecionado */}
                  {selectedCustomer && (
                    <div className="bg-white/80 dark:bg-stone-900/80 p-2 rounded-xl text-xs flex items-center justify-between">
                      <div className="text-stone-600 dark:text-stone-300">
                        {selectedCustomer.notes && (
                          <span className="block text-[11px] text-amber-800 dark:text-amber-300 italic">
                            Nota: {selectedCustomer.notes}
                          </span>
                        )}
                      </div>
                      {customerOpenDebt > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Dívida em aberto: {formatCurrency(customerOpenDebt)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                          ✓ Sem pendências
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Modo 2: Cadastrar Novo na Hora */}
              {fiadoMode === 'new' && (
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-amber-950 dark:text-amber-200 uppercase mb-0.5">
                      Nome do Cliente: *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Carlos Mecânico"
                      value={newCustomerName}
                      onChange={e => setNewCustomerName(e.target.value)}
                      className="w-full bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-1.5 text-sm font-bold text-stone-900 dark:text-stone-100 focus:outline-amber-600"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-amber-950 dark:text-amber-200 uppercase mb-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> Telefone / WhatsApp (Opcional):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 11 99999-9999"
                      value={newCustomerPhone}
                      onChange={e => setNewCustomerPhone(e.target.value)}
                      className="w-full bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700 rounded-xl px-3 py-1.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-amber-600"
                    />
                  </div>
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 italic">
                    ✓ Esse cliente será salvo na sua lista para as próximas compras.
                  </span>
                </div>
              )}

              {fiadoError && (
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900">
                  {fiadoError}
                </p>
              )}
            </div>
          )}

          {/* Campo de Dinheiro / Troco se for selecionado Dinheiro */}
          {paymentMethod === 'dinheiro' && totalAmount > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 block">Valor Recebido (R$):</span>
                <input
                  type="text"
                  placeholder="Ex: 50"
                  value={cashGiven}
                  onChange={e => setCashGiven(e.target.value)}
                  className="w-24 bg-white dark:bg-stone-900 border border-amber-300 dark:border-amber-700 rounded px-2 py-1 text-base font-bold text-stone-900 dark:text-stone-100"
                />
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 block">Troco a Devolver:</span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                  {formatCurrency(change)}
                </span>
              </div>
            </div>
          )}

          {/* Botão 1: Consumo Local (Mesa / Balcão) — SÓLIDO, TÁTIL E EVIDENTE */}
          {cart.length > 0 && (
            !activeComanda ? (
              <button
                type="button"
                onClick={() => setShowComandaModal(true)}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-500 active:scale-98 text-stone-950 font-black text-base shadow-md border-2 border-amber-300 dark:border-amber-400 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <UtensilsCrossed className="w-5 h-5 text-stone-950 shrink-0" />
                <span>🍽️ CONSUMO LOCAL (Abrir Comanda)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleUpdateExistingComanda}
                className="w-full py-3.5 px-4 rounded-2xl bg-amber-400 hover:bg-amber-500 active:scale-98 text-stone-950 font-black text-base shadow-md border-2 border-amber-300 dark:border-amber-400 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <Save className="w-5 h-5 text-stone-950 shrink-0" />
                <span>💾 ATUALIZAR CONSUMO LOCAL</span>
              </button>
            )
          )}

          {/* Botão Gigante de Finalizar Venda */}
          <button
            onClick={handleFinalize}
            disabled={cart.length === 0}
            className={`w-full py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
              cart.length === 0
                ? 'bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-600 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white active:scale-98 shadow-emerald-500/20'
            }`}
          >
            <CheckCircle2 className="w-6 h-6" />
            {activeComanda ? `RECEBER E FECHAR COMANDA (#${activeComanda.number})` : 'FINALIZAR VENDA'}
          </button>
        </div>
      </div>

      {/* Modal para Abrir / Identificar Comanda */}
      {showComandaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#1c1815] w-full max-w-md rounded-2xl border-2 border-amber-400 p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500 text-stone-950 font-black">
                  <UtensilsCrossed className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                    Comer no Local
                    <span className="bg-amber-400 text-stone-950 text-xs px-2.5 py-0.5 rounded-full font-black shadow-xs">
                      Atendimento #{peekNextDailyOrderNumber()}
                    </span>
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Identifique a comanda ou a mesa do cliente
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowComandaModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-black text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Sugestões Rápidas de 1 Toque */}
            <div>
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block mb-2">
                Toque Rápido para Escolher:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Balcão 1', 'Balcão 2'].map(sug => {
                  const isOccupied = comandas.some(c => c.label.toLowerCase() === sug.toLowerCase())
                  return (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => handleSaveNewComanda(sug)}
                      className={`py-2.5 px-2 rounded-xl font-black text-xs transition-all border cursor-pointer text-center active:scale-95 flex flex-col items-center justify-center gap-0.5 ${
                        isOccupied 
                          ? 'bg-amber-100 dark:bg-amber-950/60 border-amber-400 text-amber-900 dark:text-amber-200 shadow-xs' 
                          : 'bg-stone-100 dark:bg-stone-800/80 hover:bg-amber-400 hover:text-stone-950 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      <span>{sug}</span>
                      {isOccupied && <span className="text-[9px] text-amber-800 dark:text-amber-300 font-bold">(Ocupada)</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Ou Digitar Nome Personalizado */}
            <div>
              <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block mb-1">
                Ou digite uma identificação personalizada:
              </label>
              <input
                type="text"
                placeholder={`Ex: Comanda #${peekNextDailyOrderNumber()}, Seu Antônio, Varanda...`}
                value={comandaLabelInput}
                onChange={e => setComandaLabelInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSaveNewComanda(comandaLabelInput)
                  }
                }}
                className="w-full bg-white dark:bg-stone-900 border-2 border-stone-300 dark:border-stone-700 rounded-xl px-3.5 py-2.5 text-sm font-bold text-stone-900 dark:text-stone-100 focus:outline-amber-500"
                autoFocus
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowComandaModal(false)}
                className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-sm rounded-xl cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={() => handleSaveNewComanda(comandaLabelInput)}
                className="flex-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm rounded-xl cursor-pointer shadow-md transition-all active:scale-95"
              >
                Guardar Comanda
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Abertura de Caixa Rápida no PDV */}
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
                    Abertura de Caixa
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Defina o fundo de troco inicial da gaveta
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
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={openShiftFloatInput}
                  onChange={e => setOpenShiftFloatInput(e.target.value)}
                  className="w-full bg-white dark:bg-stone-900 border-2 border-stone-300 dark:border-stone-700 rounded-xl pl-10 pr-4 py-2.5 text-base font-black text-stone-900 dark:text-stone-100 focus:outline-emerald-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Observações Opcionais */}
            <div>
              <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block mb-1">
                Observações de Abertura (Opcional):
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
                ABRIR CAIXA AGORA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Sangria Rápida no PDV (Retirar Dinheiro) */}
      {showSangriaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#1c1815] w-full max-w-md rounded-2xl border-2 border-rose-400 p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-500 text-white font-black">
                  <ArrowDownRight className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-lg text-stone-900 dark:text-stone-100">
                    Sangria (Retirar Dinheiro)
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    O caixa continua aberto vendendo normalmente
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSangriaModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-black text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Motivos Rápidos */}
            <div>
              <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block mb-2">
                Motivo da Retirada:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {['Entrega de Gás', 'Pagamento Fornecedor', 'Sangria de Segurança', 'Outro Motivo'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSangriaReasonInput(r)}
                    className={`py-2 px-2.5 rounded-xl font-bold text-xs transition-all border cursor-pointer text-center ${
                      sangriaReasonInput === r
                        ? 'bg-rose-500 text-white border-rose-600 shadow-xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Input de Valor */}
            <div>
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider block mb-1">
                Valor Retirado da Gaveta (R$):
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-base">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={sangriaAmountInput}
                  onChange={e => setSangriaAmountInput(e.target.value)}
                  className="w-full bg-white dark:bg-stone-900 border-2 border-stone-300 dark:border-stone-700 rounded-xl pl-10 pr-4 py-2.5 text-base font-black text-stone-900 dark:text-stone-100 focus:outline-rose-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSangriaModal(false)}
                className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-sm rounded-xl cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
              >
                Voltar
              </button>
              <button
                type="button"
                onClick={handleConfirmSangria}
                disabled={!sangriaAmountInput || parseFloat(sangriaAmountInput) <= 0}
                className="flex-2 py-3 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm rounded-xl cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                CONFIRMAR SANGRIA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Fechamento de Caixa no PDV (Batimento Cego & WhatsApp) */}
      {showCloseShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#1c1815] w-full max-w-lg rounded-2xl border-2 border-amber-400 p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500 text-stone-950 font-black">
                  <Lock className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-black text-lg text-stone-900 dark:text-stone-100">
                    Fechamento de Caixa do Dia
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Conferência e batimento físico da gaveta
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCloseShiftModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 font-black text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Resumo da Gaveta Matemática */}
            <div className="bg-amber-50/60 dark:bg-stone-900 p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/40 space-y-1.5 text-xs">
              <div className="flex justify-between font-bold text-stone-600 dark:text-stone-300">
                <span>(+) Fundo Inicial:</span>
                <span>{formatCurrency(initialFloat)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-600">
                <span>(+) Vendas em Dinheiro:</span>
                <span>+{formatCurrency(cashSalesTotal)}</span>
              </div>
              {suprimentosTotal > 0 && (
                <div className="flex justify-between font-bold text-teal-600">
                  <span>(+) Entradas de Troco:</span>
                  <span>+{formatCurrency(suprimentosTotal)}</span>
                </div>
              )}
              {sangriasTotal > 0 && (
                <div className="flex justify-between font-bold text-rose-600">
                  <span>(-) Sangrias (Retiradas):</span>
                  <span>-{formatCurrency(sangriasTotal)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm pt-1.5 border-t border-amber-200 dark:border-stone-800 text-stone-900 dark:text-stone-100">
                <span>(=) Dinheiro Esperado na Gaveta:</span>
                <span className="text-amber-800 dark:text-amber-300">{formatCurrency(expectedDrawerCash)}</span>
              </div>
            </div>

            {/* Campo da Contagem Física */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Quanto dinheiro físico tem na gaveta? *
                </label>
                <button
                  type="button"
                  onClick={() => setCloseCountedInput(expectedDrawerCash.toFixed(2))}
                  className="text-xs font-black text-amber-800 dark:text-amber-300 hover:underline cursor-pointer flex items-center gap-1"
                >
                  ⚡ Copiar Esperado
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-base">R$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={closeCountedInput}
                  onChange={e => setCloseCountedInput(e.target.value)}
                  className="w-full bg-white dark:bg-stone-900 border-2 border-stone-300 dark:border-stone-700 rounded-xl pl-10 pr-4 py-2.5 text-lg font-black text-stone-900 dark:text-stone-100 focus:outline-amber-500"
                  autoFocus
                />
              </div>
            </div>

            {/* Diagnóstico Imediato de Cores */}
            {isCloseCountedValid && (
              <div className={`p-3 rounded-xl border text-xs font-black flex items-center justify-between ${
                closeDiff === 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : closeDiff > 0
                  ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
              }`}>
                <span>Resultado do Batimento:</span>
                <span>
                  {closeDiff === 0 
                    ? '✓ Caixa Bateu 100% (R$ 0,00)' 
                    : closeDiff > 0 
                    ? `+${formatCurrency(closeDiff)} (Sobra de Caixa)` 
                    : `${formatCurrency(closeDiff)} (Quebra / Falta de Troco)`}
                </span>
              </div>
            )}

            {/* Observações de Fechamento */}
            <div>
              <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block mb-1">
                Observações Finais (Opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: Tudo conferido com a mãe"
                value={closeNotesInput}
                onChange={e => setCloseNotesInput(e.target.value)}
                className="w-full bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3.5 py-2 text-xs font-bold text-stone-900 dark:text-stone-100 focus:outline-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCloseShiftModal(false)}
                className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-sm rounded-xl cursor-pointer hover:bg-stone-200 dark:hover:bg-stone-700 transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseShift}
                disabled={!isCloseCountedValid}
                className="flex-2 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-sm rounded-xl cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                CONFIRMAR E FECHAR CAIXA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Comprovante de Fechamento & Envio no WhatsApp */}
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
                <span className="text-emerald-600">{formatCurrency(closedShiftReceipt.cashSalesTotal || 0)}</span>
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
                  const txt = encodeURIComponent(generateWhatsAppReceiptText(closedShiftReceipt))
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
