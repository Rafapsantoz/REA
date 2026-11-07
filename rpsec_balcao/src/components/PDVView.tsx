import React, { useState } from 'react'
import type { Product, PaymentMethod, CartItem, Sale } from '../types'
import { formatCurrency } from '../storage'
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
  Sparkles
} from 'lucide-react'

interface PDVViewProps {
  products: Product[]
  cart: CartItem[]
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>
  onCompleteSale: (sale: Sale) => void
}

export const PDVView: React.FC<PDVViewProps> = ({ products, cart, setCart, onCompleteSale }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix')
  const [cashGiven, setCashGiven] = useState<string>('')
  const [showSuccessToast, setShowSuccessToast] = useState<boolean>(false)

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

  const clearCart = () => setCart([])

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Cálculo de troco
  const cashNum = parseFloat(cashGiven.replace(',', '.')) || 0
  const change = paymentMethod === 'dinheiro' && cashNum > totalAmount ? cashNum - totalAmount : 0

  // Finalizar venda
  const handleFinalize = () => {
    if (cart.length === 0) return

    const newSale: Sale = {
      id: Date.now().toString(),
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
    }

    onCompleteSale(newSale)
    setCart([])
    setCashGiven('')
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 2500)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Toast de Sucesso */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl animate-bounce">
          <CheckCircle2 className="w-8 h-8" />
          <div>
            <h4 className="font-bold text-lg">Venda Registrada com Sucesso!</h4>
            <p className="text-emerald-100 text-sm">O valor já foi computado no resumo do caixa.</p>
          </div>
        </div>
      )}

      {/* Lado Esquerdo: Catálogo de Produtos (7 ou 8 colunas) */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
        {/* Abas de Categorias */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'todos', label: 'Todos os Itens' },
            { id: 'salgados', label: '🥟 Salgados' },
            { id: 'bebidas', label: '🥤 Bebidas' },
            { id: 'doces', label: '🍰 Doces' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-5 py-3 rounded-xl font-bold text-base transition-all whitespace-nowrap shadow-xs cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-600 text-white shadow-md scale-102'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Grade de Produtos (Botões Grandes) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
          {filteredProducts.map(product => (
            <button
              key={product.id}
              onClick={() => addToCart(product)}
              className="flex flex-col justify-between p-4 bg-white rounded-2xl border-2 border-slate-200 hover:border-amber-500 hover:shadow-lg transition-all text-left cursor-pointer active:scale-95 min-h-[110px]"
            >
              <div className="font-bold text-slate-800 text-base leading-snug line-clamp-2">
                {product.name}
              </div>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                <span className="text-xs uppercase font-semibold text-slate-400">
                  {product.category}
                </span>
                <span className="text-lg font-black text-emerald-600">
                  {formatCurrency(product.price)}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Lado Direito: Comanda e Fechamento (4 ou 5 colunas) */}
      <div className="lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-md flex flex-col justify-between p-5">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
              <h2 className="font-black text-xl text-slate-800">Comanda Atual</h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> Limpar
              </button>
            )}
          </div>

          {/* Lista de Itens do Carrinho */}
          <div className="overflow-y-auto max-h-[220px] divide-y divide-slate-100 my-2">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <Sparkles className="w-10 h-10 mx-auto text-amber-400/60 mb-2" />
                <p className="font-semibold text-slate-500">Nenhum item selecionado</p>
                <p className="text-xs text-slate-400 mt-1">Toque nos salgados ao lado para adicionar</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.product.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="flex-1">
                    <p className="font-bold text-slate-800 text-sm">{item.product.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.quantity}x {formatCurrency(item.product.price)} = <span className="font-semibold text-slate-700">{formatCurrency(item.product.price * item.quantity)}</span>
                    </p>
                  </div>
                  {/* Controles de Quantidade */}
                  <div className="flex items-center gap-2 bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-xs text-slate-700 hover:bg-slate-200 cursor-pointer"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-black text-sm w-5 text-center text-slate-800">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-7 h-7 flex items-center justify-center bg-white rounded shadow-xs text-slate-700 hover:bg-slate-200 cursor-pointer"
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
        <div className="border-t border-slate-200 pt-4 flex flex-col gap-3">
          {/* Subtotal */}
          <div className="flex items-baseline justify-between">
            <span className="text-slate-500 font-semibold text-sm">
              Total ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'}):
            </span>
            <span className="text-3xl font-black text-emerald-600">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          {/* Formas de Pagamento (Botões Grandes) */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Forma de Pagamento:
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => setPaymentMethod('pix')}
                className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl font-bold text-xs cursor-pointer border-2 transition-all ${
                  paymentMethod === 'pix'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <QrCode className="w-5 h-5 mb-1 text-emerald-600" />
                PIX
              </button>
              <button
                onClick={() => setPaymentMethod('dinheiro')}
                className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl font-bold text-xs cursor-pointer border-2 transition-all ${
                  paymentMethod === 'dinheiro'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-5 h-5 mb-1 text-emerald-600" />
                Dinheiro
              </button>
              <button
                onClick={() => setPaymentMethod('cartao_debito')}
                className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl font-bold text-xs cursor-pointer border-2 transition-all ${
                  paymentMethod === 'cartao_debito'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1 text-emerald-600" />
                Débito
              </button>
              <button
                onClick={() => setPaymentMethod('cartao_credito')}
                className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl font-bold text-xs cursor-pointer border-2 transition-all ${
                  paymentMethod === 'cartao_credito'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1 text-emerald-600" />
                Crédito
              </button>
              <button
                onClick={() => setPaymentMethod('fiado')}
                className={`col-span-2 flex items-center justify-center gap-2 py-2.5 px-1 rounded-xl font-bold text-xs cursor-pointer border-2 transition-all ${
                  paymentMethod === 'fiado'
                    ? 'border-amber-600 bg-amber-50 text-amber-900 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <UserCheck className="w-5 h-5 text-amber-600" />
                Anotar Fiado (Cliente)
              </button>
            </div>
          </div>

          {/* Campo de Dinheiro / Troco se for selecionado Dinheiro */}
          {paymentMethod === 'dinheiro' && totalAmount > 0 && (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-amber-900 block">Valor Recebido (R$):</span>
                <input
                  type="text"
                  placeholder="Ex: 50"
                  value={cashGiven}
                  onChange={e => setCashGiven(e.target.value)}
                  className="w-24 bg-white border border-amber-300 rounded px-2 py-1 text-base font-bold text-slate-800"
                />
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-amber-900 block">Troco a Devolver:</span>
                <span className="text-xl font-black text-emerald-700">
                  {formatCurrency(change)}
                </span>
              </div>
            </div>
          )}

          {/* Botão Gigante de Finalizar Venda */}
          <button
            onClick={handleFinalize}
            disabled={cart.length === 0}
            className={`w-full py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer ${
              cart.length === 0
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-98 shadow-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-6 h-6" />
            FINALIZAR VENDA
          </button>
        </div>
      </div>
    </div>
  )
}
