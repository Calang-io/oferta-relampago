import React from 'react'
import { AlertOctagon, TrendingDown, PackageOpen, DollarSign } from 'lucide-react'
import { useStore } from '../../../context/StoreContext'
import { formatCurrencyBRL } from '../../../utils/calculations'

export const RiskKPICards: React.FC = () => {
  const { summary } = useStore()

  const soldRate =
    summary.totalPrepared > 0
      ? Math.round((summary.totalSold / summary.totalPrepared) * 100)
      : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* Card 1: Valor em Risco */}
      <div className="bg-gradient-to-br from-purple-950/90 via-purple-900/40 to-surface-card border border-brand-amber/30 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden group hover:border-brand-amber/60 transition-all">
        <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-brand-amber/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-1.5 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-300/90 truncate">
            Prejuízo em Risco
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-brand-amber/15 border border-brand-amber/30 flex items-center justify-center text-brand-amber shrink-0">
            <DollarSign className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg sm:text-2xl lg:text-3xl font-black text-brand-amber tracking-tight">
            {formatCurrencyBRL(summary.totalLossValue)}
          </span>
        </div>
        <p className="text-[10px] sm:text-xs text-purple-200/70 mt-1 sm:mt-2 flex items-center gap-1 truncate">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-amber animate-pulse shrink-0" />
          <span className="truncate">Perda prevista sem oferta</span>
        </p>
      </div>

      {/* Card 2: Unidades que Devem Sobrar */}
      <div className="bg-gradient-to-br from-purple-950/90 via-purple-900/40 to-surface-card border border-purple-800/60 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden group hover:border-purple-600 transition-all">
        <div className="flex items-center justify-between mb-1.5 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-300/90 truncate">
            Sobra Projetada
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-purple-800/40 border border-purple-700/50 flex items-center justify-center text-brand-light shrink-0">
            <PackageOpen className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
            {summary.totalSurplusUnits}
          </span>
          <span className="text-[10px] sm:text-xs text-purple-300 font-medium">unidades</span>
        </div>
        <p className="text-[10px] sm:text-xs text-brand-light/80 mt-1 sm:mt-2 truncate">
          Candidatas a promoção
        </p>
      </div>

      {/* Card 3: Itens com Risco Alto */}
      <div className="bg-gradient-to-br from-purple-950/90 via-purple-900/40 to-surface-card border border-brand-amber/30 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden group hover:border-brand-amber transition-all">
        <div className="flex items-center justify-between mb-1.5 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-300/90 truncate">
            Itens Críticos
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-brand-amber/20 border border-brand-amber/40 flex items-center justify-center text-brand-amber shrink-0">
            <AlertOctagon className="w-3.5 h-3.5 sm:w-5 sm:h-5 animate-pulse" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg sm:text-2xl lg:text-3xl font-black text-brand-light tracking-tight">
            {summary.criticalCount}
          </span>
          <span className="text-[10px] sm:text-xs text-purple-300 font-medium truncate">
            de {summary.criticalCount + summary.moderateCount + summary.safeCount} itens
          </span>
        </div>
        <p className="text-[10px] sm:text-xs text-purple-200/70 mt-1 sm:mt-2 truncate">
          Priorizados no topo
        </p>
      </div>

      {/* Card 4: Ritmo de Vendas */}
      <div className="bg-gradient-to-br from-purple-950/90 via-purple-900/40 to-surface-card border border-purple-800/60 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden group hover:border-purple-600 transition-all">
        <div className="flex items-center justify-between mb-1.5 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-300/90 truncate">
            Vendido no Dia
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-purple-800/40 border border-purple-700/50 flex items-center justify-center text-brand-light shrink-0">
            <TrendingDown className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
            {soldRate}%
          </span>
          <span className="text-[10px] sm:text-xs text-purple-300 font-medium truncate">
            ({summary.totalSold}/{summary.totalPrepared} un)
          </span>
        </div>
        <div className="w-full bg-purple-950 rounded-full h-1 sm:h-1.5 mt-2 sm:mt-2.5 overflow-hidden border border-purple-800/50">
          <div
            className="bg-gradient-to-r from-purple-500 via-brand-amber to-brand-yellow h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, soldRate)}%` }}
          />
        </div>
      </div>
    </div>
  )
}
