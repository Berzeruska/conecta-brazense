import { useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Camera, ImagePlus, Leaf, Megaphone, Loader2, RefreshCw } from 'lucide-react'
import type { Categoria, ModoAnuncio } from '../data/types'
import { CATEGORIAS, usePerfil } from '../lib/catalogo'
import { comprimirImagem } from '../lib/imagem'
import { publicarAnuncio, publicarProduto, validarAnuncio, validarProduto } from '../lib/publicar'
import { Cabecalho } from '../components/Cabecalho'
import { Botao } from '../components/Diversos'
import { useToast } from '../components/Toast'

const campo =
  'h-12 w-full rounded-xl bg-white px-4 text-base text-tinta ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-destaque placeholder:text-slate-400'
const rotulo = 'mb-1 block text-sm font-semibold text-tinta'

const CATEGORIAS_PRODUTOR: Categoria[] = ['hortifruti', 'ovos-laticinios', 'mel-doces', 'padaria', 'cafe-graos', 'agro', 'casa-jardim', 'servicos']
const UNIDADES = ['kg', 'dúzia', 'maço', 'unidade', 'pote', 'litro', 'bandeja', 'cesta']

/** Preço digitado à brasileira: "12,50" ou "12.50". */
export const lerPreco = (t: string) => {
  const limpo = t.replace(/[^\d,.]/g, '')
  const normal = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  const n = parseFloat(normal)
  return Number.isFinite(n) ? n : 0
}

export function SeletorFoto({
  foto,
  onFoto,
  cor,
  dica = 'Foto boa vende mais',
  ladoMax,
}: {
  foto: string
  onFoto: (url: string) => void
  cor: string
  dica?: string
  ladoMax?: number
}) {
  const entrada = useRef<HTMLInputElement>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  return (
    <div>
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        data-testid="entrada-foto"
        onChange={async (e) => {
          const arquivo = e.target.files?.[0]
          e.target.value = ''
          if (!arquivo) return
          setErro('')
          setCarregando(true)
          try {
            onFoto(await comprimirImagem(arquivo, ladoMax))
          } catch {
            setErro('Não deu para abrir essa foto. Tente outra.')
          } finally {
            setCarregando(false)
          }
        }}
      />
      <button
        type="button"
        onClick={() => entrada.current?.click()}
        className="relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-white text-slate-500"
      >
        {foto ? (
          <>
            <img src={foto} alt="Prévia da foto" className="absolute inset-0 h-full w-full object-cover" />
            <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white">
              <RefreshCw className="h-3.5 w-3.5" /> Trocar foto
            </span>
          </>
        ) : carregando ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : (
          <>
            <span className={`grid h-14 w-14 place-items-center rounded-full text-white ${cor}`}>
              <Camera className="h-7 w-7" />
            </span>
            <span className="font-semibold text-tinta">Tirar ou escolher foto</span>
            <span className="flex items-center gap-1 text-xs">
              <ImagePlus className="h-3.5 w-3.5" /> {dica}
            </span>
          </>
        )}
      </button>
      {erro && <p className="mt-1 text-sm text-red-600">{erro}</p>}
    </div>
  )
}

function FormProduto() {
  const navegar = useNavigate()
  const toast = useToast()
  const [foto, setFoto] = useState('')
  const [nome, setNome] = useState('')
  const [preco, setPreco] = useState('')
  const [unidade, setUnidade] = useState('kg')
  const [categoria, setCategoria] = useState<Categoria>('hortifruti')
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState('')

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        const dados = { nome, preco: lerPreco(preco), unidade, categoria, descricao, foto }
        const problema = validarProduto(dados)
        if (problema) return setErro(problema)
        const { produto, semFoto } = publicarProduto(dados)
        toast(semFoto ? 'Publicado! (a foto era grande demais e ficou de fora)' : 'Produto publicado na sua banca!')
        navegar(`/produto/${produto.id}`, { replace: true })
      }}
    >
      <SeletorFoto foto={foto} onFoto={setFoto} cor="bg-produtor" />
      <label className="block">
        <span className={rotulo}>O que você vende?</span>
        <input className={campo} value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Ovos caipiras, alface, queijo" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className={rotulo}>Preço (R$)</span>
          <input className={campo} value={preco} onChange={(e) => setPreco(e.target.value)} inputMode="decimal" placeholder="0,00" />
        </label>
        <label className="block">
          <span className={rotulo}>Por</span>
          <select className={campo} value={unidade} onChange={(e) => setUnidade(e.target.value)}>
            {UNIDADES.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <span className={rotulo}>Categoria</span>
        <div className="flex flex-wrap gap-2">
          {CATEGORIAS_PRODUTOR.map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={categoria === c}
              onClick={() => setCategoria(c)}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold ${categoria === c ? 'bg-produtor text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}
            >
              {CATEGORIAS[c].emoji} {CATEGORIAS[c].nome}
            </button>
          ))}
        </div>
      </div>
      <label className="block">
        <span className={rotulo}>Descrição (opcional)</span>
        <textarea
          className={`${campo} h-24 py-3`}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Como é produzido, quando colhe, como entrega..."
        />
      </label>
      {erro && (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {erro}
        </p>
      )}
      <Botao type="submit" variante="produtor" className="w-full">
        <Leaf className="h-5 w-5" /> Publicar na minha banca
      </Botao>
    </form>
  )
}

