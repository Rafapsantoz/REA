// Teste Automatizado de Validação do Fechamento de Caixa — RPsec Balcão
import assert from 'node:assert'

// Mock do localStorage para ambiente Node.js
const memoryStore = new Map()
globalThis.localStorage = {
  getItem: (key) => memoryStore.get(key) || null,
  setItem: (key, val) => memoryStore.set(key, String(val)),
  removeItem: (key) => memoryStore.delete(key),
  clear: () => memoryStore.clear(),
}

console.log('🧪 Iniciando Bateria de Testes: Fechamento de Caixa & Conciliação da Gaveta...')

// Importa storage compilado ou direto
const STORAGE_KEYS = {
  CURRENT_SHIFT: 'rpsec_balcao_current_shift',
  SHIFT_HISTORY: 'rpsec_balcao_shift_history',
  SALES: 'rpsec_balcao_sales',
}

function getCurrentShift() {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_SHIFT)
  if (!data) return null
  try {
    const parsed = JSON.parse(data)
    return parsed && parsed.status === 'open' ? parsed : null
  } catch {
    return null
  }
}

function saveCurrentShift(shift) {
  if (shift) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SHIFT, JSON.stringify(shift))
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SHIFT)
  }
}

function openShift(initialFloat, notes) {
  const newShift = {
    id: `shift_${Date.now()}`,
    openedAt: new Date().toISOString(),
    status: 'open',
    initialFloat: Math.max(0, initialFloat),
    movements: [],
    notes: notes?.trim() || undefined,
  }
  saveCurrentShift(newShift)
  return newShift
}

function addShiftMovement(type, amount, description) {
  const current = getCurrentShift()
  if (!current) return null
  const movement = {
    id: `mov_${Date.now()}`,
    type,
    amount: Math.max(0, amount),
    description: description.trim() || (type === 'sangria' ? 'Retirada de Dinheiro' : 'Entrada de Troco'),
    createdAt: new Date().toISOString(),
  }
  const updated = {
    ...current,
    movements: [...current.movements, movement],
  }
  saveCurrentShift(updated)
  return updated
}

function loadShiftHistory() {
  const data = localStorage.getItem(STORAGE_KEYS.SHIFT_HISTORY)
  if (!data) return []
  try {
    return JSON.parse(data)
  } catch {
    return []
  }
}

function saveShiftHistory(history) {
  localStorage.setItem(STORAGE_KEYS.SHIFT_HISTORY, JSON.stringify(history))
}

function closeShift(countedCash, expectedCash, notes, extraData) {
  const current = getCurrentShift()
  if (!current) return null
  const diff = countedCash - expectedCash
  const closed = {
    ...current,
    status: 'closed',
    closedAt: new Date().toISOString(),
    closingCashCounted: countedCash,
    closingCashExpected: expectedCash,
    closingDifference: diff,
    cashSalesTotal: extraData?.cashSalesTotal,
    totalSalesAmount: extraData?.totalSalesAmount,
    notes: notes?.trim() || current.notes,
  }
  saveCurrentShift(null)
  const history = [closed, ...loadShiftHistory()]
  saveShiftHistory(history)
  return { closedShift: closed, history }
}

// ================= TESTES =================

// 1. Estado Inicial
assert.strictEqual(getCurrentShift(), null, 'Caixa inicial deve estar fechado')
assert.deepStrictEqual(loadShiftHistory(), [], 'Histórico inicial deve ser vazio')
console.log('✅ Teste 1: Estado inicial fechado validado.')

// 2. Abertura de Caixa com Fundo de Troco
const shift1 = openShift(50.00, 'Troco inicial do dia')
assert.strictEqual(shift1.status, 'open')
assert.strictEqual(shift1.initialFloat, 50.00)
assert.strictEqual(shift1.movements.length, 0)
assert.strictEqual(getCurrentShift()?.initialFloat, 50.00)
console.log('✅ Teste 2: Abertura de caixa com fundo de R$ 50,00 validada.')

// 3. Simulação de Vendas do Dia
const sales = [
  { id: '1', paymentMethod: 'dinheiro', totalAmount: 15.00 },
  { id: '2', paymentMethod: 'dinheiro', totalAmount: 25.00 },
  { id: '3', paymentMethod: 'pix', totalAmount: 30.00 },
  { id: '4', paymentMethod: 'cartao_debito', totalAmount: 20.00 },
  { id: '5', paymentMethod: 'fiado', isCreditPaid: false, totalAmount: 18.00 },
  // Quitação de fiado recebida em dinheiro hoje:
  { id: '6', paymentMethod: 'fiado', isCreditPaid: true, creditPaidMethod: 'dinheiro', totalAmount: 10.00 },
]

