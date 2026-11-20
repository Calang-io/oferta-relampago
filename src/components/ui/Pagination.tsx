import React from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  totalItems: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (pageSize: number) => void
  pageSizeOptions?: number[]
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [4, 6, 8, 12],
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="py-3 px-1 text-sm text-purple-200/80 border-t border-purple-900/40 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
      {/* Informações de Contagem e Seletor de Página */}
      <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
        <span className="text-xs text-purple-200">
          Mostrando <strong className="text-brand-amber font-bold">{startItem}</strong>-
          <strong className="text-brand-amber font-bold">{endItem}</strong> de{' '}
          <strong className="text-white font-bold">{totalItems}</strong>
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-purple-300/70 hidden md:inline">Itens:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Itens por página"
              className="bg-purple-950 border border-purple-700/60 text-brand-light rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-brand-amber cursor-pointer min-h-[32px]"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-purple-950 text-purple-100">
                  {opt} / pág
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Navegação Mobile (Botões Grandes e Confortáveis para Toque) */}
      <div className="flex sm:hidden items-center justify-between gap-2 w-full pt-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="flex-1 flex items-center justify-center gap-1 min-h-[40px] px-3 rounded-xl border border-purple-800/80 bg-purple-950/70 text-purple-200 active:bg-purple-900 active:text-brand-amber disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold transition-all"
        >
          <ChevronLeft className="w-4 h-4 text-brand-amber" />
          <span>Anterior</span>
        </button>

        <span className="text-xs text-purple-200 font-semibold px-2 shrink-0">
          <strong className="text-brand-amber">{currentPage}</strong> / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="flex-1 flex items-center justify-center gap-1 min-h-[40px] px-3 rounded-xl border border-purple-800/80 bg-purple-950/70 text-purple-200 active:bg-purple-900 active:text-brand-amber disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold transition-all"
        >
          <span>Próxima</span>
          <ChevronRight className="w-4 h-4 text-brand-amber" />
        </button>
      </div>

      {/* Navegação Desktop (Páginas numeradas completas) */}
      <div className="hidden sm:flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
          title="Primeira página"
          aria-label="Primeira página"
          className="p-1.5 rounded-lg border border-purple-800/60 bg-purple-950/50 text-purple-300 hover:text-brand-amber hover:border-brand-amber/40 disabled:opacity-30 disabled:pointer-events-none transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          title="Página anterior"
          aria-label="Página anterior"
          className="p-1.5 rounded-lg border border-purple-800/60 bg-purple-950/50 text-purple-300 hover:text-brand-amber hover:border-brand-amber/40 disabled:opacity-30 disabled:pointer-events-none transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-1 mx-1">
          {pages.map((pageNum) => {
            const isActive = pageNum === currentPage
            if (
              totalPages > 6 &&
              Math.abs(pageNum - currentPage) > 2 &&
              pageNum !== 1 &&
              pageNum !== totalPages
            ) {
              if (pageNum === 2 || pageNum === totalPages - 1) {
                return (
                  <span key={pageNum} className="px-1 text-purple-400/50">
                    ...
                  </span>
                )
              }
              return null
            }

            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                aria-label={`Página ${pageNum}`}
                aria-current={isActive ? 'page' : undefined}
                className={`min-w-8 h-8 px-2 text-xs font-semibold rounded-lg transition-all ${
                  isActive
                    ? 'bg-brand-amber text-purple-950 font-bold shadow-[0_0_12px_rgba(251,191,36,0.35)] scale-105'
                    : 'bg-purple-950/60 border border-purple-800/50 text-purple-200 hover:bg-purple-900/60 hover:text-brand-light'
                }`}
              >
                {pageNum}
              </button>
            )
          })}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          title="Próxima página"
          aria-label="Próxima página"
          className="p-1.5 rounded-lg border border-purple-800/60 bg-purple-950/50 text-purple-300 hover:text-brand-amber hover:border-brand-amber/40 disabled:opacity-30 disabled:pointer-events-none transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || totalPages === 0}
          title="Última página"
          aria-label="Última página"
          className="p-1.5 rounded-lg border border-purple-800/60 bg-purple-950/50 text-purple-300 hover:text-brand-amber hover:border-brand-amber/40 disabled:opacity-30 disabled:pointer-events-none transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
