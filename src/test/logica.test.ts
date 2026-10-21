import { describe, expect, it } from 'vitest'
import { buscar, normalizar } from '../lib/busca'
import {
  MINHA_BANCA_ID,
  PERFIL_PADRAO,
  acharProduto,
  comparar,
  lojas,
  montarCatalogo,
  produtorDoDia,
  produtores,
  produtosBase,
  anunciosDeExemplo,
} from '../lib/catalogo'
import { adicionarItem, agruparPorVendedor, alterarQtd, montarReservas, totalItens, valorNaCidade } from '../lib/carrinho'
import { moeda, tempoRelativo } from '../lib/format'
import { publicarAnuncio, publicarProduto, validarAnuncio, validarProduto } from '../lib/publicar'
import { gravar, ler } from '../lib/storage'
import { lerPreco } from '../pages/PainelVendedor'
import city from '../config/city.json'

const cat = () => montarCatalogo(PERFIL_PADRAO, [], [])

describe('dados de demonstração', () => {
  it('tem o volume pedido no README', () => {
    expect(produtores).toHaveLength(8)
    expect(lojas).toHaveLength(8)
    expect(produtosBase.length).toBeGreaterThanOrEqual(55)
    expect(anunciosDeExemplo()).toHaveLength(20)
  })

  it('ids são únicos e todo produto aponta para um vendedor existente', () => {
    const c = cat()
    const ids = [...c.produtos.map((p) => p.id), ...c.vendedores.map((v) => v.id), ...c.anuncios.map((a) => a.id)]
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of c.produtos) expect(c.vendedores.some((v) => v.id === p.vendedorId), p.id).toBe(true)
  })

  it('todo produtor e loja tem ao menos 2 produtos', () => {
    const c = cat()
    for (const v of c.vendedores) expect(c.produtos.filter((p) => p.vendedorId === v.id).length, v.id).toBeGreaterThanOrEqual(2)
  })

  it('todas as fotos referenciadas existem em public/', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const c = cat()
    const fotos = new Set([...c.produtos.map((p) => p.foto), ...c.vendedores.map((v) => v.foto), ...c.anuncios.map((a) => a.foto)])
    for (const f of fotos) expect(fs.existsSync(path.join(process.cwd(), 'public', f)), f).toBe(true)
  })

  it('city.json tem o que o app precisa', () => {
    expect(city.appName).toBeTruthy()
    expect(city.bairros.length).toBeGreaterThan(3)
    for (const cor of Object.values(city.cores)) expect(cor).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  it('produtor do dia muda conforme a data', () => {
    const a = produtorDoDia(new Date(2026, 11, 2))
    const b = produtorDoDia(new Date(2026, 11, 3))
    expect(a.id).not.toBe(b.id)
    expect(a.tipo).toBe('produtor')
  })
})

describe('busca única', () => {
  it('normaliza acentos e maiúsculas', () => {
    expect(normalizar('  Café  MOÍDO! ')).toBe('cafe moido')
  })

  it('"ovos" encontra ovos do produtor e da loja, produtor primeiro', () => {
    const r = buscar(cat(), 'ovos')
    const produtos = r.filter((x) => x.tipo === 'produto')
    expect(produtos.length).toBeGreaterThanOrEqual(3)
    expect(produtos[0].tipo === 'produto' && produtos[0].vendedor.tipo).toBe('produtor')
    expect(produtos.some((x) => x.tipo === 'produto' && x.vendedor.tipo === 'loja')).toBe(true)
  })

  it('singular, plural e acento dão o mesmo resultado', () => {
    const ids = (q: string) => buscar(cat(), q).map((r) => (r.tipo === 'produto' ? r.produto.id : r.anuncio.id))
    expect(ids('ovo')).toEqual(ids('OVOS'))
    expect(ids('cafe')).toEqual(ids('café'))
    expect(ids('pães').length).toBeGreaterThan(0)
  })

  it('busca também no Feirão', () => {
    const r = buscar(cat(), 'bicicleta')
    expect(r.length).toBeGreaterThanOrEqual(2)
    expect(r.every((x) => x.tipo === 'anuncio')).toBe(true)
    expect(buscar(cat(), 'doação').some((x) => x.tipo === 'anuncio' && x.anuncio.modo === 'doar')).toBe(true)
  })

  it('filtra por origem, categoria e preço', () => {
    const c = cat()
    expect(buscar(c, 'ovos', { origem: 'loja', ordem: 'relevancia' }).every((r) => r.tipo === 'produto' && r.vendedor.tipo === 'loja')).toBe(true)
    expect(buscar(c, '', { origem: 'feirao', ordem: 'relevancia' }).every((r) => r.tipo === 'anuncio')).toBe(true)
    expect(buscar(c, '', { origem: 'todos', categoria: 'padaria', ordem: 'relevancia' }).every((r) => r.tipo === 'produto' && r.produto.categoria === 'padaria')).toBe(true)
    const baratos = buscar(c, '', { origem: 'produtor', precoMax: 10, ordem: 'menor-preco' })
    expect(baratos.length).toBeGreaterThan(0)
    const precos = baratos.map((r) => (r.tipo === 'produto' ? r.produto.preco : 0))
    expect(Math.max(...precos)).toBeLessThanOrEqual(10)
    expect([...precos].sort((a, b) => a - b)).toEqual(precos)
  })

  it('termo inexistente não devolve nada', () => {
    expect(buscar(cat(), 'helicoptero')).toHaveLength(0)
  })
})

