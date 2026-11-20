import React from 'react'
import { BarChart3, CheckCircle2, Sparkles } from 'lucide-react'
import { formatCurrencyBRL } from '../../../utils/calculations'

export interface WeeklySummaryItem {
  id: string
  label: string
  period: string
  recoveredRevenue: number
  avoidedWasteUnits: number
  totalSurplusUnits: number
  topItemName: string
}

interface WeeklyPerformanceCardProps {
  weeks: WeeklySummaryItem[]
  selectedWeekId: string
  onSelectWeek: (weekId: string) => void
}

export const WeeklyPerformanceCard: React.FC<WeeklyPerformanceCardProps> = ({
  weeks,
  selectedWeekId,
  onSelectWeek,
}) => {
  const maxRevenue = Math.max(...weeks.map((w) => w.recoveredRevenue), 1)

  return (
    <div className="bg-[#160b2e]/90 border border-purple-900/60 rounded-2xl p-3.5 sm:p-5 shadow-lg space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white">
              Evolução Semanal de Recuperação
            </h2>
            <p className="text-[11px] sm:text-xs text-purple-300/75">
              Toque em uma semana para filtrar o ranking de itens que mais sobraram
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/30 self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Histórico de 4 semanas</span>
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {weeks.map((week) => {
          const isSelected = week.id === selectedWeekId
          const barWidth = Math.round((week.recoveredRevenue / maxRevenue) * 100)
          const savedPercent =
            week.totalSurplusUnits > 0
              ? Math.round(
                  (week.avoidedWasteUnits / week.totalSurplusUnits) * 100
                )
              : 0

          return (
            <button
              key={week.id}
              type="button"
              onClick={() => onSelectWeek(week.id)}
              className={`text-left rounded-xl p-3.5 border transition-all flex flex-col justify-between gap-2.5 ${
                isSelected
                  ? 'bg-gradient-to-br from-purple-900/80 via-[#1d0d38] to-[#140a28] border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.18)]'
                  : 'bg-purple-950/50 border-purple-800/50 hover:border-purple-600 hover:bg-purple-950/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className={`text-xs font-extrabold block ${
                      isSelected ? 'text-amber-400' : 'text-white'
                    }`}
                  >
                    {week.label}
                  </span>
                  <span className="text-[11px] text-purple-300/70">
                    {week.period}
                  </span>
                </div>

                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                )}
              </div>

              <div>
                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-base sm:text-lg font-black text-white">
                    {formatCurrencyBRL(week.recoveredRevenue)}
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400">
                    {week.avoidedWasteUnits} un ({savedPercent}%)
                  </span>
                </div>

                {/* Barra de progresso comparativa */}
                <div className="w-full bg-purple-950 rounded-full h-1.5 mt-2 overflow-hidden border border-purple-800/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isSelected
                        ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                        : 'bg-purple-500'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-purple-900/50 text-[11px] text-purple-300/80 truncate">
                Maior sobra: <strong className="text-purple-100">{week.topItemName}</strong>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}