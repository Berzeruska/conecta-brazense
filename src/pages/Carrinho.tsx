import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, ShoppingBasket, Store as StoreIcon, Truck, Trash2 } from 'lucide-react'
import type { Vendedor } from '../data/types'
import { PERFIL_PADRAO, usePerfil, useCatalogo } from '../lib/catalogo'
import { gravar } from '../lib/storage'
import {
  agruparPorVendedor,
  arred,
  carrinho,
  confirmarReservas,
  montarReservas,
  useCarrinho,
  type FormaEntrega,
} from '../lib/carrinho'
import { moeda } from '../lib/format'
import { Cabecalho } from '../components/Cabecalho'
import { Foto } from '../components/Foto'
import { Botao, EstadoVazio } from '../components/Diversos'
import { TagOrigem } from '../components/Selos'

export function opcoesDeDia(v: Vendedor): string[] {
  const generico = v.diasEntrega.some((d) => / a |todos|combinar/i.test(d))
  return generico ? ['Hoje', 'Amanhã', 'Depois de amanhã'] : v.diasEntrega
}

const campo =
  'h-12 w-full rounded-xl bg-white px-4 text-base text-tinta ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-destaque placeholder:text-slate-400'

export function Carrinho() {
  const cat = useCatalogo()
  const itens = useCarrinho()
  const perfil = usePerfil()
  const navegar = useNavigate()
  const grupos = agruparPorVendedor(itens, cat)

  const [escolhas, setEscolhas] = useState<Record<string, { forma: FormaEntrega; dia: string }>>({})
  const [nome, setNome] = useState(perfil.nome !== 'Visitante' ? perfil.nome : '')
  const [telefone, setTelefone] = useState('')
  const [endereco, setEndereco] = useState('')
  const [erro, setErro] = useState('')

  const escolhaDe = (v: Vendedor) => escolhas[v.id] ?? { forma: 'retirada' as FormaEntrega, dia: opcoesDeDia(v)[0] }
  const mudarEscolha = (v: Vendedor, mudanca: Partial<{ forma: FormaEntrega; dia: string }>) =>
    setEscolhas((e) => ({ ...e, [v.id]: { ...escolhaDe(v), ...mudanca } }))

  const subtotal = arred(grupos.reduce((s, g) => s + g.subtotal, 0))
  const taxas = arred(grupos.reduce((s, g) => s + (escolhaDe(g.vendedor).forma === 'entrega' ? g.vendedor.taxaEntrega : 0), 0))
  const temEntrega = grupos.some((g) => escolhaDe(g.vendedor).forma === 'entrega')
  const doProdutor = arred(grupos.filter((g) => g.vendedor.tipo === 'produtor').reduce((s, g) => s + g.subtotal, 0))

  if (!grupos.length)
    return (
      <div>
        <Cabecalho titulo="Minha reserva" semCarrinho />
        <EstadoVazio Icone={ShoppingBasket} titulo="Sua cesta está vazia" texto="Escolha produtos do produtor ou das lojas da cidade e reserve aqui.">
          <Link to="/buscar?origem=produtor" className="rounded-2xl bg-produtor px-5 py-3 font-bold text-white">
            Ver produtos do produtor
          </Link>
        </EstadoVazio>
      </div>
    )

  const confirmar = () => {
    if (!nome.trim()) return setErro('Diga seu nome para o vendedor saber quem vai buscar.')
    if (temEntrega && !endereco.trim()) return setErro('Informe o endereço para a entrega.')
    setErro('')
    const reservas = montarReservas(grupos, {
      nome,
      telefone,
      endereco,
      escolhas: Object.fromEntries(grupos.map((g) => [g.vendedor.id, escolhaDe(g.vendedor)])),
    })
    confirmarReservas(reservas)
    // quem ainda era "Visitante" passa a ter nome no app (aparece no Perfil e nos anúncios)
    if (perfil.nome === PERFIL_PADRAO.nome) gravar('perfil', { ...perfil, nome: nome.trim() })
    navegar(`/reserva/${reservas[0].pedido}`, { replace: true })
  }

  return (
    <div className="pb-40">
      <Cabecalho titulo="Minha reserva" semCarrinho />
      <div className="space-y-4 px-4 pt-4">
        {grupos.map(({ vendedor, itens: linhas, subtotal: sub }) => {
          const escolha = escolhaDe(vendedor)
          return (
            <section key={vendedor.id} className="overflow-hidden rounded-2xl bg-white shadow-cartao">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 p-3">
                <p className="truncate font-bold text-tinta">{vendedor.nome}</p>
                <TagOrigem tipo={vendedor.tipo} />
              </div>
              <ul className="divide-y divide-slate-100">
                {linhas.map(({ produto, qtd }) => (
                  <li key={produto.id} className="flex items-center gap-3 p-3">
                    <Foto src={produto.foto} alt={produto.nome} className="h-14 w-14 shrink-0 rounded-xl" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-tinta">{produto.nome}</p>
                      <p className="text-xs text-slate-500">
                        {moeda(produto.preco)} / {produto.unidade}
                      </p>
                      <p className="text-sm font-bold text-tinta">{moeda(produto.preco * qtd)}</p>
                    </div>
                    <div className="flex items-center rounded-xl bg-slate-100">
                      <button
                        type="button"
                        aria-label={qtd === 1 ? `Remover ${produto.nome}` : `Diminuir ${produto.nome}`}
                        onClick={() => carrinho.alterar(produto.id, qtd - 1)}
                        className="grid h-9 w-9 place-items-center"
                      >
                        {qtd === 1 ? <Trash2 className="h-4 w-4 text-red-500" /> : <Minus className="h-4 w-4" />}
                      </button>
                      <span className="w-5 text-center text-sm font-bold tabular-nums">{qtd}</span>
                      <button type="button" aria-label={`Aumentar ${produto.nome}`} onClick={() => carrinho.alterar(produto.id, qtd + 1)} className="grid h-9 w-9 place-items-center">
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="space-y-3 bg-slate-50 p-3">
                <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={`Como receber de ${vendedor.nome}`}>
                  {(['retirada', 'entrega'] as FormaEntrega[]).map((f) => {
                    const desabilitado = f === 'entrega' && !vendedor.entrega
                    const ativo = escolha.forma === f
                    return (
                      <button
                        key={f}
                        type="button"
                        role="radio"
                        aria-checked={ativo}
                        disabled={desabilitado}
                        onClick={() => mudarEscolha(vendedor, { forma: f })}
                        className={`flex items-center gap-2 rounded-xl p-2.5 text-left text-xs transition disabled:opacity-40 ${
                          ativo ? 'bg-white ring-2 ring-destaque' : 'bg-white ring-1 ring-slate-200'
                        }`}
                      >
                        {f === 'retirada' ? <StoreIcon className="h-4 w-4 shrink-0 text-destaque" /> : <Truck className="h-4 w-4 shrink-0 text-destaque" />}
                        <span>
                          <b className="block text-tinta">{f === 'retirada' ? 'Retirar' : 'Entrega local'}</b>
                          <span className="text-slate-500">
                            {f === 'retirada' ? 'Sem taxa' : desabilitado ? 'Indisponível' : `+ ${moeda(vendedor.taxaEntrega)}`}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
                {escolha.forma === 'retirada' && <p className="text-xs text-slate-500">📍 {vendedor.retirada}</p>}
                <label className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-semibold text-tinta">Quando?</span>
                  <select
                    value={escolha.dia}
                    onChange={(e) => mudarEscolha(vendedor, { dia: e.target.value })}
                    className="h-10 rounded-xl bg-white px-3 text-sm ring-1 ring-slate-200"
                  >
                    {opcoesDeDia(vendedor).map((d) => (
                      <option key={d}>{d}</option>
                    ))}
                  </select>
                </label>
                <p className="flex justify-between text-sm">
                  <span className="text-slate-500">Subtotal</span>
                  <b className="text-tinta">{moeda(sub)}</b>
                </p>
              </div>
            </section>
          )
        })}

        <section className="space-y-3 rounded-2xl bg-white p-4 shadow-cartao">
          <p className="font-bold text-tinta">Seus dados</p>
          <input className={campo} placeholder="Seu nome" value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" aria-label="Seu nome" />
          <input
            className={campo}
            placeholder="WhatsApp (opcional)"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            inputMode="tel"
            autoComplete="tel"
            aria-label="WhatsApp"
          />
          {temEntrega && (
            <input
              className={campo}
              placeholder="Endereço para entrega"
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              autoComplete="street-address"
              aria-label="Endereço para entrega"
            />
          )}
          <p className="text-xs text-slate-500">Pagamento direto ao vendedor na retirada ou entrega (Pix ou dinheiro).</p>
        </section>

        {doProdutor > 0 && (
          <p className="rounded-2xl bg-produtor/10 p-3 text-center text-sm text-produtor">
            🌱 <b>{moeda(doProdutor)}</b> desta reserva vão direto para quem produz.
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto max-w-md">
          {erro && (
            <p role="alert" className="mb-2 text-center text-sm font-semibold text-red-600">
              {erro}
            </p>
          )}
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-slate-500">{taxas > 0 ? `Produtos ${moeda(subtotal)} + entrega ${moeda(taxas)}` : 'Total'}</span>
            <b className="text-lg text-tinta">{moeda(subtotal + taxas)}</b>
          </div>
          <Botao className="w-full" onClick={confirmar}>
            Confirmar reserva
          </Botao>
        </div>
      </div>
    </div>
  )
}
