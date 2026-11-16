import { useEffect, useMemo, useState } from 'react'
import exemplosJson from '../data/reportes.json'
import type { CategoriaReporte, Reporte, StatusReporte } from '../data/types'
import { PERFIL_PADRAO, type Perfil } from './catalogo'
import { city } from './city'
import { plural } from './format'
import { gravar, ler, useArmazenado } from './storage'
import { obterSupabase, supabaseConfigurado } from './supabase'

const DIA = 86400_000
const TABELA = 'reports'
/** Quantos reportes do servidor guardamos no aparelho (as fotos ocupam espaço no localStorage). */
const LIMITE_REMOTOS = 50

export const CATEGORIAS_REPORTE: Record<CategoriaReporte, { nome: string; dica: string; foto: string }> = {
  buraco: { nome: 'Buraco', dica: 'Buraco, asfalto afundando', foto: '/img/zelador/z-buraco-poca.jpg' },
  iluminacao: { nome: 'Iluminação', dica: 'Poste apagado ou piscando', foto: '/img/zelador/z-poste-apagado.jpg' },
  lixo: { nome: 'Lixo', dica: 'Lixo, entulho, descarte', foto: '/img/zelador/z-entulho.jpg' },
  outros: { nome: 'Outros', dica: 'Calçada, árvore, sinalização', foto: '/img/zelador/z-calcada-quebrada.jpg' },
}

export const STATUS_REPORTE: Record<StatusReporte, { nome: string; cor: string }> = {
  aberto: { nome: 'Aberto', cor: '#D9443A' },
  andamento: { nome: 'Em andamento', cor: '#E39B12' },
  resolvido: { nome: 'Resolvido', cor: '#2E9459' },
}

type ReporteJson = Omit<Reporte, 'criadoEm' | 'respondidoEm' | 'resolvidoEm'> & {
  diasAtras: number
  respondidoApos?: number
  resolvidoApos?: number
}

/** As datas dos exemplos são relativas a "agora", para os contadores parecerem sempre atuais. */
export function reportesDeExemplo(agora = Date.now()): Reporte[] {
  return (exemplosJson as ReporteJson[]).map(({ diasAtras, respondidoApos, resolvidoApos, ...r }) => {
    const criado = agora - diasAtras * DIA
    return {
      ...r,
      criadoEm: new Date(criado).toISOString(),
      respondidoEm: respondidoApos !== undefined ? new Date(criado + respondidoApos * DIA).toISOString() : undefined,
      resolvidoEm: resolvidoApos !== undefined ? new Date(criado + resolvidoApos * DIA).toISOString() : undefined,
    }
  })
}

const dias = (de: string, ate: number) => Math.max(0, Math.floor((ate - new Date(de).getTime()) / DIA))

/** Aberto: dias desde o reporte. Respondido: quantos dias levou para responder. */
export function diasSemResposta(r: Reporte, agora = Date.now()): number {
  return dias(r.criadoEm, r.respondidoEm ? new Date(r.respondidoEm).getTime() : agora)
}

export function rotuloEspera(r: Reporte, agora = Date.now()): string {
  if (r.status === 'resolvido' && r.resolvidoEm) {
    const d = dias(r.criadoEm, new Date(r.resolvidoEm).getTime())
    return d === 0 ? 'Resolvido no mesmo dia' : `Resolvido em ${plural(d, 'dia', 'dias')}`
  }
  if (r.respondidoEm) {
    const d = diasSemResposta(r)
    return d === 0 ? 'Respondido no mesmo dia' : `Respondido em ${plural(d, 'dia', 'dias')}`
  }
  const d = diasSemResposta(r, agora)
  return d === 0 ? 'Reportado hoje' : `${plural(d, 'dia', 'dias')} sem resposta`
}

export interface Resumo {
  aberto: number
  andamento: number
  resolvido: number
  maiorEspera: number
}