describe('comparação produtor x loja', () => {
  it('ovos: produtor é mais barato e a economia bate', () => {
    const c = cat()
    const cmp = comparar(c, acharProduto(c, 'ovos-caipira-duzia')!)!
    expect(cmp.produtor.vendedor.tipo).toBe('produtor')
    expect(cmp.loja.vendedor.tipo).toBe('loja')
    expect(cmp.economia).toBeCloseTo(cmp.loja.produto.preco - cmp.produtor.produto.preco)
    expect(cmp.economia).toBeGreaterThan(0)
  })

  it('toda chave de comparação usada tem os dois lados, menos as de um lado só', () => {
    const c = cat()
    const chaves = new Set(c.produtos.map((p) => p.comparar).filter(Boolean))
    let completas = 0
    for (const k of chaves) if (comparar(c, c.produtos.find((p) => p.comparar === k)!)) completas++
    expect(completas).toBeGreaterThanOrEqual(8)
  })

  it('produto sem chave não compara', () => {
    const c = cat()
    expect(comparar(c, acharProduto(c, 'favo-mel')!)).toBeNull()
  })
})

describe('carrinho e reserva', () => {
  it('soma, altera e remove itens', () => {
    let itens = adicionarItem([], 'ovos-caipira-duzia')
    itens = adicionarItem(itens, 'ovos-caipira-duzia', 2)
    itens = adicionarItem(itens, 'm-ovos')
    expect(totalItens(itens)).toBe(4)
    itens = alterarQtd(itens, 'm-ovos', 0)
    expect(itens).toEqual([{ produtoId: 'ovos-caipira-duzia', qtd: 3 }])
    expect(alterarQtd(itens, 'ovos-caipira-duzia', 500)[0].qtd).toBe(99)
  })

  it('agrupa por vendedor com produtor primeiro e subtotal sem erro de centavos', () => {
    const itens = [
      { produtoId: 'm-ovos', qtd: 3 },
      { produtoId: 'ovos-caipira-duzia', qtd: 1 },
      { produtoId: 'alface-crespa', qtd: 3 },
      { produtoId: 'item-que-sumiu', qtd: 1 },
    ]
    const g = agruparPorVendedor(itens, cat())
    expect(g.map((x) => x.vendedor.id)).toEqual(['sitio-tres-ipes', 'horta-dona-cida', 'mercado-vale-verde'])
    expect(g[2].subtotal).toBe(50.7)
  })

  it('monta uma reserva por vendedor, com taxa só na entrega e só se o vendedor entrega', () => {
    const g = agruparPorVendedor(
      [
        { produtoId: 'ovos-caipira-duzia', qtd: 2 },
        { produtoId: 'calca-jeans', qtd: 1 },
      ],
      cat(),
    )
    const rs = montarReservas(g, {
      nome: ' Ana ',
      telefone: '',
      endereco: 'Rua A, 1',
      escolhas: { 'sitio-tres-ipes': { forma: 'entrega', dia: 'Sexta' }, 'atelie-linha-fina': { forma: 'entrega', dia: 'Hoje' } },
    })
    expect(rs).toHaveLength(2)
    expect(rs[0]).toMatchObject({ vendedorId: 'sitio-tres-ipes', forma: 'entrega', taxa: 4, subtotal: 26, total: 30, nome: 'Ana', dia: 'Sexta' })
    expect(rs[1]).toMatchObject({ vendedorId: 'atelie-linha-fina', forma: 'retirada', taxa: 0, endereco: undefined })
    expect(rs[0].pedido).toBe(rs[1].pedido)
    expect(rs[0].codigo).toMatch(/^[A-Z]{2}-\d{4}$/)
  })

  it('contador da cidade cresce com o tempo e com as reservas', () => {
    const d = new Date('2026-12-02T12:00:00-03:00')
    const base = valorNaCidade([], d)
    expect(base).toBeGreaterThan(48_000)
    expect(valorNaCidade([], new Date('2026-12-03T12:00:00-03:00'))).toBeGreaterThan(base)
    const r = montarReservas(agruparPorVendedor([{ produtoId: 'ovos-caipira-duzia', qtd: 1 }], cat()), { nome: 'a', telefone: '', escolhas: {} })
    expect(valorNaCidade(r, d)).toBeCloseTo(base + 13)
  })
})