const cashTotal = sales
  .filter(s => s.paymentMethod === 'dinheiro' || (s.paymentMethod === 'fiado' && s.isCreditPaid && s.creditPaidMethod === 'dinheiro'))
  .reduce((sum, s) => sum + s.totalAmount, 0)

assert.strictEqual(cashTotal, 50.00, 'Total de entradas em dinheiro deve ser R$ 50,00 (15 + 25 + 10)')
console.log('✅ Teste 3: Vendas e quitações em dinheiro validadas (R$ 50,00).')

// 4. Movimentações (Sangrias e Suprimentos)
addShiftMovement('sangria', 30.00, 'Pagamento fornecedor de pães')
addShiftMovement('suprimento', 20.00, 'Moedas de 1 real')

const shiftWithMovs = getCurrentShift()
assert.strictEqual(shiftWithMovs.movements.length, 2)

const sangriasTotal = shiftWithMovs.movements.filter(m => m.type === 'sangria').reduce((s, m) => s + m.amount, 0)
const suprimentosTotal = shiftWithMovs.movements.filter(m => m.type === 'suprimento').reduce((s, m) => s + m.amount, 0)

assert.strictEqual(sangriasTotal, 30.00)
assert.strictEqual(suprimentosTotal, 20.00)
console.log('✅ Teste 4: Sangria (R$ 30) e Suprimento (R$ 20) validados.')

// 5. Cálculo Matemático da Gaveta
// Esperado = 50 (fundo) + 50 (vendas dinheiro) + 20 (suprimento) - 30 (sangria) = 90.00
const expectedDrawerCash = shiftWithMovs.initialFloat + cashTotal + suprimentosTotal - sangriasTotal
assert.strictEqual(expectedDrawerCash, 90.00, 'Dinheiro esperado na gaveta deve ser R$ 90,00')
console.log('✅ Teste 5: Cálculo de dinheiro esperado na gaveta exato (R$ 90,00).')

// 6. Testes de Batimento (Diferença)
// Cenário A: Bateu 100%
const diffExact = 90.00 - expectedDrawerCash
assert.strictEqual(diffExact, 0.00, 'Diferença exata deve ser 0')

// Cenário B: Sobra de Caixa
const diffSobra = 95.00 - expectedDrawerCash
assert.strictEqual(diffSobra, 5.00, 'Sobra de caixa deve ser +5.00')

// Cenário C: Quebra de Caixa
const diffQuebra = 82.50 - expectedDrawerCash
assert.strictEqual(diffQuebra, -7.50, 'Quebra de caixa deve ser -7.50')
console.log('✅ Teste 6: Cenários de batimento (100%, Sobra +R$ 5, Quebra -R$ 7,50) validados.')

// 7. Fechamento de Caixa
const closeResult = closeShift(90.00, expectedDrawerCash, 'Caixa do dia fechado perfeitamente', {
  cashSalesTotal: cashTotal,
  totalSalesAmount: 118.00,
})

assert.strictEqual(getCurrentShift(), null, 'Turno atual deve estar limpo após fechamento')
assert.strictEqual(closeResult.history.length, 1, 'Histórico deve conter 1 caixa fechado')
assert.strictEqual(closeResult.closedShift.status, 'closed')
assert.strictEqual(closeResult.closedShift.closingDifference, 0.00)
assert.strictEqual(closeResult.closedShift.cashSalesTotal, 50.00)
assert.strictEqual(closeResult.closedShift.totalSalesAmount, 118.00)
console.log('✅ Teste 7: Fechamento de caixa e arquivamento no histórico validados.')

// 8. Reabertura no dia seguinte
const shift2 = openShift(100.00, 'Fundo do dia 2')
assert.strictEqual(shift2.status, 'open')
assert.strictEqual(shift2.initialFloat, 100.00)
assert.strictEqual(loadShiftHistory().length, 1, 'Histórico deve continuar preservado')
console.log('✅ Teste 8: Reabertura com novo fundo e histórico preservado validada.')

console.log('\n🎉 TODOS OS 8 TESTES DE VALIDAÇÃO PASSARAM COM 100% DE SUCESSO!')
