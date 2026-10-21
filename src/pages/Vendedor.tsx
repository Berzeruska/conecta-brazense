import { useParams } from 'react-router-dom'
import { MapPin, CalendarDays, Truck, Store as StoreIcon, Star, MessageCircle, PackageOpen } from 'lucide-react'
import { acharVendedor, useCatalogo } from '../lib/catalogo'
import { moeda } from '../lib/format'
import { Cabecalho } from '../components/Cabecalho'
import { Foto } from '../components/Foto'
import { CartaoProduto } from '../components/Cartoes'
import { EstadoVazio, RodapeDemo } from '../components/Diversos'
import { SeloDaqui, TagOrigem } from '../components/Selos'
import { useToast } from '../components/Toast'
import { NaoEncontrado } from './NaoEncontrado'

export function PaginaVendedor() {
  const { id = '' } = useParams()
  const cat = useCatalogo()
  const toast = useToast()
  const vendedor = acharVendedor(cat, id)
  if (!vendedor) return <NaoEncontrado />
  const produtos = cat.produtos.filter((p) => p.vendedorId === vendedor.id)
  const ehProdutor = vendedor.tipo === 'produtor'

  return (
    <div className="pb-6">
      <div className="relative">
        <Cabecalho transparente />
        <Foto src={vendedor.foto} alt={vendedor.nome} className="aspect-[16/10] w-full" prioridade />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <TagOrigem tipo={vendedor.tipo} />
          <h1 className="mt-1.5 text-2xl font-extrabold leading-tight">{vendedor.nome}</h1>
          <p className="text-sm text-white/85">
            {vendedor.responsavel} · {vendedor.ramo}
          </p>
        </div>
      </div>

      <div className="-mt-3 rounded-t-3xl bg-fundo px-4 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {vendedor.nota.toFixed(1)}
          </span>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
            Desde {vendedor.desde}
          </span>
          <SeloDaqui grande />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-700">{vendedor.descricao}</p>

        <div className="mt-4 space-y-3 rounded-2xl bg-white p-4 text-sm shadow-cartao">
          <p className="flex gap-3">
            <MapPin className={`h-5 w-5 shrink-0 ${ehProdutor ? 'text-produtor' : 'text-primaria'}`} />
            <span>
              <b className="block text-tinta">{ehProdutor ? 'Onde fica' : 'Endereço'}</b>
              <span className="text-slate-600">
                {vendedor.endereco} · {vendedor.bairro}
              </span>
            </span>
          </p>
          <p className="flex gap-3">
            <CalendarDays className={`h-5 w-5 shrink-0 ${ehProdutor ? 'text-produtor' : 'text-primaria'}`} />
            <span>
              <b className="block text-tinta">Dias de entrega</b>
              <span className="text-slate-600">{vendedor.diasEntrega.join(', ')}</span>
            </span>
          </p>
          <p className="flex gap-3">
            <StoreIcon className={`h-5 w-5 shrink-0 ${ehProdutor ? 'text-produtor' : 'text-primaria'}`} />
            <span>
              <b className="block text-tinta">Retirada</b>
              <span className="text-slate-600">{vendedor.retirada}</span>
            </span>
          </p>
          <p className="flex gap-3">
            <Truck className={`h-5 w-5 shrink-0 ${ehProdutor ? 'text-produtor' : 'text-primaria'}`} />
            <span>
              <b className="block text-tinta">Entrega local</b>
              <span className="text-slate-600">
                {vendedor.entrega ? `Na cidade, taxa de ${moeda(vendedor.taxaEntrega)}` : 'Só retirada no local'}
              </span>
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => toast('Conversa simulada: no protótipo a mensagem não é enviada')}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-bold text-tinta ring-1 ring-slate-200"
        >
          <MessageCircle className="h-4 w-4" /> Conversar pelo app
        </button>

        <h2 className="mb-3 mt-6 text-lg font-bold text-tinta">
          {ehProdutor ? 'Da banca' : 'Vitrine'} <span className="text-sm font-medium text-slate-400">({produtos.length})</span>
        </h2>
      </div>
      {produtos.length ? (
        <div className="grid grid-cols-2 gap-3 px-4">
          {produtos.map((p) => (
            <CartaoProduto key={p.id} produto={p} vendedor={vendedor} />
          ))}
        </div>
      ) : (
        <EstadoVazio Icone={PackageOpen} titulo="Vitrine vazia" texto="Ainda não há produtos aqui." />
      )}
      <RodapeDemo />
    </div>
  )
}
