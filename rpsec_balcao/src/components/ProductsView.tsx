import React, { useState } from 'react'
import type { Product, ProductCategory } from '../types'
import { formatCurrency } from '../storage'
import { PackagePlus, Edit2, Check, X, Tag } from 'lucide-react'

interface ProductsViewProps {
  products: Product[]
  onUpdateProducts: (products: Product[]) => void
}

export const ProductsView: React.FC<ProductsViewProps> = ({ products, onUpdateProducts }) => {
  const [name, setName] = useState('')
  const [priceStr, setPriceStr] = useState('')
  const [category, setCategory] = useState<ProductCategory>('salgados')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState<string>('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    const price = parseFloat(priceStr.replace(',', '.'))
    if (!name.trim() || isNaN(price) || price <= 0) return

    const newProd: Product = {
      id: Date.now().toString(),
      name: name.trim(),
      price,
      category,
      active: true,
    }

    onUpdateProducts([...products, newProd])
    setName('')
    setPriceStr('')
  }

  const toggleActive = (id: string) => {
    onUpdateProducts(
      products.map(p => (p.id === id ? { ...p, active: !p.active } : p))
    )
  }

  const startEditPrice = (prod: Product) => {
    setEditingId(prod.id)
    setEditPrice(prod.price.toFixed(2).replace('.', ','))
  }

  const saveEditPrice = (id: string) => {
    const newPrice = parseFloat(editPrice.replace(',', '.'))
    if (!isNaN(newPrice) && newPrice > 0) {
      onUpdateProducts(
        products.map(p => (p.id === id ? { ...p, price: newPrice } : p))
      )
    }
    setEditingId(null)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Formulário Novo Produto (4 colunas) */}
      <div className="lg:col-span-4 bg-white dark:bg-[#1a1613] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
          <PackagePlus className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          <h2 className="text-xl font-black text-stone-900 dark:text-stone-100">Novo Salgado / Item</h2>
        </div>

        <form onSubmit={handleAdd} className="flex flex-col gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-stone-600 dark:text-stone-300 uppercase">
                Nome do Salgado ou Bebida:
              </label>
              <span className={`text-[11px] font-bold ${name.length >= 28 ? 'text-amber-600 dark:text-amber-400' : 'text-stone-400 dark:text-stone-500'}`}>
                {name.length}/32
              </span>
            </div>
            <input
              type="text"
              maxLength={32}
              placeholder="Ex: Coxinha de Costela"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-4 py-3 text-base text-stone-900 dark:text-stone-100 font-semibold focus:outline-amber-600 focus:bg-white dark:focus:bg-stone-900"
              required
            />
            <span className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 block">
              Máximo de 32 letras para não cortar nos botões do balcão.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 uppercase mb-1">
              Preço de Venda (R$):
            </label>
            <input
              type="text"
              placeholder="Ex: 8,50"
              value={priceStr}
              onChange={e => setPriceStr(e.target.value)}
              className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-4 py-3 text-lg font-black text-emerald-600 dark:text-emerald-400 focus:outline-amber-600 focus:bg-white dark:focus:bg-stone-900"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 dark:text-stone-300 uppercase mb-1">
              Categoria:
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value as ProductCategory)}
              className="w-full bg-stone-50 dark:bg-stone-900 border border-stone-300 dark:border-stone-700 rounded-xl px-3 py-3 text-sm font-semibold text-stone-700 dark:text-stone-200 focus:outline-amber-600 focus:bg-white dark:focus:bg-stone-900 cursor-pointer"
            >
              <option value="salgados">🥟 Salgados & Fritos</option>
              <option value="bebidas">🥤 Bebidas & Cafés</option>
              <option value="doces">🍰 Doces & Sobremesas</option>
              <option value="outros">Outros Itens</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-3.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-black text-lg rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
          >
            <PackagePlus className="w-5 h-5" />
            CADASTRAR ITEM
          </button>
        </form>
      </div>

      {/* Tabela de Produtos Cadastrados (8 colunas) */}
      <div className="lg:col-span-8 bg-white dark:bg-[#1a1613] p-6 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-lg font-black text-stone-900 dark:text-stone-100">
                Itens Cadastrados ({products.length})
              </h3>
            </div>
            <span className="text-xs text-stone-400 dark:text-stone-500">
              Clique no lápis para alterar o preço
            </span>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-stone-800/80 my-2 overflow-y-auto max-h-[480px]">
            {products.map(prod => (
              <div key={prod.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleActive(prod.id)}
                    className={`w-9 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
                      prod.active ? 'bg-emerald-500 justify-end' : 'bg-stone-300 dark:bg-stone-700 justify-start'
                    }`}
                    title={prod.active ? 'Ativo na tela de vendas' : 'Oculto na tela de vendas'}
                  >
                    <div className="w-4 h-4 rounded-full bg-white shadow-xs" />
                  </button>
                  <div>
                    <p className={`font-bold break-words ${prod.active ? 'text-stone-800 dark:text-stone-200' : 'text-stone-400 dark:text-stone-600 line-through'}`}>
                      {prod.name}
                    </p>
                    <span className="text-xs uppercase font-semibold text-stone-400 dark:text-stone-500">
                      {prod.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {editingId === prod.id ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-stone-500 dark:text-stone-400">R$</span>
                      <input
                        type="text"
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value)}
                        className="w-20 bg-stone-100 dark:bg-stone-800 border border-amber-400 rounded px-2 py-1 text-sm font-bold text-stone-900 dark:text-stone-100"
                        autoFocus
                      />
                      <button
                        onClick={() => saveEditPrice(prod.id)}
                        className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1.5 bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-300 rounded hover:bg-stone-300 dark:hover:bg-stone-600 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-black text-lg text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(prod.price)}
                      </span>
                      <button
                        onClick={() => startEditPrice(prod)}
                        className="p-1.5 text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 rounded cursor-pointer"
                        title="Alterar preço"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
