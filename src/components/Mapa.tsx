import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import L from 'leaflet'
import { MapContainer, Marker, Popup, ZoomControl, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import type { LucideIcon } from 'lucide-react'
import indiceTiles from '../data/tiles.json'
import { city } from '../lib/city'
import { LIMITES } from '../lib/reportes'

const VAZIO = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
const indice: Record<string, number[]> = indiceTiles
const ZOOMS = Object.keys(indice).map(Number)
export const ZOOM_MIN = Math.min(...ZOOMS)
export const ZOOM_MAX = Math.max(...ZOOMS)

/**
 * Tiles do OpenStreetMap baixados para public/tiles (scripts/baixar-tiles.mjs):
 * o mapa abre em modo avião. Fora da área baixada, um tile vazio em vez de erro.
 */
const TilesLocais = L.TileLayer.extend({
  getTileUrl(this: L.TileLayer, c: L.Coords) {
    const r = indice[c.z]
    if (!r || c.x < r[0] || c.x > r[1] || c.y < r[2] || c.y > r[3]) return VAZIO
    return L.TileLayer.prototype.getTileUrl.call(this, c)
  },
})

function CamadaTiles() {
  const mapa = useMap()
  useEffect(() => {
    const camada = new (TilesLocais as unknown as typeof L.TileLayer)('/tiles/{z}/{x}/{y}.png', {
      minZoom: ZOOM_MIN,
      maxZoom: ZOOM_MAX,
      attribution: '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap</a>',
    })
    camada.addTo(mapa)
    mapa.attributionControl?.setPrefix(false)
    return () => {
      camada.remove()
    }
  }, [mapa])
  return null
}

function AoTocar({ aoTocar }: { aoTocar: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => aoTocar(e.latlng.lat, e.latlng.lng) })
  return null
}

/** Leva o mapa até um ponto quando ele muda (ex.: reporte novo no telão). */
export function Voar({ para, zoom }: { para: [number, number] | null; zoom?: number }) {
  const mapa = useMap()
  const chave = para ? para.join(',') : ''
  useEffect(() => {
    if (!para) return
    mapa.flyTo(para, Math.max(zoom ?? mapa.getZoom(), mapa.getZoom()), { duration: 1.2 })
  }, [chave])
  return null
}

/** Enquadra todos os pontos ao abrir. */
export function Enquadrar({ pontos }: { pontos: [number, number][] }) {
  const mapa = useMap()
  useEffect(() => {
    if (pontos.length > 1) mapa.fitBounds(pontos, { padding: [28, 28], maxZoom: 15 })
  }, [])
  return null
}

interface PropsMapa {
  centro?: [number, number]
  zoom?: number
  className?: string
  /** false = mapa só de vitrine: não arrasta nem dá zoom (não prende a rolagem da página). */
  interativo?: boolean
  aoTocar?: (lat: number, lng: number) => void
  rotulo?: string
  children?: ReactNode
}

export function Mapa({ centro, zoom = 15, className = '', interativo = true, aoTocar, rotulo = `Mapa de ${city.cidade}`, children }: PropsMapa) {
  const inicio = centro ?? ([city.coordenadas.lat, city.coordenadas.lng] as [number, number])
  return (
    <div className={`mapa relative isolate overflow-hidden ${className}`} role="region" aria-label={rotulo}>
      <MapContainer
        center={inicio}
        zoom={zoom}
        minZoom={ZOOM_MIN}
        maxZoom={ZOOM_MAX}
        maxBounds={[
          [LIMITES.sul, LIMITES.oeste],
          [LIMITES.norte, LIMITES.leste],
        ]}
        maxBoundsViscosity={0.8}
        zoomControl={false}
        dragging={interativo}
        touchZoom={interativo}
        doubleClickZoom={interativo}
        scrollWheelZoom={false}
        boxZoom={false}
        keyboard={interativo}
        className="h-full w-full"
      >
        <CamadaTiles />
        {interativo && <ZoomControl position="bottomright" />}
        {aoTocar && <AoTocar aoTocar={aoTocar} />}
        {children}
      </MapContainer>
    </div>
  )
}

// ---------- Pinos ----------

const cacheIcones = new Map<string, L.DivIcon>()

function icone(Icone: LucideIcon, cor: string, classe = '', tamanho = 34): L.DivIcon {
  const chave = `${Icone.displayName}|${cor}|${classe}|${tamanho}`
  let i = cacheIcones.get(chave)
  if (!i) {
    const svg = renderToStaticMarkup(<Icone width={tamanho * 0.5} height={tamanho * 0.5} strokeWidth={2.4} color="white" aria-hidden />)
    i = L.divIcon({
      className: `pino ${classe}`,
      html: `<span class="pino-corpo" style="--cor:${cor};width:${tamanho}px;height:${tamanho}px">${svg}</span>`,
      iconSize: [tamanho, tamanho + 6],
      iconAnchor: [tamanho / 2, tamanho + 6],
      popupAnchor: [0, -tamanho - 4],
    })
    cacheIcones.set(chave, i)
  }
  return i
}

interface PropsPino {
  posicao: [number, number]
  Icone: LucideIcon
  cor: string
  rotulo: string
  /** Anel pulsando: ponto que acabou de chegar. */
  novo?: boolean
  tamanho?: number
  aoClicar?: () => void
  /** Abre o balão sozinho (ex.: /mapa?foco=hospital). */
  abrir?: boolean
  /** Conteúdo do balão ao tocar no pino. */
  children?: ReactNode
}

export function Pino({ posicao, Icone, cor, rotulo, novo, tamanho, aoClicar, abrir, children }: PropsPino) {
  const i = useMemo(() => icone(Icone, cor, novo ? 'pino-novo' : '', tamanho), [Icone, cor, novo, tamanho])
  const marcador = useRef<L.Marker>(null)
  useEffect(() => {
    if (!abrir) return
    const t = setTimeout(() => marcador.current?.openPopup(), 400)
    return () => clearTimeout(t)
  }, [abrir])
  return (
    <Marker
      ref={marcador}
      position={posicao}
      icon={i}
      title={rotulo}
      zIndexOffset={novo ? 1000 : 0}
      eventHandlers={aoClicar ? { click: aoClicar } : undefined}
    >
      {children && (
        <Popup closeButton={false} minWidth={200} maxWidth={240}>
          {children}
        </Popup>
      )}
    </Marker>
  )
}
