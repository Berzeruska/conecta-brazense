import city from '../config/city.json'

export { city }

function hexParaRgb(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}

/** As cores do city.json viram variáveis CSS usadas pelo Tailwind. */
export function aplicarCoresDaCidade(raiz: HTMLElement = document.documentElement) {
  const c = city.cores
  const mapa: Record<string, string> = {
    primaria: c.primaria,
    'primaria-clara': c.primariaClara,
    destaque: c.destaque,
    produtor: c.produtor,
    fundo: c.fundo,
    tinta: c.tinta,
  }
  for (const [nome, hex] of Object.entries(mapa)) raiz.style.setProperty(`--c-${nome}`, hexParaRgb(hex))
}
