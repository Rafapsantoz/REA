import React, { useState } from 'react'
import type { Product, Ingredient, Recipe, ImportedInvoice, UnitType } from '../types'
import {
  formatCurrency,
  calculateBatchCost,
  calculateUnitCost,
  saveIngredients,
  saveRecipes,
  saveInvoice,
} from '../storage'
import { parseNFeXML } from '../utils/nfeParser'
import {
  ChefHat,
  ReceiptText,
  FileCode,
  Plus,
  Edit2,
  Trash2,
  Upload,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Package
} from 'lucide-react'

interface ProductionCostViewProps {
  products: Product[]
  ingredients: Ingredient[]
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>
  recipes: Recipe[]
  setRecipes: React.Dispatch<React.SetStateAction<Recipe[]>>
  invoices: ImportedInvoice[]
  setInvoices: React.Dispatch<React.SetStateAction<ImportedInvoice[]>>
}

export const ProductionCostView: React.FC<ProductionCostViewProps> = ({
  products,
  ingredients,
  setIngredients,
  recipes,
  setRecipes,
  invoices,
  setInvoices,
}) => {
  const [subTab, setSubTab] = useState<'recipes' | 'ingredients' | 'invoices'>('recipes')

  // Estado para Modal de Edição/Criação de Receita
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)
  const [isNewRecipe, setIsNewRecipe] = useState(false)

  // Estado para Novo Ingrediente
  const [newIngName, setNewIngName] = useState('')
  const [newIngUnit, setNewIngUnit] = useState<UnitType>('kg')
  const [newIngCost, setNewIngCost] = useState('')

  // Edição rápida de preço de ingrediente
  const [editingIngId, setEditingIngId] = useState<string | null>(null)
  const [editIngCostStr, setEditIngCostStr] = useState('')

  // Importador XML
  const [xmlError, setXmlError] = useState<string | null>(null)
  const [xmlSuccess, setXmlSuccess] = useState<string | null>(null)
  const [parsedPreview, setParsedPreview] = useState<ImportedInvoice | null>(null)

  // ==================== AÇÕES DE RECEITAS ====================
  const handleOpenEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(JSON.parse(JSON.stringify(recipe)))
    setIsNewRecipe(false)
  }

  const handleOpenNewRecipe = (product: Product) => {
    const newRec: Recipe = {
      id: `rec_${Date.now()}`,
      productId: product.id,
      yieldQuantity: 50,
      additionalCostPerBatch: 5.00,
      ingredients: [],
    }
    setEditingRecipe(newRec)
    setIsNewRecipe(true)
  }

  const handleSaveRecipe = () => {
    if (!editingRecipe) return
    let updated: Recipe[]
    if (isNewRecipe) {
      updated = [...recipes, editingRecipe]
    } else {
      updated = recipes.map(r => (r.id === editingRecipe.id ? editingRecipe : r))
    }
    setRecipes(updated)
    saveRecipes(updated)
    setEditingRecipe(null)
  }

  const handleAddIngredientToRecipe = (ingredientId: string) => {
    if (!editingRecipe) return
    const ing = ingredients.find(i => i.id === ingredientId)
    if (!ing) return

    const exists = editingRecipe.ingredients.some(i => i.ingredientId === ingredientId)
    if (exists) return

    setEditingRecipe({
      ...editingRecipe,
      ingredients: [
        ...editingRecipe.ingredients,
        {
          ingredientId,
          quantity: ing.unit === 'kg' ? 1 : ing.unit === 'g' ? 100 : 1,
          unit: ing.unit,
        },
      ],
    })
  }

  const handleRemoveIngredientFromRecipe = (ingredientId: string) => {
    if (!editingRecipe) return
    setEditingRecipe({
      ...editingRecipe,
      ingredients: editingRecipe.ingredients.filter(i => i.ingredientId !== ingredientId),
    })
  }

  // ==================== AÇÕES DE INGREDIENTES ====================
  const handleAddIngredient = (e: React.FormEvent) => {
    e.preventDefault()
    const cost = parseFloat(newIngCost.replace(',', '.'))
    if (!newIngName.trim() || isNaN(cost) || cost <= 0) return

    const newIng: Ingredient = {
      id: `ing_${Date.now()}`,
      name: newIngName.trim(),
      unit: newIngUnit,
      unitCost: cost,
    }

    const updated = [...ingredients, newIng]
    setIngredients(updated)
    saveIngredients(updated)
    setNewIngName('')
    setNewIngCost('')
  }

  const handleSaveIngCost = (id: string) => {
    const cost = parseFloat(editIngCostStr.replace(',', '.'))
    if (!isNaN(cost) && cost > 0) {
      const updated = ingredients.map(ing => (ing.id === id ? { ...ing, unitCost: cost } : ing))
      setIngredients(updated)
      saveIngredients(updated)
    }
    setEditingIngId(null)
  }

  // ==================== PROCESSAMENTO DE XML NFe ====================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setXmlError(null)
    setXmlSuccess(null)

    const reader = new FileReader()
    reader.onload = event => {
      try {
        const text = event.target?.result as string
        const parsed = parseNFeXML(text)
        setParsedPreview(parsed)
      } catch (err: any) {
        setXmlError(err.message || 'Erro ao processar o arquivo XML.')
      }
    }
    reader.readAsText(file)
  }

  const handleConfirmInvoice = () => {
    if (!parsedPreview) return
    const updated = saveInvoice(parsedPreview)
    setInvoices(updated)
    setXmlSuccess(`Nota de ${parsedPreview.supplier} importada com sucesso! (${parsedPreview.items.length} itens)`)
    setParsedPreview(null)
  }

  // Atualizar custo de um ingrediente com base em item da nota
  const handleSyncInvoiceItem = (invoiceItemName: string, unitPrice: number) => {
    // Procura por aproximação no nome
    const match = ingredients.find(ing =>
      invoiceItemName.toLowerCase().includes(ing.name.toLowerCase().slice(0, 5))
    )
    if (match) {
      const updated = ingredients.map(ing =>
        ing.id === match.id ? { ...ing, unitCost: unitPrice } : ing
      )
      setIngredients(updated)
      saveIngredients(updated)
      alert(`Preço do ingrediente "${match.name}" atualizado para ${formatCurrency(unitPrice)}!`)
    } else {
      // Cria novo ingrediente a partir do item da nota
      const newIng: Ingredient = {
        id: `ing_${Date.now()}`,
        name: invoiceItemName,
        unit: 'kg',
        unitCost: unitPrice,
      }
      const updated = [...ingredients, newIng]
      setIngredients(updated)
      saveIngredients(updated)
      alert(`Novo ingrediente "${invoiceItemName}" cadastrado com valor de ${formatCurrency(unitPrice)}!`)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Sub-navegação da Fase 2 */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setSubTab('recipes')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm cursor-pointer transition-all ${
            subTab === 'recipes'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ChefHat className="w-5 h-5" />
          Fichas Técnicas & Lucro Real
        </button>

        <button
          onClick={() => setSubTab('ingredients')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm cursor-pointer transition-all ${
            subTab === 'ingredients'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Package className="w-5 h-5" />
          Preço dos Ingredientes ({ingredients.length})
        </button>

        <button
          onClick={() => setSubTab('invoices')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm cursor-pointer transition-all ${
            subTab === 'invoices'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <ReceiptText className="w-5 h-5" />
          Importar Nota de Compra (XML)
        </button>
      </div>

      {/* ============================================================
          SUB-ABA 1: FICHAS TÉCNICAS E LUCRO REAL
         ============================================================ */}
      {subTab === 'recipes' && (
        <div className="flex flex-col gap-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
            <HelpCircle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900 leading-relaxed">
              <strong className="block text-amber-950 font-bold mb-0.5">
                Como Funciona o Cálculo do Custo Real:
              </strong>
              Aqui sua mãe vê exatamente quanto gasta para fazer cada fornada (farinha, frango, óleo, gás) e quanto cada salgado custa individualmente na vitrine. Assim, ela nunca vende nada no prejuízo!
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products
              .filter(p => p.category === 'salgados')
              .map(prod => {
                const recipe = recipes.find(r => r.productId === prod.id)
                const unitCost = recipe ? calculateUnitCost(recipe, ingredients) : 0
                const batchCost = recipe ? calculateBatchCost(recipe, ingredients) : 0
                const profit = prod.price - unitCost
                const marginPercent = prod.price > 0 ? (profit / prod.price) * 100 : 0

                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl border-2 border-slate-200 p-5 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                        <div>
                          <h3 className="font-black text-lg text-slate-800 leading-tight">
                            {prod.name}
                          </h3>
                          <span className="text-xs text-slate-400 font-semibold">
                            Preço de Venda: <strong className="text-slate-700">{formatCurrency(prod.price)}</strong>
                          </span>
                        </div>
                        {recipe && (
                          <span className="text-xs font-bold px-2 py-1 rounded bg-amber-100 text-amber-900">
                            Fornada: {recipe.yieldQuantity} un.
                          </span>
                        )}
                      </div>

                      {/* Métricas de Custo e Lucro */}
                      {recipe ? (
                        <div className="my-4 space-y-3">
                          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                            <div>
                              <span className="text-[11px] font-bold text-slate-400 block uppercase">
                                Custo p/ Fazer 1
                              </span>
                              <span className="text-xl font-black text-rose-600">
                                {formatCurrency(unitCost)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[11px] font-bold text-slate-400 block uppercase">
                                Lucro em 1 Salgado
                              </span>
                              <span className="text-xl font-black text-emerald-600">
                                + {formatCurrency(profit)}
                              </span>
                            </div>
                          </div>

                          {/* Margem Percentual */}
                          <div className="flex items-center justify-between text-xs px-1">
                            <span className="font-semibold text-slate-500">Margem Bruta Real:</span>
                            <span className={`font-black px-2 py-0.5 rounded ${
                              marginPercent >= 60
                                ? 'bg-emerald-100 text-emerald-800'
                                : marginPercent >= 40
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {marginPercent.toFixed(1)}% de margem
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400">
                            Custo total da fornada: <strong className="text-slate-600">{formatCurrency(batchCost)}</strong>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-slate-400">
                          <ChefHat className="w-8 h-8 mx-auto text-slate-300 mb-1" />
                          <p className="text-xs font-semibold">Sem receita cadastrada</p>
                          <p className="text-[11px] mt-0.5">Cadastre os ingredientes para ver o custo.</p>
                        </div>
                      )}
                    </div>

                    {/* Botão de Ação */}
                    <div className="pt-3 border-t border-slate-100">
                      {recipe ? (
                        <button
                          onClick={() => handleOpenEditRecipe(recipe)}
                          className="w-full py-2.5 bg-slate-100 hover:bg-amber-500 hover:text-white text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Ver / Editar Ficha Técnica
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenNewRecipe(prod)}
                          className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Criar Ficha Técnica
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {/* ============================================================
          SUB-ABA 2: PREÇO DOS INGREDIENTES (INSUMOS)
         ============================================================ */}
      {subTab === 'ingredients' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Formulário Novo Ingrediente */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Package className="w-5 h-5 text-amber-600" />
              Novo Ingrediente
            </h3>

            <form onSubmit={handleAddIngredient} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Nome do Ingrediente:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Peito de Frango"
                  value={newIngName}
                  onChange={e => setNewIngName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-amber-600"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Preço Pago (R$):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 18,50"
                    value={newIngCost}
                    onChange={e => setNewIngCost(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-black text-rose-600 focus:outline-amber-600"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Unidade:
                  </label>
                  <select
                    value={newIngUnit}
                    onChange={e => setNewIngUnit(e.target.value as UnitType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 focus:outline-amber-600"
                  >
                    <option value="kg">Quilo (kg)</option>
                    <option value="g">Grama (g)</option>
                    <option value="l">Litro (l)</option>
                    <option value="ml">Mililitro (ml)</option>
                    <option value="un">Unidade (un)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" /> Cadastrar Ingrediente
              </button>
            </form>
          </div>

          {/* Lista de Ingredientes Cadastrados */}
          <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-lg font-black text-slate-800">
                  Ingredientes & Matérias-Primas ({ingredients.length})
                </h3>
                <span className="text-xs text-slate-400">
                  Clique no valor para atualizar o preço pago
                </span>
              </div>

              <div className="divide-y divide-slate-100 my-2 overflow-y-auto max-h-[460px]">
                {ingredients.map(ing => (
                  <div key={ing.id} className="py-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{ing.name}</p>
                      <span className="text-xs text-slate-400">
                        Cobrado por: <strong>1 {ing.unit}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {editingIngId === ing.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-500">R$</span>
                          <input
                            type="text"
                            value={editIngCostStr}
                            onChange={e => setEditIngCostStr(e.target.value)}
                            className="w-20 bg-slate-100 border border-amber-400 rounded px-2 py-1 text-sm font-bold text-slate-800"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveIngCost(ing.id)}
                            className="p-1.5 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer text-xs font-bold"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingIngId(null)}
                            className="p-1.5 bg-slate-200 text-slate-600 rounded hover:bg-slate-300 cursor-pointer text-xs"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-black text-base text-slate-900">
                            {formatCurrency(ing.unitCost)} / {ing.unit}
                          </span>
                          <button
                            onClick={() => {
                              setEditingIngId(ing.id)
                              setEditIngCostStr(ing.unitCost.toFixed(2).replace('.', ','))
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 rounded cursor-pointer"
                            title="Alterar preço"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
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
      )}

      {/* ============================================================
          SUB-ABA 3: IMPORTADOR DE NOTA FISCAL (XML NFe)
         ============================================================ */}
      {subTab === 'invoices' && (
        <div className="flex flex-col gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-2">
              <FileCode className="w-5 h-5 text-amber-600" />
              Leitor Automático de Nota Fiscal (XML da NFe / NFCe)
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              Quando você ou sua mãe comprarem produtos no atacado (Assaí, Atacadão, etc.), basta salvar o arquivo .xml da nota e arrastar aqui. O sistema extrai todos os preços unitários automaticamente sem precisar digitar nada!
            </p>

            {/* Input de Upload */}
            <div className="border-2 border-dashed border-amber-300 bg-amber-50/50 hover:bg-amber-50 rounded-2xl p-8 text-center transition-all cursor-pointer relative">
              <input
                type="file"
                accept=".xml"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-10 h-10 text-amber-600 mx-auto mb-2" />
              <p className="font-bold text-slate-800 text-base">
                Clique aqui ou arraste o arquivo .XML da Nota Fiscal
              </p>
              <p className="text-xs text-slate-400 mt-1">Formato suportado: NF-e ou NFC-e padrão SEFAZ</p>
            </div>

            {xmlError && (
              <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-rose-800 text-sm font-semibold">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                {xmlError}
              </div>
            )}

            {xmlSuccess && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-sm font-semibold">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                {xmlSuccess}
              </div>
            )}
          </div>

          {/* Pré-visualização da Nota Carregada */}
          {parsedPreview && (
            <div className="bg-white p-6 rounded-2xl border-2 border-amber-400 shadow-lg flex flex-col gap-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-xs uppercase font-bold text-amber-600 tracking-wider">
                    Nota Encontrada
                  </span>
                  <h4 className="text-xl font-black text-slate-800">
                    {parsedPreview.supplier}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Data: {new Date(parsedPreview.date).toLocaleDateString()} | Total da Nota: <strong className="text-slate-700">{formatCurrency(parsedPreview.totalAmount)}</strong>
                  </p>
                </div>
                <button
                  onClick={handleConfirmInvoice}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl cursor-pointer shadow-md transition-all"
                >
                  Confirmar e Salvar Nota
                </button>
              </div>

              <div>
                <h5 className="font-bold text-sm text-slate-700 mb-2">
                  Itens Identificados na Nota ({parsedPreview.items.length}):
                </h5>
                <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
                  {parsedPreview.items.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                      <div className="flex-1">
                        <p className="font-bold text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-400">
                          {item.quantity} {item.unit} x {formatCurrency(item.unitPrice)} = <strong className="text-slate-600">{formatCurrency(item.total)}</strong>
                        </p>
                      </div>
                      <button
                        onClick={() => handleSyncInvoiceItem(item.name, item.unitPrice)}
                        className="text-xs bg-amber-100 hover:bg-amber-600 hover:text-white text-amber-900 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                      >
                        Vincular / Atualizar Custo
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Histórico de Notas Importadas */}
          {invoices.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h4 className="font-black text-lg text-slate-800 mb-3">Notas Já Salvas no Histórico</h4>
              <div className="divide-y divide-slate-100 max-h-[250px] overflow-y-auto">
                {invoices.map(inv => (
                  <div key={inv.id} className="py-3 flex items-center justify-between text-sm">
                    <div>
                      <p className="font-bold text-slate-800">{inv.supplier}</p>
                      <span className="text-xs text-slate-400">
                        {new Date(inv.date).toLocaleDateString()} • {inv.items.length} itens
                      </span>
                    </div>
                    <span className="font-black text-slate-800">{formatCurrency(inv.totalAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          MODAL DE EDIÇÃO DE RECEITA / FICHA TÉCNICA
         ============================================================ */}
      {editingRecipe && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ChefHat className="w-6 h-6 text-amber-600" />
                <h3 className="font-black text-xl text-slate-800">
                  {isNewRecipe ? 'Criar Ficha Técnica' : 'Editar Ficha Técnica da Fornada'}
                </h3>
              </div>
              <button
                onClick={() => setEditingRecipe(null)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Rendimento e Custos Fixos */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Rendimento da Fornada (Salgados):
                </label>
                <input
                  type="number"
                  min="1"
                  value={editingRecipe.yieldQuantity}
                  onChange={e =>
                    setEditingRecipe({
                      ...editingRecipe,
                      yieldQuantity: parseInt(e.target.value) || 1,
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 font-bold text-slate-800 text-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Gás, Óleo e Temperos Rateados (R$):
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={editingRecipe.additionalCostPerBatch}
                  onChange={e =>
                    setEditingRecipe({
                      ...editingRecipe,
                      additionalCostPerBatch: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2 font-bold text-slate-800 text-lg"
                />
              </div>
            </div>

            {/* Ingredientes Utilizados */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Ingredientes da Receita:
                </label>
                {/* Seletor para adicionar novo ingrediente */}
                <select
                  onChange={e => {
                    if (e.target.value) {
                      handleAddIngredientToRecipe(e.target.value)
                      e.target.value = ''
                    }
                  }}
                  className="text-xs bg-amber-50 border border-amber-300 font-bold text-amber-900 rounded-lg px-2 py-1 cursor-pointer"
                >
                  <option value="">+ Adicionar Ingrediente...</option>
                  {ingredients.map(ing => (
                    <option key={ing.id} value={ing.id}>
                      {ing.name} ({formatCurrency(ing.unitCost)}/{ing.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto">
                {editingRecipe.ingredients.map(item => {
                  const ing = ingredients.find(i => i.id === item.ingredientId)
                  if (!ing) return null
                  return (
                    <div key={item.ingredientId} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                      <span className="font-bold text-slate-800 flex-1">{ing.name}</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step="0.1"
                          value={item.quantity}
                          onChange={e => {
                            const val = parseFloat(e.target.value) || 0
                            setEditingRecipe({
                              ...editingRecipe,
                              ingredients: editingRecipe.ingredients.map(i =>
                                i.ingredientId === item.ingredientId ? { ...i, quantity: val } : i
                              ),
                            })
                          }}
                          className="w-20 bg-slate-100 border border-slate-300 rounded px-2 py-1 text-center font-bold"
                        />
                        <span className="text-xs text-slate-500 w-8">{item.unit}</span>
                        <button
                          onClick={() => handleRemoveIngredientFromRecipe(item.ingredientId)}
                          className="text-rose-400 hover:text-rose-600 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Resumo do Custo Calculado */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-amber-900 block">Custo Total da Fornada:</span>
                <span className="text-xl font-black text-slate-900">
                  {formatCurrency(calculateBatchCost(editingRecipe, ingredients))}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-amber-900 block">Custo por Salgado Unitário:</span>
                <span className="text-2xl font-black text-rose-600">
                  {formatCurrency(calculateUnitCost(editingRecipe, ingredients))}
                </span>
              </div>
            </div>

            {/* Botões do Rodapé */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setEditingRecipe(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveRecipe}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl cursor-pointer shadow-md"
              >
                Salvar Ficha Técnica
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
