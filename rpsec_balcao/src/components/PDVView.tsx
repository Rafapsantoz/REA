import React, { useState } from 'react'
import type { Product, PaymentMethod, CartItem, Sale, Customer, Comanda } from '../types'
import { formatCurrency, getNextDailyOrderNumber } from '../storage'
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
  XCircle
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
  onRemoveComanda
}) => {
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
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
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-stone-950 font-black text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                Guardar este Carrinho na Fila
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
          {filteredProducts.map(product => {
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
          })}
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

          {/* Botão de Guardar Comanda ou Atualizar (Consumo no Local) */}
          {cart.length > 0 && (
            !activeComanda ? (
              <button
                type="button"
                onClick={() => setShowComandaModal(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 dark:bg-amber-950/40 hover:bg-amber-500/25 border-2 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-200 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <UtensilsCrossed className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                🍽️ Comer no Local / Guardar na Fila de Comanda
              </button>
            ) : (
              <button
                type="button"
                onClick={handleUpdateExistingComanda}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-500/15 dark:bg-amber-950/40 hover:bg-amber-500/25 border-2 border-amber-400 dark:border-amber-600 text-amber-950 dark:text-amber-200 font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
              >
                <Save className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                💾 Salvar Alterações na Comanda (Cliente continua comendo)
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
                  <h3 className="font-black text-lg text-stone-900 dark:text-stone-100">
                    Comer no Local / Guardar Comanda
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
                {['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Balcão 1', 'Balcão 2'].map(sug => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => handleSaveNewComanda(sug)}
                    className="py-2.5 px-2 bg-stone-100 dark:bg-stone-800/80 hover:bg-amber-400 hover:text-stone-950 rounded-xl font-black text-xs text-stone-800 dark:text-stone-200 transition-all border border-stone-200 dark:border-stone-700 cursor-pointer text-center active:scale-95"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>

            {/* Ou Digitar Nome Personalizado */}
            <div>
              <label className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider block mb-1">
                Ou digite uma identificação personalizada:
              </label>
              <input
                type="text"
                placeholder="Ex: Seu Antônio de Boné, Varanda..."
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
    </div>
  )
}
