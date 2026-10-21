import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Check, CalendarDays, Store as StoreIcon, Truck, Home } from 'lucide-react'
import { useReservas } from '../lib/carrinho'
import { moeda } from '../lib/format'
import { Cabecalho } from '../components/Cabecalho'
import { NaoEncontrado } from './NaoEncontrado'

export function Confirmacao() {
  const { pedido = '' } = useParams()
  const reservas = useReservas().filter((r) => r.pedido === pedido)
  if (!reservas.length) return <NaoEncontrado />
  const total = reservas.reduce((s, r) => s + r.total, 0)
  const naCidade = reservas.reduce((s, r) => s + r.subtotal, 0)

  return (
    <div className="pb-8">
      <Cabecalho voltar={false} semCarrinho />
      <div className="flex flex-col items-center px-6 pt-2 text-center">
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          className="grid h-20 w-20 place-items-center rounded-full bg-produtor text-white shadow-xl shadow-produtor/30"
        >
          <Check className="h-10 w-10" strokeWidth={3} />
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-4 text-2xl font-extrabold text-tinta">
          Reserva feita!
        </motion.h1>
        <p className="mt-1 text-sm text-slate-600">
          {reservas.length > 1 ? `Avisamos os ${reservas.length} vendedores.` : `Avisamos ${reservas[0].vendedorNome}.`} Mostre o código na hora de
          receber.
        </p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 rounded-full bg-destaque/10 px-4 py-2 text-sm font-semibold text-destaque"
        >
          + {moeda(naCidade)} ficaram na cidade 🎉
        </motion.p>
      </div>

      <div className="mt-6 space-y-3 px-4">
        {reservas.map((r, i) => (
          <motion.section
            key={r.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.1 }}
            className="overflow-hidden rounded-2xl bg-white shadow-cartao"
          >
            <div className={`flex items-center justify-between p-4 text-white ${r.vendedorTipo === 'produtor' ? 'bg-produtor' : 'bg-primaria'}`}>
              <div>
                <p className="text-xs text-white/80">Código da reserva</p>
                <p className="font-mono text-2xl font-extrabold tracking-widest">{r.codigo}</p>
              </div>
              <p className="max-w-[45%] text-right text-sm font-bold leading-tight">{r.vendedorNome}</p>
            </div>
            <ul className="space-y-1 p-4 text-sm">
              {r.itens.map((it) => (
                <li key={it.produtoId} className="flex justify-between gap-2">
                  <span className="text-slate-700">
                    {it.qtd}× {it.nome}
                  </span>
                  <span className="font-semibold text-tinta">{moeda(it.preco * it.qtd)}</span>
                </li>
              ))}
              {r.taxa > 0 && (
                <li className="flex justify-between text-slate-500">
                  <span>Entrega</span>
                  <span>{moeda(r.taxa)}</span>
                </li>
              )}
            </ul>
            <div className="flex flex-wrap gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                {r.forma === 'entrega' ? <Truck className="h-3.5 w-3.5" /> : <StoreIcon className="h-3.5 w-3.5" />}
                {r.forma === 'entrega' ? 'Entrega local' : 'Retirada'}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" /> {r.dia}
              </span>
              <span className="ml-auto font-bold text-tinta">{moeda(r.total)}</span>
            </div>
          </motion.section>
        ))}
        {reservas.length > 1 && (
          <p className="flex justify-between px-1 text-sm">
            <span className="text-slate-500">Total geral</span>
            <b className="text-tinta">{moeda(total)}</b>
          </p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2 px-4">
        <Link to="/perfil" className="flex h-12 items-center justify-center rounded-2xl bg-white font-bold text-tinta ring-1 ring-slate-200">
          Minhas reservas
        </Link>
        <Link to="/" className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-destaque font-bold text-white">
          <Home className="h-4 w-4" /> Início
        </Link>
      </div>
    </div>
  )
}
