import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Minus, Plus, ShoppingBasket, ChevronRight, Truck, Store as StoreIcon } from 'lucide-react'
import { CATEGORIAS, acharProduto, acharVendedor, comparar, useCatalogo } from '../lib/catalogo'
import { carrinho } from '../lib/carrinho'
import { moeda } from '../lib/format'
import { Cabecalho } from '../components/Cabecalho'
import { Foto } from '../components/Foto'
import { CartaoProduto } from '../components/Cartoes'
import { ComparacaoPreco } from '../components/Comparacao'
import { Botao } from '../components/Diversos'
import { SeloDaqui, TagOrigem } from '../components/Selos'
import { useToast } from '../components/Toast'
import { NaoEncontrado } from './NaoEncontrado'

export function PaginaProduto() {
  const { id = '' } = useParams()
  const cat = useCatalogo()
  const navegar = useNavigate()
  const toast = useToast()
  const [qtd, setQtd] = useState(1)
  const produto = acharProduto(cat, id)
  const vendedor = produto && acharVendedor(cat, produto.vendedorId)
  if (!produto || !vendedor) return <NaoEncontrado />

  const comparacao = comparar(cat, produto)
  const ehProdutor = vendedor.tipo === 'produtor'
  const maisDaBanca = cat.produtos.filter((p) => p.vendedorId === vendedor.id && p.id !== produto.id).slice(0, 6)
  const rota = ehProdutor ? 'produtor' : 'loja'

  const adicionar = (irParaReserva: boolean) => {
    carrinho.adicionar(produto.id, qtd)
    if (irParaReserva) navegar('/carrinho')
    else toast(`${qtd}× ${produto.nome} na sua reserva`)
  }

  return (
    <div className="pb-32">
      <div className="relative">
        <Cabecalho transparente />
        <Foto src={produto.foto} alt={produto.nome} className="aspect-[4/3] w-full" prioridade />
      </div>
      <div className="-mt-5 rounded-t-3xl bg-fundo px-4 pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <TagOrigem tipo={vendedor.tipo} />
          <span className="text-xs text-slate-500">
            {CATEGORIAS[produto.categoria].emoji} {CATEGORIAS[produto.categoria].nome}
          </span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold leading-tight text-tinta">{produto.nome}</h1>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-tinta">{moeda(produto.preco)}</span>
          <span className="text-sm text-slate-500">/ {produto.unidade}</span>
          {produto.precoAntigo && <span className="text-sm text-slate-400 line-through">{moeda(produto.precoAntigo)}</span>}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{produto.descricao}</p>

        <Link to={`/${rota}/${vendedor.id}`} className="mt-4 flex items-center gap-3 rounded-2xl bg-white p-3 shadow-cartao">
          <Foto src={vendedor.foto} alt={vendedor.nome} className="h-12 w-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-tinta">{vendedor.nome}</p>
            <p className="truncate text-xs text-slate-500">
              {vendedor.responsavel} · {vendedor.bairro}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </Link>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-start gap-2 rounded-xl bg-white p-3 ring-1 ring-slate-100">
            <StoreIcon className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="text-slate-600">
              <b className="block text-tinta">Retirada</b>
              {vendedor.retirada}
            </span>
          </div>
          <div className="flex items-start gap-2 rounded-xl bg-white p-3 ring-1 ring-slate-100">
            <Truck className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="text-slate-600">
              <b className="block text-tinta">Entrega</b>
              {vendedor.entrega ? `${vendedor.diasEntrega.join(', ')} · ${moeda(vendedor.taxaEntrega)}` : 'Não faz entrega'}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <SeloDaqui grande />
        </div>

        {comparacao && (
          <div className="mt-5">
            <ComparacaoPreco comparacao={comparacao} />
          </div>
        )}

        {maisDaBanca.length > 0 && (
          <>
            <h2 className="mb-3 mt-6 text-lg font-bold text-tinta">Mais de {vendedor.nome}</h2>
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
              {maisDaBanca.map((p) => (
                <CartaoProduto key={p.id} produto={p} vendedor={vendedor} largura="w-40 shrink-0" />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Barra de reserva fixa acima da navegação */}
      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="flex items-center rounded-2xl bg-slate-100">
            <button type="button" aria-label="Diminuir" onClick={() => setQtd((q) => Math.max(1, q - 1))} className="grid h-12 w-10 place-items-center">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center font-bold tabular-nums" aria-live="polite">
              {qtd}
            </span>
            <button type="button" aria-label="Aumentar" onClick={() => setQtd((q) => Math.min(99, q + 1))} className="grid h-12 w-10 place-items-center">
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            aria-label="Adicionar e continuar comprando"
            onClick={() => adicionar(false)}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white text-tinta ring-1 ring-slate-200"
          >
            <ShoppingBasket className="h-5 w-5" />
          </button>
          <Botao variante={ehProdutor ? 'produtor' : 'primaria'} className="flex-1" onClick={() => adicionar(true)}>
            Reservar · {moeda(produto.preco * qtd)}
          </Botao>
        </div>
      </div>
    </div>
  )
}
