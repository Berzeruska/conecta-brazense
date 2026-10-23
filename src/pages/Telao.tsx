import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BellRing, Maximize, Minimize, Smartphone, X } from 'lucide-react'
import type { Reporte } from '../data/types'
import { CATEGORIAS_REPORTE, STATUS_REPORTE, resumir, useAgora, useReportes, useReportesAoVivo } from '../lib/reportes'
import { city } from '../lib/city'
import { tempoRelativo } from '../lib/format'
import { Mapa, Voar } from '../components/Mapa'
import { ChipStatus, ICONE_CATEGORIA, IndicadorConexao, PinoReporte, SeloEspera } from '../components/Zelador'

const DESTAQUE_MS = 90_000
const AVISO_MS = 8_000

/** Rota /telao: tela cheia para projetar na feira. Atualiza sozinha e anima cada ponto novo. */
export function Telao() {
  const conexao = useReportesAoVivo()
  const reportes = useReportes()
  const agora = useAgora(1000)
  const resumo = resumir(reportes, agora)

  const abertoEm = useRef(Date.now())
  const vistos = useRef<Set<string> | null>(null)
  const [chegadas, setChegadas] = useState<Record<string, number>>({})
  const [aviso, setAviso] = useState<Reporte | null>(null)

  useEffect(() => {
    if (!vistos.current) {
      vistos.current = new Set(reportes.map((r) => r.id))
      return
    }
    // Só é "novo" o que foi criado depois que o telão abriu (não o que veio na primeira carga do servidor).
    const novos = reportes.filter((r) => !vistos.current!.has(r.id))
    novos.forEach((r) => vistos.current!.add(r.id))
    const recentes = novos.filter((r) => new Date(r.criadoEm).getTime() > abertoEm.current - 60_000)
    if (!recentes.length) return
    const t = Date.now()
    setChegadas((c) => ({ ...c, ...Object.fromEntries(recentes.map((r) => [r.id, t])) }))
    setAviso(recentes[0])
  }, [reportes])

  useEffect(() => {
    if (!aviso) return
    const t = setTimeout(() => setAviso(null), AVISO_MS)
    return () => clearTimeout(t)
  }, [aviso])

  const ehNovo = (id: string) => chegadas[id] !== undefined && agora - chegadas[id] < DESTAQUE_MS
  const ultimos = reportes.slice(0, 8)
  const hora = new Date(agora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

  const [cheia, setCheia] = useState(false)
  useEffect(() => {
    const f = () => setCheia(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', f)
    return () => document.removeEventListener('fullscreenchange', f)
  }, [])
  const alternarTelaCheia = () => {
    if (document.fullscreenElement) void document.exitFullscreen()
    else void document.documentElement.requestFullscreen?.().catch(() => {})
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-primaria text-white">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-destaque/20 blur-3xl" aria-hidden />

      {/* Topo */}
      <header className="relative flex flex-wrap items-center gap-x-6 gap-y-2 px-5 pt-4 lg:px-8 lg:pt-6">
        <div className="mr-auto">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-destaque">Zelador · ao vivo</p>
          <h1 className="text-2xl font-extrabold tracking-tight lg:text-4xl">Problemas de {city.cidade}</h1>
        </div>
        <dl className="flex gap-2 lg:gap-3">
          {(['aberto', 'andamento', 'resolvido'] as const).map((s) => (
            <div key={s} className="min-w-[5.5rem] rounded-2xl bg-white/10 px-3 py-2 ring-1 ring-white/10 lg:min-w-[7.5rem] lg:px-4">
              <dt className="text-[11px] font-semibold text-white/70 lg:text-xs">{STATUS_REPORTE[s].nome}</dt>
              <dd className="text-2xl font-extrabold tabular-nums lg:text-4xl" style={{ color: s === 'resolvido' ? '#5BD08E' : STATUS_REPORTE[s].cor }}>
                {resumo[s]}
              </dd>
            </div>
          ))}
          <div className="hidden rounded-2xl bg-white/10 px-4 py-2 ring-1 ring-white/10 sm:block">
            <dt className="text-xs font-semibold text-white/70">Maior espera</dt>
            <dd className="text-2xl font-extrabold tabular-nums lg:text-4xl">
              {resumo.maiorEspera}
              <span className="ml-1 text-sm font-bold text-white/70 lg:text-base">dias</span>
            </dd>
          </div>
        </dl>
        <div className="flex items-center gap-3">
          <IndicadorConexao estado={conexao} escuro />
          <span className="text-xl font-bold tabular-nums text-white/90 lg:text-2xl">{hora}</span>
          <button
            type="button"
            onClick={alternarTelaCheia}
            aria-label={cheia ? 'Sair da tela cheia' : 'Tela cheia'}
            className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20"
          >
            {cheia ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
          {!cheia && (
            <Link to="/zelador" aria-label="Sair do telão" className="grid h-9 w-9 place-items-center rounded-full bg-white/10 hover:bg-white/20">
              <X className="h-4 w-4" />
            </Link>
          )}
        </div>
      </header>

      {/* Mapa + lista */}
      <main className="relative grid min-h-0 flex-1 grid-rows-[minmax(0,3fr)_minmax(0,2fr)] gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_400px] lg:grid-rows-1 lg:px-8">
        <div className="relative min-h-0">
          <Mapa className="h-full rounded-3xl ring-1 ring-white/10" zoom={15} rotulo="Mapa ao vivo dos problemas">
            <Voar para={aviso ? [aviso.lat, aviso.lng] : null} zoom={16} />
            {reportes.map((r) => (
              <PinoReporte key={r.id} reporte={r} novo={ehNovo(r.id)} />
            ))}
          </Mapa>
          <AnimatePresence>
            {aviso && (
              <motion.div
                key={aviso.id}
                role="status"
                initial={{ opacity: 0, y: -24, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12 }}
                className="absolute inset-x-4 top-4 z-[600] mx-auto flex max-w-xl items-center gap-4 rounded-2xl bg-destaque p-3 pr-5 shadow-2xl"
              >
                <img src={aviso.foto} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-white/85">
                    <BellRing className="h-4 w-4" aria-hidden /> Novo reporte agora
                  </p>
                  <p className="truncate text-xl font-extrabold">
                    {CATEGORIAS_REPORTE[aviso.categoria].nome} · {aviso.bairro}
                  </p>
                  <p className="truncate text-sm text-white/85">{aviso.descricao}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="flex min-h-0 flex-col">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-white/60">Últimos reportes</h2>
          <ul className="no-scrollbar min-h-0 flex-1 space-y-2 overflow-y-auto">
            <AnimatePresence initial={false}>
              {ultimos.map((r) => {
                const Icone = ICONE_CATEGORIA[r.categoria]
                const novo = ehNovo(r.id)
                return (
                  <motion.li
                    key={r.id}
                    layout
                    initial={{ opacity: 0, x: 60, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 26 }}
                    className={`flex gap-3 rounded-2xl p-2.5 ${novo ? 'bg-white text-tinta ring-4 ring-destaque' : 'bg-white/10 ring-1 ring-white/10'}`}
                  >
                    <img src={r.foto} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="flex min-w-0 items-center gap-1.5 truncate font-bold">
                          <Icone className="h-4 w-4 shrink-0" style={{ color: STATUS_REPORTE[r.status].cor }} aria-hidden />
                          {CATEGORIAS_REPORTE[r.categoria].nome} · {r.bairro}
                        </p>
                        {novo ? (
                          <span className="shrink-0 rounded-full bg-destaque px-2 py-0.5 text-[10px] font-extrabold uppercase text-white">Novo</span>
                        ) : (
                          <ChipStatus status={r.status} />
                        )}
                      </div>
                      <p className={`truncate text-xs ${novo ? 'text-slate-600' : 'text-white/70'}`}>{r.descricao}</p>
                      <div className="mt-0.5 flex items-center justify-between gap-2">
                        <SeloEspera reporte={r} agora={agora} claro={!novo} />
                        <span className={`text-[10px] ${novo ? 'text-slate-400' : 'text-white/50'}`}>{tempoRelativo(r.criadoEm, agora)}</span>
                      </div>
                    </div>
                  </motion.li>
                )
              })}
            </AnimatePresence>
          </ul>
        </aside>
      </main>

      <footer className="flex flex-wrap items-center justify-between gap-2 px-5 pb-4 text-xs text-white/60 lg:px-8">
        <p className="flex items-center gap-1.5">
          <Smartphone className="h-4 w-4" aria-hidden /> Reporte pelo celular: {city.appName} → Zelador → Reportar problema
        </p>
        <p>Protótipo navegável · reportes de exemplo e status simulados</p>
      </footer>
    </div>
  )
}
