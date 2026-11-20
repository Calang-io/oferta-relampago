import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { RiskItem, StoreOrder } from '../types/risk'
import { getInitialItems } from '../mocks/mockData'
import { calculateRisk } from '../utils/calculations'
import { applyProduction, loadSettings, persistSettings, restaurantDate, validateConfig, validateProduction } from '../features/settings/settings-model'
import type { DailyProduction, OperationConfig } from '../features/settings/settings-model'
import { DEMO_HISTORICAL_AVERAGES } from '../features/settings/demo-history'

interface StoreContextType {
  items: RiskItem[]
  recentOrders: StoreOrder[]
  config: OperationConfig
  production: DailyProduction | null
  productionDate: string
  historicalAverages: Record<string, number | null>
  updateConfig: (config: OperationConfig) => void
  confirmProduction: (quantities: Record<string, number>) => void
  lastUpdated: Date
  isLiveSimulationActive: boolean
  toggleLiveSimulation: () => void
  simulateIncomingOrder: (specificItemId?: string) => void
  resetToDefault: () => void
  summary: {
    totalSurplusUnits: number
    totalLossValue: number
    criticalCount: number
    moderateCount: number
    safeCount: number
    totalPrepared: number
    totalSold: number
  }
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settingsSnapshot, setSettingsSnapshot] = useState(loadSettings)
  const snapshotRef = useRef(settingsSnapshot)
  const [productionDate, setProductionDate] = useState(restaurantDate)
  const [items, setItems] = useState<RiskItem[]>(() => applyProduction(getInitialItems(), settingsSnapshot.production, DEMO_HISTORICAL_AVERAGES, productionDate))
  const [recentOrders, setRecentOrders] = useState<StoreOrder[]>([])
  const config = settingsSnapshot.config
  const production = settingsSnapshot.production
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date())
  // Aplicação sempre com autopedido ON por padrão contínuo
  const [isLiveSimulationActive, setIsLiveSimulationActive] = useState<boolean>(true)

  const updateConfig = (nextConfig: OperationConfig) => {
    if (Object.keys(validateConfig(nextConfig)).length) throw new Error('Configurações inválidas.')
    const next = { ...snapshotRef.current, config: structuredClone(nextConfig) }
    persistSettings(next)
    snapshotRef.current = next
    setSettingsSnapshot(next)
    setLastUpdated(new Date())
  }

  const confirmProduction = (quantities: Record<string, number>) => {
    const today = restaurantDate()
    if (today !== productionDate) throw new Error('O dia mudou. Confira a produção novamente.')
    if (Object.keys(validateProduction(quantities, items)).length) throw new Error('Revise os totais: novos pedidos podem ter entrado.')
    const nextProduction: DailyProduction = { date: today, quantities: structuredClone(quantities), confirmedAt: new Date().toISOString() }
    const next = { ...snapshotRef.current, production: nextProduction }
    persistSettings(next)
    snapshotRef.current = next
    setSettingsSnapshot(next)
    setItems(previous => applyProduction(previous, nextProduction, DEMO_HISTORICAL_AVERAGES, today))
    setLastUpdated(new Date())
  }

  // A confirmação e os pedidos simulados pertencem ao dia do restaurante.
  useEffect(() => {
    const checkDate = () => {
      const today = restaurantDate()
      if (today === productionDate) return
      setProductionDate(today)
      setItems(previous => applyProduction(previous.map(item => ({ ...item, sold: 0, lastOrderAt: undefined })), snapshotRef.current.production, DEMO_HISTORICAL_AVERAGES, today))
      setRecentOrders([])
      setLastUpdated(new Date())
    }
    const timer = window.setInterval(checkDate, 15000)
    window.addEventListener('focus', checkDate)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', checkDate) }
  }, [productionDate])

  // Dispara um novo pedido em tempo real
  const simulateIncomingOrder = useCallback((specificItemId?: string) => {
    setItems((prevItems) => {
      if (prevItems.length === 0) return prevItems

      // Escolhe um item específico ou um item aleatório com estoque > 0
      const availableItems = prevItems.filter((i) => i.currentStock > 0)
      if (availableItems.length === 0) return prevItems

      let targetItem = specificItemId
        ? prevItems.find((i) => i.id === specificItemId)
        : null

      if (!targetItem || targetItem.currentStock <= 0) {
        // Ponderar levemente para itens em risco para simular vendas naturais
        const randomIndex = Math.floor(Math.random() * availableItems.length)
        targetItem = availableItems[randomIndex]
      }

      const qtyBought = Math.min(targetItem.currentStock, Math.floor(Math.random() * 2) + 1)
      const now = new Date()

      // Registrar o pedido no histórico
      const newOrder: StoreOrder = {
        id: `PED-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: now,
        items: [
          {
            itemId: targetItem.id,
            itemName: targetItem.name,
            quantity: qtyBought,
            price: targetItem.unitPrice,
          },
        ],
        total: qtyBought * targetItem.unitPrice,
      }

      setRecentOrders((prev) => [newOrder, ...prev.slice(0, 9)])
      setLastUpdated(now)

      // Atualiza o item e recalcula o risco
      return prevItems.map((item) => {
        if (item.id === targetItem!.id) {
          const newSold = item.sold + qtyBought
          // Conforme os pedidos entram perto do fechamento, a estimativa restante pode ajustar
          const remainingTimeFactor = 0.95
          const newEstimatedSales = Math.max(
            0,
            Math.round(item.estimatedSalesUntilClose * remainingTimeFactor)
          )

          const risk = calculateRisk(
            item.prepared,
            newSold,
            newEstimatedSales,
            item.unitPrice
          )

          return {
            ...item,
            sold: newSold,
            currentStock: risk.currentStock,
            estimatedSalesUntilClose: newEstimatedSales,
            projectedSurplus: risk.projectedSurplus,
            estimatedLossValue: risk.estimatedLossValue,
            riskLevel: risk.riskLevel,
            lastOrderAt: now,
          }
        }
        return item
      })
    })
  }, [])

  // Simulação periódica de novos pedidos caso o toggle esteja ativo
  useEffect(() => {
    if (!isLiveSimulationActive) return

    const interval = setInterval(() => {
      simulateIncomingOrder()
    }, 7000) // a cada 7 segundos entra um pedido simulado

    return () => clearInterval(interval)
  }, [isLiveSimulationActive, simulateIncomingOrder])

  const toggleLiveSimulation = () => {
    setIsLiveSimulationActive((prev) => !prev)
  }

  const resetToDefault = () => {
    setItems(applyProduction(getInitialItems(), production, DEMO_HISTORICAL_AVERAGES, productionDate))
    setRecentOrders([])
    setLastUpdated(new Date())
  }

  const summary = useMemo(() => {
    let totalSurplusUnits = 0
    let totalLossValue = 0
    let criticalCount = 0
    let moderateCount = 0
    let safeCount = 0
    let totalPrepared = 0
    let totalSold = 0

    for (const item of items) {
      totalSurplusUnits += item.projectedSurplus
      totalLossValue += item.estimatedLossValue
      totalPrepared += item.prepared
      totalSold += item.sold

      if (item.riskLevel === 'CRITICAL') criticalCount++
      else if (item.riskLevel === 'MODERATE') moderateCount++
      else safeCount++
    }

    return {
      totalSurplusUnits,
      totalLossValue,
      criticalCount,
      moderateCount,
      safeCount,
      totalPrepared,
      totalSold,
    }
  }, [items])

  return (
    <StoreContext.Provider
      value={{
        items,
        recentOrders,
        config,
        production,
        productionDate,
        historicalAverages: DEMO_HISTORICAL_AVERAGES,
        updateConfig,
        confirmProduction,
        lastUpdated,
        isLiveSimulationActive,
        toggleLiveSimulation,
        simulateIncomingOrder,
        resetToDefault,
        summary,
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export const useStore = () => {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider')
  }
  return context
}
