import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Leaf, Store, Repeat, MapPin, CalendarDays, ArrowRight, Sparkles } from 'lucide-react'
import { city } from '../lib/city'
import { CATEGORIAS, acharProduto, comparar, produtorDoDia, produtores, lojas, useCatalogo } from '../lib/catalogo'
import { useReservas, valorNaCidade } from '../lib/carrinho'
import { BotaoCarrinho } from '../components/BotaoCarrinho'
import { Foto } from '../components/Foto'
import { CartaoAnuncio, CartaoProduto, CartaoVendedor } from '../components/Cartoes'
import { ComparacaoPreco } from '../components/Comparacao'
import { NumeroAnimado, RodapeDemo, TituloSecao } from '../components/Diversos'
import { SeloDaqui } from '../components/Selos'
import type { Categoria } from '../data/types'

const ATALHOS = [
  { para: '/buscar?origem=produtor', rotulo: 'Do Produtor', texto: 'Direto da roça', Icone: Leaf, cor: 'bg-produtor' },
  { para: '/buscar?origem=loja', rotulo: 'Comércio Local', texto: 'Lojas da cidade', Icone: Store, cor: 'bg-primaria' },
  { para: '/feirao', rotulo: 'Feirão', texto: 'Vender, trocar, doar', Icone: Repeat, cor: 'bg-destaque' },
]

const CATEGORIAS_INICIO: Categoria[] = ['hortifruti', 'ovos-laticinios', 'mel-doces', 'padaria', 'cafe-graos', 'agro', 'roupas', 'farmacia']