export function resumir(reportes: Reporte[], agora = Date.now()): Resumo {
  const r: Resumo = { aberto: 0, andamento: 0, resolvido: 0, maiorEspera: 0 }
  for (const x of reportes) {
    r[x.status]++
    if (x.status === 'aberto') r.maiorEspera = Math.max(r.maiorEspera, diasSemResposta(x, agora))
  }
  return r
}

/** Exemplos, depois o que está neste aparelho, depois o servidor (que tem a palavra final). */
export function mesclarReportes(exemplos: Reporte[], locais: Reporte[], remotos: Reporte[]): Reporte[] {
  const porId = new Map<string, Reporte>()
  for (const r of exemplos) porId.set(r.id, r)
  for (const r of locais) porId.set(r.id, r)
  for (const r of remotos) {
    const local = porId.get(r.id)
    porId.set(r.id, local?.meu ? { ...r, meu: true } : r)
  }
  return [...porId.values()].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
}

export function useReportes(): Reporte[] {
  const locais = useArmazenado<Reporte[]>('reportes-locais', [])
  const remotos = useArmazenado<Reporte[]>('reportes-remotos', [])
  return useMemo(() => mesclarReportes(reportesDeExemplo(), locais, remotos), [locais, remotos])
}

/** Relógio para os contadores de dias andarem sozinhos no telão. */
export function useAgora(intervalo = 60_000): number {
  const [agora, setAgora] = useState(Date.now)
  useEffect(() => {
    const t = setInterval(() => setAgora(Date.now()), intervalo)
    return () => clearInterval(t)
  }, [intervalo])
  return agora
}

// ---------- Área aceita: a mesma do mapa offline ----------

export const LIMITES = { sul: -23.944, norte: -23.804, oeste: -49.873, leste: -49.733 }

export function dentroDaCidade(lat: number, lng: number): boolean {
  return lat >= LIMITES.sul && lat <= LIMITES.norte && lng >= LIMITES.oeste && lng <= LIMITES.leste
}

// ---------- Criar ----------

export interface NovoReporte {
  categoria: CategoriaReporte | null
  descricao: string
  foto: string
  lat: number | null
  lng: number | null
  bairro: string
}

export function validarReporte(n: NovoReporte): string | null {
  if (!n.categoria) return 'Escolha o tipo do problema.'
  if (n.lat === null || n.lng === null) return 'Toque no mapa para marcar onde fica.'
  if (!dentroDaCidade(n.lat, n.lng)) return `O ponto precisa ficar em ${city.cidade}.`
  return null
}

const novoId = () => `r-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`

export function criarReporte(n: NovoReporte, perfil: Perfil): { reporte: Reporte; semFoto: boolean } {
  const categoria = n.categoria!
  const reporte: Reporte = {
    id: novoId(),
    categoria,
    descricao: n.descricao.trim() || `${CATEGORIAS_REPORTE[categoria].nome} reportado pelo app.`,
    foto: n.foto || CATEGORIAS_REPORTE[categoria].foto,
    lat: Math.round(n.lat! * 1e6) / 1e6,
    lng: Math.round(n.lng! * 1e6) / 1e6,
    bairro: n.bairro || perfil.bairro || PERFIL_PADRAO.bairro,
    autor: perfil.nome || PERFIL_PADRAO.nome,
    status: 'aberto',
    criadoEm: new Date().toISOString(),
    meu: true,
    pendente: supabaseConfigurado,
  }
  const atuais = ler<Reporte[]>('reportes-locais', [])
  let semFoto = false
  let salvo = reporte
  if (!gravar('reportes-locais', [reporte, ...atuais])) {
    salvo = { ...reporte, foto: CATEGORIAS_REPORTE[categoria].foto }
    gravar('reportes-locais', [salvo, ...atuais])
    semFoto = Boolean(n.foto)
  }
  void sincronizarPendentes()
  return { reporte: salvo, semFoto }
}

// ---------- Servidor (Supabase) ----------

interface Linha {
  id: string
  categoria: CategoriaReporte
  descricao: string
  foto: string
  lat: number
  lng: number
  bairro: string
  autor: string
  status: StatusReporte
  criado_em: string
  respondido_em: string | null
  resolvido_em: string | null
}

