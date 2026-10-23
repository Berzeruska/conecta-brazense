import { useMemo } from 'react'
import produtoresJson from '../data/produtores.json'
import lojasJson from '../data/lojas.json'
import produtosJson from '../data/produtos.json'
import anunciosJson from '../data/anuncios.json'
import type { Anuncio, Categoria, Produto, Vendedor } from '../data/types'
import { city } from './city'
import { useArmazenado } from './storage'

export const MINHA_BANCA_ID = 'minha-banca'

export interface Perfil {
  nome: string
  bairro: string
  banca: string
}

export const PERFIL_PADRAO: Perfil = { nome: 'Visitante', bairro: 'Centro', banca: 'Minha Banca' }

export const produtores = produtoresJson as Vendedor[]
export const lojas = lojasJson as Vendedor[]
export const produtosBase = produtosJson as Produto[]

type AnuncioJson = Omit<Anuncio, 'publicadoEm'> & { horasAtras: number }

/** Datas dos anúncios de exemplo são relativas a "agora", para a demo parecer sempre recente. */
export function anunciosDeExemplo(agora = Date.now()): Anuncio[] {
  return (anunciosJson as AnuncioJson[]).map(({ horasAtras, ...a }) => ({
    ...a,
    publicadoEm: new Date(agora - horasAtras * 3600_000).toISOString(),
  }))
}

export const CATEGORIAS: Record<Categoria, { nome: string; emoji: string }> = {
  hortifruti: { nome: 'Hortifrúti', emoji: '🥬' },
  'ovos-laticinios': { nome: 'Ovos e laticínios', emoji: '🥚' },
  'mel-doces': { nome: 'Mel e doces', emoji: '🍯' },
  padaria: { nome: 'Padaria', emoji: '🍞' },
  'cafe-graos': { nome: 'Café e grãos', emoji: '☕' },
  farmacia: { nome: 'Farmácia', emoji: '💊' },
  roupas: { nome: 'Roupas', emoji: '👕' },
  agro: { nome: 'Agro', emoji: '🌱' },
  construcao: { nome: 'Construção', emoji: '🧱' },
  'casa-jardim': { nome: 'Casa e jardim', emoji: '🪴' },
  servicos: { nome: 'Serviços', emoji: '🔧' },
}

export function vendedorMinhaBanca(perfil: Perfil): Vendedor {
  return {
    id: MINHA_BANCA_ID,
    tipo: 'produtor',
    nome: perfil.banca || PERFIL_PADRAO.banca,
    responsavel: perfil.nome || PERFIL_PADRAO.nome,
    ramo: 'Produção própria',
    descricao: `Produtos publicados por você no painel do vendedor. É assim que um produtor de ${city.cidade} entra no app.`,
    bairro: perfil.bairro || PERFIL_PADRAO.bairro,
    endereco: 'Combinar pelo app',
    foto: '/img/cap-verduras.jpg',
    diasEntrega: ['Combinar'],
    retirada: 'Combinar pelo app',
    entrega: true,
    taxaEntrega: 3,
    nota: 5,
    desde: new Date().getFullYear(),
  }
}

export interface Catalogo {
  vendedores: Vendedor[]
  produtos: Produto[]
  anuncios: Anuncio[]
}

export function montarCatalogo(
  perfil: Perfil,
  meusProdutos: Produto[],
  meusAnuncios: Anuncio[],
  agora = Date.now(),
): Catalogo {
  const vendedores = [...produtores, ...lojas]
  if (meusProdutos.length) vendedores.push(vendedorMinhaBanca(perfil))
  return {
    vendedores,
    produtos: [...meusProdutos, ...produtosBase],
    anuncios: [...meusAnuncios, ...anunciosDeExemplo(agora)],
  }
}

export function useCatalogo(): Catalogo {
  const perfil = usePerfil()
  const meusProdutos = useArmazenado<Produto[]>('meus-produtos', [])
  const meusAnuncios = useArmazenado<Anuncio[]>('meus-anuncios', [])
  return useMemo(() => montarCatalogo(perfil, meusProdutos, meusAnuncios), [perfil, meusProdutos, meusAnuncios])
}

export function usePerfil(): Perfil {
  const perfil = useArmazenado<Perfil>('perfil', PERFIL_PADRAO)
  // Perfil salvo antes da troca de bairros do city.json: volta para o padrão.
  return useMemo(() => (city.bairros.includes(perfil.bairro) ? perfil : { ...perfil, bairro: PERFIL_PADRAO.bairro }), [perfil])
}

export const acharVendedor = (cat: Catalogo, id: string) => cat.vendedores.find((v) => v.id === id)
export const acharProduto = (cat: Catalogo, id: string) => cat.produtos.find((p) => p.id === id)

export interface Comparacao {
  produtor: { produto: Produto; vendedor: Vendedor }
  loja: { produto: Produto; vendedor: Vendedor }
  economia: number
  percentual: number
}

/** Mais barato do produtor x mais barato da loja para o mesmo item (mesma chave `comparar`). */
export function comparar(cat: Catalogo, produto: Produto): Comparacao | null {
  if (!produto.comparar) return null
  const mesmos = cat.produtos
    .filter((p) => p.comparar === produto.comparar)
    .map((p) => ({ produto: p, vendedor: acharVendedor(cat, p.vendedorId)! }))
    .filter((x) => x.vendedor)
  const maisBarato = (tipo: Vendedor['tipo']) =>
    mesmos.filter((x) => x.vendedor.tipo === tipo).sort((a, b) => a.produto.preco - b.produto.preco)[0]
  const produtor = maisBarato('produtor')
  const loja = maisBarato('loja')
  if (!produtor || !loja) return null
  const economia = loja.produto.preco - produtor.produto.preco
  return { produtor, loja, economia, percentual: Math.round((economia / loja.produto.preco) * 100) }
}

/** Produtor do dia: muda a cada dia, igual para todo mundo. */
export function produtorDoDia(data = new Date()): Vendedor {
  const inicio = Date.UTC(data.getFullYear(), 0, 0)
  const diaDoAno = Math.floor((Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()) - inicio) / 86400_000)
  return produtores[diaDoAno % produtores.length]
}
