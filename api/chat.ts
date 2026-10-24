// Função serverless da Vercel: POST /api/chat → { pergunta, historico? }.
// A ANTHROPIC_API_KEY fica só aqui no servidor (sem prefixo VITE_, nunca vai para o navegador).
// Sem chave, com erro ou com citação fora da base, responde { ok: false } e o app usa a resposta pronta.
import Anthropic from '@anthropic-ai/sdk'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  ESQUEMA_RESPOSTA,
  MAX_PERGUNTA,
  montarContexto,
  promptDoSistema,
  textoDoContexto,
  validarSaida,
  type Dados,
  type RetornoApi,
  type Turno,
} from '../src/lib/pergunte.js'

const MODELO = 'claude-haiku-5-5'

const lerJson = (arquivo: string) => JSON.parse(readFileSync(join(process.cwd(), arquivo), 'utf8'))
let dados: Dados | undefined
let cidade: { cidade: string; appName: string } | undefined

function carregar() {
  dados ??= { servicos: lerJson('src/data/servicos.json'), faq: lerJson('src/data/faq.json'), leis: lerJson('src/data/leis.json') }
  cidade ??= lerJson('src/config/city.json')
  return { dados: dados!, cidade: cidade! }
}

const json = (corpo: RetornoApi, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } })

function lerPedido(corpo: unknown): { pergunta: string; historico: Turno[] } | null {
  if (!corpo || typeof corpo !== 'object') return null
  const { pergunta, historico } = corpo as { pergunta?: unknown; historico?: unknown }
  if (typeof pergunta !== 'string' || !pergunta.trim() || pergunta.length > MAX_PERGUNTA) return null
  const turnos = (Array.isArray(historico) ? historico : [])
    .filter((t): t is Turno => !!t && (t.papel === 'usuario' || t.papel === 'assistente') && typeof t.texto === 'string')
    .slice(-4)
    .map((t) => ({ papel: t.papel, texto: t.texto.slice(0, 600) }))
  return { pergunta: pergunta.trim(), historico: turnos }
}

export async function POST(req: Request): Promise<Response> {
  const pedido = lerPedido(await req.json().catch(() => null))
  if (!pedido) return json({ ok: false, motivo: 'pedido-invalido' }, 400)
  if (!process.env.ANTHROPIC_API_KEY) return json({ ok: false, motivo: 'sem-chave' })

  const { dados, cidade: c } = carregar()
  const ctx = montarContexto(pedido.pergunta, dados, pedido.historico)
  const messages: Anthropic.MessageParam[] = [
    ...pedido.historico.map((t): Anthropic.MessageParam => ({ role: t.papel === 'usuario' ? 'user' : 'assistant', content: t.texto })),
    { role: 'user', content: `CONTEXTO:\n${textoDoContexto(ctx)}\n\nPERGUNTA DO MORADOR:\n${pedido.pergunta}` },
  ]
  // A API exige que a conversa comece pelo usuário.
  while (messages[0]?.role === 'assistant') messages.shift()

  try {
    const cliente = new Anthropic({ maxRetries: 0, timeout: 12_000 })
    const r = await cliente.messages.create({
      model: MODELO,
      max_tokens: 2000,
      system: promptDoSistema(c.cidade, c.appName),
      messages,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: ESQUEMA_RESPOSTA } },
    })
    if (r.stop_reason !== 'end_turn') return json({ ok: false, motivo: 'erro' })
    const texto = r.content.find((b) => b.type === 'text')?.text ?? ''
    const valida = validarSaida(texto, ctx)
    return json(valida ?? { ok: false, motivo: 'citacao-invalida' })
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) console.error('chat: ANTHROPIC_API_KEY inválida')
    else if (e instanceof Anthropic.RateLimitError) console.error('chat: limite de uso da API atingido')
    else if (e instanceof Anthropic.APIError) console.error(`chat: erro da API ${e.status}`)
    else console.error('chat: falha ao chamar a API', e)
    return json({ ok: false, motivo: 'erro' })
  }
}
