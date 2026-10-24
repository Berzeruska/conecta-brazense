import servicosJson from '../data/servicos.json'
import faqJson from '../data/faq.json'
import leisJson from '../data/leis.json'
import type { Servico } from '../data/types'
import { gravar, useArmazenado } from './storage'
import { responderLocal, type BaseFaq, type BaseLeis, type Dados, type Resposta, type RetornoApi, type Turno } from './pergunte'

export const dadosChat: Dados = { servicos: servicosJson as Servico[], faq: faqJson as BaseFaq, leis: leisJson as BaseLeis }
export const sugestoes = dadosChat.faq.sugestoes

export interface Mensagem {
  id: string
  papel: 'usuario' | 'assistente'
  texto: string
  resposta?: Resposta
}

const CHAVE = 'chat-conversa'
export const useConversa = () => useArmazenado<Mensagem[]>(CHAVE, [])
export const limparConversa = () => gravar<Mensagem[]>(CHAVE, [])

/** Depois de "sem chave" ou erro, não insiste no servidor por um tempo: a resposta pronta sai na hora. */
let pausaAte = 0
const PAUSA = 60_000
const TEMPO_LIMITE = 9_000

/**
 * Pergunta ao assistente (/api/chat). Sem internet, sem chave, demora ou erro → resposta pronta.
 * Os cartões de serviço vêm sempre do cadastro local: hospital, posto e prefeitura aparecem com ou sem rede.
 */
export async function perguntar(pergunta: string, historico: Mensagem[]): Promise<Resposta> {
  const local = responderLocal(pergunta, dadosChat)
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return local
  if (Date.now() < pausaAte) return local
  try {
    const turnos: Turno[] = historico.slice(-4).map((m) => ({ papel: m.papel, texto: m.texto }))
    const r = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pergunta, historico: turnos }),
      signal: AbortSignal.timeout(TEMPO_LIMITE),
    })
    const dados = (await r.json()) as RetornoApi
    if (!dados.ok) {
      if (dados.motivo !== 'citacao-invalida') pausaAte = Date.now() + PAUSA
      return local
    }
    const servicos = [...new Set([...local.servicos.filter((id) => id !== 'prefeitura' || dados.servicos.includes(id)), ...dados.servicos])]
    const fontesServico = [...new Set(servicos.map((id) => dadosChat.servicos.find((s) => s.id === id)?.fonte).filter((f): f is string => !!f))].map(
      (rotulo) => ({ tipo: 'servico' as const, rotulo }),
    )
    return { texto: dados.texto, servicos, fontes: [...dados.fontes, ...fontesServico], link: local.link, origem: 'assistente' }
  } catch {
    pausaAte = Date.now() + PAUSA
    return local
  }
}

/** Só para os testes. */
export const reiniciarPausa = () => {
  pausaAte = 0
}
