import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import {
  buscarTrechos,
  citacoesValidas,
  detectarServicos,
  montarContexto,
  responderLocal,
  validarSaida,
  type BaseLeis,
  type Dados,
} from '../lib/pergunte'
import { dadosChat, perguntar, reiniciarPausa } from '../lib/chat'
import leisJson from '../data/leis.json'

function abrir(rota: string) {
  return render(
    <MemoryRouter initialEntries={[rota]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>,
  )
}

/** Lei de mentira, só para testar a citação (não é lei real e não vai para docs/leis). */
const LEI_TESTE: BaseLeis = {
  documentos: [
    {
      id: 'teste-9999',
      arquivo: 'teste-9999.pdf',
      titulo: 'Lei nº 9.999/2021',
      ementa: 'Dispõe sobre a limpeza de terrenos baldios.',
      artigos: [
        { numero: '1º', texto: 'Os proprietários de terrenos baldios devem mantê-los limpos e cercados.' },
        { numero: '2º', texto: 'A fiscalização cabe à Prefeitura, que notifica o proprietário.' },
        { numero: '3º', texto: 'É proibido jogar entulho ou lixo em terreno baldio. O prazo para limpeza é de quinze dias após a notificação.' },
      ],
    },
  ],
}
const comLei: Dados = { ...dadosChat, leis: LEI_TESTE }

afterEach(() => {
  vi.unstubAllGlobals()
  reiniciarPausa()
})

describe('Pergunte à Cidade: motor', () => {
  it('reconhece hospital, posto, prefeitura e emergências', () => {
    expect(detectarServicos('Onde fica o hospital?', dadosChat.servicos)).toEqual(['hospital-sao-sebastiao'])
    expect(detectarServicos('telefone do posto do Toyoki', dadosChat.servicos)).toEqual(['posto-toyoki'])
    expect(detectarServicos('Que horas abre a Prefeitura?', dadosChat.servicos)).toEqual(['prefeitura'])
    expect(detectarServicos('preciso de uma ambulância', dadosChat.servicos)).toEqual(['samu-192'])
  })

  it('responde serviço com o cadastro e nunca inventa horário ou endereço', () => {
    const h = responderLocal('Qual o horário da prefeitura?', dadosChat)
    expect(h.servicos).toEqual(['prefeitura'])
    expect(h.texto).toMatch(/horário ainda está a confirmar/)
    expect(h.texto).toMatch(/\(43\) 3528-1157 \(a confirmar\)/)
    const p = responderLocal('Onde fica o posto do Toyoki?', dadosChat)
    expect(p.texto).toMatch(/endereço a confirmar/)
    for (const r of [h, p]) expect(r.texto).not.toMatch(/\d{1,2} ?h|\d{1,2}:\d{2}/)
  })

  it('a base de leis do repositório bate com a pasta docs/leis (vazia = não cita lei)', () => {
    expect(Array.isArray((leisJson as BaseLeis).documentos)).toBe(true)
    if ((leisJson as BaseLeis).documentos.length) return
    const r = responderLocal('Tem lei que proíbe jogar entulho em terreno?', dadosChat)
    expect(r.texto).not.toMatch(/Lei n/)
    expect(r.texto).toMatch(/base de leis deste protótipo ainda está vazia/)
    expect(r.fontes.some((f) => f.tipo === 'lei')).toBe(false)
    expect(responderLocal('Quais leis você conhece?', dadosChat).texto).toMatch(/base de leis ainda está vazia/)
  })

  it('com lei carregada, acha o artigo e cita "Lei nº X, art. Y"', () => {
    expect(buscarTrechos('posso jogar entulho no terreno baldio?', LEI_TESTE)[0]).toMatchObject({ artigo: '3º' })
    const r = responderLocal('Posso jogar entulho no terreno baldio?', comLei)
    expect(r.texto).toMatch(/Lei nº 9\.999\/2021, art\. 3º/)
    expect(r.fontes[0]).toMatchObject({ tipo: 'lei', rotulo: 'Lei nº 9.999/2021, art. 3º' })
    expect(responderLocal('Quais leis você conhece?', comLei).texto).toMatch(/Lei nº 9\.999\/2021/)
  })

  it('pergunta sem resposta: admite e manda para a Prefeitura', () => {
    const r = responderLocal('Quando é a festa do peão?', dadosChat)
    expect(r.texto).toMatch(/não vou inventar/)
    expect(r.servicos).toContain('prefeitura')
  })

  it('recusa citação de lei ou artigo que não estava no contexto', () => {
    const trechos = buscarTrechos('entulho terreno baldio', LEI_TESTE)
    expect(citacoesValidas('Segundo a Lei nº 9.999/2021, art. 3º, é proibido.', trechos)).toBe(true)
    expect(citacoesValidas('Segundo a Lei nº 1.234/2019, é proibido.', trechos)).toBe(false)
    expect(citacoesValidas('Segundo a Lei nº 9.999/2021, art. 7º, é proibido.', trechos)).toBe(false)
    expect(citacoesValidas('A Lei Orgânica garante isso.', trechos)).toBe(false)
    expect(citacoesValidas('Ligue 190 ou 192.', [])).toBe(true)
  })

  it('valida a saída do modelo contra o contexto', () => {
    const ctx = montarContexto('entulho em terreno baldio', comLei)
    const id = ctx.trechos[0].id
    const ok = validarSaida(JSON.stringify({ resposta: 'Não pode (Lei nº 9.999/2021, art. 3º).', fontes: [id, 'inventado#1'], servicos: ['prefeitura', 'nao-existe'] }), ctx)
    expect(ok).toMatchObject({ ok: true, servicos: ['prefeitura'], fontes: [{ rotulo: expect.stringMatching(/Lei nº 9\.999\/2021, art\./) }] })
    expect(ok!.fontes).toHaveLength(1)
    expect(validarSaida('{"resposta":"Lei nº 4.321, art. 2º","fontes":[],"servicos":[]}', ctx)).toBeNull()
    expect(validarSaida('não é json', ctx)).toBeNull()
  })
})

describe('Pergunte à Cidade: assistente on-line e fallback', () => {
  it('sem internet responde na hora com a resposta pronta, sem chamar o servidor', async () => {
    const f = vi.fn()
    vi.stubGlobal('fetch', f)
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValueOnce(false)
    const r = await perguntar('Onde fica o hospital?', [])
    expect(f).not.toHaveBeenCalled()
    expect(r).toMatchObject({ origem: 'pronta', servicos: ['hospital-sao-sebastiao'] })
  })

  it('com o assistente on-line, usa o texto dele e mantém o cartão do cadastro', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ ok: true, texto: 'O hospital fica na Rua Paraná, 26.', fontes: [], servicos: [] })))
    vi.stubGlobal('fetch', f)
    const r = await perguntar('Onde fica o hospital?', [])
    expect(f).toHaveBeenCalledWith('/api/chat', expect.objectContaining({ method: 'POST' }))
    expect(r).toMatchObject({ origem: 'assistente', texto: 'O hospital fica na Rua Paraná, 26.', servicos: ['hospital-sao-sebastiao'] })
    expect(r.fontes.map((f) => f.rotulo)).toContain(dadosChat.servicos[0].fonte)
  })

  it('sem chave no servidor: resposta pronta e não insiste a cada pergunta', async () => {
    const f = vi.fn(async () => new Response(JSON.stringify({ ok: false, motivo: 'sem-chave' })))
    vi.stubGlobal('fetch', f)
    expect((await perguntar('Onde fica o hospital?', [])).origem).toBe('pronta')
    expect((await perguntar('E o posto?', [])).origem).toBe('pronta')
    expect(f).toHaveBeenCalledTimes(1)
  })

  it('erro de rede também cai para a resposta pronta', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))))
    const r = await perguntar('Quais os números de emergência?', [])
    expect(r).toMatchObject({ origem: 'pronta', servicos: ['pm-190', 'samu-192', 'bombeiros-193'] })
  })
})

