import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, X, SlidersHorizontal, SearchX } from 'lucide-react'
import type { Categoria } from '../data/types'
import { CATEGORIAS, comparar, useCatalogo } from '../lib/catalogo'
import { buscar, SUGESTOES_BUSCA, type Filtros, type Ordem, type Origem } from '../lib/busca'
import { Cabecalho } from '../components/Cabecalho'
import { CartaoAnuncio, CartaoProduto } from '../components/Cartoes'
import { ComparacaoPreco } from '../components/Comparacao'
import { EstadoVazio } from '../components/Diversos'

const ORIGENS: { valor: Origem; rotulo: string }[] = [
  { valor: 'todos', rotulo: 'Tudo' },
  { valor: 'produtor', rotulo: 'Do produtor' },
  { valor: 'loja', rotulo: 'Lojas' },
  { valor: 'feirao', rotulo: 'Feirão' },
]

const PRECOS = [10, 30, 100, 500]

const ORDENS: { valor: Ordem; rotulo: string }[] = [
  { valor: 'relevancia', rotulo: 'Relevância' },
  { valor: 'menor-preco', rotulo: 'Menor preço' },
  { valor: 'maior-preco', rotulo: 'Maior preço' },
]

function Chip({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
        ativo ? 'bg-primaria text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

export function Buscar() {
  const cat = useCatalogo()
  const [params, setParams] = useSearchParams()
  const [texto, setTexto] = useState(params.get('q') ?? '')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  const filtros: Filtros = {
    origem: (params.get('origem') as Origem) || 'todos',
    categoria: (params.get('categoria') as Categoria) || undefined,
    precoMax: params.get('precoMax') ? Number(params.get('precoMax')) : undefined,
    ordem: (params.get('ordem') as Ordem) || 'relevancia',
  }
  const q = params.get('q') ?? ''

  const mudar = (chave: string, valor?: string) => {
    const novo = new URLSearchParams(params)
    if (valor) novo.set(chave, valor)
    else novo.delete(chave)
    setParams(novo, { replace: true })
  }

  const resultados = useMemo(() => buscar(cat, q, filtros), [cat, q, filtros.origem, filtros.categoria, filtros.precoMax, filtros.ordem])

  const primeiroComparavel = q
    ? resultados.find((r) => r.tipo === 'produto' && r.produto.comparar)
    : undefined
  const comparacao = primeiroComparavel?.tipo === 'produto' ? comparar(cat, primeiroComparavel.produto) : null
  const filtrosAtivos = [filtros.categoria, filtros.precoMax, filtros.ordem !== 'relevancia' ? 1 : undefined].filter(Boolean).length

  return (
    <div className="pb-6">
      <Cabecalho titulo="Buscar" />
      <div className="sticky top-14 z-10 bg-fundo/95 px-4 pb-3 pt-2 backdrop-blur">
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            mudar('q', texto.trim() || undefined)
            ;(document.activeElement as HTMLElement | null)?.blur()
          }}
          className="flex gap-2"
        >
          <label className="flex h-12 flex-1 items-center gap-2 rounded-2xl bg-white px-4 shadow-cartao ring-1 ring-slate-200 focus-within:ring-2 focus-within:ring-destaque">
            <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
            <input
              autoFocus={!q && !filtros.categoria && filtros.origem === 'todos'}
              value={texto}
              onChange={(e) => {
                setTexto(e.target.value)
                // busca enquanto digita: sem precisar apertar nada no palco
                mudar('q', e.target.value.trim() || undefined)
              }}
              type="search"
              enterKeyHint="search"
              placeholder="O que você procura?"
              aria-label="O que você procura?"
              className="h-full w-full bg-transparent text-base text-tinta outline-none placeholder:text-slate-400"
            />
            {texto && (
              <button
                type="button"
                aria-label="Limpar busca"
                onClick={() => {
                  setTexto('')
                  mudar('q')
                }}
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            )}
          </label>
          <button
            type="button"
            aria-label="Filtros"
            onClick={() => setMostrarFiltros((m) => !m)}
            className={`relative grid h-12 w-12 place-items-center rounded-2xl shadow-cartao ${
              mostrarFiltros ? 'bg-primaria text-white' : 'bg-white text-tinta ring-1 ring-slate-200'
            }`}
          >
            <SlidersHorizontal className="h-5 w-5" />
            {filtrosAtivos > 0 && (
              <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-destaque text-[10px] font-bold text-white">
                {filtrosAtivos}
              </span>
            )}
          </button>
        </form>

        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {ORIGENS.map((o) => (
            <Chip key={o.valor} ativo={filtros.origem === o.valor} onClick={() => mudar('origem', o.valor === 'todos' ? undefined : o.valor)}>
              {o.rotulo}
            </Chip>
          ))}
        </div>

        {mostrarFiltros && (
          <div className="mt-3 space-y-3 rounded-2xl bg-white p-3 shadow-cartao">
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase text-slate-500">Preço até</p>
              <div className="flex flex-wrap gap-2">
                <Chip ativo={!filtros.precoMax} onClick={() => mudar('precoMax')}>
                  Qualquer
                </Chip>
                {PRECOS.map((p) => (
                  <Chip key={p} ativo={filtros.precoMax === p} onClick={() => mudar('precoMax', String(p))}>
                    R$ {p}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase text-slate-500">Categoria</p>
              <div className="flex flex-wrap gap-2">
                <Chip ativo={!filtros.categoria} onClick={() => mudar('categoria')}>
                  Todas
                </Chip>
                {(Object.keys(CATEGORIAS) as Categoria[]).map((c) => (
                  <Chip key={c} ativo={filtros.categoria === c} onClick={() => mudar('categoria', c)}>
                    {CATEGORIAS[c].emoji} {CATEGORIAS[c].nome}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase text-slate-500">Ordenar</p>
              <div className="flex flex-wrap gap-2">
                {ORDENS.map((o) => (
                  <Chip key={o.valor} ativo={filtros.ordem === o.valor} onClick={() => mudar('ordem', o.valor === 'relevancia' ? undefined : o.valor)}>
                    {o.rotulo}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        )}
        {!mostrarFiltros && filtros.categoria && (
          <div className="mt-2 flex">
            <button
              type="button"
              onClick={() => mudar('categoria')}
              className="flex items-center gap-1 rounded-full bg-destaque/10 px-3 py-1 text-xs font-semibold text-destaque"
            >
              {CATEGORIAS[filtros.categoria].emoji} {CATEGORIAS[filtros.categoria].nome} <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {!q && !filtros.categoria && filtros.origem === 'todos' && (
        <div className="px-4 pb-2">
          <p className="mb-2 text-xs font-bold uppercase text-slate-500">Buscas populares</p>
          <div className="flex flex-wrap gap-2">
            {SUGESTOES_BUSCA.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setTexto(s)
                  mudar('q', s)
                }}
                className="rounded-full bg-white px-3 py-1.5 text-sm text-slate-700 ring-1 ring-slate-200"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {comparacao && (
        <div className="px-4 pb-4">
          <ComparacaoPreco comparacao={comparacao} titulo={`Comparando: ${comparacao.produtor.produto.nome.toLowerCase()}`} />
        </div>
      )}

      {resultados.length > 0 ? (
        <>
          <p className="px-4 pb-2 text-xs font-medium text-slate-500" aria-live="polite">
            {resultados.length} {resultados.length === 1 ? 'resultado' : 'resultados'}
          </p>
          <div className="grid grid-cols-2 gap-3 px-4">
            {resultados.map((r) =>
              r.tipo === 'produto' ? (
                <CartaoProduto key={r.produto.id} produto={r.produto} vendedor={r.vendedor} />
              ) : (
                <CartaoAnuncio key={r.anuncio.id} anuncio={r.anuncio} />
              ),
            )}
          </div>
        </>
      ) : (
        <EstadoVazio Icone={SearchX} titulo="Nada encontrado" texto="Tente outra palavra ou tire alguns filtros." />
      )}
    </div>
  )
}
