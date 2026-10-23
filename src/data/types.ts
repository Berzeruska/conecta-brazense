export type TipoVendedor = 'produtor' | 'loja'

export interface Coordenadas {
  lat: number
  lng: number
}

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
  /** Ponto fictício numa rua real da cidade, só para o mapa. */
  coordenadas?: Coordenadas
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

export type TipoServico = 'saude' | 'prefeitura' | 'emergencia'

export interface Servico {
  id: string
  nome: string
  tipo: TipoServico
  endereco: string | null
  telefone: string
  horario: string | null
  coordenadas: Coordenadas | null
  /** Caminho fixo da foto real; se o arquivo ainda não existir, o card mostra um placeholder. */
  foto: string | null
  fonte: string
  /** Campos que ainda precisam ser conferidos pela equipe. */
  aConfirmar: ('endereco' | 'telefone' | 'horario' | 'coordenadas')[]
}

export type CategoriaReporte = 'buraco' | 'iluminacao' | 'lixo' | 'outros'
export type StatusReporte = 'aberto' | 'andamento' | 'resolvido'

export interface Reporte {
  id: string
  categoria: CategoriaReporte
  descricao: string
  foto: string
  lat: number
  lng: number
  bairro: string
  autor: string
  status: StatusReporte
  /** Datas ISO. */
  criadoEm: string
  respondidoEm?: string
  resolvidoEm?: string
  /** Criado neste aparelho. */
  meu?: boolean
  /** Ainda não chegou ao servidor (sem internet ou sem Supabase). */
  pendente?: boolean
}
