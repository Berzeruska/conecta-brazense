// Baixa (uma vez) os tiles do OpenStreetMap da cidade para public/tiles, para o mapa funcionar em modo avião.
// São ~230 tiles, baixados um por vez, respeitando a política de uso do OSM. Uso: node scripts/baixar-tiles.mjs
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import city from '../src/config/city.json' with { type: 'json' }

const { lat, lng } = city.coordenadas
// Caixas em graus (sul, oeste, norte, leste) ao redor do centro da cidade.
const caixa = (dLat, dLng) => [lat - dLat, lng - dLng, lat + dLat, lng + dLng]
const NIVEIS = [
  { z: 12, caixa: caixa(0.07, 0.07) }, // zona rural inteira
  { z: 13, caixa: caixa(0.07, 0.07) },
  { z: 14, caixa: caixa(0.07, 0.07) },
  { z: 15, caixa: caixa(0.035, 0.04) }, // área urbana com folga (telão em tela larga)
  { z: 16, caixa: caixa(0.03, 0.03) }, // área urbana
  { z: 17, caixa: caixa(0.01, 0.0095) }, // centro
]

const tile = (la, lo, z) => {
  const n = 2 ** z
  const r = (la * Math.PI) / 180
  return [Math.floor(((lo + 180) / 360) * n), Math.floor(((1 - Math.asinh(Math.tan(r)) / Math.PI) / 2) * n)]
}

const indice = {}
let baixados = 0
for (const { z, caixa: [s, o, n, l] } of NIVEIS) {
  const [x1, y1] = tile(n, o, z)
  const [x2, y2] = tile(s, l, z)
  indice[z] = [x1, x2, y1, y2]
  for (let x = x1; x <= x2; x++) {
    mkdirSync(`public/tiles/${z}/${x}`, { recursive: true })
    for (let y = y1; y <= y2; y++) {
      const destino = `public/tiles/${z}/${x}/${y}.png`
      if (existsSync(destino)) continue
      const r = await fetch(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`, {
        headers: { 'User-Agent': 'ConectaBrazense-prototipo/0.1 (feira de ideias escolar)' },
      })
      if (!r.ok) throw new Error(`${z}/${x}/${y}: HTTP ${r.status}`)
      writeFileSync(destino, Buffer.from(await r.arrayBuffer()))
      baixados++
      await new Promise((ok) => setTimeout(ok, 150))
    }
  }
}
writeFileSync('src/data/tiles.json', JSON.stringify(indice) + '\n')
console.log(`${baixados} tiles novos. Índice em src/data/tiles.json`)
