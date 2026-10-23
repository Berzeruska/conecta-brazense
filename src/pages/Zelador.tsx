import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Monitor } from 'lucide-react'
import type { StatusReporte } from '../data/types'
import { STATUS_REPORTE, resumir, useAgora, useReportes, useReportesAoVivo } from '../lib/reportes'
import { city } from '../lib/city'
import { plural } from '../lib/format'
import { Mapa } from '../components/Mapa'
import { CartaoReporte, IndicadorConexao, PinoReporte } from '../components/Zelador'
import { RodapeDemo } from '../components/Diversos'

const FILTROS: (StatusReporte | 'todos')[] = ['todos', 'aberto', 'andamento', 'resolvido']

export function Zelador() {
  const conexao = useReportesAoVivo()
  const reportes = useReportes()
  const agora = useAgora()
  const [filtro, setFiltro] = useState<StatusReporte | 'todos'>('todos')
  const resumo = resumir(reportes, agora)
  const visiveis = filtro === 'todos' ? reportes : reportes.filter((r) => r.status === filtro)

  return (
    <div className="pb-24">
      <header className="flex items-start justify-between gap-3 px-4 pt-4">
        <div>
          <h1 className="text-2xl font-extrabold text-tinta">Zelador</h1>
          <p className="text-sm text-slate-500">Os problemas de {city.cidade} num mapa público.</p>
        </div>
        <Link
          to="/telao"
          className="mt-1 flex shrink-0 items-center gap-1.5 rounded-full bg-primaria px-3 py-2 text-xs font-bold text-white shadow-md"
        >
          <Monitor className="h-4 w-4" aria-hidden /> Telão
        </Link>
      </header>

      {/* Contadores que também filtram o mapa */}
      <section className="mt-4 grid grid-cols-3 gap-2 px-4" aria-label="Resumo">
        {(['aberto', 'andamento', 'resolvido'] as const).map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={filtro === s}
            onClick={() => setFiltro(filtro === s ? 'todos' : s)}
            className={`rounded-2xl bg-white p-3 text-left shadow-cartao transition active:scale-[0.98] ${
              filtro === s ? 'ring-2' : 'ring-0'
            }`}
            style={{ ['--tw-ring-color' as string]: STATUS_REPORTE[s].cor }}
          >
            <span className="block text-2xl font-extrabold tabular-nums" style={{ color: STATUS_REPORTE[s].cor }}>
              {resumo[s]}
            </span>
            <span className="text-[11px] font-semibold leading-tight text-slate-600">{STATUS_REPORTE[s].nome}</span>
          </button>
        ))}
      </section>
      {resumo.maiorEspera > 0 && (
        <p className="mt-2 px-4 text-xs text-slate-500">
          O problema aberto mais antigo está há <strong className="text-[#D9443A]">{plural(resumo.maiorEspera, 'dia', 'dias')}</strong> sem
          resposta.
        </p>
      )}

      <section className="mt-3 px-4">
        <div className="relative">
          <Mapa className="h-72 rounded-3xl shadow-cartao" zoom={14} rotulo="Mapa dos problemas reportados">
            {visiveis.map((r) => (
              <PinoReporte key={r.id} reporte={r} />
            ))}
          </Mapa>
          <div className="pointer-events-none absolute left-3 top-3 z-[500]">
            <IndicadorConexao estado={conexao} />
          </div>
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 px-1 text-[11px] text-slate-500">
          {(['aberto', 'andamento', 'resolvido'] as const).map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: STATUS_REPORTE[s].cor }} aria-hidden />
              {STATUS_REPORTE[s].nome}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-5">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Filtrar por status">
          {FILTROS.map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filtro === f}
              onClick={() => setFiltro(f)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                filtro === f ? 'bg-tinta text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
              }`}
            >
              {f === 'todos' ? `Todos (${reportes.length})` : STATUS_REPORTE[f].nome}
            </button>
          ))}
        </div>
        <motion.ul layout className="mt-3 space-y-2 px-4">
          {visiveis.map((r) => (
            <motion.li key={r.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <CartaoReporte reporte={r} agora={agora} />
            </motion.li>
          ))}
        </motion.ul>
      </section>

      <RodapeDemo texto="Protótipo navegável · reportes de exemplo e status simulados" />

      <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-md justify-end px-4">
        <Link
          to="/zelador/novo"
          className="pointer-events-auto flex h-14 items-center gap-2 rounded-full bg-destaque px-5 font-bold text-white shadow-xl shadow-destaque/40 active:scale-95"
        >
          <Camera className="h-5 w-5" aria-hidden /> Reportar problema
        </Link>
      </div>
    </div>
  )
}
