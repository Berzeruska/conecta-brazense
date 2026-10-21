import { Link, useSearchParams } from 'react-router-dom'
import { Plus, Search, PackageOpen } from 'lucide-react'
import type { ModoAnuncio } from '../data/types'
import { useCatalogo } from '../lib/catalogo'
import { BotaoCarrinho } from '../components/BotaoCarrinho'
import { CartaoAnuncio } from '../components/Cartoes'
import { EstadoVazio, RodapeDemo } from '../components/Diversos'

const ABAS: { valor: ModoAnuncio | 'todos'; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Tudo' },
  { valor: 'vender', rotulo: 'Vender' },
  { valor: 'trocar', rotulo: 'Trocar' },
  { valor: 'doar', rotulo: 'Doar' },
]

export function Feirao() {
  const { anuncios } = useCatalogo()
  const [params, setParams] = useSearchParams()
  const aba = (params.get('modo') as ModoAnuncio | null) ?? 'todos'
  const lista = aba === 'todos' ? anuncios : anuncios.filter((a) => a.modo === aba)
  const contar = (m: ModoAnuncio | 'todos') => (m === 'todos' ? anuncios.length : anuncios.filter((a) => a.modo === m).length)

  return (
    <div className="pb-6">
      <header className="sticky top-0 z-20 bg-fundo/95 px-4 pb-3 pt-4 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-tinta">Feirão</h1>
            <p className="text-sm text-slate-500">Classificados entre vizinhos</p>
          </div>
          <div className="flex gap-2">
            <Link to="/buscar?origem=feirao" aria-label="Buscar no Feirão" className="grid h-9 w-9 place-items-center rounded-full bg-white text-tinta shadow-sm">
              <Search className="h-5 w-5" />
            </Link>
            <BotaoCarrinho />
          </div>
        </div>
        <div role="tablist" className="mt-3 grid grid-cols-4 gap-1 rounded-2xl bg-slate-200/70 p-1">
          {ABAS.map((a) => (
            <button
              key={a.valor}
              role="tab"
              type="button"
              aria-selected={aba === a.valor}
              onClick={() => setParams(a.valor === 'todos' ? {} : { modo: a.valor }, { replace: true })}
              className={`rounded-xl py-2 text-sm font-bold transition ${aba === a.valor ? 'bg-white text-tinta shadow' : 'text-slate-500'}`}
            >
              {a.rotulo}
              <span className="ml-1 text-[10px] font-semibold text-slate-400">{contar(a.valor)}</span>
            </button>
          ))}
        </div>
      </header>

      {lista.length ? (
        <div className="grid grid-cols-2 gap-3 px-4 pt-1">
          {lista.map((a) => (
            <CartaoAnuncio key={a.id} anuncio={a} />
          ))}
        </div>
      ) : (
        <EstadoVazio Icone={PackageOpen} titulo="Nada por aqui ainda" texto="Seja o primeiro a anunciar nesta aba." />
      )}
      <RodapeDemo />

      <Link
        to="/vendedor?aba=anuncio"
        className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-20 flex h-14 items-center gap-2 rounded-full bg-destaque pl-4 pr-5 font-bold text-white shadow-xl shadow-destaque/40 active:scale-95 sm:right-[calc(50%-14rem+1rem)]"
      >
        <Plus className="h-5 w-5" /> Anunciar
      </Link>
    </div>
  )
}
