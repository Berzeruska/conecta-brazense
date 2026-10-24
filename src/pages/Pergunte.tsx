import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, BookOpenText, ChevronDown, Landmark, MessageCircleQuestion, RotateCcw, SendHorizontal, Sparkles, WifiOff } from 'lucide-react'
import { city } from '../lib/city'
import { MAX_PERGUNTA, type Fonte, type Resposta } from '../lib/pergunte'
import { limparConversa, perguntar, sugestoes, useConversa, type Mensagem } from '../lib/chat'
import { acharServico } from '../lib/servicos'
import { gravar, ler } from '../lib/storage'
import { ServicoCard } from '../components/ServicoCard'
import { RodapeDemo } from '../components/Diversos'

const novoId = () => Math.random().toString(36).slice(2, 10)
/** Resposta pronta sai em milissegundos; uma pausa curta deixa claro que algo foi "pensado". */
const PAUSA_MINIMA = 450

function Selo({ origem }: { origem: Resposta['origem'] }) {
  return origem === 'assistente' ? (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-produtor">
      <Sparkles className="h-3 w-3" aria-hidden /> Assistente on-line
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
      <WifiOff className="h-3 w-3" aria-hidden /> Resposta pronta · funciona sem internet
    </span>
  )
}

function ChipFonte({ fonte }: { fonte: Fonte }) {
  const [aberto, setAberto] = useState(false)
  if (fonte.tipo !== 'lei' || !fonte.trecho)
    return (
      <li className="flex items-start gap-1.5 text-[11px] leading-snug text-slate-500">
        {fonte.tipo === 'lei' ? <BookOpenText className="mt-px h-3.5 w-3.5 shrink-0 text-primaria" aria-hidden /> : <Landmark className="mt-px h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />}
        {fonte.rotulo}
      </li>
    )
  return (
    <li>
      <button
        type="button"
        onClick={() => setAberto(!aberto)}
        aria-expanded={aberto}
        className="flex items-center gap-1.5 rounded-full bg-primaria/[0.07] px-2.5 py-1 text-[11px] font-bold text-primaria"
      >
        <BookOpenText className="h-3.5 w-3.5" aria-hidden />
        {fonte.rotulo}
        <ChevronDown className={`h-3.5 w-3.5 transition ${aberto ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      <AnimatePresence initial={false}>
        {aberto && (
          <motion.blockquote
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="mt-1.5 border-l-2 border-primaria/30 pl-2.5 text-xs leading-relaxed text-slate-600">“{fonte.trecho}”</p>
          </motion.blockquote>
        )}
      </AnimatePresence>
    </li>
  )
}

function BalaoResposta({ resposta }: { resposta: Resposta }) {
  const servicos = resposta.servicos.map(acharServico).filter((s) => !!s)
  const comCard = servicos.filter((s) => s.tipo !== 'emergencia')
  const emergencias = servicos.filter((s) => s.tipo === 'emergencia')
  return (
    <div className="max-w-[92%] space-y-2">
      <div className="rounded-3xl rounded-tl-md bg-white p-4 shadow-cartao">
        {resposta.texto.split('\n\n').map((p, i) => (
          <p key={i} className={`text-[15px] leading-relaxed text-tinta ${i ? 'mt-2' : ''}`}>
            {p}
          </p>
        ))}
        {emergencias.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {emergencias.map((s) => (
              <a
                key={s.id}
                href={`tel:${s.telefone}`}
                className="rounded-full bg-[#D9443A]/10 px-3 py-1.5 text-sm font-extrabold text-[#B9342B]"
                aria-label={`Ligar ${s.telefone}, ${s.nome}`}
              >
                {s.telefone} · <span className="font-semibold">{s.nome}</span>
              </a>
            ))}
          </div>
        )}
        {resposta.link && (
          <Link to={resposta.link.para} className="mt-3 flex items-center gap-1 text-sm font-bold text-destaque">
            {resposta.link.rotulo} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        )}
        {resposta.fontes.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-2.5">
            <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">Fonte</p>
            <ul className="flex flex-wrap gap-1.5">
              {resposta.fontes.map((f) => (
                <ChipFonte key={f.rotulo} fonte={f} />
              ))}
            </ul>
          </div>
        )}
        <div className="mt-2">
          <Selo origem={resposta.origem} />
        </div>
      </div>
      {comCard.map((s) => (
        <ServicoCard key={s.id} servico={s} />
      ))}
    </div>
  )
}

function Digitando() {
  return (
    <div className="flex w-fit items-center gap-1 rounded-3xl rounded-tl-md bg-white px-4 py-3.5 shadow-cartao" role="status" aria-label="Respondendo">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-slate-300"
          animate={{ y: [0, -4, 0] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12 }}
        />
      ))}
    </div>
  )
}

function Sugestoes({ aoEscolher, compacto }: { aoEscolher: (s: string) => void; compacto?: boolean }) {
  return (
    <div className={compacto ? 'no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4' : 'flex flex-wrap gap-2'}>
      {sugestoes.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => aoEscolher(s)}
          className="shrink-0 rounded-full bg-white px-3.5 py-2 text-left text-sm font-semibold text-tinta shadow-cartao ring-1 ring-slate-100 active:scale-[0.97]"
        >
          {s}
        </button>
      ))}
    </div>
  )
}

export function Pergunte() {
  const conversa = useConversa()
  const [texto, setTexto] = useState(() => ler('chat-rascunho', ''))
  const [esperando, setEsperando] = useState(false)
  const fim = useRef<HTMLDivElement>(null)
  const primeira = useRef(true)

  useEffect(() => {
    // Resposta nova: rola até o começo dela (o texto vem antes dos cartões).
    // Ao voltar do mapa, a conversa continua de onde parou, sem animação.
    const ultima = conversa[conversa.length - 1]
    const alvo = ultima?.papel === 'assistente' && !esperando ? document.getElementById(`msg-${ultima.id}`) : fim.current
    alvo?.scrollIntoView?.({ behavior: primeira.current ? 'auto' : 'smooth', block: alvo === fim.current ? 'end' : 'start' })
    primeira.current = false
  }, [conversa, esperando])

  async function enviar(pergunta: string) {
    const p = pergunta.trim().slice(0, MAX_PERGUNTA)
    if (!p || esperando) return
    const historico = ler<Mensagem[]>('chat-conversa', [])
    gravar('chat-conversa', [...historico, { id: novoId(), papel: 'usuario', texto: p }])
    setTexto('')
    gravar('chat-rascunho', '')
    setEsperando(true)
    const [resposta] = await Promise.all([perguntar(p, historico), new Promise((r) => setTimeout(r, PAUSA_MINIMA))])
    gravar('chat-conversa', [...ler<Mensagem[]>('chat-conversa', []), { id: novoId(), papel: 'assistente', texto: resposta.texto, resposta }])
    setEsperando(false)
  }

  const vazia = conversa.length === 0

  return (
    <div className="flex min-h-[calc(100dvh-4.5rem)] flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-3 bg-fundo/95 px-4 pb-2 pt-4 backdrop-blur">
        <div>
          <h1 className="text-2xl font-extrabold text-tinta">Pergunte à Cidade</h1>
          <p className="text-sm text-slate-500">Dúvidas sobre serviços de {city.cidade}, com a fonte.</p>
        </div>
        {!vazia && (
          <button
            type="button"
            onClick={limparConversa}
            className="flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-2 text-xs font-bold text-slate-600 shadow-cartao"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Nova conversa
          </button>
        )}
      </header>

      <div className="flex-1 px-4">
        {vazia ? (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="relative mt-2 overflow-hidden rounded-3xl bg-primaria p-5 text-white">
              <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/[0.06]" aria-hidden />
              <div className="absolute -bottom-14 -left-6 h-36 w-36 rounded-full bg-destaque/20" aria-hidden />
              <span className="relative grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
                <MessageCircleQuestion className="h-7 w-7" aria-hidden />
              </span>
              <p className="relative mt-3 text-lg font-bold leading-snug">Pergunte como falaria com um vizinho.</p>
              <p className="relative mt-1 text-sm text-white/75">
                Respondo com o cadastro de serviços e as leis do município, sempre mostrando de onde veio. O que eu não souber, eu digo.
              </p>
            </div>
            <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-wide text-slate-400">Experimente</p>
            <Sugestoes aoEscolher={enviar} />
          </motion.div>
        ) : (
          <ul className="space-y-3 pb-2 pt-2 [&>li]:scroll-mt-28" aria-live="polite">
            {conversa.map((m) => (
              <motion.li key={m.id} id={`msg-${m.id}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={m.papel === 'usuario' ? 'flex justify-end' : ''}>
                {m.papel === 'usuario' ? (
                  <p className="max-w-[80%] rounded-3xl rounded-tr-md bg-primaria px-4 py-2.5 text-[15px] text-white">{m.texto}</p>
                ) : m.resposta ? (
                  <BalaoResposta resposta={m.resposta} />
                ) : null}
              </motion.li>
            ))}
            {esperando && (
              <li>
                <Digitando />
              </li>
            )}
          </ul>
        )}
        <div ref={fim} className="scroll-mb-40" />
      </div>

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-20 bg-gradient-to-t from-fundo via-fundo to-fundo/0 px-4 pb-3 pt-4">
        {!vazia && !esperando && (
          <div className="mb-2">
            <Sugestoes aoEscolher={enviar} compacto />
          </div>
        )}
        <form
          className="flex items-center gap-2 rounded-full bg-white p-1.5 pl-4 shadow-lg ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-destaque"
          onSubmit={(e) => {
            e.preventDefault()
            enviar(texto)
          }}
        >
          <input
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              gravar('chat-rascunho', e.target.value)
            }}
            maxLength={MAX_PERGUNTA}
            placeholder="Ex.: onde fica o posto de saúde?"
            aria-label="Sua pergunta"
            enterKeyHint="send"
            className="h-10 min-w-0 flex-1 bg-transparent text-base text-tinta outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={!texto.trim() || esperando}
            aria-label="Enviar pergunta"
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-destaque text-white transition active:scale-95 disabled:opacity-40"
          >
            <SendHorizontal className="h-5 w-5" aria-hidden />
          </button>
        </form>
      </div>
      {vazia && <RodapeDemo texto="Protótipo · confirme sempre na Prefeitura antes de decidir algo importante" />}
    </div>
  )
}
