import { historicalAverage } from './settings-model.ts'

/** Sete dias de vendas FICTÍCIOS, para o mesmo catálogo demonstrativo da base.
 * Substituir por histórico real na integração CW; não derivar média de `prepared`.
 */
export const DEMO_SALES_HISTORY: Record<string, number[]> = {
  'prod-1': [48, 54, 52, 58, 62, 70, 62],
  'prod-2': [24, 28, 30, 26, 32, 38, 32],
  'prod-3': [30, 34, 36, 32, 40, 48, 46],
  'prod-4': [18, 22, 24, 20, 26, 32, 26],
  'prod-5': [16, 18, 20, 16, 22, 26, 22],
  'prod-6': [28, 32, 34, 30, 38, 44, 39],
  'prod-7': [20, 24, 26, 22, 30, 34, 33],
  'prod-8': [14, 16, 18, 16, 20, 24, 18],
  'prod-9': [60, 66, 72, 68, 80, 88, 91],
  'prod-10': [14, 16, 18, 16, 22, 26, 28],
  'prod-11': [22, 24, 26, 24, 30, 36, 34],
  'prod-12': [10, 12, 14, 12, 18, 20, 19],
  'prod-13': [32, 36, 38, 34, 42, 48, 50],
  'prod-14': [10, 12, 14, 10, 16, 20, 16],
  'prod-15': [34, 38, 40, 38, 48, 54, 49],
  'prod-16': [38, 40, 44, 42, 48, 52, 51],
}

export const DEMO_HISTORICAL_AVERAGES = Object.fromEntries(
  Object.entries(DEMO_SALES_HISTORY).map(([id, days]) => [id, historicalAverage(days)]),
)
