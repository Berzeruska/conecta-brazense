import { Link } from 'react-router-dom'
import { CircleDot, Clock3, CloudOff, Lightbulb, Radio, Smartphone, Trash2, TriangleAlert, type LucideIcon } from 'lucide-react'
import type { CategoriaReporte, Reporte, StatusReporte } from '../data/types'
import { CATEGORIAS_REPORTE, STATUS_REPORTE, rotuloEspera, type EstadoConexao } from '../lib/reportes'
import { tempoRelativo } from '../lib/format'
import { Foto } from './Foto'
import { Pino } from './Mapa'

export const ICONE_CATEGORIA: Record<CategoriaReporte, LucideIcon> = {
  buraco: CircleDot,
  iluminacao: Lightbulb,
  lixo: Trash2,
  outros: TriangleAlert,
}

export function ChipStatus({ status, grande }: { status: StatusReporte; grande?: boolean }) {
  const { nome, cor } = STATUS_REPORTE[status]
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full font-bold ${grande ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'}`}
      style={{ color: cor, backgroundColor: `${cor}1A` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cor }} aria-hidden />
      {nome}
    </span>
  )
}

/** Selo de espera: vermelho enquanto ninguém respondeu. */
export function SeloEspera({ reporte, agora, claro }: { reporte: Reporte; agora?: number; claro?: boolean }) {
  const aberto = reporte.status === 'aberto'
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold ${
        aberto ? 'text-[#D9443A]' : claro ? 'text-white/70' : 'text-slate-500'
      }`}
    >
      <Clock3 className="h-3.5 w-3.5" aria-hidden />
      {rotuloEspera(reporte, agora)}
    </span>
  )
}

export function CartaoReporte({ reporte, agora }: { reporte: Reporte; agora?: number }) {
  const Icone = ICONE_CATEGORIA[reporte.categoria]
  return (
    <Link to={`/zelador/${reporte.id}`} className="flex gap-3 rounded-2xl bg-white p-2.5 shadow-cartao active:scale-[0.99]">
      <Foto src={reporte.foto} alt={CATEGORIAS_REPORTE[reporte.categoria].nome} className="h-[84px] w-[84px] shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-1.5 truncate text-sm font-bold text-tinta">
            <Icone className="h-4 w-4 shrink-0" style={{ color: STATUS_REPORTE[reporte.status].cor }} aria-hidden />
            {CATEGORIAS_REPORTE[reporte.categoria].nome} · {reporte.bairro}
          </p>
          <ChipStatus status={reporte.status} />
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-slate-600">{reporte.descricao}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <SeloEspera reporte={reporte} agora={agora} />
          <span className="text-[10px] text-slate-400">{reporte.meu ? 'Você' : reporte.autor} · {tempoRelativo(reporte.criadoEm, agora)}</span>
        </div>
      </div>
    </Link>
  )
}

export function PinoReporte({ reporte, novo, comBalao = true }: { reporte: Reporte; novo?: boolean; comBalao?: boolean }) {
  const cat = CATEGORIAS_REPORTE[reporte.categoria]
  return (
    <Pino
      posicao={[reporte.lat, reporte.lng]}
      Icone={ICONE_CATEGORIA[reporte.categoria]}
      cor={STATUS_REPORTE[reporte.status].cor}
      rotulo={`${cat.nome} · ${reporte.bairro} · ${STATUS_REPORTE[reporte.status].nome}`}
      novo={novo}
    >
      {comBalao && (
        <div>
          <p className="font-bold text-tinta">
            {cat.nome} · {reporte.bairro}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <ChipStatus status={reporte.status} />
            <SeloEspera reporte={reporte} />
          </div>
          <Link to={`/zelador/${reporte.id}`} className="mt-2 block font-semibold text-destaque">
            Ver detalhes
          </Link>
        </div>
      )}
    </Pino>
  )
}

const CONEXAO: Record<EstadoConexao, { texto: string; Icone: LucideIcon; classe: string }> = {
  'ao-vivo': { texto: 'Ao vivo', Icone: Radio, classe: 'bg-emerald-500/15 text-emerald-600' },
  conectando: { texto: 'Conectando...', Icone: Radio, classe: 'bg-slate-500/10 text-slate-500' },
  offline: { texto: 'Sem conexão · dados salvos', Icone: CloudOff, classe: 'bg-amber-500/15 text-amber-700' },
  local: { texto: 'Neste aparelho', Icone: Smartphone, classe: 'bg-slate-500/10 text-slate-500' },
}

export function IndicadorConexao({ estado, escuro }: { estado: EstadoConexao; escuro?: boolean }) {
  const { texto, Icone, classe } = CONEXAO[estado]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
        escuro ? 'bg-white/10 text-white' : classe
      }`}
      title={estado === 'local' ? 'Sem Supabase configurado: sincroniza só entre abas deste aparelho' : undefined}
    >
      {estado === 'ao-vivo' ? (
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      ) : (
        <Icone className="h-3.5 w-3.5" aria-hidden />
      )}
      {texto}
    </span>
  )
}
