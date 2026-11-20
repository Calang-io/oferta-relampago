import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_CONFIG } from '../../settings/settings-model.ts'
import { discountFor, formatCountdown, getFlashDeals, getOfferWindow, placeInventoryOrder, rebaseOffers, reconcileOffers, reconfigureOffers } from '../flash-deals-model.ts'

const config = structuredClone(DEFAULT_CONFIG)
const at = time => new Date(`2026-11-20T${time}-03:00`)
const item = { id: 'one', name: 'Produto', category: 'Padaria', unitPrice: 12.5, prepared: 30, sold: 10, estimatedSalesUntilClose: 15, projectedSurplus: 5, currentStock: 20, estimatedLossValue: 62.5, riskLevel: 'MODERATE', trend: 'stable' }
const emptyBook = () => ({ cycle: '', paused: false, pausedItems: [], allocations: [] })
const inventory = () => ({ items: [{ ...item }], recentOrders: [], lastUpdated: at('20:00:00'), offers: reconcileOffers(emptyBook(), [item], config, at('20:00:00')) })

test('publica no início exato e encerra no fechamento exato, em Fortaleza', () => {
  assert.equal(getOfferWindow(config, at('19:59:59')).phase, 'scheduled')
  assert.equal(getOfferWindow(config, at('20:00:00')).phase, 'active')
  assert.equal(getOfferWindow(config, at('21:59:59')).phase, 'active')
  assert.equal(getOfferWindow(config, at('22:00:00')).phase, 'closed')
  assert.equal(reconcileOffers(emptyBook(), [item], config, at('19:59:59')).allocations.length, 0)
  assert.equal(reconcileOffers(emptyBook(), [item], config, at('20:00:00')).allocations.length, 1)
})

test('janela após meia-noite conserva o mesmo ciclo e 24 horas não têm lacuna', () => {
  const overnight = { ...config, closingTime: '01:00' }
  const before = getOfferWindow(overnight, at('23:30:00'))
  const after = getOfferWindow(overnight, new Date('2026-11-21T00:30:00-03:00'))
  assert.equal(before.phase, 'active')
  assert.equal(before.cycle, after.cycle)
  assert.equal(getOfferWindow(overnight, at('01:00:00')).phase, 'closed')
  assert.equal(getOfferWindow(overnight, at('22:59:59')).phase, 'closed')
  assert.equal(getOfferWindow(overnight, at('23:00:00')).phase, 'active')
  assert.equal(getOfferWindow({ ...config, offerWindowHours: 24 }, at('22:00:00')).phase, 'active')
})

test('oferta usa sobra limitada ao estoque, exclui estoque vazio, sem sobra ou desconto zero', () => {
  const items = [item, { ...item, id: 'empty', currentStock: 0 }, { ...item, id: 'safe', projectedSurplus: 0 }, { ...item, id: 'zero' }, { ...item, id: 'limited', currentStock: 2 }]
  const book = reconcileOffers(emptyBook(), items, { ...config, maxDiscountByItem: { zero: 0 } }, at('20:00:00'))
  assert.deepEqual(book.allocations.map(offer => [offer.itemId, offer.quantity]), [['one', 5], ['limited', 2]])
})

test('respeita desconto por item, teto geral, centavos e desconto de 100%', () => {
  const custom = { ...config, maxDiscountByItem: { one: 15.5 } }
  assert.equal(discountFor('one', custom), 15.5)
  assert.equal(discountFor('other', custom), 50)
  assert.equal(discountFor('one', { ...custom, maxDiscountPercentage: 10 }), 10)
  assert.equal(getFlashDeals(inventory().offers, [item], custom, at('20:00:00'))[0].price, 10.56)
  assert.equal(getFlashDeals(inventory().offers, [item], { ...config, maxDiscountPercentage: 100 }, at('20:00:00'))[0].price, 0)
})

test('compra registra preço promocional, reduz estoque e não vende além do lote', () => {
  let state = inventory()
  for (let index = 0; index < 5; index++) state = placeInventoryOrder(state, config, at('20:30:00'), 0, `order-${index}`, 'one', true)
  assert.equal(state.items[0].currentStock, 15)
  assert.equal(state.items[0].sold, 15)
  assert.equal(state.recentOrders.length, 5)
  assert.equal(state.recentOrders[0].items[0].price, 6.25)
  assert.equal(getFlashDeals(state.offers, state.items, config, at('20:30:00'))[0].status, 'sold-out')
  assert.equal(placeInventoryOrder(state, config, at('20:30:00'), 0, 'extra', 'one', true), state)
  assert.equal(reconcileOffers(state.offers, state.items, config, at('20:30:00')).allocations.length, 1)
})

test('pausa geral e individual bloqueiam compra sem impedir venda normal', () => {
  for (const pause of [{ paused: true }, { pausedItems: ['one'] }]) {
    const state = inventory()
    state.offers = { ...state.offers, ...pause }
    assert.equal(getFlashDeals(state.offers, state.items, config, at('20:30:00'))[0].status, 'paused')
    assert.equal(placeInventoryOrder(state, config, at('20:30:00'), 0, 'blocked', 'one', true), state)
    const sold = placeInventoryOrder(state, config, at('20:30:00'), 0, 'normal', 'one')
    assert.equal(sold.recentOrders[0].items[0].price, 12.5)
    assert.equal(getFlashDeals(sold.offers, sold.items, config, at('20:30:00'))[0].remaining, 4)
  }
})

