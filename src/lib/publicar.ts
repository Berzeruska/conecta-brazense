import type { Anuncio, Categoria, ModoAnuncio, Produto } from '../data/types'
import { MINHA_BANCA_ID, PERFIL_PADRAO, type Perfil } from './catalogo'
import { gravar, ler } from './storage'

const novoId = (prefixo: string) => `${prefixo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

export interface NovoProduto {
  nome: string
  preco: number
  unidade: string
  categoria: Categoria
  descricao: string
  foto: string
}

export interface NovoAnuncio {
  titulo: string
  modo: ModoAnuncio
  preco?: number
  troca?: string
  descricao: string
  estado: string
  foto: string
}

export const FOTO_PADRAO_PRODUTO = '/img/cap-verduras.jpg'
export const FOTO_PADRAO_ANUNCIO = '/img/cap-feira.jpg'

export function validarProduto(p: Partial<NovoProduto>): string | null {
  if (!p.nome?.trim()) return 'Dê um nome ao produto.'
  if (!p.preco || !(p.preco > 0)) return 'Informe um preço maior que zero.'
  if (!p.unidade?.trim()) return 'Informe a unidade (kg, dúzia, maço...).'
  return null
}

export function validarAnuncio(a: Partial<NovoAnuncio>): string | null {
  if (!a.titulo?.trim()) return 'Dê um título ao anúncio.'
  if (a.modo === 'vender' && !(a.preco && a.preco > 0)) return 'Informe o preço de venda.'
  if (a.modo === 'trocar' && !a.troca?.trim()) return 'Conte o que você aceita na troca.'
  return null
}

/** Grava no localStorage; se a foto não couber, tenta de novo sem ela. */
export function publicarProduto(p: NovoProduto): { produto: Produto; semFoto: boolean } {
  const produto: Produto = {
    id: novoId('meu'),
    vendedorId: MINHA_BANCA_ID,
    nome: p.nome.trim(),
    preco: Math.round(p.preco * 100) / 100,
    unidade: p.unidade.trim(),
    categoria: p.categoria,
    descricao: p.descricao.trim() || 'Produto publicado pelo painel do vendedor.',
    foto: p.foto || FOTO_PADRAO_PRODUTO,
    meu: true,
  }
  const atuais = ler<Produto[]>('meus-produtos', [])
  if (gravar('meus-produtos', [produto, ...atuais])) return { produto, semFoto: false }
  const leve = { ...produto, foto: FOTO_PADRAO_PRODUTO }
  gravar('meus-produtos', [leve, ...atuais])
  return { produto: leve, semFoto: p.foto !== '' && p.foto !== FOTO_PADRAO_PRODUTO }
}

export function publicarAnuncio(a: NovoAnuncio, perfil: Perfil): { anuncio: Anuncio; semFoto: boolean } {
  const anuncio: Anuncio = {
    id: novoId('meu'),
    titulo: a.titulo.trim(),
    modo: a.modo,
    preco: a.modo === 'vender' ? Math.round((a.preco ?? 0) * 100) / 100 : undefined,
    troca: a.modo === 'trocar' ? a.troca?.trim() : undefined,
    foto: a.foto || FOTO_PADRAO_ANUNCIO,
    descricao: a.descricao.trim() || 'Anúncio publicado pelo app.',
    bairro: perfil.bairro || PERFIL_PADRAO.bairro,
    autor: perfil.nome || PERFIL_PADRAO.nome,
    estado: a.estado.trim() || 'Usado',
    publicadoEm: new Date().toISOString(),
    meu: true,
  }
  const atuais = ler<Anuncio[]>('meus-anuncios', [])
  if (gravar('meus-anuncios', [anuncio, ...atuais])) return { anuncio, semFoto: false }
  const leve = { ...anuncio, foto: FOTO_PADRAO_ANUNCIO }
  gravar('meus-anuncios', [leve, ...atuais])
  return { anuncio: leve, semFoto: a.foto !== '' && a.foto !== FOTO_PADRAO_ANUNCIO }
}

export function removerMeuProduto(id: string) {
  gravar('meus-produtos', ler<Produto[]>('meus-produtos', []).filter((p) => p.id !== id))
}

export function removerMeuAnuncio(id: string) {
  gravar('meus-anuncios', ler<Anuncio[]>('meus-anuncios', []).filter((a) => a.id !== id))
}
