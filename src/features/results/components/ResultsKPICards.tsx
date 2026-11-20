import React from 'react'
import { DollarSign, Recycle, Flame, TrendingUp } from 'lucide-react'
import { formatCurrencyBRL } from '../../../utils/calculations'

export interface WeeklyKPIStats {
  recoveredRevenue: number
  previousWeekRevenue: number
  avoidedWasteUnits: number
  totalSurplusGenerated: number
  recoveryRate: number
  activeDealsCount: number
}

interface ResultsKPICardsProps {
  stats: WeeklyKPIStats
  weekLabel: string
}

export const ResultsKPICards: React.FC<ResultsKPICardsProps> = ({
  stats,
  weekLabel,
}) => {
  const revenueDelta =
    stats.previousWeekRevenue > 0
      ? Math.round(
          ((stats.recoveredRevenue - stats.previousWeekRevenue) /
            stats.previousWeekRevenue) *
            100
        )
      : 0

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* Card 1: Receita Recuperada */}
      <div className="bg-gradient-to-br from-purple-950/90 via-purple-900/40 to-[#1b0d30] border border-amber-400/30 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden group hover:border-amber-400/60 transition-all">
        <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-1.5 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-300/90 truncate">
            Receita Recuperada
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
            <DollarSign className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg sm:text-2xl lg:text-3xl font-black text-amber-400 tracking-tight">
            {formatCurrencyBRL(stats.recoveredRevenue)}
          </span>
        </div>
        <p className="text-[10px] sm:text-xs text-emerald-300/90 mt-1 sm:mt-2 flex items-center gap-1 truncate">
          <TrendingUp className="w-3 h-3 text-emerald-400 shrink-0" />
          <span className="truncate">
            {revenueDelta >= 0 ? `+${revenueDelta}%` : `${revenueDelta}%`} vs. semana anterior
          </span>
        </p>
      </div>

      {/* Card 2: Desperdício Evitado */}
      <div className="bg-gradient-to-br from-purple-950/90 via-purple-900/40 to-[#1b0d30] border border-emerald-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden group hover:border-emerald-400/60 transition-all">
        <div className="absolute top-0 right-0 w-16 sm:w-24 h-16 sm:h-24 bg-emerald-400/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-1.5 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-300/90 truncate">
            Desperdício Evitado
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Recycle className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
            {stats.avoidedWasteUnits}
          </span>
          <span className="text-[10px] sm:text-xs text-emerald-300 font-semibold">
            un salvas
          </span>
        </div>
        <p className="text-[10px] sm:text-xs text-purple-200/70 mt-1 sm:mt-2 truncate">
          De {stats.totalSurplusGenerated} un excedentes ({weekLabel})
        </p>
      </div>

      {/* Card 3: Aproveitamento das Ofertas */}
      <div className="bg-gradient-to-br from-purple-950/90 via-purple-900/40 to-[#1b0d30] border border-purple-800/60 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden group hover:border-purple-600 transition-all">
        <div className="flex items-center justify-between mb-1.5 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-300/90 truncate">
            Taxa de Aproveitamento
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-purple-800/40 border border-purple-700/50 flex items-center justify-center text-amber-300 shrink-0">
            <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
            {stats.recoveryRate}%
          </span>
          <span className="text-[10px] sm:text-xs text-purple-300 font-medium truncate">
            da sobra vendida
          </span>
        </div>
        <div className="w-full bg-purple-950 rounded-full h-1 sm:h-1.5 mt-2 sm:mt-2.5 overflow-hidden border border-purple-800/50">
          <div
            className="bg-gradient-to-r from-emerald-400 via-amber-400 to-yellow-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, stats.recoveryRate)}%` }}
          />
        </div>
      </div>

      {/* Card 4: Ofertas Relâmpago Ativadas */}
      <div className="bg-gradient-to-br from-purple-950/90 via-purple-900/40 to-[#1b0d30] border border-amber-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-lg relative overflow-hidden group hover:border-amber-400 transition-all">
        <div className="flex items-center justify-between mb-1.5 sm:mb-3">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-purple-300/90 truncate">
            Ofertas Concluídas
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
            <Flame className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-lg sm:text-2xl lg:text-3xl font-black text-amber-300 tracking-tight">
            {stats.activeDealsCount}
          </span>
          <span className="text-[10px] sm:text-xs text-purple-300 font-medium truncate">
            itens ofertados
          </span>
        </div>
        <p className="text-[10px] sm:text-xs text-purple-200/70 mt-1 sm:mt-2 truncate">
          Nas últimas horas de operação
        </p>
      </div>
    </div>
  )
}