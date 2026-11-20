import type { RiskItem, StoreOrder } from '../../types/risk'
import { calculateRisk } from '../../utils/calculations.ts'
import type { OperationConfig } from '../settings/settings-model'
import { restaurantDate } from '../settings/settings-model.ts'

export interface OfferAllocation {
  itemId: string
  quantity: number
  soldAtCreation: number
  exhausted?: boolean
}

export interface OfferBook {
  cycle: string
  paused: boolean
  pausedItems: string[]
  allocations: OfferAllocation[]
}

export type OfferStatus = 'scheduled' | 'active' | 'paused' | 'sold-out' | 'closed'

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  scheduled: 'Programada', active: 'No cardápio', paused: 'Pausada', 'sold-out': 'Esgotada', closed: 'Encerrada',
}

export function getOfferWindow(config: OperationConfig, now: Date) {
  const date = restaurantDate(now)
  let end = new Date(`${date}T${config.closingTime}:00-03:00`).getTime()
  const duration = config.offerWindowHours * 3600000
  // Uma janela que atravessa a meia-noite pertence ao próximo fechamento.
  if (now.getTime() >= end && now.getTime() >= end + 86400000 - duration) end += 86400000
  const start = end - duration
  const phase: 'scheduled' | 'closed' | 'active' = now.getTime() < start ? 'scheduled' : now.getTime() >= end ? 'closed' : 'active'
  return { start, end, phase, cycle: new Date(end).toISOString() }
}

export function discountFor(itemId: string, config: OperationConfig) {
  return Math.max(0, Math.min(config.maxDiscountPercentage, config.maxDiscountByItem[itemId] ?? config.maxDiscountPercentage))
}

function remainingQuantity(allocation: OfferAllocation, item: RiskItem) {
  return allocation.exhausted ? 0 : Math.max(0, Math.min(item.currentStock, allocation.quantity - Math.max(0, item.sold - allocation.soldAtCreation)))
}

function settleOfferStock(book: OfferBook, items: RiskItem[]): OfferBook {
  let changed = false
  const allocations = book.allocations.map(allocation => {
    const item = items.find(candidate => candidate.id === allocation.itemId)
    if (allocation.exhausted || !item || remainingQuantity(allocation, item) > 0) return allocation
    changed = true
    return { ...allocation, exhausted: true }
  })
  return changed ? { ...book, allocations } : book
}

export function reconcileOffers(book: OfferBook, items: RiskItem[], config: OperationConfig, now: Date): OfferBook {
  const window = getOfferWindow(config, now)
  const current = settleOfferStock(book.cycle === window.cycle ? book : { cycle: window.cycle, paused: false, pausedItems: [], allocations: [] }, items)
  if (window.phase !== 'active') return current
  const additions = items.filter(item => item.projectedSurplus > 0 && item.currentStock > 0 && discountFor(item.id, config) > 0 && !current.allocations.some(offer => offer.itemId === item.id))
    .map(item => ({ itemId: item.id, quantity: Math.min(item.projectedSurplus, item.currentStock), soldAtCreation: item.sold }))
  return additions.length ? { ...current, allocations: [...current.allocations, ...additions] } : current
}

// Uma edição de horário não inicia outra operação. Primeiro avançamos o ciclo
// pelo horário anterior, depois transferimos seus lotes e pausas ao novo horário.
export function reconfigureOffers(book: OfferBook, items: RiskItem[], previousConfig: OperationConfig, nextConfig: OperationConfig, now: Date): OfferBook {
  const current = reconcileOffers(book, items, previousConfig, now)
  return reconcileOffers({ ...current, cycle: getOfferWindow(nextConfig, now).cycle }, items, nextConfig, now)
}

export function getFlashDeals(book: OfferBook, items: RiskItem[], config: OperationConfig, now: Date) {
  const window = getOfferWindow(config, now)
  return book.allocations.flatMap(allocation => {
    const item = items.find(candidate => candidate.id === allocation.itemId)
    if (!item) return []
    const remaining = remainingQuantity(allocation, item)
    const discount = discountFor(item.id, config)
    const status: OfferStatus = window.phase !== 'active' ? window.phase
      : remaining === 0 ? 'sold-out'
      : book.paused || book.pausedItems.includes(item.id) || discount === 0 ? 'paused' : 'active'
    return [{ ...allocation, item, remaining, discount, price: Math.round(item.unitPrice * (1 - discount / 100) * 100) / 100, status }]
  })
}

export function formatCountdown(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000))
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, '0')).join(':')
}

export interface StoreInventory {
  items: RiskItem[]
  recentOrders: StoreOrder[]
  lastUpdated: Date
  offers: OfferBook
}

// Na virada do dia, as vendas diárias zeram, mas a quantidade de uma oferta
// que atravessa a meia-noite não pode ser reposta.
export function rebaseOffers(book: OfferBook, previousItems: RiskItem[], nextItems: RiskItem[]): OfferBook {
  const settled = settleOfferStock(book, previousItems)
  return { ...settled, allocations: settled.allocations.map(allocation => {
    const previous = previousItems.find(item => item.id === allocation.itemId)
    const next = nextItems.find(item => item.id === allocation.itemId)
    const consumed = Math.max(0, (previous?.sold ?? allocation.soldAtCreation) - allocation.soldAtCreation)
    return { ...allocation, quantity: Math.max(0, Math.min(next?.currentStock ?? 0, allocation.quantity - consumed)), soldAtCreation: next?.sold ?? 0 }
  }) }
}

export function placeInventoryOrder(previous: StoreInventory, config: OperationConfig, timestamp: Date, random: number, orderId: string, specificItemId?: string, offerOnly = false): StoreInventory {
  const availableItems = previous.items.filter(item => item.currentStock > 0)
  let targetItem = specificItemId ? availableItems.find(item => item.id === specificItemId) : undefined
  if (offerOnly && !targetItem) return previous
  targetItem ??= availableItems[Math.floor(random * availableItems.length)]
  if (!targetItem) return previous
  const offers = reconcileOffers(previous.offers, previous.items, config, timestamp)
  const deal = getFlashDeals(offers, previous.items, config, timestamp).find(offer => offer.itemId === targetItem.id)
  if (offerOnly && deal?.status !== 'active') return previous
  const discounted = deal?.status === 'active'
  const quantity = Math.min(targetItem.currentStock, offerOnly ? 1 : Math.floor(random * 2) + 1, discounted ? deal.remaining : Infinity)
  const price = discounted ? deal.price : targetItem.unitPrice
  const order: StoreOrder = {
    id: orderId, timestamp,
    items: [{ itemId: targetItem.id, itemName: targetItem.name, quantity, price }],
    total: Math.round(quantity * price * 100) / 100,
  }
  const items = previous.items.map(item => {
    if (item.id !== targetItem.id) return item
    const sold = item.sold + quantity
    const estimatedSalesUntilClose = Math.max(0, Math.round(item.estimatedSalesUntilClose * 0.95))
    return { ...item, sold, estimatedSalesUntilClose, ...calculateRisk(item.prepared, sold, estimatedSalesUntilClose, item.unitPrice), lastOrderAt: timestamp }
  })
  return { items, recentOrders: [order, ...previous.recentOrders.slice(0, 9)], lastUpdated: timestamp, offers: settleOfferStock(offers, items) }
}
