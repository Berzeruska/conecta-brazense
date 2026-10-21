import { NavLink } from 'react-router-dom'
import { Home, Store, MapPinned, MessageCircleQuestion, User } from 'lucide-react'

const ABAS = [
  { para: '/', rotulo: 'Início', Icone: Home },
  { para: '/feirao', rotulo: 'Feirão', Icone: Store },
  { para: '/zelador', rotulo: 'Zelador', Icone: MapPinned },
  { para: '/pergunte', rotulo: 'Pergunte', Icone: MessageCircleQuestion },
  { para: '/perfil', rotulo: 'Perfil', Icone: User },
]

export function NavInferior() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md justify-around">
        {ABAS.map(({ para, rotulo, Icone }) => (
          <li key={para} className="flex-1">
            <NavLink
              to={para}
              end={para === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold transition ${
                  isActive ? 'text-destaque' : 'text-slate-500'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`grid h-7 w-12 place-items-center rounded-full transition ${isActive ? 'bg-destaque/10' : ''}`}>
                    <Icone className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
                  </span>
                  {rotulo}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
