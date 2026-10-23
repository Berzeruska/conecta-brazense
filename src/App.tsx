import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { NavInferior } from './components/NavInferior'
import { ProvedorToast } from './components/Toast'
import { Inicio } from './pages/Inicio'
import { Buscar } from './pages/Buscar'
import { PaginaVendedor } from './pages/Vendedor'
import { PaginaProduto } from './pages/Produto'
import { Feirao } from './pages/Feirao'
import { PaginaAnuncio } from './pages/Anuncio'
import { Carrinho } from './pages/Carrinho'
import { Confirmacao } from './pages/Confirmacao'
import { Perfil } from './pages/Perfil'
import { PainelVendedor } from './pages/PainelVendedor'
import { ListaVendedores } from './pages/ListaVendedores'
import { EmBreve } from './pages/EmBreve'
import { Zelador } from './pages/Zelador'
import { NovoReporte } from './pages/NovoReporte'
import { PaginaReporte } from './pages/Reporte'
import { Telao } from './pages/Telao'
import { MapaCidade } from './pages/MapaCidade'
import { NaoEncontrado } from './pages/NaoEncontrado'

export function Rotas() {
  const local = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [local.pathname])

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={local.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
      >
        <Routes location={local}>
          <Route path="/" element={<Inicio />} />
          <Route path="/buscar" element={<Buscar />} />
          <Route path="/produtores" element={<ListaVendedores tipo="produtor" />} />
          <Route path="/lojas" element={<ListaVendedores tipo="loja" />} />
          <Route path="/produtor/:id" element={<PaginaVendedor />} />
          <Route path="/loja/:id" element={<PaginaVendedor />} />
          <Route path="/produto/:id" element={<PaginaProduto />} />
          <Route path="/feirao" element={<Feirao />} />
          <Route path="/feirao/:id" element={<PaginaAnuncio />} />
          <Route path="/carrinho" element={<Carrinho />} />
          <Route path="/reserva/:pedido" element={<Confirmacao />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/vendedor" element={<PainelVendedor />} />
          <Route path="/zelador" element={<Zelador />} />
          <Route path="/zelador/novo" element={<NovoReporte />} />
          <Route path="/zelador/:id" element={<PaginaReporte />} />
          <Route path="/mapa" element={<MapaCidade />} />
          <Route path="/pergunte" element={<EmBreve tela="pergunte" />} />
          <Route path="*" element={<NaoEncontrado />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  // O telão é tela cheia para projetar: sem a moldura de celular e sem a navegação inferior.
  if (useLocation().pathname === '/telao') return <Telao />
  return (
    <ProvedorToast>
      <div className="mx-auto min-h-dvh max-w-md bg-fundo pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:shadow-2xl">
        <Rotas />
      </div>
      <NavInferior />
    </ProvedorToast>
  )
}
