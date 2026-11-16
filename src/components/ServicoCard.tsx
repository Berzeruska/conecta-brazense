import { Link } from 'react-router-dom'
import { Ambulance, Clock3, Flame, Hospital, Landmark, MapPin, Phone, Shield, Stethoscope, type LucideIcon } from 'lucide-react'
import type { Servico } from '../data/types'
import { emergencias, fotoDisponivel, linkTelefone } from '../lib/servicos'
import { Foto } from './Foto'

export const ICONE_SERVICO: Record<string, LucideIcon> = {
  'hospital-sao-sebastiao': Hospital,
  'posto-toyoki': Stethoscope,
  'camara-vereadores': Landmark,
  'pm-190': Shield,
  'samu-192': Ambulance,
  'bombeiros-193': Flame,
}
export const iconeServico = (s: Servico): LucideIcon => ICONE_SERVICO[s.id] ?? (s.tipo === 'camara' ? Landmark : Hospital)

/** Enquanto a equipe não coloca a foto real, um fundo da cor da cidade com o ícone do serviço. */
function Placeholder({ servico }: { servico: Servico }) {
  const Icone = iconeServico(servico)
  return (
    <div className="relative grid aspect-[16/9] w-full place-items-center overflow-hidden bg-gradient-to-br from-primaria to-primaria-clara" aria-hidden>
      <div className="absolute -right-6 -top-10 h-32 w-32 rounded-full bg-white/[0.06]" />
      <div className="absolute -bottom-12 -left-6 h-36 w-36 rounded-full bg-destaque/15" />
      <Icone className="absolute -bottom-4 right-3 h-24 w-24 text-white/[0.07]" strokeWidth={1.5} />
      <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur-sm">
        <Icone className="h-7 w-7" strokeWidth={1.8} />
      </span>
    </div>
  )
}

interface Props {
  servico: Servico
  className?: string
  /** Esconde o botão "Ver no mapa" (ex.: dentro do próprio mapa). */
  semMapa?: boolean
}

/** Card de serviço público: usado no Início, no mapa e, no Tiro 3, nas respostas do Pergunte à Cidade. */
export function ServicoCard({ servico, className = '', semMapa }: Props) {
  const foto = fotoDisponivel(servico)
  return (
    <article className={`flex flex-col overflow-hidden rounded-3xl bg-white shadow-cartao ${className}`}>
      {foto ? <Foto src={foto} alt={servico.nome} className="aspect-[16/9] w-full" /> : <Placeholder servico={servico} />}
      {foto && servico.legendaFoto && <p className="px-4 pt-2 text-[10px] italic leading-tight text-slate-400">{servico.legendaFoto}</p>}
      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold leading-tight text-tinta">{servico.nome}</h3>
        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-slate-600">
          <MapPin className="mt-px h-3.5 w-3.5 shrink-0 text-destaque" aria-hidden />
          {servico.endereco ??
            (servico.numero ? (
              <span>
                Nº {servico.numero} · <span className="italic text-slate-400">rua a confirmar</span>
              </span>
            ) : (
              <span className="italic text-slate-400">Endereço a confirmar</span>
            ))}
        </p>
        <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-600">
          <Clock3 className="mt-px h-3.5 w-3.5 shrink-0 text-destaque" aria-hidden />
          {servico.horario ?? <span className="italic text-slate-400">Horário a confirmar</span>}
        </p>
        <p className="mt-1 flex items-start gap-1.5 text-xs text-slate-600">
          <Phone className="mt-px h-3.5 w-3.5 shrink-0 text-destaque" aria-hidden />
          {servico.telefone ?? <span className="italic text-slate-400">Telefone a confirmar</span>}
        </p>
        <div className="mt-auto flex gap-2 pt-3">
          {servico.telefone && (
            <a
              href={linkTelefone(servico.telefone)}
              className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primaria text-sm font-bold text-white active:scale-[0.98]"
              aria-label={`Ligar para ${servico.nome}: ${servico.telefone}`}
            >
              <Phone className="h-4 w-4" aria-hidden /> Ligar
            </a>
          )}
          {!semMapa &&
            (servico.coordenadas ? (
              <Link
                to={`/mapa?foco=${servico.id}`}
                className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-sm font-bold text-tinta ring-1 ring-slate-200 active:scale-[0.98]"
              >
                <MapPin className="h-4 w-4" aria-hidden /> Ver no mapa
              </Link>
            ) : (
              <span className="flex h-10 flex-1 items-center justify-center rounded-xl text-center text-[11px] font-semibold leading-tight text-slate-400 ring-1 ring-slate-100">
                Local a confirmar
              </span>
            ))}
        </div>
      </div>
    </article>
  )
}

/** 190 · 192 · 193: um toque para ligar. */
export function Emergencias() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {emergencias.map((s) => {
        const Icone = iconeServico(s)
        return (
          <a
            key={s.id}
            href={linkTelefone(s.telefone)}
            aria-label={`Ligar ${s.telefone}, ${s.nome}`}
            className="flex flex-col items-center gap-0.5 rounded-2xl bg-[#D9443A]/[0.08] px-2 py-3 text-center ring-1 ring-[#D9443A]/15 active:scale-95"
          >
            <Icone className="h-5 w-5 text-[#D9443A]" aria-hidden />
            <span className="text-xl font-extrabold tabular-nums text-[#B9342B]">{s.telefone}</span>
            <span className="text-[11px] font-semibold leading-tight text-tinta">{s.nome}</span>
          </a>
        )
      })}
    </div>
  )
}
