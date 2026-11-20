import type { RiskItem, StoreConfig } from '../../types/risk'
import { calculateRisk } from '../../utils/calculations.ts'

export interface OperationConfig extends StoreConfig {
  maxDiscountByItem: Record<string, number>
}

export interface DailyProduction {
  date: string
  quantities: Record<string, number>
  confirmedAt: string
}

export interface SettingsSnapshot {
  version: 1
  config: OperationConfig
  production: DailyProduction | null
}

export const SETTINGS_KEY = 'oferta-relampago:demo-store:settings:v1'
export const DEFAULT_CONFIG: OperationConfig = {
  closingTime: '22:00', offerWindowHours: 2, maxDiscountPercentage: 50, maxDiscountByItem: {},
}

export function restaurantDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Fortaleza', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
}

export function offerPeriod(closingTime: string, hours: number) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(closingTime) || !Number.isFinite(hours) || hours < 0.5 || hours > 24 || !Number.isInteger(hours * 60)) return null
  const [hour, minute] = closingTime.split(':').map(Number)
  const start = hour * 60 + minute - Math.round(hours * 60)
  const normalized = (start + 1440) % 1440
  return { start: `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`, end: closingTime, previousDay: start < 0 }
}

export function historicalAverage(values: readonly number[] | undefined): number | null {
  if (!values?.length || values.some(value => !Number.isFinite(value) || value < 0)) return null
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

export function resolveQuantity(id: string, production: DailyProduction | null, averages: Record<string, number | null>, date: string) {
  const quantity = production?.date === date ? production.quantities[id] : undefined
  if (typeof quantity === 'number' && Number.isFinite(quantity) && quantity >= 0) return { quantity, source: 'confirmed' as const }
  const average = averages[id] ?? null
  return { quantity: average, source: average === null ? 'missing' as const : 'estimated' as const }
}

export function applyProduction(items: RiskItem[], production: DailyProduction | null, averages: Record<string, number | null>, date: string): RiskItem[] {
  return items.map(item => {
    const prepared = resolveQuantity(item.id, production, averages, date).quantity ?? item.prepared
    return { ...item, prepared, ...calculateRisk(prepared, item.sold, item.estimatedSalesUntilClose, item.unitPrice) }
  })
}

export function validateConfig(config: OperationConfig) {
  const errors: Record<string, string> = {}
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(config.closingTime)) errors.closingTime = 'Informe um horário válido.'
  if (!offerPeriod('22:00', config.offerWindowHours)) errors.offerWindowHours = 'Escolha uma janela entre 30 minutos e 24 horas.'
  if (!Number.isFinite(config.maxDiscountPercentage) || config.maxDiscountPercentage < 0 || config.maxDiscountPercentage > 100) errors.maxDiscountPercentage = 'Informe um limite entre 0% e 100%.'
  for (const [id, discount] of Object.entries(config.maxDiscountByItem)) {
    if (!Number.isFinite(discount) || discount < 0 || discount > config.maxDiscountPercentage) errors[id] = `Use de 0% a ${config.maxDiscountPercentage}% (limite geral).`
  }
  return errors
}

export function parsePrepared(value: string): number | null {
  return /^\d+$/.test(value) && Number(value) <= 99999 ? Number(value) : null
}

export function validateProduction(quantities: Record<string, number>, items: Pick<RiskItem, 'id' | 'sold'>[]) {
  const errors: Record<string, string> = {}
  for (const item of items) {
    const value = quantities[item.id]
    if (!Number.isInteger(value) || value < 0 || value > 99999) errors[item.id] = 'Informe um total inteiro de 0 a 99.999.'
    else if (value < item.sold) errors[item.id] = `Já foram vendidas ${item.sold} unidades. O total preparado não pode ser menor.`
  }
  return errors
}

export function readSnapshot(raw: string | null): SettingsSnapshot {
  const fallback = (): SettingsSnapshot => ({ version: 1, config: structuredClone(DEFAULT_CONFIG), production: null })
  if (!raw) return fallback()
  try {
    const value = JSON.parse(raw) as SettingsSnapshot
    if (value?.version !== 1 || !value.config || typeof value.config.maxDiscountByItem !== 'object' || !value.config.maxDiscountByItem || Array.isArray(value.config.maxDiscountByItem) || Object.keys(validateConfig(value.config)).length) return fallback()
    const p = value.production
    if (p !== null && (!p || !/^\d{4}-\d{2}-\d{2}$/.test(p.date) || typeof p.confirmedAt !== 'string' || !p.quantities || typeof p.quantities !== 'object' || Array.isArray(p.quantities) || Object.values(p.quantities).some(q => !Number.isInteger(q) || q < 0 || q > 99999))) return { ...value, production: null }
    return value
  } catch { return fallback() }
}

export function loadSettings(): SettingsSnapshot {
  try { return readSnapshot(localStorage.getItem(SETTINGS_KEY)) } catch { return readSnapshot(null) }
}

export function persistSettings(snapshot: SettingsSnapshot) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(snapshot))
}
