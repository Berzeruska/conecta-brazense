import type { TipoVendedor } from '../data/types'
import { useCatalogo } from '../lib/catalogo'
import { Cabecalho } from '../components/Cabecalho'
import { CartaoVendedor } from '../components/Cartoes'
import { RodapeDemo } from '../components/Diversos'

export function ListaVendedores({ tipo }: { tipo: TipoVendedor }) {
  const { vendedores } = useCatalogo()
  const lista = vendedores.filter((v) => v.tipo === tipo)
  return (
    <div>
      <Cabecalho titulo={tipo === 'produtor' ? 'Produtores da região' : 'Comércio local'} />
      <p className="px-4 pt-3 text-sm text-slate-600">
        {tipo === 'produtor'
          ? 'Gente que planta, cria e faz. Compre direto, sem atravessador.'
          : 'As lojas da cidade, com retirada no balcão ou entrega local.'}
      </p>
      <div className="space-y-2 px-4 pt-4">
        {lista.map((v) => (
          <CartaoVendedor key={v.id} vendedor={v} />
        ))}
      </div>
      <RodapeDemo />
    </div>
  )
}
