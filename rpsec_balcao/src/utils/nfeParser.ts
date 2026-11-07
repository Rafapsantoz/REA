import type { ImportedInvoice, InvoiceItem } from '../types'

export function parseNFeXML(xmlContent: string): ImportedInvoice {
  const parser = new DOMParser()
  const xmlDoc = parser.parseFromString(xmlContent, 'text/xml')

  // Verifica erro de parse
  const parseError = xmlDoc.getElementsByTagName('parsererror')
  if (parseError.length > 0) {
    throw new Error('O arquivo selecionado não é um XML válido ou está corrompido.')
  }

  // Dados do Fornecedor (Emitente)
  const emit = xmlDoc.getElementsByTagName('emit')[0]
  const supplier = emit?.getElementsByTagName('xNome')[0]?.textContent || 'Fornecedor Desconhecido'
  const cnpj = emit?.getElementsByTagName('CNPJ')[0]?.textContent || ''

  // Data de Emissão
  const ide = xmlDoc.getElementsByTagName('ide')[0]
  const dateStr =
    ide?.getElementsByTagName('dhEmi')[0]?.textContent ||
    ide?.getElementsByTagName('dEmi')[0]?.textContent ||
    new Date().toISOString()

  // Total da Nota
  const totalElem = xmlDoc.getElementsByTagName('vNF')[0]
  const totalAmount = totalElem ? parseFloat(totalElem.textContent || '0') : 0

  // Itens da Nota (<det>)
  const detList = xmlDoc.getElementsByTagName('det')
  const items: InvoiceItem[] = []

  for (let i = 0; i < detList.length; i++) {
    const prod = detList[i].getElementsByTagName('prod')[0]
    if (!prod) continue

    const code = prod.getElementsByTagName('cProd')[0]?.textContent || `${i + 1}`
    const name = prod.getElementsByTagName('xProd')[0]?.textContent || `Item ${i + 1}`
    const unit = (prod.getElementsByTagName('uCom')[0]?.textContent || 'UN').toUpperCase()
    const quantity = parseFloat(prod.getElementsByTagName('qCom')[0]?.textContent || '1')
    const unitPrice = parseFloat(prod.getElementsByTagName('vUnCom')[0]?.textContent || '0')
    const total = parseFloat(prod.getElementsByTagName('vProd')[0]?.textContent || '0')

    items.push({
      code,
      name,
      unit,
      quantity,
      unitPrice,
      total: total > 0 ? total : quantity * unitPrice,
    })
  }

  return {
    id: Date.now().toString(),
    supplier,
    cnpj,
    date: dateStr,
    totalAmount,
    items,
  }
}
