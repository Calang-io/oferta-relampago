import { Clock, Package, Pause, Play, ShoppingBag } from 'lucide-react'
import { Badge } from '../../../components/ui/Badge'
import { formatCurrencyBRL } from '../../../utils/calculations'
import { OFFER_STATUS_LABELS } from '../flash-deals-model'
import type { getFlashDeals } from '../flash-deals-model'

interface FlashDealCardProps {
  deal: ReturnType<typeof getFlashDeals>[number]
  menu: boolean
  offersPaused: boolean
  closingTime: string
  startTime: string
  countdown: string
  onPurchase: (itemId: string) => void
  onTogglePause: (itemId: string) => void
}

export function FlashDealCard({ deal, menu, offersPaused, closingTime, startTime, countdown, onPurchase, onTogglePause }: FlashDealCardProps) {
  const paused = deal.status === 'paused'
  const canToggle = !offersPaused && ['active', 'paused'].includes(deal.status) && deal.discount > 0
  const timing = deal.status === 'closed' ? 'Encerrada no fechamento'
    : deal.status === 'sold-out' ? 'Quantidade da oferta esgotada'
    : deal.status === 'scheduled' ? `Disponível a partir das ${startTime}`
    : `Até ${closingTime} · ${countdown}`

  return (
    <article className="panel-surface p-4 sm:p-5 flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge variant={deal.status === 'active' ? 'safe' : 'neutral'}>{OFFER_STATUS_LABELS[deal.status]}</Badge>
        <span className="text-brand-amber font-extrabold text-sm">{deal.discount}% OFF</span>
      </div>
      <div>
        <p className="text-sm text-purple-300">{deal.item.category}</p>
        <h3 className="text-lg font-extrabold text-white mt-1">{deal.item.name}</h3>
      </div>
      <div className="flex flex-wrap items-baseline gap-3">
        <span className="text-2xl font-black text-brand-amber">{formatCurrencyBRL(deal.price)}</span>
        <del className="text-sm text-purple-300">{formatCurrencyBRL(deal.item.unitPrice)}</del>
      </div>
      <div className="space-y-2 text-sm text-purple-200 mt-auto">
        <p className="flex items-center gap-2"><Package className="w-4 h-4 shrink-0" /><strong>{deal.remaining} un.</strong> de {deal.quantity} disponíveis</p>
        <p className="flex items-center gap-2"><Clock className="w-4 h-4 shrink-0" />{timing}</p>
      </div>
      {menu ? (
        <button type="button" onClick={() => onPurchase(deal.itemId)} disabled={deal.status !== 'active'} className="btn-primary min-h-11 flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
          <ShoppingBag className="w-4 h-4" />Simular compra de 1 unidade
          <span className="sr-only"> de {deal.item.name}</span>
        </button>
      ) : (
        <button type="button" onClick={() => onTogglePause(deal.itemId)} disabled={!canToggle} className="btn-secondary min-h-11 flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed">
          {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          {paused ? 'Retomar oferta' : 'Pausar oferta'}
          <span className="sr-only"> de {deal.item.name}</span>
        </button>
      )}
    </article>
  )
}
