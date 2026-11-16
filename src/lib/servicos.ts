import servicosJson from '../data/servicos.json'
import { servicos as fotosServicos, cidade as fotosCidade } from 'virtual:fotos-locais'
import type { Servico } from '../data/types'

export const servicos = servicosJson as Servico[]
export const servicosDaCidade = servicos.filter((s) => s.tipo !== 'emergencia')
/** Emergência sempre tem telefone (190, 192, 193). */
export const emergencias = servicos.filter((s): s is Servico & { telefone: string } => s.tipo === 'emergencia' && s.telefone !== null)

export const acharServico = (id: string) => servicos.find((s) => s.id === id)

/** A foto só aparece se o arquivo já foi colocado em public/img/servicos. */
export const fotoDisponivel = (s: Servico): string | null => (s.foto && fotosServicos.includes(s.foto) ? s.foto : null)

/** Fotos reais da cidade para a capa do Início (public/img/cidade). */
export const fotosDaCidade: string[] = fotosCidade

/** "(43) 3528-1100" → "tel:4335281100" */
export const linkTelefone = (telefone: string) => `tel:${telefone.replace(/\D/g, '')}`
