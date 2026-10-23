import { useEffect, useRef, useState, type ReactNode } from 'react'
import { animate } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ChevronRight, FlaskConical } from 'lucide-react'
import { moeda } from '../lib/format'

export function NumeroAnimado({ valor, formato = moeda }: { valor: number; formato?: (v: number) => string }) {
  const [mostrado, setMostrado] = useState(valor * 0.92)
  const anterior = useRef(valor * 0.92)
  useEffect(() => {
    const c = animate(anterior.current, valor, {
      duration: 1.4,
      ease: 'easeOut',
      onUpdate: (v) => {
        anterior.current = v
        setMostrado(v)
      },
    })
    return () => c.stop()
  }, [valor])
  return <span className="tabular-nums">{formato(mostrado)}</span>
}

export function TituloSecao({ titulo, para, acao = 'Ver tudo' }: { titulo: string; para?: string; acao?: string }) {
  return (
    <div className="mb-3 flex items-end justify-between px-4">
      <h2 className="text-lg font-bold text-tinta">{titulo}</h2>
      {para && (
        <Link to={para} className="flex items-center text-sm font-semibold text-destaque">
          {acao} <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

export function EstadoVazio({ Icone, titulo, texto, children }: { Icone: typeof FlaskConical; titulo: string; texto: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-8 py-14 text-center">
      <div className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-primaria/5 text-primaria">
        <Icone className="h-8 w-8" />
      </div>
      <p className="text-lg font-bold text-tinta">{titulo}</p>
      <p className="mt-1 text-sm text-slate-500">{texto}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  )
}

/** Aviso discreto exigido pelas regras do MVP. */
export function RodapeDemo({ texto = 'Protótipo navegável · lojas, produtores e anúncios fictícios de demonstração' }: { texto?: string }) {
  return (
    <p className="flex items-center justify-center gap-1.5 px-6 pb-6 pt-8 text-center text-[11px] text-slate-400">
      <FlaskConical className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {texto}
    </p>
  )
}

export function Botao({
  children,
  variante = 'destaque',
  className = '',
  ...resto
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: 'destaque' | 'produtor' | 'primaria' | 'claro' }) {
  const cores = {
    destaque: 'bg-destaque text-white shadow-lg shadow-destaque/30',
    produtor: 'bg-produtor text-white shadow-lg shadow-produtor/30',
    primaria: 'bg-primaria text-white shadow-lg shadow-primaria/25',
    claro: 'bg-white text-tinta ring-1 ring-slate-200',
  }[variante]
  return (
    <button
      type="button"
      {...resto}
      className={`flex h-12 items-center justify-center gap-2 rounded-2xl px-5 font-bold transition active:scale-[0.98] disabled:opacity-50 ${cores} ${className}`}
    >
      {children}
    </button>
  )
}