export function Inicio() {
  const cat = useCatalogo()
  const reservas = useReservas()
  const navegar = useNavigate()
  const doDia = produtorDoDia()
  const produtosDoDia = cat.produtos.filter((p) => p.vendedorId === doDia.id).slice(0, 4)
  const ofertas = cat.produtos.filter((p) => p.precoAntigo)
  const ovos = acharProduto(cat, 'ovos-caipira-duzia')
  const comparacao = ovos && comparar(cat, ovos)
  const vendedorDe = (id: string) => cat.vendedores.find((v) => v.id === id)!

  return (
    <div className="pb-4">
      {/* Topo azul com busca */}
      <section className="relative overflow-hidden rounded-b-[2rem] bg-primaria px-4 pb-6 pt-5 text-white">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-destaque/25 blur-2xl" aria-hidden />
        <div className="absolute -bottom-24 -left-10 h-56 w-56 rounded-full bg-produtor/25 blur-2xl" aria-hidden />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="flex items-center gap-1 text-xs font-medium text-white/70">
              <MapPin className="h-3.5 w-3.5" /> {city.cidade} · {city.uf}
            </p>
            <h1 className="text-2xl font-extrabold tracking-tight">{city.appName}</h1>
          </div>
          <BotaoCarrinho className="bg-white/15 text-white" />
        </div>
        <p className="relative mt-1 text-sm text-white/80">O app da cidade, feito por nós, para nós.</p>

        <button
          type="button"
          onClick={() => navegar('/buscar')}
          className="relative mt-4 flex h-12 w-full items-center gap-3 rounded-2xl bg-white px-4 text-left text-slate-400 shadow-lg"
        >
          <Search className="h-5 w-5 text-slate-500" />
          <span className="text-sm">Busque ovos, queijo, bicicleta...</span>
        </button>

        {/* Contador "R$ que ficaram na cidade" */}
        <Link to="/perfil" className="relative mt-4 block rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
          <p className="text-xs font-medium text-white/70">R$ que ficaram na cidade este ano</p>
          <p className="mt-0.5 text-3xl font-extrabold tracking-tight text-white">
            <NumeroAnimado valor={valorNaCidade(reservas)} />
          </p>
          <p className="mt-1 text-[11px] text-white/60">
            Em compras de quem é daqui · valor simulado para demonstração
          </p>
        </Link>
      </section>

      {/* Atalhos do núcleo */}
      <section className="-mt-1 grid grid-cols-3 gap-2 px-4 pt-5">
        {ATALHOS.map(({ para, rotulo, texto, Icone, cor }, i) => (
          <motion.div key={para} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i }}>
            <Link to={para} className="flex h-full flex-col items-start gap-2 rounded-2xl bg-white p-3 shadow-cartao active:scale-[0.98]">
              <span className={`grid h-9 w-9 place-items-center rounded-xl text-white ${cor}`}>
                <Icone className="h-5 w-5" />
              </span>
              <span className="text-sm font-bold leading-tight text-tinta">{rotulo}</span>
              <span className="-mt-1.5 text-[11px] leading-tight text-slate-500">{texto}</span>
            </Link>
          </motion.div>
        ))}
      </section>

      {/* Produtor do dia */}
      <section className="mt-7">
        <TituloSecao titulo="Produtor do dia" />
        <div className="px-4">
          <Link to={`/produtor/${doDia.id}`} className="block overflow-hidden rounded-3xl bg-white shadow-cartao">
            <div className="relative">
              <Foto src={doDia.foto} alt={doDia.nome} className="aspect-[16/9] w-full" prioridade />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-produtor">
                <Sparkles className="h-3.5 w-3.5" /> Destaque de hoje
              </span>
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <p className="text-xl font-extrabold">{doDia.nome}</p>
                <p className="text-sm text-white/85">
                  {doDia.responsavel} · {doDia.ramo}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <div className="flex-1 text-xs text-slate-600">
                <p className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-produtor" /> {doDia.endereco}
                </p>
                <p className="mt-1 flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5 text-produtor" /> Entrega: {doDia.diasEntrega.join(' e ')}
                </p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-produtor px-3 py-2 text-xs font-bold text-white">
                Ver banca <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        </div>
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto px-4 pb-2">
          {produtosDoDia.map((p) => (
            <CartaoProduto key={p.id} produto={p} vendedor={doDia} largura="w-40 shrink-0" />
          ))}
        </div>
      </section>

      {/* Comparação */}
      {comparacao && (
        <section className="mt-6 px-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-tinta">Compare antes de comprar</h2>
            <SeloDaqui />
          </div>
          <ComparacaoPreco comparacao={comparacao} titulo="Dúzia de ovos caipiras" />
        </section>
      )}

      {/* Ofertas */}
      <section className="mt-7">
        <TituloSecao titulo="Ofertas da semana" para="/buscar?ordem=menor-preco" />
        <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-2">
          {ofertas.map((p) => (
            <CartaoProduto key={p.id} produto={p} vendedor={vendedorDe(p.vendedorId)} largura="w-40 shrink-0" />
          ))}
        </div>
      </section>

      {/* Categorias */}
      <section className="mt-6">
        <TituloSecao titulo="Categorias" />
        <div className="grid grid-cols-4 gap-2 px-4">
          {CATEGORIAS_INICIO.map((c) => (
            <Link
              key={c}
              to={`/buscar?categoria=${c}`}
              className="flex flex-col items-center gap-1 rounded-2xl bg-white px-1 py-3 text-center shadow-cartao active:scale-95"
            >
              <span className="text-2xl" aria-hidden>
                {CATEGORIAS[c].emoji}
              </span>
              <span className="text-[11px] font-semibold leading-tight text-tinta">{CATEGORIAS[c].nome}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Produtores */}
      <section className="mt-7">
        <TituloSecao titulo="Produtores da região" para="/produtores" />
        <div className="no-scrollbar flex gap-1 overflow-x-auto px-4 pb-2">
          {produtores.map((v) => (
            <CartaoVendedor key={v.id} vendedor={v} compacto />
          ))}
        </div>
      </section>

      {/* Feirão */}
      <section className="mt-6">
        <TituloSecao titulo="Novidades do Feirão" para="/feirao" />
        <div className="grid grid-cols-2 gap-3 px-4">
          {cat.anuncios.slice(0, 4).map((a) => (
            <CartaoAnuncio key={a.id} anuncio={a} />
          ))}
        </div>
      </section>

      {/* Lojas */}
      <section className="mt-7">
        <TituloSecao titulo="Comércio local" para="/lojas" />
        <div className="space-y-2 px-4">
          {lojas.slice(0, 4).map((v) => (
            <CartaoVendedor key={v.id} vendedor={v} />
          ))}
        </div>
      </section>

      <RodapeDemo />
    </div>
  )
}