describe('painel do vendedor', () => {
  it('entende preço à brasileira', () => {
    expect(lerPreco('12,50')).toBe(12.5)
    expect(lerPreco('1.234,90')).toBe(1234.9)
    expect(lerPreco('8.5')).toBe(8.5)
    expect(lerPreco('R$ 7')).toBe(7)
    expect(lerPreco('abc')).toBe(0)
  })

  it('valida campos obrigatórios', () => {
    expect(validarProduto({ nome: '', preco: 1, unidade: 'kg' })).toMatch(/nome/)
    expect(validarProduto({ nome: 'x', preco: 0, unidade: 'kg' })).toMatch(/preço/)
    expect(validarProduto({ nome: 'x', preco: 2, unidade: 'kg' })).toBeNull()
    expect(validarAnuncio({ titulo: 'x', modo: 'vender' })).toMatch(/preço/)
    expect(validarAnuncio({ titulo: 'x', modo: 'trocar' })).toMatch(/troca/)
    expect(validarAnuncio({ titulo: 'x', modo: 'doar' })).toBeNull()
  })

  it('produto publicado entra no catálogo, na busca e cria a banca', () => {
    const { produto } = publicarProduto({ nome: 'Ovos de codorna', preco: 9, unidade: 'dúzia', categoria: 'ovos-laticinios', descricao: '', foto: '' })
    const c = montarCatalogo(PERFIL_PADRAO, ler('meus-produtos', []), [])
    expect(c.vendedores.some((v) => v.id === MINHA_BANCA_ID)).toBe(true)
    expect(buscar(c, 'codorna').map((r) => r.tipo === 'produto' && r.produto.id)).toContain(produto.id)
  })

  it('anúncio publicado aparece primeiro no Feirão', () => {
    const { anuncio } = publicarAnuncio({ titulo: 'Geladeira', modo: 'doar', descricao: '', estado: 'Usado', foto: '' }, { ...PERFIL_PADRAO, nome: 'Bia' })
    const c = montarCatalogo(PERFIL_PADRAO, [], ler('meus-anuncios', []))
    expect(c.anuncios[0].id).toBe(anuncio.id)
    expect(c.anuncios[0]).toMatchObject({ autor: 'Bia', meu: true })
    expect(c.anuncios[0].preco).toBeUndefined()
  })

  it('se a foto não couber no localStorage, publica sem ela em vez de quebrar', () => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = function (k: string, v: string) {
      if (v.length > 2000) throw new DOMException('cheio', 'QuotaExceededError')
      return original.call(this, k, v)
    }
    try {
      const foto = 'data:image/jpeg;base64,' + 'A'.repeat(5000)
      const r = publicarProduto({ nome: 'Mel', preco: 10, unidade: 'pote', categoria: 'mel-doces', descricao: '', foto })
      expect(r.semFoto).toBe(true)
      expect(ler<{ foto: string }[]>('meus-produtos', [])[0].foto).not.toContain('base64')
    } finally {
      Storage.prototype.setItem = original
    }
  })
})

describe('utilitários', () => {
  it('formata moeda e tempo', () => {
    expect(moeda(13)).toBe('R$ 13,00')
    expect(moeda(1234.5)).toBe('R$ 1.234,50')
    const agora = Date.now()
    expect(tempoRelativo(new Date(agora - 5 * 60000).toISOString(), agora)).toBe('há 5 min')
    expect(tempoRelativo(new Date(agora - 3 * 3600000).toISOString(), agora)).toBe('há 3 h')
    expect(tempoRelativo(new Date(agora - 30 * 3600000).toISOString(), agora)).toBe('ontem')
  })

  it('storage sobrevive a JSON corrompido e a localStorage bloqueado', () => {
    window.localStorage.setItem('conecta:x', '{quebrado')
    expect(ler('x', 42)).toBe(42)
    const original = Storage.prototype.getItem
    Storage.prototype.getItem = () => {
      throw new Error('bloqueado')
    }
    try {
      gravar('y', [1, 2])
      expect(ler('y', [])).toEqual([1, 2])
    } finally {
      Storage.prototype.getItem = original
    }
  })
})
