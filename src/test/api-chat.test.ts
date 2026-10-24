// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const criar = vi.fn()

vi.mock('@anthropic-ai/sdk', () => {
  class APIError extends Error {
    status = 500
  }
  class AuthenticationError extends APIError {}
  class RateLimitError extends APIError {}
  class Anthropic {
    static APIError = APIError
    static AuthenticationError = AuthenticationError
    static RateLimitError = RateLimitError
    opcoes: unknown
    messages = { create: criar }
    constructor(opcoes: unknown) {
      this.opcoes = opcoes
    }
  }
  return { default: Anthropic }
})

const { POST } = await import('../../api/chat')

const pedir = (corpo: unknown) => POST(new Request('http://x/api/chat', { method: 'POST', body: JSON.stringify(corpo) }))
const respostaModelo = (json: unknown, stop_reason = 'end_turn') => ({ stop_reason, content: [{ type: 'text', text: JSON.stringify(json) }] })

beforeEach(() => {
  criar.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('/api/chat', () => {
  it('sem ANTHROPIC_API_KEY responde sem-chave (o app usa a resposta pronta)', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '')
    expect(await (await pedir({ pergunta: 'Onde fica o hospital?' })).json()).toEqual({ ok: false, motivo: 'sem-chave' })
    expect(criar).not.toHaveBeenCalled()
  })

  it('recusa pedido vazio ou grande demais', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-teste')
    expect((await pedir({})).status).toBe(400)
    expect((await pedir({ pergunta: 'x'.repeat(301) })).status).toBe(400)
  })

  it('chama o claude-haiku-5-5 com o cadastro no contexto e devolve a resposta validada', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-teste')
    criar.mockResolvedValue(respostaModelo({ resposta: 'Fica na Rua Paraná, 26, Centro.', fontes: [], servicos: ['hospital-sao-sebastiao', 'xyz'] }))
    const r = await (await pedir({ pergunta: 'Onde fica o hospital?', historico: [{ papel: 'assistente', texto: 'Oi' }] })).json()
    expect(r).toEqual({ ok: true, texto: 'Fica na Rua Paraná, 26, Centro.', fontes: [], servicos: ['hospital-sao-sebastiao'] })
    const args = criar.mock.calls[0][0]
    expect(args.model).toBe('claude-haiku-5-5')
    expect(args.output_config.format.type).toBe('json_schema')
    expect(args.messages[0].role).toBe('user')
    expect(args.messages.at(-1).content).toMatch(/Hospital São Sebastião/)
    expect(args.messages.at(-1).content).toMatch(/não cite lei/)
    expect(args.system).toMatch(/Nunca invente lei/)
  })

  it('resposta que cita lei fora da base é descartada', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-teste')
    criar.mockResolvedValue(respostaModelo({ resposta: 'Pela Lei nº 1.234/2019, art. 5º, é proibido.', fontes: [], servicos: [] }))
    expect(await (await pedir({ pergunta: 'Pode jogar lixo no terreno?' })).json()).toEqual({ ok: false, motivo: 'citacao-invalida' })
  })

  it('recusa, corte por tamanho ou erro da API viram ok:false, sem derrubar nada', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', 'sk-teste')
    criar.mockResolvedValueOnce(respostaModelo({}, 'refusal'))
    expect((await (await pedir({ pergunta: 'oi' })).json()).ok).toBe(false)
    criar.mockRejectedValueOnce(new Error('rede'))
    expect(await (await pedir({ pergunta: 'oi' })).json()).toEqual({ ok: false, motivo: 'erro' })
  })
})
