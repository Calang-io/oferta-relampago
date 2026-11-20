import React, { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  Flame,
  ArrowUpDown,
  LayoutGrid,
  Table as TableIcon,
  Package,
} from 'lucide-react'
import type { RiskItem } from '../../../types/risk'
import { Badge } from '../../../components/ui/Badge'
import { formatCurrencyBRL } from '../../../utils/calculations'
import { useStore } from '../../../context/StoreContext'
import { useNavigate } from 'react-router-dom'

interface RiskTableProps {
  items: RiskItem[]
}

export const RiskTable: React.FC<RiskTableProps> = ({ items }) => {
  const { simulateIncomingOrder } = useStore()
  const navigate = useNavigate()

  // Preferência de visualização (em mobile força 'cards', em desktop permite alternar)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table')

  if (items.length === 0) {
    return (
      <div className="py-12 px-4 text-center rounded-xl border border-purple-900/60 bg-surface-table/90">
        <Package className="w-10 h-10 text-purple-400/50 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white mb-1">Nenhum item encontrado</h3>
        <p className="text-xs text-purple-300/70">
          Tente ajustar sua busca ou limpar os filtros aplicados.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Seletor de Modo de Exibição */}
      <div className="hidden sm:flex items-center justify-end gap-1 text-xs">
        <span className="text-purple-300/60 mr-1 text-[11px]">Visualização:</span>
        <button
          onClick={() => setViewMode('table')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
            viewMode === 'table'
              ? 'bg-brand-amber text-purple-950 font-bold shadow-sm'
              : 'bg-purple-950/60 text-purple-300 hover:text-brand-light border border-purple-800/40'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          <span>Tabela</span>
        </button>
        <button
          onClick={() => setViewMode('cards')}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-md transition-all ${
            viewMode === 'cards'
              ? 'bg-brand-amber text-purple-950 font-bold shadow-sm'
              : 'bg-purple-950/60 text-purple-300 hover:text-brand-light border border-purple-800/40'
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Cards</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* 1. VISUALIZAÇÃO EM CARDS (PADRÃO PARA MOBILE / SMARTPHONES) */}
      {/* ========================================================= */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${
          viewMode === 'table' ? 'sm:hidden' : 'block'
        }`}
      >
        {items.map((item) => {
          const hasSurplus = item.projectedSurplus > 0
          const isCritical = item.riskLevel === 'CRITICAL'
          const isModerate = item.riskLevel === 'MODERATE'

          return (
            <div
              key={item.id}
              className={`rounded-xl p-3.5 sm:p-4 border transition-all relative overflow-hidden flex flex-col justify-between gap-3 ${
                isCritical
                  ? 'bg-gradient-to-br from-surface-critical via-surface-critical-mid to-surface-critical-end border-brand-amber/50 shadow-[0_4px_20px_rgba(251,191,36,0.12)] border-l-4 border-l-brand-amber'
                  : isModerate
                  ? 'bg-gradient-to-br from-surface-moderate via-surface-moderate-mid to-surface-moderate-end border-purple-700/60 border-l-4 border-l-purple-500'
                  : 'bg-surface-table/90 border-purple-900/50 border-l-4 border-l-risk-safe/50'
              }`}
            >
              {/* Header do Card */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-extrabold text-white text-sm leading-snug break-words">
                        {item.name}
                      </h4>
                      {item.trend === 'up' && (
                        <span title="Ritmo de saída acelerado">
                          <TrendingUp className="w-3.5 h-3.5 text-risk-safe shrink-0" />
                        </span>
                      )}
                      {item.trend === 'down' && (
                        <span title="Ritmo de saída abaixo da média">
                          <TrendingDown className="w-3.5 h-3.5 text-brand-amber shrink-0" />
                        </span>
                      )}
                      {item.trend === 'stable' && (
                        <span title="Ritmo constante">
                          <Minus className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 text-xs text-purple-300/80">
                      <span>{item.category}</span>
                      <span>•</span>
                      <strong className="text-brand-amber font-semibold">
                        {formatCurrencyBRL(item.unitPrice)}
                      </strong>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isCritical ? (
                      <Badge variant="critical" size="sm" dot>
                        Risco Alto
                      </Badge>
                    ) : isModerate ? (
                      <Badge variant="moderate" size="sm" dot>
                        Risco Médio
                      </Badge>
                    ) : (
                      <Badge variant="safe" size="sm">
                        Equilibrado
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Bloco de Destaque Máximo: Sobra & Prejuízo Previsto */}
                {hasSurplus ? (
                  <div className="mt-2.5 bg-brand-amber/[0.12] border border-brand-amber/40 rounded-xl p-2.5 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-brand-amber/20 text-brand-amber flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-brand-light block">
                          Sobra Prevista
                        </span>
                        <span className="text-base font-black text-brand-light leading-tight">
                          +{item.projectedSurplus} un
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-semibold text-purple-300/80 block uppercase">
                        Prejuízo Estimado
                      </span>
                      <span className="text-sm font-extrabold text-brand-amber">
                        {formatCurrencyBRL(item.estimatedLossValue)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2.5 bg-risk-safe/[0.08] border border-risk-safe/30 rounded-xl p-2 flex items-center gap-2 text-xs text-risk-safe font-medium">
                    <CheckCircle2 className="w-4 h-4 text-risk-safe shrink-0" />
                    <span>Demanda estimada absorve todo o estoque preparado.</span>
                  </div>
                )}

                {/* Grade de 4 Métricas Operacionais */}
                <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-purple-900/40 text-center text-xs">
                  <div className="bg-purple-950/50 rounded-lg p-1.5 border border-purple-800/40">
                    <span className="text-[10px] text-purple-300/70 block">Preparado</span>
                    <strong className="text-purple-100 font-bold text-xs">{item.prepared}</strong>
                  </div>
                  <div className="bg-purple-950/50 rounded-lg p-1.5 border border-purple-800/40">
                    <span className="text-[10px] text-purple-300/70 block">Vendido</span>
                    <strong className="text-purple-100 font-bold text-xs">{item.sold}</strong>
                  </div>
                  <div className="bg-purple-900/60 rounded-lg p-1.5 border border-purple-700/60">
                    <span className="text-[10px] text-brand-light font-bold block">Estoque</span>
                    <strong className="text-white font-extrabold text-xs">{item.currentStock}</strong>
                  </div>
                  <div className="bg-purple-950/50 rounded-lg p-1.5 border border-purple-800/40">
                    <span className="text-[10px] text-purple-300/70 block">Venda Est.</span>
                    <strong className="text-purple-200 font-bold text-xs">~{item.estimatedSalesUntilClose}</strong>
                  </div>
                </div>
              </div>

              {/* Botões de Ação para Celular */}
              <div className="flex items-center gap-2 pt-2 border-t border-purple-900/40">
                <button
                  onClick={() => simulateIncomingOrder(item.id)}
                  disabled={item.currentStock <= 0}
                  className="flex-1 flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-xl border border-purple-700/70 bg-purple-950/80 active:bg-purple-900 text-purple-200 active:text-brand-amber text-xs font-bold transition-all disabled:opacity-30 disabled:pointer-events-none"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-amber" />
                  <span>+1 Venda</span>
                </button>

                {hasSurplus && (
                  <button
                    onClick={() => navigate('/oferta-relampago')}
                    className="flex-1 flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-xl bg-gradient-to-r from-brand-amber to-brand-gold active:scale-95 text-purple-950 font-black text-xs shadow-md transition-all"
                  >
                    <Flame className="w-3.5 h-3.5 fill-purple-950" />
                    <span>Criar Oferta</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ========================================================= */}
      {/* 2. VISUALIZAÇÃO EM TABELA (DESKTOP & TABLETS LARGOS)      */}
      {/* ========================================================= */}
      <div
        className={`w-full overflow-x-auto rounded-xl border border-purple-900/60 bg-surface-table/90 shadow-xl ${
          viewMode === 'cards' ? 'hidden' : 'hidden sm:block'
        }`}
      >
        <table className="w-full text-left border-collapse text-sm">
          {/* Table Head */}
          <thead>
            <tr className="bg-purple-950/80 border-b border-purple-800/60 text-xs font-bold uppercase tracking-wider text-purple-300">
              <th className="py-3.5 px-4 text-purple-200">Item & Categoria</th>
              <th className="py-3.5 px-3 text-center">Preparado</th>
              <th className="py-3.5 px-3 text-center">Vendido</th>
              <th className="py-3.5 px-3 text-center">Estoque Atual</th>
              <th className="py-3.5 px-3 text-center">Venda Estimada (até Fechamento)</th>
              <th className="py-3.5 px-4 text-center bg-brand-amber/10 text-brand-light border-x border-brand-amber/20">
                <div className="flex items-center justify-center gap-1">
                  <span>Sobra Prevista</span>
                  <ArrowUpDown className="w-3 h-3 text-brand-amber" />
                </div>
              </th>
              <th className="py-3.5 px-4 text-right">Prejuízo Potencial</th>
              <th className="py-3.5 px-4 text-center">Status / Risco</th>
              <th className="py-3.5 px-4 text-center">Ações Rápidas</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-purple-900/40 text-purple-100">
            {items.map((item) => {
              const hasSurplus = item.projectedSurplus > 0
              const isCritical = item.riskLevel === 'CRITICAL'
              const isModerate = item.riskLevel === 'MODERATE'

              return (
                <tr
                  key={item.id}
                  className={`transition-colors group ${
                    isCritical
                      ? 'bg-brand-amber/[0.07] hover:bg-brand-amber/[0.13] border-l-4 border-l-brand-amber'
                      : isModerate
                      ? 'bg-purple-900/[0.15] hover:bg-purple-900/[0.3] border-l-4 border-l-purple-500'
                      : 'hover:bg-purple-950/50 border-l-4 border-l-transparent'
                  }`}
                >
                  {/* 1. Item e Categoria */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {isCritical ? (
                        <div
                          className="w-8 h-8 rounded-lg bg-brand-amber/20 border border-brand-amber/40 flex items-center justify-center text-brand-light shrink-0"
                          title="Item em risco crítico de sobra e desperdício"
                        >
                          <AlertTriangle className="w-4 h-4 text-brand-amber animate-pulse" />
                        </div>
                      ) : isModerate ? (
                        <div
                          className="w-8 h-8 rounded-lg bg-purple-700/30 border border-purple-600/40 flex items-center justify-center text-purple-300 shrink-0"
                          title="Risco moderado de sobra"
                        >
                          <AlertTriangle className="w-4 h-4 text-purple-300" />
                        </div>
                      ) : (
                        <div
                          className="w-8 h-8 rounded-lg bg-risk-safe/10 border border-risk-safe/30 flex items-center justify-center text-risk-safe shrink-0"
                          title="Demanda absorve o estoque projetado"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm group-hover:text-brand-light transition-colors">
                            {item.name}
                          </span>
                          {item.trend === 'up' && (
                            <span title="Ritmo de saída acelerado">
                              <TrendingUp className="w-3.5 h-3.5 text-risk-safe" />
                            </span>
                          )}
                          {item.trend === 'down' && (
                            <span title="Ritmo de saída abaixo da média">
                              <TrendingDown className="w-3.5 h-3.5 text-brand-amber" />
                            </span>
                          )}
                          {item.trend === 'stable' && (
                            <span title="Ritmo constante">
                              <Minus className="w-3.5 h-3.5 text-purple-400" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-purple-300/70 font-medium">
                            {item.category}
                          </span>
                          <span className="text-purple-500">•</span>
                          <span className="text-xs text-brand-amber font-medium">
                            {formatCurrencyBRL(item.unitPrice)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Preparado */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-semibold text-purple-200">
                      {item.prepared}
                    </span>
                    <span className="text-[11px] text-purple-400 block">unidades</span>
                  </td>

                  {/* 3. Vendido */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-semibold text-purple-200">
                      {item.sold}
                    </span>
                    <span className="text-[11px] text-purple-400/80 block">
                      {Math.round((item.sold / item.prepared) * 100)}%
                    </span>
                  </td>

                  {/* 4. Estoque Atual */}
                  <td className="py-3 px-3 text-center">
                    <span className="font-bold text-white bg-purple-900/60 px-2 py-0.5 rounded-md border border-purple-700/50">
                      {item.currentStock} un
                    </span>
                  </td>

                  {/* 5. Venda Estimada até Fechamento */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-medium text-purple-200">
                        ~ {item.estimatedSalesUntilClose} un
                      </span>
                      <span className="text-[10px] text-purple-400/70">
                        ritmo histórico
                      </span>
                    </div>
                  </td>

                  {/* 6. Sobra Prevista (DESTAQUE MÁXIMO) */}
                  <td className="py-3 px-4 text-center bg-brand-amber/[0.08] border-x border-brand-amber/20">
                    {hasSurplus ? (
                      <div className="inline-flex flex-col items-center">
                        <span className="font-black text-base text-brand-light flex items-center gap-1 drop-shadow-sm">
                          +{item.projectedSurplus} un
                        </span>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-brand-amber bg-brand-amber/20 px-1.5 py-0.2 rounded border border-brand-amber/40">
                          Vai Sobrar
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-risk-safe font-medium inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Esgota / 0 sobra
                      </span>
                    )}
                  </td>

                  {/* 7. Prejuízo Potencial */}
                  <td className="py-3 px-4 text-right">
                    {hasSurplus ? (
                      <span className="font-bold text-brand-amber text-sm">
                        {formatCurrencyBRL(item.estimatedLossValue)}
                      </span>
                    ) : (
                      <span className="text-xs text-purple-400/60">R$ 0,00</span>
                    )}
                  </td>

                  {/* 8. Status / Risco */}
                  <td className="py-3 px-4 text-center">
                    {isCritical ? (
                      <Badge variant="critical" size="sm" dot>
                        Risco Alto
                      </Badge>
                    ) : isModerate ? (
                      <Badge variant="moderate" size="sm" dot>
                        Risco Médio
                      </Badge>
                    ) : (
                      <Badge variant="safe" size="sm">
                        Equilibrado
                      </Badge>
                    )}
                  </td>

                  {/* 9. Ações Rápidas */}
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => simulateIncomingOrder(item.id)}
                        disabled={item.currentStock <= 0}
                        title="Simular pedido deste item para ver recálculo"
                        className="p-1.5 rounded-lg border border-purple-700/60 bg-purple-950/60 text-purple-300 hover:text-brand-light hover:border-brand-amber/50 hover:bg-purple-900/60 text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none transition-all min-h-[32px] min-w-[32px] flex items-center justify-center"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-brand-amber" />
                      </button>

                      {hasSurplus ? (
                        <button
                          onClick={() => navigate('/oferta-relampago')}
                          title="Criar Oferta Relâmpago para este item"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-amber hover:bg-brand-light text-purple-950 font-bold text-xs shadow-sm transition-all active:scale-95 min-h-[32px]"
                        >
                          <Flame className="w-3.5 h-3.5 fill-purple-950" />
                          <span>Ofertar</span>
                        </button>
                      ) : (
                        <span className="text-xs text-purple-400/40">—</span>
                      )}
                    </div>
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
