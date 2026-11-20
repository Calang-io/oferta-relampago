import React, { useState, useMemo } from 'react'
import {
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Flame,
  Info,
  Clock,
  X,
} from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { RiskKPICards } from './components/RiskKPICards'
import { RiskTable } from './components/RiskTable'
import { RecentOrdersTicker } from './components/RecentOrdersTicker'
import { Pagination } from '../../components/ui/Pagination'
import { useNavigate } from 'react-router-dom'

export const RiskItemsPage: React.FC = () => {
  const { items, resetToDefault, summary, config } = useStore()
  const navigate = useNavigate()

  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'ALL' | 'SURPLUS' | 'CRITICAL' | 'SAFE'>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)

  // 1. Filtragem por busca e categoria
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesSearch) return false

      if (filterType === 'SURPLUS') {
        return item.projectedSurplus > 0
      }
      if (filterType === 'CRITICAL') {
        return item.riskLevel === 'CRITICAL'
      }
      if (filterType === 'SAFE') {
        return item.riskLevel === 'SAFE'
      }

      return true
    })
  }, [items, searchTerm, filterType])

  // 2. Ordenação obrigatória:
  // "os que devem sobrar aparecem nas primeiras páginas e sempre acima dos com risco baixo."
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      // Prioridade 1: Itens que devem sobrar (projectedSurplus > 0)
      const aHasSurplus = a.projectedSurplus > 0 ? 1 : 0
      const bHasSurplus = b.projectedSurplus > 0 ? 1 : 0
      if (bHasSurplus !== aHasSurplus) {
        return bHasSurplus - aHasSurplus
      }

      // Prioridade 2: Nível de Risco (CRITICAL > MODERATE > SAFE)
      const riskOrder = { CRITICAL: 3, MODERATE: 2, SAFE: 1 }
      if (riskOrder[b.riskLevel] !== riskOrder[a.riskLevel]) {
        return riskOrder[b.riskLevel] - riskOrder[a.riskLevel]
      }

      // Prioridade 3: Maior quantidade de sobra projetada
      if (b.projectedSurplus !== a.projectedSurplus) {
        return b.projectedSurplus - a.projectedSurplus
      }

      // Prioridade 4: Maior valor de perda financeira estimada
      return b.estimatedLossValue - a.estimatedLossValue
    })
  }, [filteredItems])

  // 3. Paginação
  const totalPages = Math.ceil(sortedItems.length / pageSize) || 1
  const adjustedCurrentPage = Math.min(currentPage, totalPages)

  const paginatedItems = useMemo(() => {
    const startIndex = (adjustedCurrentPage - 1) * pageSize
    return sortedItems.slice(startIndex, startIndex + pageSize)
  }, [sortedItems, adjustedCurrentPage, pageSize])

  const surplusCount = items.filter((i) => i.projectedSurplus > 0).length

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 px-1 sm:px-0">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">
              Itens em <span className="text-amber-400">Risco</span>
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-400/40 text-amber-300 text-[11px] sm:text-xs font-bold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Ao Vivo
            </span>
          </div>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-2xl leading-relaxed">
            Monitoramento em tempo real do <strong>preparado</strong> contra a <strong>venda estimada</strong> até o fechamento.
            Itens que devem sobrar aparecem no topo.
          </p>
        </div>

        {/* Action Controls (Otimizado para Touch no Mobile) */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full md:w-auto">
          <button
            onClick={resetToDefault}
            title="Reiniciar dados da demonstração"
            className="flex items-center justify-center gap-1.5 min-h-[42px] sm:min-h-[38px] px-3 py-2 rounded-xl bg-purple-950/70 border border-purple-800/70 text-purple-200 hover:text-amber-300 active:bg-purple-900 text-xs font-semibold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Resetar</span>
          </button>

          <button
            onClick={() => navigate('/oferta-relampago')}
            className="flex items-center justify-center gap-1.5 min-h-[42px] sm:min-h-[38px] px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 active:scale-95 text-purple-950 font-black text-xs shadow-[0_0_15px_rgba(251,191,36,0.25)] transition-all truncate"
          >
            <Flame className="w-4 h-4 fill-purple-950 shrink-0" />
            <span className="truncate">Ofertas ({surplusCount})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Grade 2x2 no Mobile, 4 colunas no Desktop) */}
      <RiskKPICards />

      {/* Real-time Order Ticker */}
      <RecentOrdersTicker />

      {/* Search, Filter Bar and Table Card Container */}
      <div className="bg-[#160b2e]/90 border border-purple-900/60 rounded-2xl p-3 sm:p-5 shadow-lg space-y-3.5 sm:space-y-4">
        {/* Barra de Busca e Filtros */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3">
          {/* Caixa de Busca (text-base no mobile evita zoom indesejado no iOS) */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-purple-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Buscar por produto ou categoria..."
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

          {/* Filtros em Pílula (Carrossel touch horizontal no mobile) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 lg:pb-0 text-xs scrollbar-none touch-pan-x -mx-1 px-1 sm:mx-0 sm:px-0">
            <span className="text-purple-400 flex items-center gap-1 shrink-0 font-medium mr-0.5 hidden xs:flex">
              <Filter className="w-3.5 h-3.5" />
            </span>

            <button
              onClick={() => {
                setFilterType('ALL')
                setCurrentPage(1)
              }}
              className={`min-h-[36px] px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1 ${
                filterType === 'ALL'
                  ? 'bg-amber-400 text-purple-950 shadow-sm font-bold'
                  : 'bg-purple-950/70 border border-purple-800/60 text-purple-300 active:bg-purple-900 hover:text-amber-300'
              }`}
            >
              <span>Todos</span>
              <span className="opacity-75">({items.length})</span>
            </button>

            <button
              onClick={() => {
                setFilterType('SURPLUS')
                setCurrentPage(1)
              }}
              className={`min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                filterType === 'SURPLUS'
                  ? 'bg-amber-400 text-purple-950 shadow-sm font-bold'
                  : 'bg-purple-950/70 border border-amber-400/30 text-amber-300 active:bg-purple-900 hover:border-amber-400/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Sobra Prevista</span>
              <span className="opacity-80">({surplusCount})</span>
            </button>

            <button
              onClick={() => {
                setFilterType('CRITICAL')
                setCurrentPage(1)
              }}
              className={`min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                filterType === 'CRITICAL'
                  ? 'bg-amber-400 text-purple-950 shadow-sm font-bold'
                  : 'bg-purple-950/70 border border-purple-800/60 text-purple-300 active:bg-purple-900 hover:text-amber-300'
              }`}
            >
              <span>Críticos</span>
              <span className="opacity-80">({summary.criticalCount})</span>
            </button>

            <button
              onClick={() => {
                setFilterType('SAFE')
                setCurrentPage(1)
              }}
              className={`min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                filterType === 'SAFE'
                  ? 'bg-amber-400 text-purple-950 shadow-sm font-bold'
                  : 'bg-purple-950/70 border border-purple-800/60 text-purple-300 active:bg-purple-900 hover:text-emerald-300'
              }`}
            >
              <span>Equilibrados</span>
              <span className="opacity-80">({summary.safeCount})</span>
            </button>
          </div>
        </div>

        {/* Banner Informativo (Compacto no Mobile) */}
        <div className="bg-purple-950/60 border border-purple-800/40 rounded-xl p-2.5 sm:p-3 flex items-start sm:items-center justify-between gap-2 text-xs text-purple-200">
          <div className="flex items-center gap-2 min-w-0">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <span className="text-[11px] sm:text-xs leading-snug">
              <strong>Prioridade Ativa:</strong> Itens que vão sobrar aparecem sempre nas primeiras páginas e no topo antes do fechamento ({config.closingTime}).
            </span>
          </div>
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-amber-300 font-semibold bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30 shrink-0">
            <Clock className="w-3 h-3" />
            Janela: Últimas {config.offerWindowHours}h
          </span>
        </div>

        {/* Tabela / Cards de Risco */}
        <RiskTable items={paginatedItems} />

        {/* Controles de Paginação com Suporte Mobile Completo */}
        <Pagination
          currentPage={adjustedCurrentPage}
          totalPages={totalPages}
          totalItems={sortedItems.length}
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
