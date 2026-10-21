import { Link } from 'react-router-dom'
import { Leaf, Store, TrendingDown } from 'lucide-react'
import type { Comparacao } from '../lib/catalogo'
import { moeda } from '../lib/format'

/** Produtor x loja lado a lado, com a economia em destaque. */
export function ComparacaoPreco({ comparacao, titulo = 'Produtor x loja' }: { comparacao: Comparacao; titulo?: string }) {
  const { produtor, loja, economia, percentual } = comparacao
  const produtorGanha = economia > 0
  return (
    <div className="rounded-2xl bg-white p-4 shadow-cartao">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-bold text-tinta">{titulo}</p>
        {produtorGanha && (
          <span className="flex items-center gap-1 rounded-full bg-produtor/10 px-2 py-0.5 text-xs font-bold text-produtor">
            <TrendingDown className="h-3.5 w-3.5" /> {percentual}% mais barato
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Link
          to={`/produto/${produtor.produto.id}`}
          className={`rounded-xl p-3 ${produtorGanha ? 'bg-produtor/10 ring-2 ring-produtor' : 'bg-slate-50'}`}
        >
          <p className="flex items-center gap-1 text-[11px] font-bold uppercase text-produtor">
            <Leaf className="h-3 w-3" /> Produtor
          </p>
          <p className="mt-1 text-xl font-extrabold text-tinta">{moeda(produtor.produto.preco)}</p>
          <p className="text-[11px] text-slate-500">/ {produtor.produto.unidade}</p>
          <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-600">{produtor.vendedor.nome}</p>
        </Link>
        <Link to={`/produto/${loja.produto.id}`} className="rounded-xl bg-slate-50 p-3">
          <p className="flex items-center gap-1 text-[11px] font-bold uppercase text-primaria">
            <Store className="h-3 w-3" /> Loja
          </p>
          <p className="mt-1 text-xl font-extrabold text-tinta">{moeda(loja.produto.preco)}</p>
          <p className="text-[11px] text-slate-500">/ {loja.produto.unidade}</p>
          <p className="mt-1 line-clamp-1 text-xs font-medium text-slate-600">{loja.vendedor.nome}</p>
        </Link>
      </div>
      {produtorGanha && (
        <p className="mt-3 text-center text-xs text-slate-600">
          Comprando direto do produtor você economiza <b className="text-produtor">{moeda(economia)}</b> e o dinheiro fica com quem produz.
        </p>
      )}
    </div>
  )
}
