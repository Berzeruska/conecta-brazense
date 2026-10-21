import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { produtores, lojas, produtosBase, anunciosDeExemplo } from '../lib/catalogo'

function abrir(rota: string) {
  return render(
    <MemoryRouter initialEntries={[rota]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>,
  )
}

describe('todas as telas abrem sem quebrar', () => {
  const rotas = [
    '/',
    '/buscar',
    '/buscar?q=ovos',
    '/buscar?origem=produtor&categoria=hortifruti&precoMax=10&ordem=menor-preco',
    '/produtores',
    '/lojas',
    '/feirao',
    '/feirao?modo=doar',
    '/carrinho',
    '/perfil',
    '/vendedor',
    '/vendedor?aba=anuncio',
    '/zelador',
    '/pergunte',
    ...produtores.map((v) => `/produtor/${v.id}`),
    ...lojas.map((v) => `/loja/${v.id}`),
    ...produtosBase.map((p) => `/produto/${p.id}`),
    ...anunciosDeExemplo().map((a) => `/feirao/${a.id}`),
  ]
  it.each(rotas)('%s', (rota) => {
    const { container, unmount } = abrir(rota)
    expect(container.textContent).not.toMatch(/Não achamos esta página/)
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument()
    unmount()
  })

  it('rota inexistente mostra página amigável', () => {
    abrir('/nao-existe')
    expect(screen.getByText('Não achamos esta página')).toBeInTheDocument()
  })

  it('navegação inferior tem as 5 abas na ordem do README', () => {
    abrir('/')
    const nav = screen.getByRole('navigation', { name: 'Navegação principal' })
    expect(within(nav).getAllByRole('link').map((l) => l.textContent)).toEqual(['Início', 'Feirão', 'Zelador', 'Pergunte', 'Perfil'])
  })

  it('início mostra o essencial e o aviso discreto de protótipo', () => {
    abrir('/')
    expect(screen.getByText('Produtor do dia')).toBeInTheDocument()
    expect(screen.getByText(/R\$ que ficaram na cidade/)).toBeInTheDocument()
    expect(screen.getByText('Compare antes de comprar')).toBeInTheDocument()
    expect(screen.getByText(/Protótipo navegável/)).toBeInTheDocument()
  })
})

describe('roteiro da demo', () => {
  it('busca "ovos", compara, reserva do produtor e confirma', async () => {
    const user = userEvent.setup()
    abrir('/buscar')
    await user.type(screen.getByRole('searchbox', { name: 'O que você procura?' }), 'ovos')
    expect(await screen.findByText(/Comparando: ovos caipiras/)).toBeInTheDocument()
    expect(screen.getByText(/mais barato/)).toBeInTheDocument()

    // abre o produto do produtor pela comparação
    await user.click(screen.getAllByRole('link', { name: /Produtor R\$ 13,00/ })[0])
    expect(await screen.findByRole('heading', { name: 'Ovos caipiras' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Aumentar' }))
    await user.click(screen.getByRole('button', { name: /Reservar · R\$ 26,00/ }))

    expect(await screen.findByRole('heading', { name: 'Minha reserva' })).toBeInTheDocument()
    expect(screen.getByText('Sítio Três Ipês')).toBeInTheDocument()

    // sem nome: avisa e não confirma
    await user.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/nome/)

    await user.type(screen.getByRole('textbox', { name: 'Seu nome' }), 'Jurado')
    await user.click(screen.getByRole('radio', { name: /Entrega local/ }))
    await user.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/endereço/)
    await user.type(screen.getByRole('textbox', { name: 'Endereço para entrega' }), 'Rua das Flores, 10')
    await user.click(screen.getByRole('button', { name: 'Confirmar reserva' }))

    expect(await screen.findByText('Reserva feita!')).toBeInTheDocument()
    expect(screen.getByText(/[A-Z]{2}-\d{4}/)).toBeInTheDocument()
    expect(screen.getByText(/R\$ 26,00 ficaram na cidade/)).toBeInTheDocument()

    // aparece no perfil e a cesta esvaziou
    await user.click(screen.getByRole('link', { name: 'Minhas reservas' }))
    expect(await screen.findByRole('heading', { name: 'Perfil' })).toBeInTheDocument()
    expect(screen.getByText(/2× Ovos caipiras/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Minha reserva' })).toBeInTheDocument()
  })

  it('reserva com itens de dois vendedores gera duas reservas', async () => {
    const user = userEvent.setup()
    abrir('/produto/mel-500')
    await user.click(await screen.findByRole('button', { name: 'Adicionar e continuar comprando' }))
    expect(screen.getByRole('link', { name: 'Minha reserva, 1 itens' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Voltar' }))
    // sem histórico, volta ao início; lá adiciona uma oferta de loja pelo botão +
    await user.click(await screen.findByRole('button', { name: 'Adicionar Calça jeans à reserva' }))
    expect(screen.getByRole('link', { name: 'Minha reserva, 2 itens' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Minha reserva, 2 itens' }))
    expect(await screen.findByText('Apiário Serra Azul')).toBeInTheDocument()
    expect(screen.getByText('Ateliê Linha Fina')).toBeInTheDocument()
    // a loja de roupas não entrega: opção desabilitada
    const entregas = screen.getAllByRole('radio', { name: /Entrega local/ })
    expect(entregas[1]).toBeDisabled()
    await user.type(screen.getByRole('textbox', { name: 'Seu nome' }), 'Ana')
    await user.click(screen.getByRole('button', { name: 'Confirmar reserva' }))
    expect(await screen.findByText('Reserva feita!')).toBeInTheDocument()
    expect(screen.getAllByText(/^[A-Z]{2}-\d{4}$/)).toHaveLength(2)
    expect(screen.getByText('Total geral')).toBeInTheDocument()
  })

  it('publica um anúncio de doação no Feirão pelo painel', async () => {
    const user = userEvent.setup()
    abrir('/vendedor?aba=anuncio')
    await user.click(screen.getByRole('radio', { name: 'Doar' }))
    await user.click(screen.getByRole('button', { name: /Publicar no Feirão/ }))
    expect(screen.getByRole('alert')).toHaveTextContent(/título/)
    await user.type(screen.getByRole('textbox', { name: 'Título' }), 'Berço de madeira')
    await user.click(screen.getByRole('button', { name: /Publicar no Feirão/ }))
    expect(await screen.findByRole('heading', { name: 'Berço de madeira' })).toBeInTheDocument()
    expect(screen.getAllByText('Grátis')[0]).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Remover meu anúncio/ })).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Feirão' }))
    expect(await screen.findByText('Classificados entre vizinhos')).toBeInTheDocument()
    expect(screen.getByText('Berço de madeira')).toBeInTheDocument()
    expect(screen.getByText('Seu anúncio')).toBeInTheDocument()
  })

  it('publica um produto e ele aparece na busca e na banca', async () => {
    const user = userEvent.setup()
    abrir('/vendedor')
    await user.type(screen.getByRole('textbox', { name: 'O que você vende?' }), 'Ovos de codorna')
    await user.type(screen.getByRole('textbox', { name: 'Preço (R$)' }), '9,50')
    await user.click(screen.getByRole('button', { name: /Publicar na minha banca/ }))
    expect(await screen.findByRole('heading', { name: 'Ovos de codorna' })).toBeInTheDocument()
    expect(screen.getByText('R$ 9,50')).toBeInTheDocument()
    expect(screen.getByText('Minha Banca')).toBeInTheDocument()
  })
})
