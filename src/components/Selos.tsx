import { Home, Leaf, Store, Repeat, Gift, Tag } from 'lucide-react'
import type { ModoAnuncio, TipoVendedor } from '../data/types'

export function SeloDaqui({ grande = false }: { grande?: boolean }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-destaque/10 font-semibold text-destaque ${
        grande ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px]'
      }`}
    >
      <Home className={grande ? 'h-3.5 w-3.5' : 'h-3 w-3'} aria-hidden />
      Compre de quem é daqui
    </span>
  )
}

export function TagOrigem({ tipo }: { tipo: TipoVendedor }) {
  return tipo === 'produtor' ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-produtor px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
      <Leaf className="h-3 w-3" aria-hidden /> Do produtor
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-primaria px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
      <Store className="h-3 w-3" aria-hidden /> Comércio local
    </span>
  )
}

const MODOS: Record<ModoAnuncio, { rotulo: string; classe: string; Icone: typeof Tag }> = {
  vender: { rotulo: 'Venda', classe: 'bg-destaque text-white', Icone: Tag },
  trocar: { rotulo: 'Troca', classe: 'bg-sky-600 text-white', Icone: Repeat },
  doar: { rotulo: 'Doação', classe: 'bg-fuchsia-600 text-white', Icone: Gift },
}

export function TagModo({ modo }: { modo: ModoAnuncio }) {
  const { rotulo, classe, Icone } = MODOS[modo]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${classe}`}>
      <Icone className="h-3 w-3" aria-hidden /> {rotulo}
    </span>
  )
}
