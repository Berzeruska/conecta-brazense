import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase é opcional: só o Zelador e o telão usam, para o ponto criado num
 * celular aparecer em outro aparelho. Sem as variáveis, ou sem rede, o app
 * segue só com localStorage.
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const chave = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/** A chave secreta nunca pode ir para o navegador: se alguém colar ela por engano, o app a ignora. */
export function chaveEhSecreta(k: string): boolean {
  if (k.startsWith('sb_secret_')) return true
  const partes = k.split('.')
  if (partes.length !== 3) return false
  try {
    const payload = JSON.parse(atob(partes[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.role === 'service_role'
  } catch {
    return false
  }
}

const secreta = Boolean(chave && chaveEhSecreta(chave))
if (secreta) console.warn('VITE_SUPABASE_ANON_KEY contém a chave secreta (service_role). Use a chave anon/publishable. Supabase desligado.')

export const supabaseConfigurado = Boolean(url && chave && !secreta)

let cliente: Promise<SupabaseClient | null> | null = null

export function obterSupabase(): Promise<SupabaseClient | null> {
  if (!supabaseConfigurado) return Promise.resolve(null)
  cliente ??= import('@supabase/supabase-js')
    .then(({ createClient }) => createClient(url!, chave!, { auth: { persistSession: false } }))
    .catch(() => {
      cliente = null
      return null
    })
  return cliente
}
