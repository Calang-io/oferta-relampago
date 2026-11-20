import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, Flame, Info, Package, Pause, Play, Search, ShoppingBag, Sliders, Store } from 'lucide-react'
import { useStore } from '../../context/StoreContext'
import { Badge } from '../../components/ui/Badge'
import { Pagination } from '../../components/ui/Pagination'
import { formatCurrencyBRL } from '../../utils/calculations'
import { offerPeriod } from '../settings/settings-model'
import { discountFor, formatCountdown, getFlashDeals, OFFER_STATUS_LABELS } from './flash-deals-model'
import { FlashDealCard } from './components/FlashDealCard'

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')

export function FlashDealsPage() {
  const { items, config, flashDeals, offerWindow, offersPaused, now, toggleOffersPaused, toggleOfferPaused, purchaseFlashDeal, recentOrders, isLiveSimulationActive, toggleLiveSimulation } = useStore()
  const [view, setView] = useState<'management' | 'menu'>('management')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)
  const period = offerPeriod(config.closingTime, config.offerWindowHours)
  const scheduled = offerWindow.phase === 'scheduled'
  const closed = offerWindow.phase === 'closed'
  // Antes da janela, mostrar apenas a previsão, sem publicar nem reservar estoque.
  const deals = scheduled ? getFlashDeals({ cycle: offerWindow.cycle, paused: false, pausedItems: [], allocations: items
    .filter(item => item.projectedSurplus > 0 && item.currentStock > 0 && discountFor(item.id, config) > 0)
    .map(item => ({ itemId: item.id, quantity: Math.min(item.projectedSurplus, item.currentStock), soldAtCreation: item.sold })) }, items, config, now) : flashDeals
  const active = flashDeals.filter(deal => deal.status === 'active')
  const available = active.reduce((sum, deal) => sum + deal.remaining, 0)
  const potentialRevenue = active.reduce((sum, deal) => sum + deal.price * deal.remaining, 0)
  const filtered = deals.filter(deal => normalize(`${deal.item.name} ${deal.item.category}`).includes(normalize(search)) && (view === 'menu' ? deal.status === 'active' : filter === 'ALL' || deal.status === filter))
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const title = closed ? 'Ofertas encerradas' : scheduled ? 'Aguardando a janela' : offersPaused ? 'Ofertas pausadas' : 'Janela de ofertas aberta'
  const countdown = formatCountdown((scheduled ? offerWindow.start : offerWindow.end) - now.getTime())

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Oferta <span className="text-brand-amber">Relâmpago</span></h1>
          <p className="text-sm text-purple-200/80 mt-2">Transforme a sobra prevista em ofertas com desconto e quantidade limitada.</p>
        </div>
        <Link to="/configuracao" className="btn-secondary inline-flex items-center justify-center gap-2 min-h-11 text-sm"><Sliders className="w-4 h-4" /> Ajustar operação</Link>
      </div>

      <section className="card-surface p-4 sm:p-6" aria-labelledby="offer-window-title">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <Badge variant={closed || offersPaused ? 'neutral' : 'yellow'}><Flame className="w-4 h-4" /> Automação de ofertas</Badge>
            <h2 id="offer-window-title" className="text-xl font-extrabold text-white">{title}</h2>
            <p className="text-sm text-purple-200">Janela das {period?.start} às {period?.end}{period?.previousDay ? ' (início no dia anterior ao fechamento)' : ''} · Horário de Fortaleza</p>
            <p className="text-sm text-purple-300">{offersPaused ? 'A publicação está pausada. Retome para disponibilizar as ofertas durante a janela.' : 'Publicação automática dos itens com sobra prevista. Cada oferta termina ao esgotar sua quantidade ou no fechamento.'}</p>
          </div>
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 sm:items-center lg:items-stretch shrink-0">
            <div className="text-center bg-purple-950/70 border border-purple-700/60 rounded-xl px-6 py-3">
              <p className="text-sm text-purple-200 flex items-center justify-center gap-2"><Clock className="w-4 h-4" />{closed ? 'Fechamento atingido' : scheduled ? 'Começa em' : 'Encerra em'}</p>
              <p className="text-3xl font-black text-brand-amber tabular-nums mt-1" role="timer" aria-label={closed ? 'Ofertas encerradas' : `${scheduled ? 'Início' : 'Fim'} das ofertas em ${countdown}`}>{closed ? '00:00:00' : countdown}</p>
            </div>
            <button type="button" onClick={toggleOffersPaused} disabled={closed} className="btn-primary flex items-center justify-center gap-2 min-h-11 disabled:opacity-40 disabled:cursor-not-allowed">
              {offersPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}{offersPaused ? 'Retomar ofertas' : 'Pausar todas'}
            </button>
          </div>
        </div>
      </section>

      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { label: 'Ofertas no cardápio', value: String(active.length), icon: Store },
          { label: 'Unidades disponíveis em oferta', value: String(available), icon: Package },
          { label: 'Receita potencial com ofertas', value: formatCurrencyBRL(potentialRevenue), icon: ShoppingBag },
        ].map(({ label, value, icon: Icon }) => <div key={label} className="panel-surface p-4"><p className="text-sm text-purple-200 flex items-center gap-2"><Icon className="w-4 h-4 text-brand-amber" />{label}</p><p className="text-2xl font-black text-white mt-2">{value}</p></div>)}
      </div>

      <div className="panel-surface p-4 flex gap-3 items-start text-sm text-purple-200">
        <Info className="w-5 h-5 text-brand-amber shrink-0" />
        <p>Cardápio de demonstração: as ofertas aparecem automaticamente na prévia abaixo. Simular uma compra desconta uma unidade do estoque compartilhado. Os pedidos automáticos também consomem estoque. A integração com um cardápio externo ainda não está disponível.</p>
      </div>

      <div role="status" className="text-sm text-purple-200">
        {recentOrders[0] && <>Último pedido simulado: {recentOrders[0].items.map(item => `${item.quantity}× ${item.itemName}`).join(', ')} · <strong className="text-brand-amber">{formatCurrencyBRL(recentOrders[0].total)}</strong></>}
      </div>

      <section className="space-y-4" aria-label="Ofertas e cardápio digital">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex gap-2" role="group" aria-label="Visualização das ofertas">
            <button type="button" aria-pressed={view === 'management'} onClick={() => { setView('management'); setPage(1) }} className={`${view === 'management' ? 'btn-primary' : 'btn-secondary'} min-h-11 text-sm`}>Gerenciar ofertas</button>
            <button type="button" aria-pressed={view === 'menu'} onClick={() => { setView('menu'); setPage(1) }} className={`${view === 'menu' ? 'btn-primary' : 'btn-secondary'} min-h-11 text-sm`}>Prévia do cardápio</button>
          </div>
          <button type="button" onClick={toggleLiveSimulation} aria-pressed={isLiveSimulationActive} className="btn-secondary text-sm min-h-11">Pedidos automáticos: {isLiveSimulationActive ? 'ligados' : 'desligados'}</button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <label className="relative flex-1"><span className="sr-only">Buscar produto ou categoria</span><Search className="absolute left-3 top-3.5 w-4 h-4 text-purple-300" /><input type="search" value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} placeholder="Buscar produto ou categoria" className="w-full min-h-11 rounded-xl bg-purple-950/70 border border-purple-700/60 pl-10 pr-3 text-sm text-white placeholder:text-purple-300/70" /></label>
          {view === 'management' && <label><span className="sr-only">Filtrar por status</span><select value={filter} onChange={event => { setFilter(event.target.value); setPage(1) }} className="w-full min-h-11 rounded-xl bg-purple-950 border border-purple-700/60 px-3 text-sm text-purple-100"><option value="ALL">Todos os status</option>{Object.entries(OFFER_STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>}
        </div>

        <h2 className="font-extrabold text-lg text-white">{view === 'menu' ? 'Ofertas disponíveis no cardápio' : scheduled ? 'Ofertas previstas para a janela' : 'Ofertas desta janela'} <span className="text-purple-300 font-normal text-sm">({filtered.length})</span></h2>
        {scheduled && view === 'management' && <p className="text-sm text-purple-300">Preços e quantidades serão confirmados automaticamente quando a janela abrir, usando o estoque e as configurações vigentes.</p>}

        {!visible.length ? <div className="panel-surface p-8 text-center space-y-3"><Package className="w-8 h-8 text-brand-amber mx-auto" /><h3 className="text-lg text-white font-bold">{search || (view === 'management' && filter !== 'ALL') ? 'Nenhuma oferta encontrada' : closed ? 'A janela de ofertas terminou' : scheduled ? 'Nenhuma oferta publicada ainda' : offersPaused ? 'As ofertas estão pausadas' : 'Nenhuma oferta disponível'}</h3><p className="text-sm text-purple-200">{search || (view === 'management' && filter !== 'ALL') ? 'Ajuste a busca ou o filtro para encontrar os produtos.' : scheduled ? `A publicação começa às ${period?.start}, para produtos com sobra prevista e desconto maior que zero.` : 'Somente produtos com sobra prevista, estoque e desconto disponível entram em oferta durante a janela.'}</p><Link to="/itens-em-risco" className="text-brand-amber underline inline-block text-sm">Consultar itens em risco</Link></div> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map(deal => (
            <FlashDealCard key={deal.itemId} deal={deal} menu={view === 'menu'} offersPaused={offersPaused}
              closingTime={config.closingTime} startTime={period?.start ?? ''} countdown={countdown}
              onPurchase={purchaseFlashDeal} onTogglePause={toggleOfferPaused} />
          ))}
        </div>}
        <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={size => { setPageSize(size); setPage(1) }} />
      </section>
    </div>
  )
}
