import type { RiskLevel } from '../types/risk'

export function calculateRisk(
  prepared: number,
  sold: number,
  estimatedSalesUntilClose: number,
  unitPrice: number
): {
  currentStock: number
  projectedSurplus: number
  estimatedLossValue: number
  riskLevel: RiskLevel
} {
  const currentStock = Math.max(0, prepared - sold)
  // Se a estimativa for menor que o estoque, haverá sobra
  const projectedSurplus = Math.max(0, currentStock - estimatedSalesUntilClose)
  const estimatedLossValue = projectedSurplus * unitPrice

  let riskLevel: RiskLevel = 'SAFE'
  if (projectedSurplus >= 6 || (currentStock > 0 && projectedSurplus / currentStock >= 0.4)) {
    riskLevel = 'CRITICAL'
  } else if (projectedSurplus > 0) {
    riskLevel = 'MODERATE'
  }

  return {
    currentStock,
    projectedSurplus,
    estimatedLossValue,
    riskLevel,
  }
}

export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatTimeAgo(date?: Date): string {
  if (!date) return 'Sem pedidos recentes'
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return `Há ${Math.max(1, seconds)}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `Há ${minutes}min`
  const hours = Math.floor(minutes / 60)
  return `Há ${hours}h`
}
