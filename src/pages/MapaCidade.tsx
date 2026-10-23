import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { city } from '../lib/city'
import { acharServico } from '../lib/servicos'
import { lojas, produtores } from '../lib/catalogo'
import { Cabecalho } from '../components/Cabecalho'
import { Enquadrar, Mapa } from '../components/Mapa'
import { CAMADAS, PinosCidade, pontosDaCidade, type CamadaCidade } from '../components/PinosCidade'

const TODAS: CamadaCidade[] = ['produtor', 'loja', 'servico']

/** Mapa da cidade em tela cheia; /mapa?foco=<id> abre já no ponto escolhido. */
export function MapaCidade() {
  const [params] = useSearchParams()
  const foco = params.get('foco')
  const [camadas, setCamadas] = useState<CamadaCidade[]>(TODAS)

  const alvo = (() => {
    if (!foco) return null
    const s = acharServico(foco)
    if (s?.coordenadas) return s.coordenadas
    return [...produtores, ...lojas].find((v) => v.id === foco)?.coordenadas ?? null
  })()

  const alternar = (c: CamadaCidade) => setCamadas((atual) => (atual.includes(c) ? atual.filter((x) => x !== c) : [...atual, c]))

  return (
    <div>
      <Cabecalho titulo={`Mapa de ${city.cidade}`} semCarrinho />
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2">
        {TODAS.map((c) => {
          const { nome, cor, Icone } = CAMADAS[c]
          const ativo = camadas.includes(c)
          return (
            <button
              key={c}
              type="button"
              aria-pressed={ativo}
              onClick={() => alternar(c)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                ativo ? 'text-white shadow-sm' : 'bg-white text-slate-500 ring-1 ring-slate-200'
              }`}
              style={ativo ? { backgroundColor: cor } : undefined}
            >
              <Icone className="h-3.5 w-3.5" aria-hidden /> {nome}
            </button>
          )
        })}
      </div>
      <Mapa
        className="h-[calc(100dvh-3.5rem-3rem-4.5rem-env(safe-area-inset-bottom))] min-h-[320px]"
        centro={alvo ? [alvo.lat, alvo.lng] : undefined}
        zoom={alvo ? 16 : 13}
      >
        {!alvo && <Enquadrar pontos={pontosDaCidade(TODAS)} />}
        <PinosCidade camadas={camadas} foco={foco} />
      </Mapa>
    </div>
  )
}
