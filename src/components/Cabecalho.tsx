import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { BotaoCarrinho } from './BotaoCarrinho'

interface Props {
  titulo?: string
  voltar?: boolean
  transparente?: boolean
  direita?: ReactNode
  semCarrinho?: boolean
}

export function Cabecalho({ titulo, voltar = true, transparente = false, direita, semCarrinho }: Props) {
  const navegar = useNavigate()
  const botao = transparente ? 'bg-white/90 shadow-md backdrop-blur' : 'bg-white shadow-sm'
  return (
    <header
      className={`${
        transparente ? 'absolute inset-x-0 top-0 z-20' : 'sticky top-0 z-20 border-b border-slate-200/70 bg-fundo/90 backdrop-blur'
      } flex h-14 items-center gap-2 px-4`}
    >
      {voltar && (
        <button
          type="button"
          aria-label="Voltar"
          onClick={() => (window.history.length > 1 ? navegar(-1) : navegar('/'))}
          className={`grid h-9 w-9 place-items-center rounded-full text-tinta ${botao}`}
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )}
      {titulo && <h1 className="flex-1 truncate text-lg font-bold text-tinta">{titulo}</h1>}
      {!titulo && <div className="flex-1" />}
      {direita}
      {!semCarrinho && <BotaoCarrinho className={botao} />}
    </header>
  )
}
