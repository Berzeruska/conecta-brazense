import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Cabecalho } from '../components/Cabecalho'
import { EstadoVazio } from '../components/Diversos'

export function NaoEncontrado() {
  return (
    <div>
      <Cabecalho />
      <EstadoVazio Icone={Compass} titulo="Não achamos esta página" texto="Ela pode ter sido removida. Que tal voltar ao início?">
        <Link to="/" className="rounded-2xl bg-destaque px-5 py-3 font-bold text-white">
          Ir para o início
        </Link>
      </EstadoVazio>
    </div>
  )
}