export function daLinha(l: Linha): Reporte {
  return {
    id: l.id,
    categoria: l.categoria,
    descricao: l.descricao,
    foto: l.foto,
    lat: l.lat,
    lng: l.lng,
    bairro: l.bairro,
    autor: l.autor,
    status: l.status,
    criadoEm: new Date(l.criado_em).toISOString(),
    respondidoEm: l.respondido_em ? new Date(l.respondido_em).toISOString() : undefined,
    resolvidoEm: l.resolvido_em ? new Date(l.resolvido_em).toISOString() : undefined,
  }
}

const maisNovosPrimeiro = (a: Reporte, b: Reporte) => b.criadoEm.localeCompare(a.criadoEm)

function guardarRemotos(novos: Reporte[]) {
  const porId = new Map(ler<Reporte[]>('reportes-remotos', []).map((r) => [r.id, r]))
  for (const r of novos) porId.set(r.id, r)
  gravar('reportes-remotos', [...porId.values()].sort(maisNovosPrimeiro).slice(0, LIMITE_REMOTOS))
}

/** O banco avisou (realtime) que estes reportes foram apagados: somem do aparelho também. */
export function removerReportes(ids: string[]) {
  const fora = new Set(ids)
  for (const chave of ['reportes-remotos', 'reportes-locais']) {
    const atuais = ler<Reporte[]>(chave, [])
    const ficam = atuais.filter((r) => !fora.has(r.id))
    if (ficam.length !== atuais.length) gravar(chave, ficam)
  }
}

/** Ids que este aparelho já viu no servidor. Tirar a foto ANTES de consultar, para comparar com a resposta. */
export const idsVistosNoServidor = () => new Set(ler<Reporte[]>('reportes-remotos', []).map((r) => r.id))

/**
 * A consulta ao servidor é a verdade: o que o aparelho já tinha visto lá e não veio mais foi apagado
 * no banco, então sai do cache e da lista "meus reportes" (senão o aparelho ressuscita o reporte).
 * Ficam: o que ainda não foi enviado, o que nunca passou pelo servidor e o que chegou durante a consulta.
 */
export function reconciliarComServidor(servidor: Reporte[], vistosAntes: Set<string>) {
  const noServidor = new Set(servidor.map((r) => r.id))
  // A consulta traz só os LIMITE_REMOTOS mais novos: mais antigo que isso não dá para afirmar que sumiu.
  const completa = servidor.length < LIMITE_REMOTOS
  const maisAntigo = servidor.reduce((m, r) => (r.criadoEm < m ? r.criadoEm : m), servidor[0]?.criadoEm ?? '')
  const sumiu = (r: Reporte) => vistosAntes.has(r.id) && !noServidor.has(r.id) && (completa || r.criadoEm >= maisAntigo)

  const cache = ler<Reporte[]>('reportes-remotos', [])
  const remotos = [...servidor, ...cache.filter((r) => !noServidor.has(r.id) && !sumiu(r))].sort(maisNovosPrimeiro).slice(0, LIMITE_REMOTOS)
  gravar('reportes-remotos', remotos)

  const locais = ler<Reporte[]>('reportes-locais', [])
  const ficam = locais.filter((r) => r.pendente || !sumiu(r))
  if (ficam.length !== locais.length) gravar('reportes-locais', ficam)
}

let sincronizando = false

