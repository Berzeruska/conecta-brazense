import { useSyncExternalStore } from 'react'

/**
 * localStorage com tolerância a falhas: em aba anônima, cota cheia ou
 * armazenamento bloqueado, o app continua funcionando só em memória.
 */
const PREFIXO = 'conecta:'
const memoria = new Map<string, string>()
const ouvintes = new Set<() => void>()
const cacheLeitura = new Map<string, { bruto: string | null; valor: unknown }>()

function lerBruto(chave: string): string | null {
  try {
    const v = window.localStorage.getItem(PREFIXO + chave)
    if (v !== null) return v
  } catch {
    /* armazenamento indisponível */
  }
  return memoria.get(chave) ?? null
}

export function ler<T>(chave: string, padrao: T): T {
  const bruto = lerBruto(chave)
  const c = cacheLeitura.get(chave)
  if (c && c.bruto === bruto) return c.valor as T
  let valor: unknown = padrao
  if (bruto !== null) {
    try {
      valor = JSON.parse(bruto)
    } catch {
      valor = padrao
    }
  }
  cacheLeitura.set(chave, { bruto, valor })
  return valor as T
}

/** Retorna false se não coube no localStorage (o valor fica só em memória). */
export function gravar<T>(chave: string, valor: T): boolean {
  const bruto = JSON.stringify(valor)
  memoria.set(chave, bruto)
  let ok = true
  try {
    window.localStorage.setItem(PREFIXO + chave, bruto)
  } catch {
    ok = false
    try {
      window.localStorage.removeItem(PREFIXO + chave)
    } catch {
      /* ignora */
    }
  }
  ouvintes.forEach((f) => f())
  return ok
}

export function apagarTudo() {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(PREFIXO))
      .forEach((k) => window.localStorage.removeItem(k))
  } catch {
    /* ignora */
  }
  memoria.clear()
  cacheLeitura.clear()
  ouvintes.forEach((f) => f())
}

function assinar(f: () => void) {
  ouvintes.add(f)
  const aoMudarOutraAba = (e: StorageEvent) => {
    if (!e.key || e.key.startsWith(PREFIXO)) f()
  }
  window.addEventListener('storage', aoMudarOutraAba)
  return () => {
    ouvintes.delete(f)
    window.removeEventListener('storage', aoMudarOutraAba)
  }
}

export function useArmazenado<T>(chave: string, padrao: T): T {
  return useSyncExternalStore(
    assinar,
    () => ler(chave, padrao),
    () => padrao,
  )
}
