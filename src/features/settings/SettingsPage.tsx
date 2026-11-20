import { useEffect, useId, useRef, useState } from 'react'
import { ArrowRight, CalendarDays, Check, CheckCheck, Clock, CookingPot, Info, Minus, PackageOpen, Percent, Plus, RotateCcw, Save, Search, ShieldCheck, Sliders, Sparkles, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../../context/StoreContext'
import { Badge } from '../../components/ui/Badge'
import { Pagination } from '../../components/ui/Pagination'
import { formatCurrencyBRL } from '../../utils/calculations'
import { offerPeriod, parsePrepared, restaurantDate, resolveQuantity, validateConfig, validateProduction } from './settings-model'
import './settings.css'

const fieldClass = 'w-full min-h-11 bg-purple-950/80 border border-purple-700/60 rounded-xl px-3 py-2 text-base sm:text-sm text-purple-100 placeholder:text-purple-400/60'
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')

export function SettingsPage() {
  const { items, config, production, productionDate, historicalAverages, updateConfig, confirmProduction } = useStore()
  const uid = useId()
  const root = useRef<HTMLDivElement>(null)
  const previousDate = useRef(productionDate)
  const [tab, setTab] = useState<'operation' | 'production'>('operation')
  const [draft, setDraft] = useState(() => structuredClone(config))
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('ALL')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [notice, setNotice] = useState('')
  const [failure, setFailure] = useState('')
  const [saving, setSaving] = useState(false)
  const operationDirty = JSON.stringify(draft) !== JSON.stringify(config)
  const productionDirty = Object.keys(quantities).length > 0
  const dirty = tab === 'operation' ? operationDirty : productionDirty
  const period = offerPeriod(draft.closingTime, draft.offerWindowHours)
  const categories = [...new Set(items.map(item => item.category))]
  const filtered = items.filter(item => normalize(`${item.name} ${item.category}`).includes(normalize(search)) && (category === 'ALL' || item.category === category))
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visibleItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const confirmedCount = items.filter(item => resolveQuantity(item.id, production, historicalAverages, productionDate).source === 'confirmed').length
  const dateLabel = new Intl.DateTimeFormat('pt-BR', { day: 'numeric', month: 'long', timeZone: 'America/Fortaleza' }).format(new Date(`${productionDate}T12:00:00-03:00`))

  useEffect(() => {
    if (previousDate.current === productionDate) return
    previousDate.current = productionDate
    setQuantities({}); setErrors({}); setFailure('')
    setNotice('Um novo dia começou. Confira a produção de hoje.')
  }, [productionDate])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (operationDirty || productionDirty) { event.preventDefault(); event.returnValue = '' }
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [operationDirty, productionDirty])

  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(''), 6000)
    return () => window.clearTimeout(timer)
  }, [notice])

  function showErrors(nextErrors: Record<string, string>) {
    setErrors(nextErrors)
    if (!Object.keys(nextErrors).length) return false
    const index = items.findIndex(item => nextErrors[item.id])
    if (index >= 0) { setSearch(''); setCategory('ALL'); setPage(Math.floor(index / pageSize) + 1) }
    requestAnimationFrame(() => root.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
    return true
  }

  async function save() {
    if (saving) return
    setNotice(''); setFailure('')
    if (tab === 'operation') {
      if (showErrors(validateConfig(draft))) return
      setSaving(true)
      try {
        updateConfig(draft)
        setNotice('Configurações salvas. O cabeçalho e as outras telas já usam os novos horários.')
      } catch { setFailure('Não foi possível salvar neste navegador. Suas alterações foram mantidas; tente novamente.') }
      finally { setSaving(false) }
      return
    }
    if (restaurantDate() !== productionDate) { setFailure('O dia mudou. Aguarde a atualização e confira os totais novamente.'); return }
    if (!items.length) return
    const next = Object.fromEntries(items.map(item => {
      const value = quantities[item.id] ?? String(resolveQuantity(item.id, production, historicalAverages, productionDate).quantity ?? '')
      return [item.id, parsePrepared(value) ?? NaN]
    }))
    if (showErrors(validateProduction(next, items))) return
    setSaving(true)
    try {
      confirmProduction(next)
      setQuantities({})
      setNotice('Produção confirmada. Estoque e risco de sobra foram recalculados.')
    } catch (error) { setFailure(error instanceof Error ? `${error.message} Suas quantidades foram mantidas.` : 'Não foi possível confirmar. Tente novamente.') }
    finally { setSaving(false) }
  }

  function switchTab(next: typeof tab) {
    setTab(next); setErrors({}); setFailure(''); setPage(1)
  }

  function step(id: string, increment: number) {
    const current = Number(quantities[id] ?? resolveQuantity(id, production, historicalAverages, productionDate).quantity ?? 0)
    setQuantities(previous => ({ ...previous, [id]: String(Math.min(99999, Math.max(0, (Number.isFinite(current) ? current : 0) + increment))) }))
  }

  return (
    <div className="settings-page space-y-4 sm:space-y-6 pb-12 px-1 sm:px-0" ref={root}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-3xl font-black text-white tracking-tight">Configuração da <span className="text-brand-amber">Operação</span></h1>
            <Badge variant="purple" size="sm"><Sliders className="w-3 h-3" />Suas regras</Badge>
          </div>
          <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-2xl leading-relaxed">Defina os horários, proteja a margem de cada produto e informe o que preparou hoje.</p>
        </div>
        <Link to="/itens-em-risco" className="btn-secondary min-h-11 inline-flex items-center justify-center gap-2 text-xs shrink-0">Ver itens em risco<ArrowRight className="w-4 h-4" /></Link>
      </div>

      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2" role="tablist" aria-label="Seções de configuração">
        {(['operation', 'production'] as const).map(value => (
          <button key={value} type="button" role="tab" id={`${uid}-${value}-tab`} aria-selected={tab === value} aria-controls={`${uid}-${value}-panel`} tabIndex={tab === value ? 0 : -1} disabled={saving} onClick={() => switchTab(value)} onKeyDown={event => {
            if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
              event.preventDefault()
              const next = event.key === 'Home' ? 'operation' : event.key === 'End' ? 'production' : value === 'operation' ? 'production' : 'operation'
              switchTab(next); document.getElementById(`${uid}-${next}-tab`)?.focus()
            }
          }} className={`min-h-11 min-w-0 px-2 sm:px-4 rounded-xl inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold border transition-colors ${tab === value ? 'bg-brand-amber text-purple-950 border-brand-light shadow-sm' : 'bg-purple-950/70 text-purple-200 border-purple-800/70 hover:text-brand-light'}`}>
            {value === 'operation' ? <Sliders className="w-4 h-4" /> : <CookingPot className="w-4 h-4" />}
            {value === 'operation' ? 'Operação e descontos' : 'Produção de hoje'}
            {value === 'production' && <span className="text-[10px] opacity-80">{confirmedCount}/{items.length}</span>}
          </button>
        ))}
      </div>

      <form id={`${uid}-form`} noValidate onSubmit={event => { event.preventDefault(); void save() }} />
      <fieldset disabled={saving} className="min-w-0 space-y-4 sm:space-y-6 border-0 p-0 m-0" id={`${uid}-${tab}-panel`} role="tabpanel" aria-labelledby={`${uid}-${tab}-tab`}>
        {tab === 'operation' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              <section className="card-surface p-4 sm:p-5">
                <div className="flex items-center gap-2 text-brand-amber mb-4"><Clock className="w-5 h-5" /><h2 className="font-extrabold text-white text-sm">Horário de fechamento</h2></div>
                <label className="sr-only" htmlFor={`${uid}-closing`}>Horário de fechamento</label>
                <input form={`${uid}-form`} id={`${uid}-closing`} type="time" className={fieldClass} value={draft.closingTime} onChange={event => setDraft(previous => ({ ...previous, closingTime: event.target.value }))} aria-invalid={!!errors.closingTime} aria-describedby={`${uid}-closing-help`} />
                <p id={`${uid}-closing-help`} className={`text-xs mt-2 ${errors.closingTime ? 'text-red-300' : 'text-purple-300'}`}>{errors.closingTime ?? 'Quando a operação termina, inclusive após meia-noite.'}</p>
              </section>
              <section className="card-surface p-4 sm:p-5">
                <div className="flex items-center gap-2 text-brand-amber mb-4"><Sparkles className="w-5 h-5" /><h2 className="font-extrabold text-white text-sm">Janela das ofertas</h2></div>
                <label className="sr-only" htmlFor={`${uid}-window`}>Janela das ofertas</label>
                <select form={`${uid}-form`} id={`${uid}-window`} className={fieldClass} value={draft.offerWindowHours} onChange={event => setDraft(previous => ({ ...previous, offerWindowHours: Number(event.target.value) }))} aria-invalid={!!errors.offerWindowHours} aria-describedby={`${uid}-window-help`}>
                  {[...new Set([0.5, 1, 1.5, 2, 3, 4, draft.offerWindowHours])].sort((a, b) => a - b).map(hours => <option key={hours} value={hours}>{hours === 0.5 ? 'Últimos 30 minutos' : hours === 1 ? 'Última 1 hora' : `Últimas ${hours.toLocaleString('pt-BR')} horas`}</option>)}
                </select>
                <p id={`${uid}-window-help`} className={`text-xs mt-2 ${errors.offerWindowHours ? 'text-red-300' : 'text-purple-300'}`}>{errors.offerWindowHours ?? 'Período antes do fechamento para aproveitar excedentes.'}</p>
              </section>
              <section className="card-surface p-4 sm:p-5">
                <div className="flex items-center gap-2 text-brand-amber mb-4"><ShieldCheck className="w-5 h-5" /><h2 className="font-extrabold text-white text-sm">Limite geral de desconto</h2></div>
                <label className="sr-only" htmlFor={`${uid}-limit`}>Limite geral de desconto</label>
                <div className="relative"><input form={`${uid}-form`} id={`${uid}-limit`} type="number" min="0" max="100" step="0.1" inputMode="decimal" className={`${fieldClass} pr-10`} value={Number.isNaN(draft.maxDiscountPercentage) ? '' : draft.maxDiscountPercentage} onChange={event => setDraft(previous => ({ ...previous, maxDiscountPercentage: event.target.value === '' ? NaN : Number(event.target.value) }))} aria-invalid={!!errors.maxDiscountPercentage} aria-describedby={`${uid}-limit-help`} /><Percent className="absolute w-4 h-4 right-3 top-3.5 text-brand-amber pointer-events-none" /></div>
                <p id={`${uid}-limit-help`} className={`text-xs mt-2 ${errors.maxDiscountPercentage ? 'text-red-300' : 'text-purple-300'}`}>{errors.maxDiscountPercentage ?? 'Teto da loja. Abaixo, defina limites menores por produto.'}</p>
              </section>
            </div>
            <div className="bg-brand-amber/10 border border-brand-amber/30 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3"><Clock className="w-5 h-5 text-brand-amber shrink-0" /><div><p className="text-xs text-purple-200">Prévia da janela de ofertas</p><p className="text-xl font-black text-brand-light tabular-nums" aria-live="polite">{period ? `${period.start} → ${period.end}` : 'Defina um horário válido'}{period?.previousDay && <span className="text-xs font-medium text-purple-200 block mt-1">O início pertence ao dia anterior.</span>}</p></div></div>
              <p className="text-xs text-purple-200 max-w-sm leading-relaxed">Salvar define as regras da operação. Nenhuma oferta é publicada automaticamente por esta tela.</p>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 card-surface p-4 sm:p-5">
            <div><p className="flex items-center gap-2 text-brand-light text-xs font-bold mb-2"><CalendarDays className="w-4 h-4" />Hoje, {dateLabel}</p><h2 className="text-lg sm:text-xl text-white font-black">Quanto você preparou hoje?</h2><p className="text-xs sm:text-sm text-purple-200 mt-2 max-w-2xl">Informe o <strong>total preparado</strong>, incluindo o que já vendeu. Sem confirmação, a média dos últimos 7 dias é usada como estimativa.</p></div>
            <div className="rounded-xl bg-purple-950/70 border border-purple-800/60 px-5 py-3 flex md:flex-col items-center justify-between md:justify-center gap-2"><span className="text-3xl text-brand-amber font-black tabular-nums">{confirmedCount}<span className="text-lg text-purple-300 font-medium">/{items.length}</span></span><span className="text-xs text-purple-200">itens confirmados hoje</span></div>
          </div>
        )}

        <section className="panel-surface p-3 sm:p-5 space-y-4" aria-labelledby={`${uid}-products-title`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div><h2 id={`${uid}-products-title`} className="text-base sm:text-lg font-extrabold text-white">{tab === 'operation' ? 'Desconto máximo por produto' : 'Registro da produção'}</h2><p className="text-xs text-purple-300 mt-1">{tab === 'operation' ? 'O preço mínimo acompanha o limite escolhido para cada item.' : 'Revise os valores estimados. A confirmação inclui todas as páginas.'}</p></div>
            <Badge variant="purple" size="sm">{items.length} produtos no catálogo</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-3">
            <div className="relative"><label className="sr-only" htmlFor={`${uid}-search`}>Buscar produto ou categoria</label><Search className="absolute left-3 top-3.5 w-4 h-4 text-purple-400 pointer-events-none" /><input id={`${uid}-search`} className={`${fieldClass} pl-10 pr-11`} placeholder="Buscar produto ou categoria..." value={search} onChange={event => { setSearch(event.target.value); setPage(1) }} />{search && <button type="button" className="absolute right-0 top-0 min-w-11 min-h-11 grid place-items-center text-purple-300 hover:text-brand-amber" aria-label="Limpar busca" onClick={() => { setSearch(''); setPage(1) }}><X className="w-4 h-4" /></button>}</div>
            <div><label htmlFor={`${uid}-category`} className="sr-only">Categoria</label><select id={`${uid}-category`} className={fieldClass} value={category} onChange={event => { setCategory(event.target.value); setPage(1) }}><option value="ALL">Todas as categorias</option>{categories.map(value => <option key={value}>{value}</option>)}</select></div>
          </div>
          <div className="rounded-xl border border-purple-800/50 overflow-hidden bg-surface-table">
            <div className={`settings-grid settings-grid-${tab} settings-table-head text-xs text-purple-300 bg-purple-950/60 px-4 py-3 font-semibold`} aria-hidden="true"><span>Produto</span><span>{tab === 'operation' ? 'Preço atual' : 'Média de vendas'}</span><span>{tab === 'operation' ? 'Desconto máximo' : 'Total preparado'}</span><span className="text-right">{tab === 'operation' ? 'Preço mínimo' : 'Registro'}</span></div>
            <div role="list" aria-label={tab === 'operation' ? 'Limites dos produtos' : 'Produção dos produtos'}>
              {visibleItems.map(item => {
                const discount = draft.maxDiscountByItem[item.id] ?? draft.maxDiscountPercentage
                const resolved = resolveQuantity(item.id, production, historicalAverages, productionDate)
                const quantity = quantities[item.id] ?? String(resolved.quantity ?? '')
                const edited = Object.hasOwn(quantities, item.id)
                return <div role="listitem" key={item.id} className={`settings-grid settings-grid-${tab} settings-product-row border-t border-purple-900/60 px-4 py-4 hover:bg-purple-900/10 transition-colors`}>
                  <div className="settings-product-name min-w-0"><p className="text-sm font-bold text-purple-50 leading-snug">{item.name}</p><p className="text-[11px] text-purple-300 mt-1">{item.category}{tab === 'production' && <span className="block mt-1">Vendidos hoje: <strong className="text-purple-100">{item.sold}</strong> un.</span>}</p></div>
                  <div className="text-sm text-purple-100 tabular-nums"><span className="settings-mobile-label">{tab === 'operation' ? 'Preço atual' : 'Média / dia'}</span>{tab === 'operation' ? formatCurrencyBRL(item.unitPrice) : historicalAverages[item.id] == null ? <span className="text-xs text-purple-300">Sem histórico</span> : <>{historicalAverages[item.id]} <span className="text-xs text-purple-300">un.</span></>}</div>
                  {tab === 'operation' ? <div><label className="settings-mobile-label" htmlFor={`${uid}-discount-${item.id}`}>Desconto</label><div className="relative max-w-28"><input form={`${uid}-form`} id={`${uid}-discount-${item.id}`} type="number" min="0" max={Number.isFinite(draft.maxDiscountPercentage) ? draft.maxDiscountPercentage : 100} step="0.1" inputMode="decimal" aria-label={`Desconto máximo de ${item.name}`} value={Number.isNaN(discount) ? '' : discount} onChange={event => setDraft(previous => ({ ...previous, maxDiscountByItem: { ...previous.maxDiscountByItem, [item.id]: event.target.value === '' ? NaN : Number(event.target.value) } }))} className={`${fieldClass} pr-8 font-bold`} aria-invalid={!!errors[item.id]} aria-describedby={errors[item.id] ? `${uid}-error-${item.id}` : undefined} /><span className="absolute right-3 top-3 text-purple-300 text-sm pointer-events-none">%</span></div>{errors[item.id] && <p id={`${uid}-error-${item.id}`} className="text-xs text-red-300 mt-2">{errors[item.id]}</p>}</div> : <div><label className="settings-mobile-label" htmlFor={`${uid}-quantity-${item.id}`}>Preparado</label><div className="settings-stepper flex items-center rounded-xl border border-purple-700/60 bg-purple-950/80 w-fit"><button type="button" className="min-h-11 min-w-11 text-brand-amber grid place-items-center hover:bg-purple-900/70 rounded-l-xl" aria-label={`Diminuir produção de ${item.name}`} disabled={Number(quantity) <= 0} onClick={() => step(item.id, -1)}><Minus className="w-4 h-4" /></button><input form={`${uid}-form`} id={`${uid}-quantity-${item.id}`} aria-label={`Quantidade preparada de ${item.name}`} className="w-14 min-h-11 bg-transparent text-center text-base sm:text-sm text-white font-bold min-w-0" type="text" inputMode="numeric" placeholder="—" value={quantity} onChange={event => setQuantities(previous => ({ ...previous, [item.id]: event.target.value }))} aria-invalid={!!errors[item.id]} aria-describedby={errors[item.id] ? `${uid}-error-${item.id}` : undefined} /><button type="button" className="min-h-11 min-w-11 text-brand-amber grid place-items-center hover:bg-purple-900/70 rounded-r-xl" aria-label={`Aumentar produção de ${item.name}`} disabled={Number(quantity) >= 99999} onClick={() => step(item.id, 1)}><Plus className="w-4 h-4" /></button></div>{errors[item.id] && <p id={`${uid}-error-${item.id}`} className="text-xs text-red-300 mt-2">{errors[item.id]}</p>}</div>}
                  <div className="settings-last-cell text-right">{tab === 'operation' ? <><span className="settings-mobile-label">Preço mínimo</span><span className="text-brand-amber font-bold text-sm tabular-nums">{Number.isFinite(discount) && discount >= 0 && discount <= 100 ? formatCurrencyBRL(item.unitPrice * (1 - discount / 100)) : '—'}</span></> : <Badge size="sm" variant={edited ? 'purple' : resolved.source === 'confirmed' ? 'safe' : 'moderate'}>{edited ? 'Não salvo' : resolved.source === 'confirmed' ? <><Check className="w-3 h-3" />Confirmado</> : resolved.source === 'estimated' ? 'Estimativa' : 'Sem registro'}</Badge>}</div>
                </div>
              })}
            </div>
            {!visibleItems.length && <div className="text-center py-12 px-4 text-purple-300"><PackageOpen className="w-8 h-8 mx-auto mb-3 text-brand-amber" /><h3 className="font-bold text-white">{items.length ? 'Nenhum produto encontrado' : 'O catálogo ainda está vazio'}</h3><p className="text-xs mt-2">{items.length ? 'Tente outro nome ou limpe os filtros.' : 'Os produtos aparecerão aqui quando estiverem disponíveis.'}</p>{items.length > 0 && <button type="button" className="btn-secondary text-xs min-h-11 mt-4" onClick={() => { setSearch(''); setCategory('ALL'); setPage(1) }}>Limpar filtros</button>}</div>}
          </div>
          <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} pageSize={pageSize} pageSizeOptions={[6, 8, 12, 16]} onPageChange={setPage} onPageSizeChange={value => { setPageSize(value); setPage(1) }} />
          <div className="rounded-xl bg-purple-950/60 border border-purple-800/40 p-3 flex items-start gap-2 text-xs text-purple-200"><Info className="w-4 h-4 text-brand-amber shrink-0 mt-0.5" /><p className="leading-relaxed">{tab === 'operation' ? 'O limite geral vale para produtos sem um desconto individual. Reduzir o teto exige revisar os limites individuais que o ultrapassarem.' : 'A média é estimada com 7 dias de vendas simuladas. Zero é válido quando ainda não houve venda do item. Amanhã, as quantidades voltam à estimativa até nova confirmação.'}</p></div>
        </section>
      </fieldset>

      {Object.keys(errors).length > 0 && <p role="alert" className="text-sm text-red-300">Revise os campos destacados antes de continuar.</p>}
      {failure && <div role="alert" className="rounded-xl border border-red-400/40 bg-red-950/30 p-4 text-sm text-red-200">{failure}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-400/40 bg-emerald-950/30 p-3 text-sm text-emerald-200 flex items-center justify-between gap-2"><span className="flex items-center gap-2"><CheckCheck className="w-4 h-4 shrink-0" />{notice}</span><button type="button" aria-label="Fechar mensagem" className="min-w-11 min-h-11 grid place-items-center" onClick={() => setNotice('')}><X className="w-4 h-4" /></button></div>}
      <footer className="panel-surface px-4 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><p className="text-sm font-bold text-purple-100">{dirty ? 'Alterações não salvas' : tab === 'production' && confirmedCount === items.length && items.length ? 'Produção de hoje confirmada' : 'Pronto para salvar'}</p><p className="text-xs text-purple-300 mt-1">{tab === 'production' ? `A confirmação considera todos os ${items.length} produtos.` : 'As regras serão compartilhadas com as outras telas.'}</p></div>
        <div className="flex flex-wrap gap-2"><button type="button" disabled={!dirty || saving} className="btn-secondary min-h-11 inline-flex items-center justify-center gap-2 text-xs flex-1 sm:flex-none" onClick={() => { if (tab === 'operation') setDraft(structuredClone(config)); else setQuantities({}); setErrors({}); setFailure('') }}><RotateCcw className="w-4 h-4" />Descartar</button><button type="submit" form={`${uid}-form`} disabled={saving || (tab === 'production' && (!items.length || (confirmedCount === items.length && !productionDirty)))} className="btn-primary min-h-11 inline-flex items-center justify-center gap-2 text-xs flex-1 sm:flex-none"><Save className="w-4 h-4" />{saving ? 'Salvando...' : tab === 'operation' ? 'Salvar configurações' : confirmedCount === items.length ? 'Atualizar produção' : 'Confirmar produção'}</button></div>
      </footer>
      <p className="text-[11px] text-purple-300 text-center leading-relaxed">Ambiente de demonstração · Catálogo e histórico simulados · Dados salvos neste navegador, sem envio à Cardápio Web.</p>
    </div>
  )
}
