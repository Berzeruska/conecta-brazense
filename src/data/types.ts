export type TipoVendedor = 'produtor' | 'loja'

export interface Vendedor {
  id: string
  tipo: TipoVendedor
  nome: string
  responsavel: string
  ramo: string
  descricao: string
  bairro: string
  endereco: string
  foto: string
  diasEntrega: string[]
  retirada: string
  entrega: boolean
  taxaEntrega: number
  nota: number
  desde: number
}

export type Categoria =
  | 'hortifruti'
  | 'ovos-laticinios'
  | 'mel-doces'
  | 'padaria'
  | 'cafe-graos'
  | 'farmacia'
  | 'roupas'
  | 'agro'
  | 'construcao'
  | 'casa-jardim'
  | 'servicos'

export interface Produto {
  id: string
  vendedorId: string
  nome: string
  preco: number
  precoAntigo?: number
  unidade: string
  categoria: Categoria
  foto: string
  descricao: string
  /** Produtos com a mesma chave entram na comparação produtor x loja. */
  comparar?: string
  /** Publicado pelo visitante no painel do vendedor (fica no localStorage). */
  meu?: boolean
}

export type ModoAnuncio = 'vender' | 'trocar' | 'doar'

export interface Anuncio {
  id: string
  titulo: string
  modo: ModoAnuncio
  preco?: number
  troca?: string
  foto: string
  descricao: string
  bairro: string
  autor: string
  estado: string
  /** Data ISO de publicação. */
  publicadoEm: string
  meu?: boolean
}