describe('Pergunte à Cidade: tela', () => {
  it('sugestão do hospital responde com o cartão (Ligar e Ver no mapa)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: false, motivo: 'sem-chave' }))))
    const u = userEvent.setup()
    abrir('/pergunte')
    await u.click(screen.getByRole('button', { name: 'Onde fica o hospital?' }))
    const ligar = await screen.findByRole('link', { name: /Ligar para Hospital São Sebastião/ }, { timeout: 3000 })
    expect(ligar).toHaveAttribute('href', 'tel:4335281100')
    expect(screen.getByRole('link', { name: /Ver no mapa/ })).toHaveAttribute('href', '/mapa?foco=hospital-sao-sebastiao')
    expect(screen.getByText(/Resposta pronta/)).toBeInTheDocument()
    expect(screen.getByText('Fonte')).toBeInTheDocument()
  })

  it('pergunta digitada sobre o posto mostra o cartão com local a confirmar, e a conversa fica salva', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ ok: false, motivo: 'sem-chave' }))))
    const u = userEvent.setup()
    const { unmount } = abrir('/pergunte')
    await u.type(screen.getByRole('textbox', { name: 'Sua pergunta' }), 'telefone do posto de saúde{Enter}')
    const card = (await screen.findByRole('heading', { name: 'Posto de saúde do Toyoki' }, { timeout: 3000 })).closest('article')!
    expect(within(card).getByText('Local a confirmar')).toBeInTheDocument()
    expect(within(card).getByText('Endereço a confirmar')).toBeInTheDocument()
    unmount()
    abrir('/pergunte')
    expect(screen.getByText('telefone do posto de saúde')).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: /Nova conversa/ }))
    expect(screen.getByText('Experimente')).toBeInTheDocument()
  })

  it('/qr mostra os dois QR codes e avisa quando o link é local', async () => {
    abrir('/qr')
    expect(screen.getByRole('heading', { name: 'Conecta Brazense' })).toBeInTheDocument()
    const qrs = screen.getAllByTestId('qr')
    expect(qrs).toHaveLength(2)
    await vi.waitFor(() => expect(qrs[0].querySelector('svg')).not.toBeNull())
    expect(screen.getByText(/só abre neste computador/)).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).toBeNull()
  })

  it('/qr com ?url= usa o link público', () => {
    abrir('/qr?url=https://conecta-brazense.vercel.app/')
    expect(screen.getByText('https://conecta-brazense.vercel.app/zelador/novo')).toBeInTheDocument()
    expect(screen.queryByText(/só abre neste computador/)).toBeNull()
  })
})
