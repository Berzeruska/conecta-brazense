import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Store as StoreIcon, Megaphone, Package, Receipt, Pencil, RotateCcw, Leaf, QrCode, Monitor } from 'lucide-react'
import type { Anuncio, Produto } from '../data/types'
import { city } from '../lib/city'
import { MINHA_BANCA_ID, PERFIL_PADRAO, usePerfil, type Perfil as TPerfil } from '../lib/catalogo'
import { useReservas, valorNaCidade } from '../lib/carrinho'
import { moeda, tempoRelativo } from '../lib/format'
import { apagarTudo, gravar, useArmazenado } from '../lib/storage'
import { BotaoCarrinho } from '../components/BotaoCarrinho'
import { Foto } from '../components/Foto'
import { NumeroAnimado, RodapeDemo } from '../components/Diversos'
import { useToast } from '../components/Toast'

const campo = 'h-11 w-full rounded-xl bg-white px-3 text-base text-tinta ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-destaque'

export function Perfil() {
  const perfil = usePerfil()
  const reservas = useReservas()
  const meusProdutos = useArmazenado<Produto[]>('meus-produtos', [])
  const meusAnuncios = useArmazenado<Anuncio[]>('meus-anuncios', [])
  const toast = useToast()
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState<TPerfil>(perfil)
  const [confirmarReset, setConfirmarReset] = useState(false)

  const gastoLocal = reservas.reduce((s, r) => s + r.subtotal, 0)
  const doProdutor = reservas.filter((r) => r.vendedorTipo === 'produtor').reduce((s, r) => s + r.subtotal, 0)
  const iniciais = (perfil.nome || 'V')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="pb-4">
      <section className="rounded-b-[2rem] bg-primaria px-4 pb-6 pt-5 text-white">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold">Perfil</h1>
          <BotaoCarrinho className="bg-white/15 text-white" />
        </div>
        {!editando ? (
          <div className="mt-4 flex items-center gap-3">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-destaque text-xl font-extrabold">{iniciais}</div>
            <div className="flex-1">
              <p className="text-lg font-bold">{perfil.nome}</p>
              <p className="text-sm text-white/70">
                {perfil.bairro} · {city.cidade}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setRascunho(perfil)
                setEditando(true)
              }}
              aria-label="Editar perfil"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/15"
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <form
            className="mt-4 space-y-2"
            onSubmit={(e) => {
              e.preventDefault()
              gravar('perfil', { ...rascunho, nome: rascunho.nome.trim() || PERFIL_PADRAO.nome, banca: rascunho.banca.trim() || PERFIL_PADRAO.banca })
              setEditando(false)
              toast('Perfil salvo')
            }}
          >
            <input className={campo} aria-label="Seu nome" placeholder="Seu nome" value={rascunho.nome} onChange={(e) => setRascunho({ ...rascunho, nome: e.target.value })} />
            <select className={campo} aria-label="Bairro" value={rascunho.bairro} onChange={(e) => setRascunho({ ...rascunho, bairro: e.target.value })}>
              {city.bairros.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
            <input
              className={campo}
              aria-label="Nome da sua banca"
              placeholder="Nome da sua banca (se vende)"
              value={rascunho.banca}
              onChange={(e) => setRascunho({ ...rascunho, banca: e.target.value })}
            />
            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setEditando(false)} className="h-11 flex-1 rounded-xl bg-white/15 font-bold">
                Cancelar
              </button>
              <button type="submit" className="h-11 flex-1 rounded-xl bg-destaque font-bold">
                Salvar
              </button>
            </div>
          </form>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-[11px] text-white/70">Você deixou na cidade</p>
            <p className="text-xl font-extrabold">{moeda(gastoLocal)}</p>
            <p className="text-[11px] text-emerald-300">{moeda(doProdutor)} direto ao produtor</p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3">
            <p className="text-[11px] text-white/70">Toda a cidade (simulado)</p>
            <p className="text-xl font-extrabold">
              <NumeroAnimado valor={valorNaCidade(reservas)} />
            </p>
            <p className="text-[11px] text-white/60">desde setembro</p>
          </div>
        </div>
      </section>

      <section className="mt-5 px-4">
        <Link to="/vendedor" className="flex items-center gap-3 rounded-2xl bg-produtor p-4 text-white shadow-lg shadow-produtor/25 active:scale-[0.99]">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/20">
            <StoreIcon className="h-6 w-6" />
          </span>
          <span className="flex-1">
            <b className="block">Painel do vendedor</b>
            <span className="text-sm text-white/85">Publique um produto ou anúncio com foto</span>
          </span>
          <ChevronRight className="h-5 w-5" />
        </Link>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Link to="/qr" className="flex items-center gap-2 rounded-2xl bg-white p-3 text-sm font-bold text-tinta shadow-cartao active:scale-[0.99]">
            <QrCode className="h-5 w-5 text-destaque" aria-hidden /> QR para a mesa
          </Link>
          <Link to="/telao" className="flex items-center gap-2 rounded-2xl bg-white p-3 text-sm font-bold text-tinta shadow-cartao active:scale-[0.99]">
            <Monitor className="h-5 w-5 text-destaque" aria-hidden /> Telão ao vivo
          </Link>
        </div>
      </section>

      <section className="mt-6 px-4">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-tinta">
          <Receipt className="h-5 w-5 text-destaque" /> Minhas reservas
        </h2>
        {reservas.length ? (
          <ul className="space-y-2">
            {reservas.slice(0, 8).map((r) => (
              <li key={r.id}>
                <Link to={`/reserva/${r.pedido}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-cartao">
                  <Foto src={r.itens[0]?.foto ?? ''} alt="" className="h-12 w-12 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-tinta">{r.vendedorNome}</p>
                    <p className="truncate text-xs text-slate-500">
                      {r.itens.map((i) => `${i.qtd}× ${i.nome}`).join(', ')}
                    </p>
                    <p className="text-xs text-slate-400">
                      {r.forma === 'entrega' ? 'Entrega' : 'Retirada'} · {r.dia} · {tempoRelativo(r.criadaEm)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs font-bold text-destaque">{r.codigo}</p>
                    <p className="text-sm font-bold text-tinta">{moeda(r.total)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-cartao">
            Nenhuma reserva ainda.{' '}
            <Link to="/buscar?origem=produtor" className="font-semibold text-produtor">
              Compre do produtor →
            </Link>
          </p>
        )}
      </section>

      <section className="mt-6 px-4">
        <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-tinta">
          <Megaphone className="h-5 w-5 text-destaque" /> Meus anúncios no Feirão
        </h2>
        {meusAnuncios.length ? (
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {meusAnuncios.map((a) => (
              <Link key={a.id} to={`/feirao/${a.id}`} className="w-32 shrink-0 overflow-hidden rounded-2xl bg-white shadow-cartao">
                <Foto src={a.foto} alt={a.titulo} className="aspect-square w-full" />
                <p className="line-clamp-1 p-2 text-xs font-semibold text-tinta">{a.titulo}</p>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-cartao">
            Tem algo parado em casa?{' '}
            <Link to="/vendedor?aba=anuncio" className="font-semibold text-destaque">
              Anuncie no Feirão →
            </Link>
          </p>
        )}
      </section>

      {meusProdutos.length > 0 && (
        <section className="mt-6 px-4">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-tinta">
            <Package className="h-5 w-5 text-produtor" /> Minha banca
          </h2>
          <Link to={`/produtor/${MINHA_BANCA_ID}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-cartao">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-produtor/10 text-produtor">
              <Leaf className="h-5 w-5" />
            </span>
            <span className="flex-1 text-sm">
              <b className="block text-tinta">{perfil.banca}</b>
              <span className="text-slate-500">{meusProdutos.length} {meusProdutos.length === 1 ? 'produto publicado' : 'produtos publicados'}</span>
            </span>
            <ChevronRight className="h-5 w-5 text-slate-400" />
          </Link>
        </section>
      )}

      <section className="mt-8 px-4">
        {!confirmarReset ? (
          <button
            type="button"
            onClick={() => setConfirmarReset(true)}
            className="flex w-full items-center justify-center gap-2 py-2 text-xs font-semibold text-slate-400"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Recomeçar a demonstração
          </button>
        ) : (
          <div className="rounded-2xl bg-white p-4 text-center shadow-cartao">
            <p className="text-sm text-tinta">Apagar reservas, anúncios e produtos criados neste aparelho?</p>
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setConfirmarReset(false)} className="h-10 flex-1 rounded-xl bg-slate-100 text-sm font-bold">
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  apagarTudo()
                  setConfirmarReset(false)
                  toast('Demonstração reiniciada')
                }}
                className="h-10 flex-1 rounded-xl bg-red-600 text-sm font-bold text-white"
              >
                Apagar
              </button>
            </div>
          </div>
        )}
      </section>
      <RodapeDemo />
    </div>
  )
}
