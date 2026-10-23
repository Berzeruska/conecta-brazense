import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, CircleDashed, CloudUpload, Globe2, MapPinned } from 'lucide-react'
import { CATEGORIAS_REPORTE, STATUS_REPORTE, diasSemResposta, rotuloEspera, useAgora, useReportes, useReportesAoVivo } from '../lib/reportes'
import { city } from '../lib/city'
import { tempoRelativo } from '../lib/format'
import { supabaseConfigurado } from '../lib/supabase'
import { Cabecalho } from '../components/Cabecalho'
import { EstadoVazio, RodapeDemo } from '../components/Diversos'
import { Foto } from '../components/Foto'
import { Mapa } from '../components/Mapa'
import { ChipStatus, ICONE_CATEGORIA, PinoReporte } from '../components/Zelador'

const data = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

export function PaginaReporte() {
  const { id } = useParams()
  useReportesAoVivo()
  const agora = useAgora()
  const r = useReportes().find((x) => x.id === id)

  if (!r) {
    return (
      <div>
        <Cabecalho semCarrinho />
        <EstadoVazio Icone={MapPinned} titulo="Reporte não encontrado" texto="Ele pode ter sido criado em outro aparelho que ainda não sincronizou." />
      </div>
    )
  }

  const cat = CATEGORIAS_REPORTE[r.categoria]
  const Icone = ICONE_CATEGORIA[r.categoria]
  const cor = STATUS_REPORTE[r.status].cor
  const etapas = [
    { feito: true, titulo: 'Reportado', quando: data(r.criadoEm) },
    { feito: Boolean(r.respondidoEm), titulo: 'Prefeitura respondeu', quando: r.respondidoEm && data(r.respondidoEm) },
    { feito: r.status === 'resolvido', titulo: 'Resolvido', quando: r.resolvidoEm && data(r.resolvidoEm) },
  ]

  return (
    <div className="pb-4">
      <div className="relative">
        <Cabecalho transparente semCarrinho />
        <Foto src={r.foto} alt={`Foto do problema: ${cat.nome}`} className="aspect-[4/3] w-full" prioridade />
      </div>

      <div className="relative -mt-6 rounded-t-3xl bg-fundo px-4 pt-5">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl text-white" style={{ backgroundColor: cor }}>
            <Icone className="h-5 w-5" aria-hidden />
          </span>
          <ChipStatus status={r.status} grande />
        </div>
        <h1 className="mt-3 text-2xl font-extrabold text-tinta">
          {cat.nome} · {r.bairro}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Por {r.meu ? 'você' : r.autor} · {tempoRelativo(r.criadoEm, agora)}
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-tinta">{r.descricao}</p>

        {/* Contador em destaque */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 rounded-3xl p-5 text-white"
          style={{ backgroundColor: cor }}
        >
          {r.status === 'aberto' ? (
            <>
              <p className="text-5xl font-extrabold tabular-nums">{diasSemResposta(r, agora)}</p>
              <p className="mt-1 font-semibold">{diasSemResposta(r, agora) === 1 ? 'dia sem resposta' : 'dias sem resposta'}</p>
            </>
          ) : (
            <p className="text-xl font-extrabold">{rotuloEspera(r, agora)}</p>
          )}
          <p className="mt-2 text-xs text-white/80">Contador público: todo mundo vê quanto tempo o problema esperou.</p>
        </motion.div>

        {/* Linha do tempo */}
        <ol className="mt-5 space-y-3 rounded-2xl bg-white p-4 shadow-cartao">
          {etapas.map((e) => (
            <li key={e.titulo} className="flex items-center gap-3">
              {e.feito ? (
                <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: STATUS_REPORTE.resolvido.cor }} aria-hidden />
              ) : (
                <CircleDashed className="h-5 w-5 shrink-0 text-slate-300" aria-hidden />
              )}
              <span className={`flex-1 text-sm font-semibold ${e.feito ? 'text-tinta' : 'text-slate-400'}`}>{e.titulo}</span>
              <span className="text-xs text-slate-400">{e.quando || 'aguardando'}</span>
            </li>
          ))}
        </ol>

        {r.meu && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-medium text-slate-600 shadow-cartao">
            {r.pendente ? (
              <>
                <CloudUpload className="h-4 w-4 shrink-0 text-amber-600" aria-hidden /> Salvo neste aparelho. Vai para o mapa público quando
                houver internet.
              </>
            ) : supabaseConfigurado ? (
              <>
                <Globe2 className="h-4 w-4 shrink-0 text-produtor" aria-hidden /> No mapa público: já aparece no telão.
              </>
            ) : (
              <>
                <Globe2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden /> Salvo neste aparelho (sem servidor configurado).
              </>
            )}
          </p>
        )}

        <h2 className="mt-6 mb-2 text-lg font-bold text-tinta">Onde fica</h2>
        <Mapa className="h-52 rounded-2xl shadow-cartao" centro={[r.lat, r.lng]} zoom={16} interativo={false} rotulo={`Local do problema em ${city.cidade}`}>
          <PinoReporte reporte={r} comBalao={false} novo={r.status === 'aberto'} />
        </Mapa>
      </div>

      <RodapeDemo texto="Protótipo navegável · status simulado para demonstração" />
    </div>
  )
}
