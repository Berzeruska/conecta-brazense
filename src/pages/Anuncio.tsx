import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Clock, User, BadgeCheck, MessageCircle, Repeat, Trash2, Send, X } from 'lucide-react'
import { useCatalogo } from '../lib/catalogo'
import { tempoRelativo } from '../lib/format'
import { removerMeuAnuncio } from '../lib/publicar'
import { Cabecalho } from '../components/Cabecalho'
import { Foto } from '../components/Foto'
import { CartaoAnuncio, PrecoAnuncio } from '../components/Cartoes'
import { Botao } from '../components/Diversos'
import { SeloDaqui, TagModo } from '../components/Selos'
import { useToast } from '../components/Toast'
import { NaoEncontrado } from './NaoEncontrado'

export function PaginaAnuncio() {
  const { id = '' } = useParams()
  const { anuncios } = useCatalogo()
  const navegar = useNavigate()
  const toast = useToast()
  const [conversa, setConversa] = useState(false)
  const anuncio = anuncios.find((a) => a.id === id)
  if (!anuncio) return <NaoEncontrado />

  const parecidos = anuncios.filter((a) => a.id !== anuncio.id && a.modo === anuncio.modo).slice(0, 4)
  const mensagens =
    anuncio.modo === 'doar'
      ? ['Oi! Ainda está disponível? Tenho interesse.', 'Posso buscar hoje no fim da tarde?']
      : anuncio.modo === 'trocar'
        ? ['Oi! Tenho interesse na troca. Posso mandar foto do que tenho?', 'Ainda está disponível?']
        : ['Oi! Ainda está disponível?', 'Aceita uma proposta?', 'Posso ver pessoalmente?']

  return (
    <div className="pb-32">
      <div className="relative">
        <Cabecalho transparente />
        <Foto src={anuncio.foto} alt={anuncio.titulo} className="aspect-square w-full" prioridade />
      </div>
      <div className="-mt-5 rounded-t-3xl bg-fundo px-4 pt-5">
        <TagModo modo={anuncio.modo} />
        <h1 className="mt-2 text-2xl font-extrabold leading-tight text-tinta">{anuncio.titulo}</h1>
        <PrecoAnuncio anuncio={anuncio} className="mt-1 block text-3xl" />
        {anuncio.modo === 'trocar' && anuncio.troca && (
          <p className="mt-2 flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-sm text-sky-900">
            <Repeat className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              <b>Aceita em troca:</b> {anuncio.troca}
            </span>
          </p>
        )}
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{anuncio.descricao}</p>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <p className="flex items-center gap-2 rounded-xl bg-white p-3 ring-1 ring-slate-100">
            <MapPin className="h-4 w-4 text-destaque" /> {anuncio.bairro}
          </p>
          <p className="flex items-center gap-2 rounded-xl bg-white p-3 ring-1 ring-slate-100">
            <Clock className="h-4 w-4 text-destaque" /> {tempoRelativo(anuncio.publicadoEm)}
          </p>
          <p className="flex items-center gap-2 rounded-xl bg-white p-3 ring-1 ring-slate-100">
            <User className="h-4 w-4 text-destaque" /> {anuncio.autor}
          </p>
          <p className="flex items-center gap-2 rounded-xl bg-white p-3 ring-1 ring-slate-100">
            <BadgeCheck className="h-4 w-4 text-destaque" /> {anuncio.estado}
          </p>
        </div>
        <div className="mt-3">
          <SeloDaqui grande />
        </div>
        <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
          Dica de segurança: combine a entrega em lugar movimentado e só pague depois de ver o produto.
        </p>

        {anuncio.meu && (
          <button
            type="button"
            onClick={() => {
              removerMeuAnuncio(anuncio.id)
              toast('Anúncio removido')
              navegar('/feirao', { replace: true })
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold text-red-600 ring-1 ring-red-200"
          >
            <Trash2 className="h-4 w-4" /> Remover meu anúncio
          </button>
        )}

        {parecidos.length > 0 && (
          <>
            <h2 className="mb-3 mt-6 text-lg font-bold text-tinta">Parecidos no Feirão</h2>
            <div className="grid grid-cols-2 gap-3">
              {parecidos.map((a) => (
                <CartaoAnuncio key={a.id} anuncio={a} />
              ))}
            </div>
          </>
        )}
      </div>

      {!anuncio.meu && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto max-w-md">
            <Botao className="w-full" onClick={() => setConversa(true)}>
              <MessageCircle className="h-5 w-5" /> Chamar {anuncio.autor}
            </Botao>
          </div>
        </div>
      )}

      <AnimatePresence>
        {conversa && (
          <motion.div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConversa(false)}>
            <motion.div
              role="dialog"
              aria-label="Enviar mensagem"
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            >
              <div className="mb-3 flex items-center justify-between">
                <p className="font-bold text-tinta">Mensagem para {anuncio.autor}</p>
                <button type="button" aria-label="Fechar" onClick={() => setConversa(false)}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              <div className="space-y-2">
                {mensagens.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setConversa(false)
                      toast('Mensagem simulada: no protótipo nada é enviado')
                    }}
                    className="flex w-full items-center justify-between gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-left text-sm text-tinta active:bg-slate-200"
                  >
                    {m} <Send className="h-4 w-4 shrink-0 text-destaque" />
                  </button>
                ))}
              </div>
              <p className="mt-3 text-center text-[11px] text-slate-400">Protótipo: a conversa é simulada.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
