import { Link } from 'react-router-dom'
import { Leaf, Phone, Store } from 'lucide-react'
import { lojas, produtores } from '../lib/catalogo'
import { city } from '../lib/city'
import { linkTelefone, servicosDaCidade } from '../lib/servicos'
import { Pino } from './Mapa'
import { iconeServico } from './ServicoCard'

export type CamadaCidade = 'produtor' | 'loja' | 'servico'

export const CAMADAS: Record<CamadaCidade, { nome: string; cor: string; Icone: typeof Leaf }> = {
  produtor: { nome: 'Produtores', cor: city.cores.produtor, Icone: Leaf },
  loja: { nome: 'Lojas', cor: city.cores.primaria, Icone: Store },
  servico: { nome: 'Serviços públicos', cor: city.cores.destaque, Icone: Phone },
}

/** Todos os pontos com coordenada, para enquadrar o mapa. */
export function pontosDaCidade(camadas: CamadaCidade[]): [number, number][] {
  const p: [number, number][] = []
  if (camadas.includes('produtor')) produtores.forEach((v) => v.coordenadas && p.push([v.coordenadas.lat, v.coordenadas.lng]))
  if (camadas.includes('loja')) lojas.forEach((v) => v.coordenadas && p.push([v.coordenadas.lat, v.coordenadas.lng]))
  if (camadas.includes('servico')) servicosDaCidade.forEach((s) => s.coordenadas && p.push([s.coordenadas.lat, s.coordenadas.lng]))
  return p
}

/** Pinos de produtores, lojas e serviços públicos, cada tipo com seu ícone e cor. */
export function PinosCidade({ camadas, foco, comBalao = true }: { camadas: CamadaCidade[]; foco?: string | null; comBalao?: boolean }) {
  return (
    <>
      {camadas.includes('produtor') || camadas.includes('loja')
        ? [...produtores, ...lojas]
            .filter((v) => v.coordenadas && camadas.includes(v.tipo))
            .map((v) => (
              <Pino
                key={v.id}
                posicao={[v.coordenadas!.lat, v.coordenadas!.lng]}
                Icone={CAMADAS[v.tipo].Icone}
                cor={CAMADAS[v.tipo].cor}
                rotulo={v.nome}
                tamanho={30}
                abrir={foco === v.id}
              >
                {comBalao && (
                  <div>
                    <p className="font-bold text-tinta">{v.nome}</p>
                    <p className="text-xs text-slate-500">
                      {v.ramo} · {v.bairro}
                    </p>
                    <Link to={`/${v.tipo}/${v.id}`} className="mt-1.5 block font-semibold" style={{ color: CAMADAS[v.tipo].cor }}>
                      {v.tipo === 'produtor' ? 'Ver banca' : 'Ver loja'}
                    </Link>
                  </div>
                )}
              </Pino>
            ))
        : null}
      {camadas.includes('servico') &&
        servicosDaCidade
          .filter((s) => s.coordenadas)
          .map((s) => (
            <Pino
              key={s.id}
              posicao={[s.coordenadas!.lat, s.coordenadas!.lng]}
              Icone={iconeServico(s)}
              cor={CAMADAS.servico.cor}
              rotulo={s.nome}
              tamanho={36}
              novo={foco === s.id}
              abrir={foco === s.id}
            >
              {comBalao && (
                <div>
                  <p className="font-bold text-tinta">{s.nome}</p>
                  {s.endereco && <p className="text-xs text-slate-500">{s.endereco}</p>}
                  <a href={linkTelefone(s.telefone)} className="mt-1.5 flex items-center gap-1 font-semibold text-destaque">
                    <Phone className="h-3.5 w-3.5" aria-hidden /> {s.telefone}
                  </a>
                </div>
              )}
            </Pino>
          ))}
    </>
  )
}
