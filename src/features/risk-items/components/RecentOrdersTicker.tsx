import React from 'react'
import { ShoppingBag, Zap } from 'lucide-react'
import { useStore } from '../../../context/StoreContext'
import { formatCurrencyBRL, formatTimeAgo } from '../../../utils/calculations'

export const RecentOrdersTicker: React.FC = () => {
  const { recentOrders, lastUpdated } = useStore()

  if (recentOrders.length === 0) {
    return (
      <div className="bg-purple-950/60 border border-purple-900/60 rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs text-purple-300/80">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping shrink-0" />
          <span className="text-[11px] sm:text-xs">
            Monitorando pedidos ao vivo. Toque em <strong>"+ Simular Pedido"</strong> para testar.
          </span>
        </div>
        <span className="text-[10px] text-purple-400/60 shrink-0 hidden sm:inline">
          {lastUpdated.toLocaleTimeString('pt-BR')}
        </span>
      </div>
    )
  }

  const latest = recentOrders[0]

  return (
    <div className="bg-gradient-to-r from-purple-950 via-purple-900/60 to-purple-950 border border-amber-400/30 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-md bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-amber-400 uppercase tracking-wide shrink-0">
            Novo Pedido:
          </span>
          <span className="text-xs text-purple-100 font-medium truncate">
            {latest.items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}
          </span>
          <span className="text-xs font-bold text-amber-300 shrink-0">
            {formatCurrencyBRL(latest.total)}
          </span>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 text-[11px] text-purple-300/80 border-t sm:border-t-0 border-purple-900/40 pt-1 sm:pt-0">
          <span className="flex items-center gap-1 text-amber-300 font-medium">
            <Zap className="w-3 h-3 text-amber-400 animate-pulse shrink-0" />
            <span className="hidden xs:inline">Recálculo automático</span>
            <span className="xs:hidden">Recalculado</span>
          </span>
          <span className="text-purple-400/60 text-[10px]">
            {formatTimeAgo(latest.timestamp)}
          </span>
        </div>
      </div>
    </div>
  )
}
