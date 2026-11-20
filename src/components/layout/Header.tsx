import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Zap,
  Sliders,
  AlertTriangle,
  Flame,
  BarChart3,
  Clock,
  Menu,
  X,
} from 'lucide-react'
import { useStore } from '../../context/StoreContext'

export const Header: React.FC = () => {
  const { config, summary, isLiveSimulationActive } = useStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navItems = [
    {
      to: '/configuracao',
      label: 'Configuração',
      icon: Sliders,
      badge: null,
    },
    {
      to: '/itens-em-risco',
      label: 'Itens em Risco',
      icon: AlertTriangle,
      badge: summary.criticalCount > 0 ? `${summary.criticalCount} críticos` : null,
    },
    {
      to: '/oferta-relampago',
      label: 'Oferta Relâmpago',
      icon: Flame,
      badge: 'Auto',
    },
    {
      to: '/resultados',
      label: 'Resultados',
      icon: BarChart3,
      badge: null,
    },
  ]

  return (
    <header className="sticky top-0 z-50 bg-surface-header/95 backdrop-blur-md border-b border-purple-900/60 shadow-lg shadow-purple-950/40 w-full overflow-hidden">
      {/* Top Banner: Status da Loja & Janela */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900/80 to-purple-950 px-3 sm:px-4 py-1 border-b border-purple-800/40 text-[11px] sm:text-xs text-purple-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 truncate">
            <span className="flex items-center gap-1.5 text-brand-amber font-bold shrink-0">
              <Clock className="w-3.5 h-3.5 text-brand-amber shrink-0" />
              <span>Fechamento às {config.closingTime}</span>
            </span>
            <span className="text-purple-400/50 hidden xs:inline">•</span>
            <span className="text-purple-300 hidden md:inline truncate">
              Janela: <strong className="text-brand-light">Últimas {config.offerWindowHours}h</strong> (Máx: {config.maxDiscountPercentage}% OFF)
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-amber/15 border border-brand-amber/35 text-brand-light text-[10px] sm:text-[11px] font-bold">
              <span className={`w-1.5 h-1.5 rounded-full bg-brand-amber ${isLiveSimulationActive ? 'animate-ping' : ''}`} />
              Auto Pedidos {isLiveSimulationActive ? 'ON' : 'OFF'}
            </span>
            <span className="text-purple-400/50 hidden sm:inline">•</span>
            <span className="text-purple-300/80 text-[11px] hidden sm:inline">
              {summary.totalSurplusUnits} un em risco
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          {/* Logo & Brand */}
          <NavLink
            to="/itens-em-risco"
            className="flex items-center gap-2 group cursor-pointer shrink-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-brand-amber via-brand-light to-brand-gold flex items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.3)] group-hover:scale-105 transition-transform shrink-0">
              <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-purple-950 fill-purple-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-black text-base sm:text-lg tracking-tight text-white group-hover:text-brand-light transition-colors">
                  Oferta<span className="text-brand-amber">Relâmpago</span>
                </span>
                <span className="bg-purple-800/90 text-brand-light text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded border border-purple-600/50 tracking-wider">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-purple-300/70 hidden md:block truncate">
                Controle de Validade & Desperdício Zero
              </p>
            </div>
          </NavLink>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all relative ${
                      isActive
                        ? 'bg-brand-amber text-purple-950 shadow-[0_0_18px_rgba(251,191,36,0.3)] font-bold'
                        : 'text-purple-200/80 hover:text-brand-light hover:bg-purple-900/50 border border-transparent hover:border-purple-700/40'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-4 h-4 ${
                          isActive
                            ? 'text-purple-950 fill-purple-950/20'
                            : 'text-purple-400 group-hover:text-brand-light'
                        }`}
                      />
                      <span>{item.label}</span>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-purple-950 text-brand-amber'
                              : 'bg-purple-800 text-brand-light border border-purple-600/40'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              )
            })}
          </nav>

          {/* Mobile Hamburguer Button */}
          <div className="flex lg:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
              aria-expanded={mobileMenuOpen}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all flex items-center justify-center shrink-0 min-w-[40px] min-h-[40px] active:scale-95 ${
                mobileMenuOpen
                  ? 'bg-brand-amber text-purple-950 font-bold border-brand-light shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                  : 'bg-purple-950/80 border-purple-700/60 text-brand-amber hover:text-brand-light hover:bg-purple-900/80 hover:border-brand-amber/50 shadow-sm'
              }`}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-purple-950 stroke-[2.5]" />
              ) : (
                <Menu className="w-5 h-5 text-brand-amber stroke-[2.5]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-purple-900/70 bg-surface-header/98 flex flex-col gap-1.5 animate-fadeIn">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all min-h-[44px] ${
                      isActive
                        ? 'bg-brand-amber text-purple-950 font-black shadow-md'
                        : 'text-purple-200 bg-purple-950/50 hover:bg-purple-900/60 hover:text-brand-light border border-purple-800/40'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`w-4 h-4 ${
                            isActive ? 'text-purple-950' : 'text-brand-amber'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            isActive
                              ? 'bg-purple-950 text-brand-amber'
                              : 'bg-purple-900 text-brand-light border border-purple-700'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        )}
      </div>
    </header>
  )
}
