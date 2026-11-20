import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { RiskItem, StoreOrder } from '../types/risk'
import { getInitialItems } from '../mocks/mockData'
import { applyProduction, loadSettings, persistSettings, restaurantDate, validateConfig, validateProduction } from '../features/settings/settings-model'
import type { DailyProduction, OperationConfig } from '../features/settings/settings-model'
import { DEMO_HISTORICAL_AVERAGES } from '../features/settings/demo-history'
import { getFlashDeals, getOfferWindow, placeInventoryOrder, rebaseOffers, reconcileOffers, reconfigureOffers } from '../features/flash-deals/flash-deals-model'
import type { OfferBook } from '../features/flash-deals/flash-deals-model'

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
  flashDeals: ReturnType<typeof getFlashDeals>
  offerWindow: ReturnType<typeof getOfferWindow>
  offersPaused: boolean
  now: Date
  toggleOffersPaused: () => void
  toggleOfferPaused: (itemId: string) => void
  purchaseFlashDeal: (itemId: string) => void
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
  const config = settingsSnapshot.config
  const production = settingsSnapshot.production
  const [now, setNow] = useState(() => new Date())
  const [inventory, setInventory] = useState(() => {
    const items = applyProduction(getInitialItems(), settingsSnapshot.production, DEMO_HISTORICAL_AVERAGES, productionDate)
    const offers: OfferBook = reconcileOffers({ cycle: '', paused: false, pausedItems: [], allocations: [] }, items, config, new Date())
    return { items, recentOrders: [] as StoreOrder[], lastUpdated: new Date(), offers }
  })
  const { items, recentOrders, lastUpdated } = inventory
  const offerWindow = getOfferWindow(config, now)
  const offerBook = reconcileOffers(inventory.offers, items, config, now)
  const flashDeals = getFlashDeals(offerBook, items, config, now)

  // O relógio pertence ao contexto: ofertas continuam atualizando em outras telas.
  useEffect(() => {
    const tick = () => {
      const timestamp = new Date()
      setNow(timestamp)
      setInventory(previous => {
        const offers = reconcileOffers(previous.offers, previous.items, config, timestamp)
        return offers === previous.offers ? previous : { ...previous, offers }
      })
    }
    const timer = window.setInterval(tick, 1000)
    window.addEventListener('focus', tick)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', tick) }
  }, [config])

  const toggleOffersPaused = () => setInventory(previous => {
    const offers = reconcileOffers(previous.offers, previous.items, config, new Date())
    return { ...previous, offers: { ...offers, paused: !offers.paused } }
  })

  const toggleOfferPaused = (itemId: string) => setInventory(previous => {
    const offers = reconcileOffers(previous.offers, previous.items, config, new Date())
    const pausedItems = offers.pausedItems.includes(itemId) ? offers.pausedItems.filter(id => id !== itemId) : [...offers.pausedItems, itemId]
    return { ...previous, offers: { ...offers, pausedItems } }
  })
  // Aplicação sempre com autopedido ON por padrão contínuo
  const [isLiveSimulationActive, setIsLiveSimulationActive] = useState<boolean>(true)

  const updateConfig = (nextConfig: OperationConfig) => {
    if (Object.keys(validateConfig(nextConfig)).length) throw new Error('Configurações inválidas.')
    const previousConfig = snapshotRef.current.config
    const next = { ...snapshotRef.current, config: structuredClone(nextConfig) }
    persistSettings(next)
    snapshotRef.current = next
    setSettingsSnapshot(next)
    setInventory(previous => ({ ...previous, offers: reconfigureOffers(previous.offers, previous.items, previousConfig, next.config, new Date()), lastUpdated: new Date() }))
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
    setInventory(previous => {
      const items = applyProduction(previous.items, nextProduction, DEMO_HISTORICAL_AVERAGES, today)
      return { ...previous, items, offers: reconcileOffers(previous.offers, items, next.config, new Date()), lastUpdated: new Date() }
    })
  }

  // A confirmação e os pedidos simulados pertencem ao dia do restaurante.
  useEffect(() => {
    const checkDate = () => {
      const today = restaurantDate()
      if (today === productionDate) return
      setProductionDate(today)
      setInventory(previous => {
        const items = applyProduction(previous.items.map(item => ({ ...item, sold: 0, lastOrderAt: undefined })), snapshotRef.current.production, DEMO_HISTORICAL_AVERAGES, today)
        return { ...previous, items, offers: rebaseOffers(previous.offers, previous.items, items), recentOrders: [], lastUpdated: new Date() }
      })
    }
    const timer = window.setInterval(checkDate, 15000)
    window.addEventListener('focus', checkDate)
    return () => { window.clearInterval(timer); window.removeEventListener('focus', checkDate) }
  }, [productionDate])

  // Estoque e pedido são atualizados juntos; o updater permanece puro no StrictMode.
  const placeOrder = useCallback((specificItemId?: string, offerOnly = false) => {
    const timestamp = new Date()
    const random = Math.random()
    const orderId = `PED-${timestamp.getTime()}-${Math.floor(Math.random() * 10000)}`
    setInventory(previous => placeInventoryOrder(previous, config, timestamp, random, orderId, specificItemId, offerOnly))
  }, [config])

  const simulateIncomingOrder = useCallback((itemId?: string) => placeOrder(itemId), [placeOrder])
  const purchaseFlashDeal = (itemId: string) => placeOrder(itemId, true)

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
    setInventory({ items: applyProduction(getInitialItems(), production, DEMO_HISTORICAL_AVERAGES, productionDate), recentOrders: [], lastUpdated: new Date(), offers: { cycle: '', paused: false, pausedItems: [], allocations: [] } })
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
        flashDeals,
        offerWindow,
        offersPaused: offerBook.paused,
        now,
        toggleOffersPaused,
        toggleOfferPaused,
        purchaseFlashDeal,
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
