import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, Crosshair, Loader2, MapPin, Send } from 'lucide-react'
import type { CategoriaReporte } from '../data/types'
import { city } from '../lib/city'
import { usePerfil } from '../lib/catalogo'
import { CATEGORIAS_REPORTE, STATUS_REPORTE, criarReporte, dentroDaCidade, validarReporte } from '../lib/reportes'
import { Cabecalho } from '../components/Cabecalho'
import { Botao } from '../components/Diversos'
import { Mapa, Pino, Voar } from '../components/Mapa'
import { ICONE_CATEGORIA } from '../components/Zelador'
import { useToast } from '../components/Toast'
import { SeletorFoto } from './PainelVendedor'

const campo =
  'w-full rounded-xl bg-white px-4 text-base text-tinta ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-destaque placeholder:text-slate-400'
const titulo = 'mb-2 flex items-center gap-2 text-base font-bold text-tinta'
const Passo = ({ n }: { n: number }) => (
  <span className="grid h-6 w-6 place-items-center rounded-full bg-destaque text-xs font-extrabold text-white">{n}</span>
)

export function NovoReporte() {
  const navegar = useNavigate()
  const toast = useToast()
  const perfil = usePerfil()
  const [categoria, setCategoria] = useState<CategoriaReporte | null>(null)
  const [foto, setFoto] = useState('')
  const [ponto, setPonto] = useState<[number, number] | null>(null)
  const [voarPara, setVoarPara] = useState<[number, number] | null>(null)
  const [bairro, setBairro] = useState(perfil.bairro)
  const [descricao, setDescricao] = useState('')
  const [erro, setErro] = useState('')
  const [localizando, setLocalizando] = useState(false)

  const usarMinhaLocalizacao = () => {
    if (!('geolocation' in navigator)) return toast('Este aparelho não informa a localização. Toque no mapa.')
    setLocalizando(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocalizando(false)
        if (!dentroDaCidade(coords.latitude, coords.longitude)) {
          toast(`Você parece estar fora de ${city.cidade}. Toque no mapa.`)
          return
        }
        const p: [number, number] = [coords.latitude, coords.longitude]
        setPonto(p)
        setVoarPara(p)
      },
      () => {
        setLocalizando(false)
        toast('Não deu para pegar a localização. Toque no mapa.')
      },
      { enableHighAccuracy: true, timeout: 8000 },
    )
  }

  return (
    <div className="pb-6">
      <Cabecalho titulo="Reportar problema" semCarrinho />
      <form
        className="space-y-6 px-4 pt-4"
        onSubmit={(e) => {
          e.preventDefault()
          const dados = { categoria, foto, descricao, bairro, lat: ponto?.[0] ?? null, lng: ponto?.[1] ?? null }
          const problema = validarReporte(dados)
          if (problema) return setErro(problema)
          const { reporte, semFoto } = criarReporte(dados, perfil)
          toast(semFoto ? 'Reporte enviado (a foto não coube na memória)' : 'Reporte enviado! Já está no mapa público.')
          navegar(`/zelador/${reporte.id}`, { replace: true })
        }}
      >
        <section>
          <h2 className={titulo}>
            <Passo n={1} /> O que está acontecendo?
          </h2>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo do problema">
            {(Object.keys(CATEGORIAS_REPORTE) as CategoriaReporte[]).map((c) => {
              const Icone = ICONE_CATEGORIA[c]
              const ativo = categoria === c
              return (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  onClick={() => {
                    setCategoria(c)
                    setErro('')
                  }}
                  className={`flex items-center gap-3 rounded-2xl p-3 text-left transition active:scale-[0.98] ${
                    ativo ? 'bg-primaria text-white shadow-lg shadow-primaria/25' : 'bg-white text-tinta shadow-cartao'
                  }`}
                >
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${ativo ? 'bg-white/15' : 'bg-destaque/10 text-destaque'}`}
                  >
                    <Icone className="h-5 w-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block text-sm font-bold">{CATEGORIAS_REPORTE[c].nome}</span>
                    <span className={`block text-[11px] leading-tight ${ativo ? 'text-white/70' : 'text-slate-500'}`}>
                      {CATEGORIAS_REPORTE[c].dica}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <section>
          <h2 className={titulo}>
            <Passo n={2} /> Foto do problema
          </h2>
          <SeletorFoto foto={foto} onFoto={setFoto} cor="bg-destaque" dica="Mostre bem o problema" ladoMax={720} />
        </section>

        <section>
          <h2 className={titulo}>
            <Passo n={3} /> Onde fica?
          </h2>
          <div className="relative">
            <Mapa
              className="h-64 rounded-2xl ring-1 ring-slate-200"
              zoom={15}
              rotulo="Toque no mapa para marcar o local"
              aoTocar={(lat, lng) => {
                setPonto([lat, lng])
                setErro('')
              }}
            >
              <Voar para={voarPara} zoom={16} />
              {ponto && (
                <Pino
                  posicao={ponto}
                  Icone={categoria ? ICONE_CATEGORIA[categoria] : MapPin}
                  cor={STATUS_REPORTE.aberto.cor}
                  rotulo="Local do problema"
                  tamanho={40}
                  novo
                />
              )}
            </Mapa>
            <p
              className={`pointer-events-none absolute inset-x-3 top-3 z-[500] mx-auto flex w-fit items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold shadow-md ${
                ponto ? 'bg-produtor text-white' : 'bg-white text-tinta'
              }`}
            >
              {ponto ? <Check className="h-3.5 w-3.5" aria-hidden /> : <MapPin className="h-3.5 w-3.5 text-destaque" aria-hidden />}
              {ponto ? 'Local marcado · toque de novo para ajustar' : 'Toque no mapa onde está o problema'}
            </p>
          </div>
          <button
            type="button"
            onClick={usarMinhaLocalizacao}
            className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-destaque"
          >
            {localizando ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Crosshair className="h-4 w-4" aria-hidden />}
            Usar minha localização
          </button>
        </section>

        <section className="space-y-3">
          <div>
            <label htmlFor="bairro" className="mb-1 block text-sm font-semibold text-tinta">
              Bairro
            </label>
            <select id="bairro" className={`${campo} h-12`} value={bairro} onChange={(e) => setBairro(e.target.value)}>
              {city.bairros.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="descricao" className="mb-1 block text-sm font-semibold text-tinta">
              Conte mais <span className="font-normal text-slate-400">(opcional)</span>
            </label>
            <textarea
              id="descricao"
              rows={3}
              maxLength={280}
              className={`${campo} py-3`}
              placeholder="Ex.: buraco grande perto do ponto de ônibus"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />
          </div>
        </section>

        {erro && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {erro}
          </p>
        )}
        <Botao type="submit" className="w-full">
          <Send className="h-5 w-5" aria-hidden /> Enviar reporte
        </Botao>
        <p className="text-center text-[11px] text-slate-400">
          O reporte fica público no mapa. Protótipo: a prefeitura ainda não recebe estes avisos.
        </p>
      </form>
    </div>
  )
}
