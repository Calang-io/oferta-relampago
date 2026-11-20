import React, { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Minus,
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon,
  Package,
  Trophy,
  Recycle,
} from 'lucide-react'
import type { RiskLevel } from '../../../types/risk'
import { Badge } from '../../../components/ui/Badge'
import { formatCurrencyBRL } from '../../../utils/calculations'

export interface WeeklyItemResult {
  id: string
  rank: number
  name: string
  category: string
  unitPrice: number
  weeklyPrepared: number
  weeklySurplus: number
  recoveredUnits: number
  wastedUnits: number
  recoveredRevenue: number
  avoidedWastePercent: number
  riskLevel: RiskLevel
  trend: 'up' | 'stable' | 'down'
}

interface TopSurplusItemsTableProps {
  items: WeeklyItemResult[]
}

export const TopSurplusItemsTable: React.FC<TopSurplusItemsTableProps> = ({
  items,
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')

  if (items.length === 0) {
    return (
      <div className="py-12 px-4 text-center rounded-xl border border-purple-900/60 bg-[#140a28]/90">
        <Package className="w-10 h-10 text-purple-400/50 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">
          Nenhum item encontrado nesta semana
        </h3>
        <p className="text-xs text-purple-300/70">
          Tente ajustar sua busca ou selecionar outro período semanal.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Seletor de Modo de Exibição (Desktop / Tablet) */}
      <div className="hidden sm:flex items-center justify-end gap-1 text-xs">
        <span className="text-purple-300/60 mr-1 text-[11px]">
          Visualização:
        </span>
        <button
          onClick={() => setViewMode('table')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
            viewMode === 'table'
              ? 'bg-amber-400 text-purple-950 font-bold shadow-sm'
              : 'bg-purple-950/60 text-purple-300 hover:text-amber-300 border border-purple-800/40'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Tabela</span>
        </button>
        <button
          onClick={() => setViewMode('cards')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
            viewMode === 'cards'
              ? 'bg-amber-400 text-purple-950 font-bold shadow-sm'
              : 'bg-purple-950/60 text-purple-300 hover:text-amber-300 border border-purple-800/40'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Cards</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. VISUALIZAÇÃO EM CARDS (MOBILE / SMARTPHONES)           */}
      {/* ========================================================= */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${
          viewMode === 'table' ? 'sm:hidden' : 'block'
        }`}
      >
        {items.map((item) => {
          const isTop3 = item.rank <= 3
          const isCritical = item.riskLevel === 'CRITICAL'

          return (
            <div
              key={item.id}
              className={`rounded-xl p-3.5 sm:p-4 border transition-all relative overflow-hidden flex flex-col justify-between gap-3 ${
                isTop3
                  ? 'bg-gradient-to-br from-[#1d0d38] via-[#170a2c] to-[#120722] border-amber-400/50 shadow-[0_4px_20px_rgba(251,191,36,0.12)] border-l-4 border-l-amber-400'
                  : 'bg-gradient-to-br from-[#190d33] via-[#140826] to-[#10061e] border-purple-700/60 border-l-4 border-l-purple-500'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-black ${
                          isTop3
                            ? 'bg-amber-400 text-purple-950'
                            : 'bg-purple-900 text-purple-200 border border-purple-700/60'
                        }`}
                      >
                        #{item.rank}
                      </span>
                      <h4 className="font-extrabold text-white text-sm leading-snug break-words">
                        {item.name}
                      </h4>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-purple-300/80">
                      <span>{item.category}</span>
                      <span>•</span>
                      <strong className="text-amber-400 font-semibold">
                        {formatCurrencyBRL(item.unitPrice)}
                      </strong>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isCritical ? (
                      <Badge variant="critical" size="sm" dot>
                        Alta Sobra
                      </Badge>
                    ) : (
                      <Badge variant="moderate" size="sm" dot>
                        Recorrente
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Bloco de Destaque: Desperdício Evitado & Receita Recuperada */}
                <div className="mt-2.5 bg-emerald-500/[0.10] border border-emerald-500/35 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Recycle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
                        Desperdício Evitado
                      </span>
                      <span className="text-base font-black text-emerald-300 leading-tight">
                        {item.recoveredUnits} un ({item.avoidedWastePercent}%)
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-purple-300/80 block uppercase">
                      Receita Recuperada
                    </span>
                    <span className="text-sm font-extrabold text-amber-400">
                      {formatCurrencyBRL(item.recoveredRevenue)}
                    </span>
                  </div>
                </div>

                {/* Grade de 4 Métricas Semanais */}
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-purple-900/40 text-center text-xs">
                  <div className="bg-purple-950/50 rounded-lg p-1.5 border border-purple-800/40">
                    <span className="text-[10px] text-purple-300/70 block">
                      Prep. Sem.
                    </span>
                    <strong className="text-purple-100 font-bold text-xs">
                      {item.weeklyPrepared}
                    </strong>
                  </div>
                  <div className="bg-amber-400/15 rounded-lg p-1.5 border border-amber-400/40">
                    <span className="text-[10px] text-amber-300 font-bold block">
                      Sobra Sem.
                    </span>
                    <strong className="text-amber-300 font-black text-xs">
                      {item.weeklySurplus} un
                    </strong>
                  </div>
                  <div className="bg-emerald-500/10 rounded-lg p-1.5 border border-emerald-500/30">
                    <span className="text-[10px] text-emerald-300 font-bold block">
                      Salvas
                    </span>
                    <strong className="text-emerald-300 font-extrabold text-xs">
                      {item.recoveredUnits} un
                    </strong>
                  </div>
                  <div className="bg-purple-950/50 rounded-lg p-1.5 border border-purple-800/40">
                    <span className="text-[10px] text-purple-300/70 block">
                      Perda Real
                    </span>
                    <strong className="text-purple-200 font-bold text-xs">
                      {item.wastedUnits} un
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ========================================================= */}
      {/* 2. VISUALIZAÇÃO EM TABELA (DESKTOP & TABLETS LARGOS)      */}
      {/* ========================================================= */}
      <div
        className={`w-full overflow-x-auto rounded-xl border border-purple-900/60 bg-[#140a28]/90 shadow-xl ${
          viewMode === 'cards' ? 'hidden' : 'hidden sm:block'
        }`}
      >
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-purple-950/80 border-b border-purple-800/60 text-xs font-bold uppercase tracking-wider text-purple-300">
              <th className="py-3.5 px-4 text-center w-14">#</th>
              <th className="py-3.5 px-4 text-purple-200">Item & Categoria</th>
              <th className="py-3.5 px-3 text-center">Preparado (Sem.)</th>
              <th className="py-3.5 px-4 text-center bg-amber-400/10 text-amber-300 border-x border-amber-400/20">
                <div className="flex items-center justify-center gap-1">
                  <span>Sobra na Semana</span>
                  <ArrowUpDown className="w-3 h-3 text-amber-400" />
                </div>
              </th>
              <th className="py-3.5 px-3 text-center">Desperdício Evitado</th>
              <th className="py-3.5 px-3 text-center">Perda Não Evitada</th>
              <th className="py-3.5 px-4 text-right">Receita Recuperada</th>
              <th className="py-3.5 px-4 text-center">Recorrência</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-purple-900/40 text-purple-100">
            {items.map((item) => {
              const isTop3 = item.rank <= 3
              const isCritical = item.riskLevel === 'CRITICAL'

              return (
                <tr
                  key={item.id}
                  className={`transition-colors group ${
                    isTop3
                      ? 'bg-amber-400/[0.07] hover:bg-amber-400/[0.13] border-l-4 border-l-amber-400'
                      : 'hover:bg-purple-950/50 border-l-4 border-l-transparent'
                  }`}
                >
                  {/* 1. Posição no Ranking */}
                  <td className="py-3 px-4 text-center">
                    {isTop3 ? (
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-400 text-purple-950 font-black text-xs shadow-sm">
                        {item.rank === 1 ? (
                          <Trophy className="w-3.5 h-3.5 fill-purple-950" />
                        ) : (
                          `#${item.rank}`
                        )}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-purple-300/70">
                        #{item.rank}
                      </span>
                    )}
                  </td>

                  {/* 2. Item e Categoria */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                          isCritical
                            ? 'bg-amber-400/20 border-amber-400/40 text-amber-300'
                            : 'bg-purple-700/30 border-purple-600/40 text-purple-300'
                        }`}
                      >
                        <AlertTriangle
                          className={`w-4 h-4 ${
                            isCritical ? 'text-amber-400' : 'text-purple-300'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                            {item.name}
                          </span>
                          {item.trend === 'up' && (
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          {item.trend === 'down' && (
                            <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                          )}
                          {item.trend === 'stable' && (
                            <Minus className="w-3.5 h-3.5 text-purple-400" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-purple-300/70 font-medium">
                            {item.category}
                          </span>
                          <span className="text-purple-500">•</span>
                          <span className="text-xs text-amber-400/90 font-medium">
                            {formatCurrencyBRL(item.unitPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 3. Preparado na Semana */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-semibold text-purple-200">
                      {item.weeklyPrepared}
                    </span>
                    <span className="text-[11px] text-purple-400 block">
                      unidades
                    </span>
                  </td>

                  {/* 4. Sobra na Semana (Destaque) */}
                  <td className="py-3 px-4 text-center bg-amber-400/[0.08] border-x border-amber-400/20">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-black text-base text-amber-300">
                        {item.weeklySurplus} un
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400/90 bg-amber-400/20 px-1.5 py-0.2 rounded border border-amber-400/40">
                        {Math.round(
                          (item.weeklySurplus / Math.max(item.weeklyPrepared, 1)) *
                            100
                        )}
                        % do lote
                      </span>
                    </div>
                  </td>

                  {/* 5. Desperdício Evitado */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex flex-col items-center">
                      <span className="font-bold text-emerald-300 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        {item.recoveredUnits} un
                      </span>
                      <span className="text-[11px] text-emerald-400/80 font-medium">
                        {item.avoidedWastePercent}% salvos
                      </span>
                    </div>
                  </td>

                  {/* 6. Perda Não Evitada */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-semibold text-purple-300/80">
                      {item.wastedUnits} un
                    </span>
                  </td>

                  {/* 7. Receita Recuperada */}
                  <td className="py-3 px-4 text-right">
                    <span className="font-extrabold text-amber-400 text-sm">
                      {formatCurrencyBRL(item.recoveredRevenue)}
                    </span>
                  </td>

                  {/* 8. Recorrência */}
                  <td className="py-3 px-4 text-center">
                    {isCritical ? (
                      <Badge variant="critical" size="sm" dot>
                        Alta Sobra
                      </Badge>
                    ) : (
                      <Badge variant="moderate" size="sm" dot>
                        Recorrente
                      </Badge>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}