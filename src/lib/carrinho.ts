import type { Produto, Vendedor } from '../data/types'
import { acharProduto, acharVendedor, type Catalogo } from './catalogo'
import { gravar, ler, useArmazenado } from './storage'

export interface ItemCarrinho {
  produtoId: string
  qtd: number
}

export type FormaEntrega = 'retirada' | 'entrega'

export interface Reserva {
  id: string
  pedido: string
  codigo: string
  criadaEm: string
  vendedorId: string
  vendedorNome: string
  vendedorTipo: Vendedor['tipo']
  itens: { produtoId: string; nome: string; qtd: number; preco: number; unidade: string; foto: string }[]
  subtotal: number
  taxa: number
  total: number
  forma: FormaEntrega
  dia: string
  nome: string
  telefone: string
  endereco?: string
  observacao?: string
}

const CHAVE_CARRINHO = 'carrinho'
const CHAVE_RESERVAS = 'reservas'

/* ---------- funções puras (testáveis) ---------- */

export function adicionarItem(itens: ItemCarrinho[], produtoId: string, qtd = 1): ItemCarrinho[] {
  const existe = itens.find((i) => i.produtoId === produtoId)
  if (existe) return itens.map((i) => (i.produtoId === produtoId ? { ...i, qtd: Math.min(99, i.qtd + qtd) } : i))
  return [...itens, { produtoId, qtd: Math.min(99, qtd) }]
}

export function alterarQtd(itens: ItemCarrinho[], produtoId: string, qtd: number): ItemCarrinho[] {
  if (qtd <= 0) return itens.filter((i) => i.produtoId !== produtoId)
  return itens.map((i) => (i.produtoId === produtoId ? { ...i, qtd: Math.min(99, qtd) } : i))
}

export interface GrupoCarrinho {
  vendedor: Vendedor
  itens: { produto: Produto; qtd: number }[]
  subtotal: number
}

/** Um carrinho pode ter itens de vários vendedores: cada um vira uma reserva. */
export function agruparPorVendedor(itens: ItemCarrinho[], cat: Catalogo): GrupoCarrinho[] {
  const grupos = new Map<string, GrupoCarrinho>()
  for (const item of itens) {
    const produto = acharProduto(cat, item.produtoId)
    const vendedor = produto && acharVendedor(cat, produto.vendedorId)
    if (!produto || !vendedor) continue
    const g = grupos.get(vendedor.id) ?? { vendedor, itens: [], subtotal: 0 }
    g.itens.push({ produto, qtd: item.qtd })
    g.subtotal = arred(g.subtotal + produto.preco * item.qtd)
    grupos.set(vendedor.id, g)
  }
  // produtores primeiro
  return [...grupos.values()].sort((a, b) => Number(a.vendedor.tipo === 'loja') - Number(b.vendedor.tipo === 'loja'))
}

export const arred = (v: number) => Math.round(v * 100) / 100

export const totalItens = (itens: ItemCarrinho[]) => itens.reduce((s, i) => s + i.qtd, 0)

function gerarCodigo(): string {
  const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const l = () => letras[Math.floor(Math.random() * letras.length)]
  return `${l()}${l()}-${String(Math.floor(1000 + Math.random() * 9000))}`
}

export interface DadosReserva {
  nome: string
  telefone: string
  endereco?: string
  observacao?: string
  /** Por vendedor: forma de entrega e dia escolhido. */
  escolhas: Record<string, { forma: FormaEntrega; dia: string }>
}

export function montarReservas(grupos: GrupoCarrinho[], dados: DadosReserva, agora = new Date()): Reserva[] {
  const pedido = `p${agora.getTime().toString(36)}`
  return grupos.map((g) => {
    const escolha = dados.escolhas[g.vendedor.id] ?? { forma: 'retirada' as FormaEntrega, dia: g.vendedor.diasEntrega[0] }
    const forma = g.vendedor.entrega ? escolha.forma : 'retirada'
    const taxa = forma === 'entrega' ? g.vendedor.taxaEntrega : 0
    return {
      id: `${pedido}-${g.vendedor.id}`,
      pedido,
      codigo: gerarCodigo(),
      criadaEm: agora.toISOString(),
      vendedorId: g.vendedor.id,
      vendedorNome: g.vendedor.nome,
      vendedorTipo: g.vendedor.tipo,
      itens: g.itens.map(({ produto, qtd }) => ({
        produtoId: produto.id,
        nome: produto.nome,
        qtd,
        preco: produto.preco,
        unidade: produto.unidade,
        foto: produto.foto,
      })),
      subtotal: g.subtotal,
      taxa,
      total: arred(g.subtotal + taxa),
      forma,
      dia: escolha.dia,
      nome: dados.nome.trim(),
      telefone: dados.telefone.trim(),
      endereco: forma === 'entrega' ? dados.endereco?.trim() : undefined,
      observacao: dados.observacao?.trim() || undefined,
    }
  })
}

/**
 * "R$ que ficaram na cidade" (simulado): uma base que cresce com o passar
 * dos dias + tudo o que o visitante reservou no app.
 */
export function valorNaCidade(reservas: Reserva[], agora = new Date()): number {
  const inicio = new Date('2026-09-01T00:00:00-03:00').getTime()
  const dias = Math.max(0, (agora.getTime() - inicio) / 86400_000)
  const base = 48_320 + dias * 386.4
  return arred(base + reservas.reduce((s, r) => s + r.subtotal, 0))
}

/* ---------- estado persistido ---------- */

export const useCarrinho = () => useArmazenado<ItemCarrinho[]>(CHAVE_CARRINHO, [])
export const useReservas = () => useArmazenado<Reserva[]>(CHAVE_RESERVAS, [])

const carrinhoAtual = () => ler<ItemCarrinho[]>(CHAVE_CARRINHO, [])

export const carrinho = {
  adicionar: (produtoId: string, qtd = 1) => gravar(CHAVE_CARRINHO, adicionarItem(carrinhoAtual(), produtoId, qtd)),
  alterar: (produtoId: string, qtd: number) => gravar(CHAVE_CARRINHO, alterarQtd(carrinhoAtual(), produtoId, qtd)),
  limpar: () => gravar(CHAVE_CARRINHO, []),
}

export function confirmarReservas(novas: Reserva[]) {
  gravar(CHAVE_RESERVAS, [...novas, ...ler<Reserva[]>(CHAVE_RESERVAS, [])])
  carrinho.limpar()
}
