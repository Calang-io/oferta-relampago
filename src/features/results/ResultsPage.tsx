import React, { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  Flame,
  Info,
  Calendar,
  X,
  ArrowRight,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { getInitialItems } from '../../mocks/mockData'
import { Pagination } from '../../components/ui/Pagination'
import {
  ResultsKPICards,
  type WeeklyKPIStats,
} from './components/ResultsKPICards'
import {
  WeeklyPerformanceCard,
  type WeeklySummaryItem,
} from './components/WeeklyPerformanceCard'
import {
  TopSurplusItemsTable,
  type WeeklyItemResult,
} from './components/TopSurplusItemsTable'

interface WeekPreset {
  id: string
  label: string
  period: string
  surplusFactor: number
  recoveryRate: number
  discountAvg: number
}

const WEEK_PRESETS: WeekPreset[] = [
  {
    id: 'week-current',
    label: 'Semana Atual',
    period: 'Seg – Dom (Em andamento)',
    surplusFactor: 5.2,
    recoveryRate: 0.78,
    discountAvg: 0.35,
  },
  {
    id: 'week-last',
    label: 'Semana Passada',
    period: 'Semana -1',
    surplusFactor: 6.0,
    recoveryRate: 0.74,
    discountAvg: 0.38,
  },
  {
    id: 'week-2',
    label: 'Há 2 Semanas',
    period: 'Semana -2',
    surplusFactor: 6.4,
    recoveryRate: 0.68,
    discountAvg: 0.4,
  },
  {
    id: 'week-3',
    label: 'Há 3 Semanas',
    period: 'Semana -3',
    surplusFactor: 6.8,
    recoveryRate: 0.61,
    discountAvg: 0.42,
  },
]

export const ResultsPage: React.FC = () => {
  const { items: storeItems, config } = useStore()
  const navigate = useNavigate()

  const [selectedWeekId, setSelectedWeekId] = useState<string>('week-current')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)

  // Utiliza os itens ativos do Store (inicializados a partir de src/mocks/mockData.ts)
  const baseItems = useMemo(() => {
    return storeItems.length > 0 ? storeItems : getInitialItems()
  }, [storeItems])

  // Calcula os resultados semanais para cada semana a partir dos dados do mock
  const weeklyDatasets = useMemo(() => {
    const map: Record<
      string,
      {
        preset: WeekPreset
        items: WeeklyItemResult[]
        stats: WeeklyKPIStats
      }
    > = {}

    WEEK_PRESETS.forEach((preset, weekIdx) => {
      const surplusCandidates = baseItems
        .map((item, idx) => {
          // Base semanal derivada da sobra projetada / ritmo de cada produto do mock
          const rawSurplus =
            item.projectedSurplus > 0
              ? item.projectedSurplus
              : Math.max(1, Math.round((item.prepared - item.sold) * 0.4))

          const variation = 1 + ((idx + weekIdx) % 3) * 0.08
          const weeklySurplus = Math.max(
            2,
            Math.round(rawSurplus * preset.surplusFactor * variation)
          )
          const weeklyPrepared = Math.round(item.prepared * 6)

          const itemRecoveryRate = Math.min(
            0.94,
            Math.max(0.45, preset.recoveryRate + ((idx % 4) - 1.5) * 0.05)
          )

          const recoveredUnits = Math.min(
            weeklySurplus,
            Math.round(weeklySurplus * itemRecoveryRate)
          )
          const wastedUnits = Math.max(0, weeklySurplus - recoveredUnits)
          const discountedUnitPrice =
            item.unitPrice * (1 - preset.discountAvg)
          const recoveredRevenue = Number(
            (recoveredUnits * discountedUnitPrice).toFixed(2)
          )
          const avoidedWastePercent =
            weeklySurplus > 0
              ? Math.round((recoveredUnits / weeklySurplus) * 100)
              : 0

          return {
            id: `${preset.id}-${item.id}`,
            rank: 0,
            name: item.name,
            category: item.category,
            unitPrice: item.unitPrice,
            weeklyPrepared,
            weeklySurplus,
            recoveredUnits,
            wastedUnits,
            recoveredRevenue,
            avoidedWastePercent,
            riskLevel: item.riskLevel,
            trend: item.trend,
          }
        })
        // Ordena pelos itens que MAIS SOBRAM na semana
        .sort((a, b) => b.weeklySurplus - a.weeklySurplus)
        .map((item, index) => ({
          ...item,
          rank: index + 1,
        }))

      const totalRecoveredRevenue = surplusCandidates.reduce(
        (acc, cur) => acc + cur.recoveredRevenue,
        0
      )
      const totalAvoidedUnits = surplusCandidates.reduce(
        (acc, cur) => acc + cur.recoveredUnits,
        0
      )
      const totalSurplusGenerated = surplusCandidates.reduce(
        (acc, cur) => acc + cur.weeklySurplus,
        0
      )

      map[preset.id] = {
        preset,
        items: surplusCandidates,
        stats: {
          recoveredRevenue: totalRecoveredRevenue,
          previousWeekRevenue: 0, // preenchido logo abaixo
          avoidedWasteUnits: totalAvoidedUnits,
          totalSurplusGenerated,
          recoveryRate:
            totalSurplusGenerated > 0
              ? Math.round((totalAvoidedUnits / totalSurplusGenerated) * 100)
              : 0,
          activeDealsCount: surplusCandidates.filter(
            (i) => i.recoveredUnits > 0
          ).length,
        },
      }
    })

    // Preenche comparativo com a semana imediatamente anterior
    WEEK_PRESETS.forEach((preset, idx) => {
      const prevPreset = WEEK_PRESETS[idx + 1]
      map[preset.id].stats.previousWeekRevenue = prevPreset
        ? map[prevPreset.id].stats.recoveredRevenue
        : map[preset.id].stats.recoveredRevenue * 0.9
    })

    return map
  }, [baseItems])

  const activeWeekData = weeklyDatasets[selectedWeekId] ?? weeklyDatasets['week-current']

  const weeklySummaries: WeeklySummaryItem[] = useMemo(() => {
    return WEEK_PRESETS.map((preset) => {
      const data = weeklyDatasets[preset.id]
      return {
        id: preset.id,
        label: preset.label,
        period: preset.period,
        recoveredRevenue: data.stats.recoveredRevenue,
        avoidedWasteUnits: data.stats.avoidedWasteUnits,
        totalSurplusUnits: data.stats.totalSurplusGenerated,
        topItemName: data.items[0]?.name ?? '—',
      }
    })
  }, [weeklyDatasets])

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(activeWeekData.items.map((item) => item.category))
    )
    return ['ALL', ...unique]
  }, [activeWeekData])

  // Filtragem por busca e categoria
  const filteredItems = useMemo(() => {
    return activeWeekData.items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false
      if (categoryFilter !== 'ALL' && item.category !== categoryFilter) {
        return false
      }
      return true
    })
  }, [activeWeekData, searchTerm, categoryFilter])

  // Paginação
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1
  const adjustedCurrentPage = Math.min(currentPage, totalPages)

  const paginatedItems = useMemo(() => {
    const startIndex = (adjustedCurrentPage - 1) * pageSize
    return filteredItems.slice(startIndex, startIndex + pageSize)
  }, [filteredItems, adjustedCurrentPage, pageSize])

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 px-1 sm:px-0">
      {/* Top Header Section (Seguindo o padrão de RiskItemsPage) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              Resultados das <span className="text-amber-400">Ofertas</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-[11px] sm:text-xs font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Consolidado Semanal
            </span>
          </div>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-2xl leading-relaxed">
            Acompanhe o <strong>desperdício evitado</strong>, a{' '}
            <strong>receita recuperada</strong> nas últimas {config.offerWindowHours}h de operação e os{' '}
            <strong>itens que mais sobram por semana</strong>.
          </p>
        </div>

        {/* Action Controls (Otimizado para Touch no Mobile) */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => navigate('/itens-em-risco')}
            className="flex items-center justify-center gap-1.5 min-h-[42px] sm:min-h-[38px] px-3 py-2 rounded-xl bg-purple-950/70 border border-purple-800/70 text-purple-200 hover:text-amber-300 active:bg-purple-900 text-xs font-semibold transition-all"
          >
            <span>Itens em Risco</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => navigate('/oferta-relampago')}
            className="flex items-center justify-center gap-1.5 min-h-[42px] sm:min-h-[38px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 active:scale-95 text-purple-950 font-black text-xs shadow-[0_0_15px_rgba(251,191,36,0.25)] transition-all truncate"
          >
            <Flame className="w-4 h-4 fill-purple-950 shrink-0" />
            <span className="truncate">Oferta Relâmpago</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Grade 2x2 no Mobile, 4 colunas no Desktop) */}
      <ResultsKPICards
        stats={activeWeekData.stats}
        weekLabel={activeWeekData.preset.label}
      />

      {/* Comparativo / Seletor Visual de Semanas */}
      <WeeklyPerformanceCard
        weeks={weeklySummaries}
        selectedWeekId={selectedWeekId}
        onSelectWeek={(weekId) => {
          setSelectedWeekId(weekId)
          setCurrentPage(1)
        }}
      />

      {/* Container Principal: Itens que Mais Sobram por Semana */}
      <div className="bg-[#160b2e]/90 border border-purple-900/60 rounded-2xl p-3 sm:p-5 shadow-lg space-y-3.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-white">
              Itens que Mais Sobram —{' '}
              <span className="text-amber-400">{activeWeekData.preset.label}</span>
            </h2>
            <p className="text-xs text-purple-300/75">
              Ordenados pelo maior volume de sobra semanal e impacto financeiro recuperado.
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs text-amber-300 font-semibold bg-purple-950/80 border border-purple-800/60 px-2.5 py-1 rounded-xl self-start sm:self-auto">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>{activeWeekData.preset.period}</span>
          </span>
        </div>

        {/* Barra de Busca e Filtros por Categoria */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Buscar item ou categoria..."
              className="w-full bg-purple-950/80 border border-purple-800/60 focus:border-amber-400 rounded-xl pl-10 pr-9 py-2.5 text-base sm:text-sm text-purple-100 placeholder-purple-400/50 focus:outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-400 hover:text-amber-300 p-1"
                aria-label="Limpar busca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Pílulas de Categoria */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 lg:pb-0 text-xs scrollbar-none touch-pan-x -mx-1 px-1 sm:mx-0 sm:px-0">
            <span className="text-purple-400 flex items-center gap-1 shrink-0 font-medium mr-0.5 hidden xs:flex">
              <Filter className="w-3.5 h-3.5" />
            </span>

            {categories.map((cat) => {
              const isAll = cat === 'ALL'
              const isSelected = categoryFilter === cat
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setCategoryFilter(cat)
                    setCurrentPage(1)
                  }}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-amber-400 text-purple-950 shadow-sm font-bold'
                      : 'bg-purple-950/70 border border-purple-800/60 text-purple-300 active:bg-purple-900 hover:text-amber-300'
                  }`}
                >
                  {isAll ? 'Todas Categorias' : cat}
                </button>
              )
            })}
          </div>
        </div>

        {/* Banner de Insight Operacional */}
        <div className="bg-purple-950/60 border border-purple-800/40 rounded-xl p-2.5 sm:p-3 flex items-start sm:items-center justify-between gap-2 text-xs text-purple-200">
          <div className="flex items-center gap-2 min-w-0">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-[11px] sm:text-xs leading-snug">
              <strong>Sugestão de Produção:</strong> Os 3 primeiros itens concentram a maior sobra de{' '}
              <strong>{activeWeekData.preset.label.toLowerCase()}</strong>. Considere reduzir o lote inicial em 10% a 15%.
            </span>
          </div>
        </div>

        {/* Tabela / Cards de Ranking Semanal */}
        <TopSurplusItemsTable items={paginatedItems} />

        {/* Paginação */}
        <Pagination
          currentPage={adjustedCurrentPage}
          totalPages={totalPages}
          totalItems={filteredItems.length}
          pageSize={pageSize}
          pageSizeOptions={[4, 6, 8, 12]}
          onPageChange={(page) => setCurrentPage(page)}
          onPageSizeChange={(newSize) => {
            setPageSize(newSize)
            setCurrentPage(1)
          }}
        />
      </div>
    </div>
  )
}