/** Envia o que foi criado sem internet. Seguro chamar várias vezes. */
export async function sincronizarPendentes(): Promise<void> {
  if (sincronizando) return
  const sb = await obterSupabase()
  if (!sb) return
  sincronizando = true
  try {
    for (const r of ler<Reporte[]>('reportes-locais', []).filter((x) => x.pendente)) {
      const { data, error } = await sb
        .from(TABELA)
        .insert({
          id: r.id,
          categoria: r.categoria,
          descricao: r.descricao,
          foto: r.foto,
          lat: r.lat,
          lng: r.lng,
          bairro: r.bairro,
          autor: r.autor,
        })
        .select()
        .single()
      // 23505 = já existe (enviado antes, mas a resposta se perdeu).
      if (error && error.code !== '23505') break
      gravar(
        'reportes-locais',
        ler<Reporte[]>('reportes-locais', []).map((x) => (x.id === r.id ? { ...x, pendente: false } : x)),
      )
      if (data) guardarRemotos([daLinha(data as Linha)])
    }
  } catch {
    /* sem rede: tenta de novo depois */
  } finally {
    sincronizando = false
  }
}

export async function carregarRemotos(): Promise<boolean> {
  const sb = await obterSupabase()
  if (!sb) return false
  try {
    const vistosAntes = idsVistosNoServidor()
    const { data, error } = await sb.from(TABELA).select('*').order('criado_em', { ascending: false }).limit(LIMITE_REMOTOS)
    if (error || !data) return false
    reconciliarComServidor((data as Linha[]).map(daLinha), vistosAntes)
    return true
  } catch {
    return false
  }
}

/** Evento do realtime: INSERT/UPDATE trazem a linha em `new`; DELETE traz só o id em `old`. */
export function aplicarEvento(p: { eventType?: string; new?: unknown; old?: unknown }) {
  if (p.eventType === 'DELETE') {
    const id = (p.old as { id?: unknown } | null)?.id
    if (typeof id === 'string') removerReportes([id])
  } else if (p.new && typeof p.new === 'object' && 'id' in p.new) {
    guardarRemotos([daLinha(p.new as Linha)])
  }
}

export type EstadoConexao = 'local' | 'conectando' | 'ao-vivo' | 'offline'

/**
 * Mantém os reportes atualizados enquanto a tela está aberta: realtime do
 * Supabase, mais uma consulta periódica de segurança. Sem Supabase, outras
 * abas do mesmo aparelho continuam sincronizadas pelo localStorage.
 */
export function useReportesAoVivo(): EstadoConexao {
  const [estado, setEstado] = useState<EstadoConexao>(supabaseConfigurado ? 'conectando' : 'local')

  useEffect(() => {
    if (!supabaseConfigurado) return
    let ativo = true
    let inscrito = false
    let sair = () => {}
    // Em modo avião não insiste: nada de requisição falhando a cada 20 s nem websocket reconectando.
    const semRede = () => navigator.onLine === false

    const atualizar = async () => {
      if (semRede()) return ativo && setEstado('offline')
      await sincronizarPendentes()
      const ok = await carregarRemotos()
      if (ativo) setEstado(ok ? (inscrito ? 'ao-vivo' : 'conectando') : 'offline')
    }

    const conectar = () =>
      void obterSupabase().then((sb) => {
        if (!sb || !ativo || semRede()) return
        const canal = sb
          .channel(`reports-${Math.random().toString(36).slice(2)}`)
          .on('postgres_changes', { event: '*', schema: 'public', table: TABELA }, (p) => aplicarEvento(p))
          .subscribe((s) => {
            inscrito = s === 'SUBSCRIBED'
            if (!ativo) return
            if (inscrito) setEstado('ao-vivo')
            else if (s === 'CHANNEL_ERROR' || s === 'TIMED_OUT') setEstado('offline')
          })
        sair = () => {
          inscrito = false
          sair = () => {}
          void sb.removeChannel(canal)
        }
      })

    void atualizar()
    conectar()
    const relogio = setInterval(atualizar, 20_000)
    const voltouRede = () => {
      conectar()
      void atualizar()
    }
    const caiuRede = () => {
      sair()
      setEstado('offline')
    }
    window.addEventListener('online', voltouRede)
    window.addEventListener('offline', caiuRede)

    return () => {
      ativo = false
      clearInterval(relogio)
      window.removeEventListener('online', voltouRede)
      window.removeEventListener('offline', caiuRede)
      sair()
    }
  }, [])

  return estado
}
