import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_CONFIG, applyProduction, historicalAverage, offerPeriod, parsePrepared, readSnapshot, resolveQuantity, restaurantDate, validateConfig, validateProduction } from '../settings-model.ts'

const date = '2026-11-20'
const item = { id: 'one', name: 'Produto', category: 'Padaria', unitPrice: 10, prepared: 40, sold: 12, estimatedSalesUntilClose: 8, projectedSurplus: 20, currentStock: 28, estimatedLossValue: 200, riskLevel: 'CRITICAL', trend: 'stable' }
const production = { date, quantities: { one: 20 }, confirmedAt: '2026-11-20T12:00:00Z' }

test('calcula intervalo normal e sinaliza início no dia anterior', () => {
  assert.deepEqual(offerPeriod('22:00', 2), { start: '20:00', end: '22:00', previousDay: false })
  assert.deepEqual(offerPeriod('01:00', 2), { start: '23:00', end: '01:00', previousDay: true })
  assert.equal(offerPeriod('25:00', 2), null)
  assert.equal(offerPeriod('22:00', 0), null)
  assert.equal(offerPeriod('22:00', 25), null)
})

test('data do restaurante muda às 03h UTC em Fortaleza', () => {
  assert.equal(restaurantDate(new Date('2026-11-21T02:59:00Z')), date)
  assert.equal(restaurantDate(new Date('2026-11-21T03:00:00Z')), '2026-11-21')
})

test('calcula média de vendas; histórico ausente não se transforma em zero', () => {
  assert.equal(historicalAverage([10, 20, 30]), 20)
  assert.equal(historicalAverage([0, 0]), 0)
  assert.equal(historicalAverage([]), null)
  assert.equal(historicalAverage(undefined), null)
  assert.equal(historicalAverage([NaN]), null)
})

test('confirmação do dia tem prioridade sobre média e expira amanhã', () => {
  assert.deepEqual(resolveQuantity('one', production, { one: 30 }, date), { quantity: 20, source: 'confirmed' })
  assert.deepEqual(resolveQuantity('one', production, { one: 30 }, '2026-11-21'), { quantity: 30, source: 'estimated' })
  assert.deepEqual(resolveQuantity('other', production, {}, date), { quantity: null, source: 'missing' })
})

test('preserva zero confirmado e recalcula estoque, sobra e valor em risco', () => {
  const empty = { ...production, quantities: { one: 0 } }
  assert.deepEqual(resolveQuantity('one', empty, { one: 30 }, date), { quantity: 0, source: 'confirmed' })
  const result = applyProduction([item], production, { one: 30 }, date)[0]
  assert.equal(result.prepared, 20)
  assert.equal(result.currentStock, 8)
  assert.equal(result.projectedSurplus, 0)
  assert.equal(result.estimatedLossValue, 0)
  assert.equal(result.riskLevel, 'SAFE')
})

test('sem confirmação o risco usa a produção estimada pelo histórico', () => {
  const result = applyProduction([item], null, { one: 30 }, date)[0]
  assert.equal(result.prepared, 30)
  assert.equal(result.currentStock, 18)
  assert.equal(result.projectedSurplus, 10)
  assert.equal(result.estimatedLossValue, 100)
})

test('quantidade aceita zero inteiro, rejeita vazio, fração e números inválidos', () => {
  assert.equal(parsePrepared('0'), 0)
  assert.equal(parsePrepared('99999'), 99999)
  for (const value of ['', ' ', '-1', '1.5', '1,5', '1e3', '100000', 'Infinity']) assert.equal(parsePrepared(value), null)
})

test('total preparado deve cobrir as vendas já registradas', () => {
  assert.ok(validateProduction({ one: 10 }, [item]).one)
  assert.deepEqual(validateProduction({ one: 12 }, [item]), {})
  assert.deepEqual(validateProduction({ one: 0 }, [{ id: 'one', sold: 0 }]), {})
  assert.ok(validateProduction({}, [item]).one)
})

test('desconto individual respeita o teto da loja', () => {
  assert.deepEqual(validateConfig(DEFAULT_CONFIG), {})
  assert.deepEqual(validateConfig({ ...DEFAULT_CONFIG, maxDiscountByItem: { one: 20.5 } }), {})
  assert.ok(validateConfig({ ...DEFAULT_CONFIG, maxDiscountByItem: { one: 60 } }).one)
  assert.ok(validateConfig({ ...DEFAULT_CONFIG, maxDiscountPercentage: NaN }).maxDiscountPercentage)
  assert.ok(validateConfig({ ...DEFAULT_CONFIG, maxDiscountByItem: { one: NaN } }).one)
})

test('snapshot válido é preservado e armazenamento corrompido tem fallback', () => {
  const valid = { version: 1, config: DEFAULT_CONFIG, production }
  assert.deepEqual(readSnapshot(JSON.stringify(valid)), valid)
  for (const raw of [null, '{', 'null', '{}', JSON.stringify({ ...valid, config: { ...DEFAULT_CONFIG, maxDiscountByItem: [] } })]) assert.deepEqual(readSnapshot(raw), { version: 1, config: DEFAULT_CONFIG, production: null })
  assert.equal(readSnapshot(JSON.stringify({ ...valid, production: { ...production, quantities: { one: -1 } } })).production, null)
})
