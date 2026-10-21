import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, MapPin, Star } from 'lucide-react'
import type { Anuncio, Produto, Vendedor } from '../data/types'
import { moeda, tempoRelativo } from '../lib/format'
import { carrinho } from '../lib/carrinho'
import { Foto } from './Foto'
import { TagModo, TagOrigem } from './Selos'
import { useToast } from './Toast'

export function PrecoAnuncio({ anuncio, className = '' }: { anuncio: Anuncio; className?: string }) {
  if (anuncio.modo === 'doar') return <span className={`font-extrabold text-fuchsia-600 ${className}`}>Grátis</span>
  if (anuncio.modo === 'trocar') return <span className={`font-extrabold text-sky-700 ${className}`}>Troca</span>
  return <span className={`font-extrabold text-tinta ${className}`}>{moeda(anuncio.preco ?? 0)}</span>
}

export function CartaoProduto({ produto, vendedor, largura }: { produto: Produto; vendedor: Vendedor; largura?: string }) {
  const toast = useToast()
  return (
    <motion.div whileTap={{ scale: 0.98 }} className={`relative overflow-hidden rounded-2xl bg-white shadow-cartao ${largura ?? ''}`}>
      <Link to={`/produto/${produto.id}`} className="block">
        <div className="relative">
          <Foto src={produto.foto} alt={produto.nome} className="aspect-[4/3] w-full" />
          <div className="absolute left-2 top-2">
            <TagOrigem tipo={vendedor.tipo} />
          </div>
          {produto.precoAntigo && (
            <span className="absolute right-2 top-2 rounded-full bg-destaque px-2 py-0.5 text-[10px] font-bold text-white">
              -{Math.round((1 - produto.preco / produto.precoAntigo) * 100)}%
            </span>
          )}
        </div>
        <div className="p-3 pb-3.5">
          <p className="line-clamp-1 text-sm font-semibold text-tinta">{produto.nome}</p>
          <p className="line-clamp-1 text-xs text-slate-500">{vendedor.nome}</p>
          <div className="pr-10">
            <p className="mt-1.5 text-base font-extrabold text-tinta">{moeda(produto.preco)}</p>
            <p className="line-clamp-1 text-[11px] text-slate-500">
              / {produto.unidade}
              {produto.precoAntigo && <span className="ml-1 text-slate-400 line-through">{moeda(produto.precoAntigo)}</span>}
            </p>
          </div>
        </div>
      </Link>
      <button
        type="button"
        aria-label={`Adicionar ${produto.nome} à reserva`}
        onClick={() => {
          carrinho.adicionar(produto.id)
          toast(`${produto.nome} na sua reserva`)
        }}
        className={`absolute bottom-3 right-3 grid h-9 w-9 place-items-center rounded-full text-white shadow-lg transition active:scale-90 ${
          vendedor.tipo === 'produtor' ? 'bg-produtor' : 'bg-primaria'
        }`}
      >
        <Plus className="h-5 w-5" />
      </button>
    </motion.div>
  )
}

export function CartaoAnuncio({ anuncio }: { anuncio: Anuncio }) {
  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Link to={`/feirao/${anuncio.id}`} className="block overflow-hidden rounded-2xl bg-white shadow-cartao">
        <div className="relative">
          <Foto src={anuncio.foto} alt={anuncio.titulo} className="aspect-square w-full" />
          <div className="absolute left-2 top-2">
            <TagModo modo={anuncio.modo} />
          </div>
          {anuncio.meu && (
            <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-bold text-primaria">Seu anúncio</span>
          )}
        </div>
        <div className="p-3">
          <p className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-tinta">{anuncio.titulo}</p>
          <PrecoAnuncio anuncio={anuncio} className="mt-1 block text-base" />
          <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
            <MapPin className="h-3 w-3" aria-hidden />
            <span className="line-clamp-1">
              {anuncio.bairro} · {tempoRelativo(anuncio.publicadoEm)}
            </span>
          </p>
        </div>
      </Link>
    </motion.div>
  )
}

export function CartaoVendedor({ vendedor, compacto = false }: { vendedor: Vendedor; compacto?: boolean }) {
  const rota = vendedor.tipo === 'produtor' ? 'produtor' : 'loja'
  if (compacto)
    return (
      <Link to={`/${rota}/${vendedor.id}`} className="flex w-36 shrink-0 flex-col items-center gap-2 text-center">
        <Foto
          src={vendedor.foto}
          alt={vendedor.nome}
          className={`h-20 w-20 rounded-full ring-4 ${vendedor.tipo === 'produtor' ? 'ring-produtor/25' : 'ring-primaria/15'}`}
        />
        <div>
          <p className="line-clamp-2 text-xs font-semibold leading-tight text-tinta">{vendedor.nome}</p>
          <p className="line-clamp-1 text-[11px] text-slate-500">{vendedor.ramo}</p>
        </div>
      </Link>
    )
  return (
    <Link to={`/${rota}/${vendedor.id}`} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-cartao active:scale-[0.99]">
      <Foto src={vendedor.foto} alt={vendedor.nome} className="h-16 w-16 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-tinta">{vendedor.nome}</p>
        <p className="truncate text-xs text-slate-500">
          {vendedor.ramo} · {vendedor.bairro}
        </p>
        <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-amber-600">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden /> {vendedor.nota.toFixed(1)}
          <span className="font-normal text-slate-400">· desde {vendedor.desde}</span>
        </p>
      </div>
      <TagOrigem tipo={vendedor.tipo} />
    </Link>
  )
}
