import type { Anuncio, Categoria, Produto, Vendedor } from '../data/types'
import { CATEGORIAS, type Catalogo } from './catalogo'

export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Radical bem simples: "ovos" → "ovo", "laranjas" → "laranja", "pães" → "pao". */
function radical(palavra: string): string {
  if (palavra.length >= 4 && /[ao]es$/.test(palavra)) return palavra.slice(0, -3) + 'ao'
  if (palavra.length > 3 && palavra.endsWith('es') && /[rsz]es$/.test(palavra)) return palavra.slice(0, -2)
  if (palavra.length > 2 && palavra.endsWith('s')) return palavra.slice(0, -1)
  return palavra
}

const termos = (texto: string) => normalizar(texto).split(' ').filter(Boolean).map(radical)

export type Origem = 'todos' | 'produtor' | 'loja' | 'feirao'
export type Ordem = 'relevancia' | 'menor-preco' | 'maior-preco'

export interface Filtros {
  origem: Origem
  categoria?: Categoria
  precoMax?: number
  ordem: Ordem
}

export const FILTROS_PADRAO: Filtros = { origem: 'todos', ordem: 'relevancia' }

export type Resultado =
  | { tipo: 'produto'; produto: Produto; vendedor: Vendedor; pontos: number }
  | { tipo: 'anuncio'; anuncio: Anuncio; pontos: number }

export const precoDoResultado = (r: Resultado) =>
  r.tipo === 'produto' ? r.produto.preco : (r.anuncio.preco ?? 0)

function pontuar(busca: string[], campos: { texto: string; peso: number }[]): number {
  if (!busca.length) return 1
  let total = 0
  for (const t of busca) {
    let melhor = 0
    for (const c of campos) {
      const palavras = termos(c.texto)
      if (palavras.some((p) => p === t)) melhor = Math.max(melhor, c.peso * 2)
      else if (palavras.some((p) => p.startsWith(t) || (t.length >= 4 && p.includes(t)))) melhor = Math.max(melhor, c.peso)
    }
    if (melhor === 0) return 0 // todos os termos precisam aparecer
    total += melhor
  }
  return total
}

export function buscar(cat: Catalogo, texto: string, filtros: Filtros = FILTROS_PADRAO): Resultado[] {
  const busca = termos(texto)
  const resultados: Resultado[] = []

  if (filtros.origem !== 'feirao') {
    for (const produto of cat.produtos) {
      const vendedor = cat.vendedores.find((v) => v.id === produto.vendedorId)
      if (!vendedor) continue
      if (filtros.origem !== 'todos' && vendedor.tipo !== filtros.origem) continue
      if (filtros.categoria && produto.categoria !== filtros.categoria) continue
      if (filtros.precoMax !== undefined && produto.preco > filtros.precoMax) continue
      const pontos = pontuar(busca, [
        { texto: produto.nome, peso: 3 },
        { texto: CATEGORIAS[produto.categoria].nome, peso: 1 },
        { texto: `${vendedor.nome} ${vendedor.ramo}`, peso: 1 },
        { texto: produto.descricao, peso: 1 },
      ])
      // produtor ganha um empurrãozinho no empate: é o trunfo do app
      if (pontos > 0) resultados.push({ tipo: 'produto', produto, vendedor, pontos: pontos + (vendedor.tipo === 'produtor' ? 0.5 : 0) })
    }
  }

  if ((filtros.origem === 'todos' || filtros.origem === 'feirao') && !filtros.categoria) {
    for (const anuncio of cat.anuncios) {
      if (filtros.precoMax !== undefined && (anuncio.preco ?? 0) > filtros.precoMax) continue
      const pontos = pontuar(busca, [
        { texto: anuncio.titulo, peso: 3 },
        { texto: anuncio.descricao, peso: 1 },
        { texto: anuncio.modo === 'doar' ? 'doação doar grátis' : anuncio.modo === 'trocar' ? 'troca trocar' : 'venda', peso: 1 },
      ])
      if (pontos > 0) resultados.push({ tipo: 'anuncio', anuncio, pontos })
    }
  }

  const porPreco = (a: Resultado, b: Resultado) => precoDoResultado(a) - precoDoResultado(b)
  if (filtros.ordem === 'menor-preco') resultados.sort(porPreco)
  else if (filtros.ordem === 'maior-preco') resultados.sort((a, b) => porPreco(b, a))
  else resultados.sort((a, b) => b.pontos - a.pontos || porPreco(a, b))
  return resultados
}

export const SUGESTOES_BUSCA = ['ovos', 'queijo', 'mel', 'café', 'tomate', 'pão caseiro', 'bicicleta', 'doação']
