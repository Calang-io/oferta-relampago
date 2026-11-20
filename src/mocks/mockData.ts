import type { RiskItem } from '../types/risk'
import { calculateRisk } from '../utils/calculations'

interface RawItemData {
  id: string
  name: string
  category: string
  unitPrice: number
  prepared: number
  sold: number
  estimatedSalesUntilClose: number
  trend: 'up' | 'stable' | 'down'
}

const initialRawData: RawItemData[] = [
  {
    id: 'prod-1',
    name: 'Croissant Tradicional de Manteiga',
    category: 'Padaria & Folhados',
    unitPrice: 12.5,
    prepared: 60,
    sold: 28,
    estimatedSalesUntilClose: 12,
    trend: 'down',
  },
  {
    id: 'prod-2',
    name: 'Bolo Red Velvet Fatia Especial',
    category: 'Confeitaria',
    unitPrice: 18.0,
    prepared: 35,
    sold: 14,
    estimatedSalesUntilClose: 6,
    trend: 'down',
  },
  {
    id: 'prod-3',
    name: 'Pão de Fermentação Natural (Levain)',
    category: 'Padaria Artesanal',
    unitPrice: 22.0,
    prepared: 45,
    sold: 20,
    estimatedSalesUntilClose: 10,
    trend: 'down',
  },
  {
    id: 'prod-4',
    name: 'Quiche Lorraine com Alho-Poró',
    category: 'Salgados Finos',
    unitPrice: 16.5,
    prepared: 30,
    sold: 12,
    estimatedSalesUntilClose: 7,
    trend: 'stable',
  },
  {
    id: 'prod-5',
    name: 'Sanduíche Baguete Presunto Cru & Brie',
    category: 'Lanches Prontos',
    unitPrice: 24.0,
    prepared: 25,
    sold: 9,
    estimatedSalesUntilClose: 5,
    trend: 'down',
  },
  {
    id: 'prod-6',
    name: 'Muffin de Mirtilo com Crosta Açucarada',
    category: 'Confeitaria',
    unitPrice: 11.0,
    prepared: 40,
    sold: 24,
    estimatedSalesUntilClose: 7,
    trend: 'stable',
  },
  {
    id: 'prod-7',
    name: 'Empada Cremosa de Camarão',
    category: 'Salgados Finos',
    unitPrice: 13.5,
    prepared: 32,
    sold: 18,
    estimatedSalesUntilClose: 6,
    trend: 'down',
  },
  {
    id: 'prod-8',
    name: 'Torta de Limão Siciliano Fatia',
    category: 'Sobremesas',
    unitPrice: 15.0,
    prepared: 20,
    sold: 14,
    estimatedSalesUntilClose: 4,
    trend: 'up',
  },
  {
    id: 'prod-9',
    name: 'Pão de Queijo Canastra Grande',
    category: 'Padaria Artesanal',
    unitPrice: 8.5,
    prepared: 80,
    sold: 58,
    estimatedSalesUntilClose: 20,
    trend: 'up',
  },
  {
    id: 'prod-10',
    name: 'Focaccia com Alecrim e Tomate Confit',
    category: 'Padaria Artesanal',
    unitPrice: 19.0,
    prepared: 22,
    sold: 11,
    estimatedSalesUntilClose: 7,
    trend: 'stable',
  },
  {
    id: 'prod-11',
    name: 'Brownie de Chocolate 70% com Nozes',
    category: 'Confeitaria',
    unitPrice: 14.0,
    prepared: 30,
    sold: 22,
    estimatedSalesUntilClose: 8,
    trend: 'up',
  },
  {
    id: 'prod-12',
    name: 'Salada Ceasar no Pote com Frango',
    category: 'Lanches Prontos',
    unitPrice: 26.0,
    prepared: 18,
    sold: 8,
    estimatedSalesUntilClose: 3,
    trend: 'down',
  },
  {
    id: 'prod-13',
    name: 'Suco Natural de Laranja Integral 500ml',
    category: 'Bebidas Frescas',
    unitPrice: 10.0,
    prepared: 40,
    sold: 34,
    estimatedSalesUntilClose: 8,
    trend: 'up',
  },
  {
    id: 'prod-14',
    name: 'Cheesecake Frutas Vermelhas',
    category: 'Sobremesas',
    unitPrice: 21.0,
    prepared: 16,
    sold: 6,
    estimatedSalesUntilClose: 3,
    trend: 'down',
  },
  {
    id: 'prod-15',
    name: 'Pastel de Nata Artesanal (Belém)',
    category: 'Padaria & Folhados',
    unitPrice: 9.5,
    prepared: 50,
    sold: 35,
    estimatedSalesUntilClose: 14,
    trend: 'stable',
  },
  {
    id: 'prod-16',
    name: 'Coxinha Gourmet de Frango com Catupiry',
    category: 'Salgados Finos',
    unitPrice: 12.0,
    prepared: 45,
    sold: 40,
    estimatedSalesUntilClose: 6,
    trend: 'up',
  },
]

export function getInitialItems(): RiskItem[] {
  return initialRawData.map((item) => {
    const risk = calculateRisk(
      item.prepared,
      item.sold,
      item.estimatedSalesUntilClose,
      item.unitPrice
    )

    return {
      id: item.id,
      name: item.name,
      category: item.category,
      unitPrice: item.unitPrice,
      prepared: item.prepared,
      sold: item.sold,
      currentStock: risk.currentStock,
      estimatedSalesUntilClose: item.estimatedSalesUntilClose,
      projectedSurplus: risk.projectedSurplus,
      estimatedLossValue: risk.estimatedLossValue,
      riskLevel: risk.riskLevel,
      lastOrderAt: new Date(Date.now() - Math.floor(Math.random() * 1800000)), // últimos 30 min
      trend: item.trend,
    }
  })
}
