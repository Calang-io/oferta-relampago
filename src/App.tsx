import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StoreProvider } from './context/StoreContext'
import { Header } from './components/layout/Header'
import { RiskItemsPage } from './features/risk-items/RiskItemsPage'

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <div className="min-h-screen bg-[#0e061c] text-purple-100 antialiased selection:bg-amber-400 selection:text-purple-950 font-sans">
          {/* Header com Navegação e Status */}
          <Header />

          {/* Conteúdo Principal */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
            <Routes>
              <Route path="/" element={<Navigate to="/itens-em-risco" replace />} />
              <Route path="/itens-em-risco" element={<RiskItemsPage />} />
              <Route path="*" element={<Navigate to="/itens-em-risco" replace />} />
            </Routes>
          </main>
        </div>
      </StoreProvider>
    </BrowserRouter>
  )
}