const MODOS: { valor: ModoAnuncio; rotulo: string; cor: string }[] = [
  { valor: 'vender', rotulo: 'Vender', cor: 'bg-destaque' },
  { valor: 'trocar', rotulo: 'Trocar', cor: 'bg-sky-600' },
  { valor: 'doar', rotulo: 'Doar', cor: 'bg-fuchsia-600' },
]

function FormAnuncio() {
  const navegar = useNavigate()
  const toast = useToast()
  const perfil = usePerfil()
  const [foto, setFoto] = useState('')
  const [titulo, setTitulo] = useState('')
  const [modo, setModo] = useState<ModoAnuncio>('vender')
  const [preco, setPreco] = useState('')
  const [troca, setTroca] = useState('')
  const [estado, setEstado] = useState('Usado, bom estado')
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState('')

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        const dados = { titulo, modo, preco: lerPreco(preco), troca, estado, descricao, foto }
        const problema = validarAnuncio(dados)
        if (problema) return setErro(problema)
        const { anuncio, semFoto } = publicarAnuncio(dados, perfil)
        toast(semFoto ? 'Publicado! (a foto era grande demais e ficou de fora)' : 'Anúncio publicado no Feirão!')
        navegar(`/feirao/${anuncio.id}`, { replace: true })
      }}
    >
      <SeletorFoto foto={foto} onFoto={setFoto} cor="bg-destaque" />
      <div role="radiogroup" aria-label="Tipo de anúncio" className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-200/70 p-1">
        {MODOS.map((m) => (
          <button
            key={m.valor}
            type="button"
            role="radio"
            aria-checked={modo === m.valor}
            onClick={() => setModo(m.valor)}
            className={`rounded-xl py-2.5 text-sm font-bold transition ${modo === m.valor ? `${m.cor} text-white shadow` : 'text-slate-500'}`}
          >
            {m.rotulo}
          </button>
        ))}
      </div>
      <label className="block">
        <span className={rotulo}>Título</span>
        <input className={campo} value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Bicicleta aro 26" />
      </label>
      {modo === 'vender' && (
        <label className="block">
          <span className={rotulo}>Preço (R$)</span>
          <input className={campo} value={preco} onChange={(e) => setPreco(e.target.value)} inputMode="decimal" placeholder="0,00" />
        </label>
      )}
      {modo === 'trocar' && (
        <label className="block">
          <span className={rotulo}>Aceito em troca</span>
          <input className={campo} value={troca} onChange={(e) => setTroca(e.target.value)} placeholder="Ex.: bicicleta infantil" />
        </label>
      )}
      <label className="block">
        <span className={rotulo}>Estado</span>
        <select className={campo} value={estado} onChange={(e) => setEstado(e.target.value)}>
          {['Novo', 'Usado, ótimo estado', 'Usado, bom estado', 'Usado, precisa de reparo'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className={rotulo}>Descrição (opcional)</span>
        <textarea className={`${campo} h-24 py-3`} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Conte detalhes, tamanho, motivo..." />
      </label>
      <p className="text-xs text-slate-500">
        Vai aparecer como <b>{perfil.nome}</b> · {perfil.bairro}. Dá para mudar no Perfil.
      </p>
      {erro && (
        <p role="alert" className="text-sm font-semibold text-red-600">
          {erro}
        </p>
      )}
      <Botao type="submit" className="w-full">
        <Megaphone className="h-5 w-5" /> Publicar no Feirão
      </Botao>
    </form>
  )
}

export function PainelVendedor() {
  const [params, setParams] = useSearchParams()
  const aba = params.get('aba') === 'anuncio' ? 'anuncio' : 'produto'
  return (
    <div className="pb-8">
      <Cabecalho titulo="Painel do vendedor" />
      <div className="px-4 pt-3">
        <div role="tablist" className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-200/70 p-1">
          <button
            role="tab"
            type="button"
            aria-selected={aba === 'produto'}
            onClick={() => setParams({}, { replace: true })}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold ${aba === 'produto' ? 'bg-white text-produtor shadow' : 'text-slate-500'}`}
          >
            <Leaf className="h-4 w-4" /> Produto
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={aba === 'anuncio'}
            onClick={() => setParams({ aba: 'anuncio' }, { replace: true })}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold ${aba === 'anuncio' ? 'bg-white text-destaque shadow' : 'text-slate-500'}`}
          >
            <Megaphone className="h-4 w-4" /> Anúncio no Feirão
          </button>
        </div>
        <p className="mb-4 mt-3 text-sm text-slate-600">
          {aba === 'produto'
            ? 'Para produtor e comércio: o produto entra na busca e na sua banca na hora.'
            : 'Para qualquer morador: venda, troque ou doe o que está parado em casa.'}
        </p>
        {aba === 'produto' ? <FormProduto /> : <FormAnuncio />}
      </div>
    </div>
  )
}