test('revalida horário e estoque na compra e nunca troca produto indisponível', () => {
  const state = inventory()
  for (const time of ['19:59:59', '22:00:00']) assert.equal(placeInventoryOrder(state, config, at(time), 0, 'blocked', 'one', true), state)
  assert.equal(placeInventoryOrder(state, config, at('20:00:00'), 0, 'missing', 'unknown', true), state)
  state.items[0].currentStock = 0
  assert.equal(placeInventoryOrder(state, config, at('20:00:00'), 0, 'empty', 'one', true), state)
})

test('não repõe lote com produção maior e adiciona novos itens elegíveis', () => {
  const state = inventory()
  const items = [{ ...item, currentStock: 50, projectedSurplus: 40 }, { ...item, id: 'new' }]
  const book = reconcileOffers(state.offers, items, config, at('20:00:00'))
  assert.equal(book.allocations[0].quantity, 5)
  assert.equal(book.allocations[1].itemId, 'new')
  assert.equal(reconcileOffers(book, items, config, at('20:00:00')), book)
})

test('zerar vendas na virada do dia não repõe unidades de uma oferta em andamento', () => {
  const state = placeInventoryOrder(inventory(), config, at('20:30:00'), 0, 'one', 'one', true)
  const nextItems = [{ ...state.items[0], sold: 0, currentStock: 30 }]
  const rebased = rebaseOffers(state.offers, state.items, nextItems)
  assert.equal(rebased.allocations[0].quantity, 4)
  assert.equal(rebased.allocations[0].soldAtCreation, 0)
  assert.equal(getFlashDeals(rebased, nextItems, config, at('20:30:00'))[0].remaining, 4)
})

test('novo ciclo renova ofertas e pausa; cronômetro nunca fica negativo', () => {
  const old = { ...inventory().offers, paused: true, pausedItems: ['one'] }
  const book = reconcileOffers(old, [item], config, new Date('2026-11-21T20:00:00-03:00'))
  assert.notEqual(book.cycle, old.cycle)
  assert.equal(book.paused, false)
  assert.deepEqual(book.pausedItems, [])
  assert.equal(formatCountdown(3661000), '01:01:01')
  assert.equal(formatCountdown(-1000), '00:00:00')
  assert.equal(formatCountdown(1), '00:00:01')
})

test('editar fechamento preserva pausa geral, pausa individual e lote já consumido', () => {
  const state = placeInventoryOrder(inventory(), config, at('20:30:00'), 0, 'order', 'one', true)
  const paused = { ...state.offers, paused: true, pausedItems: ['one'] }
  const edited = { ...config, closingTime: '22:30', offerWindowHours: 3 }
  const book = reconfigureOffers(paused, state.items, config, edited, at('20:30:00'))
  assert.equal(book.paused, true)
  assert.deepEqual(book.pausedItems, ['one'])
  assert.deepEqual(book.allocations, paused.allocations)
  assert.equal(getFlashDeals(book, state.items, edited, at('20:30:00'))[0].status, 'paused')
  assert.equal(getFlashDeals({ ...book, paused: false }, state.items, edited, at('20:30:00'))[0].status, 'paused')
  assert.equal(getFlashDeals({ ...book, paused: false, pausedItems: [] }, state.items, edited, at('20:30:00'))[0].remaining, 4)
})

test('editar horário para fora da janela e voltar não limpa pausas nem lotes', () => {
  const paused = { ...inventory().offers, paused: true, pausedItems: ['one'] }
  const later = { ...config, closingTime: '23:00' }
  const scheduled = reconfigureOffers(paused, [item], config, later, at('20:30:00'))
  assert.equal(getFlashDeals(scheduled, [item], later, at('20:30:00'))[0].status, 'scheduled')
  const returned = reconfigureOffers(scheduled, [item], later, config, at('20:30:00'))
  assert.equal(returned.paused, true)
  assert.deepEqual(returned.pausedItems, ['one'])
  assert.deepEqual(returned.allocations, paused.allocations)
})

test('estoque zerado encerra a oferta mesmo após reposição e edição de fechamento', () => {
  const empty = { ...item, prepared: item.sold, currentStock: 0, projectedSurplus: 0 }
  const exhausted = reconcileOffers(inventory().offers, [empty], config, at('20:30:00'))
  assert.equal(getFlashDeals(exhausted, [empty], config, at('20:30:00'))[0].status, 'sold-out')
  const refilled = reconcileOffers(exhausted, [item], config, at('20:30:00'))
  const deal = getFlashDeals(refilled, [item], config, at('20:30:00'))[0]
  assert.equal(deal.status, 'sold-out')
  assert.equal(deal.remaining, 0)
  const state = { ...inventory(), offers: refilled }
  assert.equal(placeInventoryOrder(state, config, at('20:30:00'), 0, 'blocked', 'one', true), state)
  const edited = { ...config, closingTime: '22:30' }
  const moved = reconfigureOffers(refilled, [item], config, edited, at('20:30:00'))
  assert.equal(getFlashDeals(moved, [item], edited, at('20:30:00'))[0].status, 'sold-out')
  const tomorrow = new Date('2026-11-21T21:00:00-03:00')
  const renewed = reconcileOffers(moved, [item], edited, tomorrow)
  assert.equal(getFlashDeals(renewed, [item], edited, tomorrow)[0].status, 'active')
})

test('estoque zerado antes da virada do dia não reabre com a produção do dia seguinte', () => {
  const empty = { ...item, prepared: item.sold, currentStock: 0, projectedSurplus: 0 }
  const nextItems = [{ ...item, sold: 0, currentStock: item.prepared }]
  const rebased = rebaseOffers(inventory().offers, [empty], nextItems)
  assert.equal(getFlashDeals(rebased, nextItems, config, at('20:30:00'))[0].status, 'sold-out')
})
