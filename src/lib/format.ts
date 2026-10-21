const moedaFmt = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const moeda = (v: number) => moedaFmt.format(v).replace(/ /g, ' ')

export function tempoRelativo(iso: string, agora = Date.now()): string {
  const min = Math.max(0, Math.round((agora - new Date(iso).getTime()) / 60000))
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.round(h / 24)
  return d === 1 ? 'ontem' : `há ${d} dias`
}

export const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`
