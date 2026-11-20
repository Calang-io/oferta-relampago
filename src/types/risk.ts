export type RiskLevel = 'CRITICAL' | 'MODERATE' | 'SAFE'

export interface RiskItem {
  id: string
  name: string
  category: string
  unitPrice: number
  prepared: number // Quantidade preparada no dia
  sold: number // Vendidos até o momento
  currentStock: number // Estoque atual em tempo real (prepared - sold)
  estimatedSalesUntilClose: number // Projeção de vendas até o fechamento com base no ritmo atual
  projectedSurplus: number // Sobra estimada (currentStock - estimatedSalesUntilClose)
  estimatedLossValue: number // Valor financeiro em risco de perda (projectedSurplus * unitPrice)
  riskLevel: RiskLevel // 'CRITICAL' (sobra alta), 'MODERATE' (sobra leve), 'SAFE' (vai esgotar/equilibrado)
  lastOrderAt?: Date
  trend: 'up' | 'stable' | 'down' // Tendência de vendas
}

export interface OrderItemSimulation {
  itemId: string
  quantity: number
}

export interface StoreOrder {
  id: string
  timestamp: Date
  items: {
    itemId: string
    itemName: string
    quantity: number
    price: number
  }[]
  total: number
}

export interface StoreConfig {
  closingTime: string // formato "HH:mm", ex: "22:00"
  offerWindowHours: number // ex: 2 (últimas 2 horas)
  maxDiscountPercentage: number // ex: 50%
}
