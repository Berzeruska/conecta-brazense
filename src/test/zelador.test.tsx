import { describe, expect, it } from 'vitest'
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import type { Reporte } from '../data/types'
import {
  CATEGORIAS_REPORTE,
  aplicarEvento,
  criarReporte,
  daLinha,
  dentroDaCidade,
  diasSemResposta,
  idsVistosNoServidor,
  mesclarReportes,
  reconciliarComServidor,
  reportesDeExemplo,
  resumir,
  rotuloEspera,
  validarReporte,
} from '../lib/reportes'
import { chaveEhSecreta } from '../lib/supabase'
import { emergencias, linkTelefone, servicos, servicosDaCidade } from '../lib/servicos'
import { anunciosDeExemplo, lojas, PERFIL_PADRAO, produtores } from '../lib/catalogo'
import { gravar, ler } from '../lib/storage'
import city from '../config/city.json'

const DIA = 86400_000
const abrir = (rota: string) =>
  render(
    <MemoryRouter initialEntries={[rota]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </MemoryRouter>,
  )

describe('Zelador: dados e regras', () => {
  it('tem 10 reportes de exemplo, com fotos locais, dentro da cidade e dos três status', () => {
    const ex = reportesDeExemplo()
    expect(ex).toHaveLength(10)
    expect(new Set(ex.map((r) => r.id)).size).toBe(10)
    for (const r of ex) {
      expect(r.foto, r.id).toMatch(/^\/img\/zelador\/.+\.jpg$/)
      expect(dentroDaCidade(r.lat, r.lng), r.id).toBe(true)
      expect(city.bairros, r.id).toContain(r.bairro)
    }
    expect(new Set(ex.map((r) => r.status))).toEqual(new Set(['aberto', 'andamento', 'resolvido']))
    expect(new Set(ex.map((r) => r.categoria))).toEqual(new Set(Object.keys(CATEGORIAS_REPORTE)))
  })

  it('conta dias sem resposta e escreve o rótulo certo para cada status', () => {
    const agora = Date.now()
    const base = { id: 'x', categoria: 'buraco', descricao: '', foto: '', lat: 0, lng: 0, bairro: 'Centro', autor: 'A' } as const
    const aberto: Reporte = { ...base, status: 'aberto', criadoEm: new Date(agora - 12.5 * DIA).toISOString() }
    expect(diasSemResposta(aberto, agora)).toBe(12)
    expect(rotuloEspera(aberto, agora)).toBe('12 dias sem resposta')
    expect(rotuloEspera({ ...aberto, criadoEm: new Date(agora - 1.2 * DIA).toISOString() }, agora)).toBe('1 dia sem resposta')
    expect(rotuloEspera({ ...aberto, criadoEm: new Date(agora - 3600_000).toISOString() }, agora)).toBe('Reportado hoje')

    const criado = agora - 10 * DIA
    const andamento: Reporte = { ...base, status: 'andamento', criadoEm: new Date(criado).toISOString(), respondidoEm: new Date(criado + 3.2 * DIA).toISOString() }
    expect(diasSemResposta(andamento, agora)).toBe(3)
    expect(rotuloEspera(andamento, agora)).toBe('Respondido em 3 dias')
    const resolvido: Reporte = { ...andamento, status: 'resolvido', resolvidoEm: new Date(criado + 5.5 * DIA).toISOString() }
    expect(rotuloEspera(resolvido, agora)).toBe('Resolvido em 5 dias')
  })

  it('resume os contadores e a maior espera', () => {
    const r = resumir(reportesDeExemplo())
    expect(r).toEqual({ aberto: 5, andamento: 3, resolvido: 2, maiorEspera: 23 })
  })

  it('mescla exemplos, locais e servidor sem duplicar, mais novo primeiro', () => {
    const ex = reportesDeExemplo()
    const meu: Reporte = { ...ex[0], id: 'r-meu', meu: true, pendente: true, criadoEm: new Date().toISOString() }
    const doServidor: Reporte = { ...meu, pendente: undefined, meu: undefined, status: 'andamento' }
    const outro: Reporte = { ...ex[1], id: 'r-outro', criadoEm: new Date(Date.now() - 1000).toISOString() }
    const lista = mesclarReportes(ex, [meu], [doServidor, outro])
    expect(lista).toHaveLength(12)
    expect(lista[0]).toMatchObject({ id: 'r-meu', status: 'andamento', meu: true })
    expect(lista[1].id).toBe('r-outro')
  })

  it('valida categoria e ponto dentro da cidade', () => {
    const n = { categoria: null, descricao: '', foto: '', lat: null, lng: null, bairro: 'Centro' }
    expect(validarReporte(n)).toMatch(/tipo do problema/)
    expect(validarReporte({ ...n, categoria: 'lixo' })).toMatch(/Toque no mapa/)
    expect(validarReporte({ ...n, categoria: 'lixo', lat: -23.55, lng: -46.63 })).toMatch(/precisa ficar/)
    expect(validarReporte({ ...n, categoria: 'lixo', lat: city.coordenadas.lat, lng: city.coordenadas.lng })).toBeNull()
  })

  it('sem Supabase, cria o reporte só no aparelho (não fica pendente) e usa a foto da categoria', () => {
    const { reporte } = criarReporte(
      { categoria: 'iluminacao', descricao: '  ', foto: '', lat: -23.87, lng: -49.8, bairro: 'Vila Garibaldi' },
      { ...PERFIL_PADRAO, nome: 'Jurado' },
    )
    expect(reporte).toMatchObject({ status: 'aberto', meu: true, pendente: false, autor: 'Jurado', bairro: 'Vila Garibaldi' })
    expect(reporte.foto).toBe(CATEGORIAS_REPORTE.iluminacao.foto)
    expect(reporte.descricao).toMatch(/Iluminação/)
    expect(ler<Reporte[]>('reportes-locais', [])[0].id).toBe(reporte.id)
  })

  it('converte a linha do banco para o formato do app', () => {
    const r = daLinha({
      id: 'r-1',
      categoria: 'lixo',
      descricao: 'd',
      foto: '/img/x.jpg',
      lat: -23.87,
      lng: -49.8,
      bairro: 'Centro',
      autor: 'A',
      status: 'resolvido',
      criado_em: '2026-10-01T10:00:00+00:00',
      respondido_em: '2026-10-02T10:00:00+00:00',
      resolvido_em: null,
    })
    expect(r).toMatchObject({ id: 'r-1', criadoEm: '2026-10-01T10:00:00.000Z', respondidoEm: '2026-10-02T10:00:00.000Z', resolvidoEm: undefined })
  })

  describe('reporte apagado no banco não volta', () => {
    const r = (id: string, extra: Partial<Reporte> = {}): Reporte => ({
      id,
      categoria: 'buraco',
      descricao: '',
      foto: '',
      lat: -23.87,
      lng: -49.8,
      bairro: 'Centro',
      autor: 'A',
      status: 'aberto',
      criadoEm: new Date(Date.now() - DIA).toISOString(),
      ...extra,
    })
    const ids = (chave: string) => ler<Reporte[]>(chave, []).map((x) => x.id)

    it('evento DELETE do realtime tira o reporte do cache e dos "meus"', () => {
      gravar('reportes-remotos', [r('r-fantasma'), r('r-fica')])
      gravar('reportes-locais', [r('r-fantasma', { meu: true, pendente: false })])
      aplicarEvento({ eventType: 'DELETE', new: {}, old: { id: 'r-fantasma' } })
      expect(ids('reportes-remotos')).toEqual(['r-fica'])
      expect(ids('reportes-locais')).toEqual([])
    })

    it('INSERT e UPDATE do realtime continuam entrando', () => {
      const linha = { ...r('r-novo'), criado_em: new Date().toISOString(), respondido_em: null, resolvido_em: null }
      aplicarEvento({ eventType: 'INSERT', new: linha, old: {} })
      aplicarEvento({ eventType: 'UPDATE', new: { ...linha, status: 'andamento' }, old: { id: 'r-novo' } })
      expect(ler<Reporte[]>('reportes-remotos', [])).toMatchObject([{ id: 'r-novo', status: 'andamento' }])
    })

    it('consulta ao servidor sem o reporte: ele sai do aparelho (o DELETE aconteceu com o app fechado)', () => {
      gravar('reportes-remotos', [r('r-fantasma'), r('r-fica')])
      gravar('reportes-locais', [r('r-fantasma', { meu: true, pendente: false })])
      reconciliarComServidor([r('r-fica')], idsVistosNoServidor())
      expect(ids('reportes-remotos')).toEqual(['r-fica'])
      expect(ids('reportes-locais')).toEqual([])
      expect(mesclarReportes([], ler('reportes-locais', []), ler('reportes-remotos', [])).map((x) => x.id)).toEqual(['r-fica'])
    })

    it('não apaga o que ainda não foi enviado, o que nunca foi ao servidor nem o que chegou durante a consulta', () => {
      gravar('reportes-remotos', [r('r-visto')])
      gravar('reportes-locais', [r('r-pendente', { meu: true, pendente: true }), r('r-so-local', { meu: true, pendente: false })])
      const antes = idsVistosNoServidor()
      // Chega pelo realtime enquanto a consulta (que ainda não o enxergava) está em andamento
      aplicarEvento({ eventType: 'INSERT', new: { ...r('r-chegou'), criado_em: new Date().toISOString(), respondido_em: null, resolvido_em: null }, old: {} })
      reconciliarComServidor([r('r-visto')], antes)
      expect(ids('reportes-remotos').sort()).toEqual(['r-chegou', 'r-visto'])
      expect(ids('reportes-locais')).toEqual(['r-pendente', 'r-so-local'])
    })

    it('com a consulta cheia (só os 50 mais novos), não conclui que um reporte mais antigo foi apagado', () => {
      const servidor = Array.from({ length: 50 }, (_, i) => r(`r-${i}`, { criadoEm: new Date(Date.now() - i * 1000).toISOString() }))
      const antigo = r('r-antigo', { criadoEm: new Date(Date.now() - 30 * DIA).toISOString(), meu: true, pendente: false })
      const recente = r('r-recente-apagado', { criadoEm: new Date(Date.now() - 500).toISOString(), meu: true, pendente: false })
      gravar('reportes-remotos', [antigo, recente])
      gravar('reportes-locais', [antigo, recente])
      reconciliarComServidor(servidor, idsVistosNoServidor())
      expect(ids('reportes-locais')).toEqual(['r-antigo'])
      expect(ids('reportes-remotos')).not.toContain('r-recente-apagado')
    })
  })

  it('recusa a chave secreta do Supabase no front', () => {
    const jwt = (role: string) => `x.${btoa(JSON.stringify({ role })).replace(/=+$/, '')}.y`
    expect(chaveEhSecreta(jwt('service_role'))).toBe(true)
    expect(chaveEhSecreta('sb_secret_abc')).toBe(true)
    expect(chaveEhSecreta(jwt('anon'))).toBe(false)
    expect(chaveEhSecreta('sb_publishable_abc')).toBe(false)
  })
})

describe('serviços públicos e mapa da cidade', () => {
  it('servicos.json tem os campos pedidos', () => {
    for (const s of servicos) {
      for (const campo of ['nome', 'tipo', 'endereco', 'numero', 'telefone', 'horario', 'coordenadas', 'foto', 'fonte']) expect(s, s.id).toHaveProperty(campo)
      if (s.coordenadas) expect(dentroDaCidade(s.coordenadas.lat, s.coordenadas.lng), s.id).toBe(true)
    }
    expect(emergencias.map((s) => s.telefone)).toEqual(['190', '192', '193'])
    expect(emergencias.every((s) => s.foto === null && s.endereco === null)).toBe(true)
    expect(servicosDaCidade.map((s) => s.foto)).toEqual(['/img/servicos/hospital.jpg', '/img/servicos/posto-toyoki.jpg', '/img/servicos/camara.jpg'])
    expect(servicos.some((s) => /prefeitura/i.test(s.id + s.nome + s.tipo))).toBe(false)
  })

  it('monta o link de telefone só com dígitos', () => {
    expect(linkTelefone('(43) 3528-1100')).toBe('tel:4335281100')
    expect(linkTelefone('192')).toBe('tel:192')
  })

  it('bairros de todo o app são os do city.json (nomes reais do mapa)', () => {
    const usados = [...produtores, ...lojas, ...anunciosDeExemplo(), ...reportesDeExemplo()].map((x) => x.bairro)
    for (const b of usados) expect(city.bairros).toContain(b)
  })

  it('horário não confirmado aparece como "Horário a confirmar", nunca inventado', () => {
    for (const s of servicosDaCidade) if (s.aConfirmar.includes('horario')) expect(s.horario, s.id).toBeNull()
    abrir('/')
    expect(screen.getAllByText('Horário a confirmar')).toHaveLength(3)
  })

  it('todo produtor e loja tem coordenada dentro do mapa', () => {
    for (const v of [...produtores, ...lojas]) {
      expect(v.coordenadas, v.id).toBeDefined()
      expect(dentroDaCidade(v.coordenadas!.lat, v.coordenadas!.lng), v.id).toBe(true)
    }
  })
})

describe('telas do Tiro 2', () => {
  it.each(['/zelador', '/zelador/novo', '/zelador/ex-buraco-primavera', '/zelador/nao-existe', '/mapa', '/mapa?foco=hospital-sao-sebastiao'])(
    '%s abre sem quebrar',
    (rota) => {
      const { container, unmount } = abrir(rota)
      expect(container.textContent).not.toMatch(/Não achamos esta página/)
      expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument()
      unmount()
    },
  )

  it('Zelador mostra contadores, mapa, lista e botão de reportar', () => {
    abrir('/zelador')
    const resumo = screen.getByRole('region', { name: 'Resumo' })
    expect(within(resumo).getByRole('button', { name: /5\s*Aberto/ })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Mapa dos problemas reportados' })).toBeInTheDocument()
    expect(screen.getByText('23 dias').closest('p')).toHaveTextContent('O problema aberto mais antigo está há 23 dias sem resposta.')
    expect(screen.getAllByRole('link', { name: /sem resposta|Respondido|Resolvido/ })).toHaveLength(10)
    expect(screen.getByRole('link', { name: /Reportar problema/ })).toHaveAttribute('href', '/zelador/novo')
  })

  it('filtrar por "Resolvido" deixa só os resolvidos na lista', async () => {
    abrir('/zelador')
    await userEvent.click(screen.getByRole('tab', { name: 'Resolvido' }))
    expect(screen.getAllByRole('link', { name: /Resolvido em/ })).toHaveLength(2)
    expect(screen.queryByRole('link', { name: /sem resposta/ })).not.toBeInTheDocument()
  })

  it('reportar sem marcar o local mostra o que falta', async () => {
    abrir('/zelador/novo')
    await userEvent.click(screen.getByRole('button', { name: /Enviar reporte/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('Escolha o tipo do problema.')
    await userEvent.click(screen.getByRole('radio', { name: /Buraco/ }))
    await userEvent.click(screen.getByRole('button', { name: /Enviar reporte/ }))
    expect(screen.getByRole('alert')).toHaveTextContent(/Toque no mapa/)
  })

  it('reporte criado em outra aba aparece na lista sem recarregar', () => {
    abrir('/zelador')
    expect(screen.getAllByRole('link', { name: /sem resposta|Respondido|Resolvido/ })).toHaveLength(10)
    act(() => {
      criarReporte({ categoria: 'lixo', descricao: 'Teste ao vivo', foto: '', lat: -23.87, lng: -49.8, bairro: 'Centro' }, PERFIL_PADRAO)
    })
    expect(screen.getByText('Teste ao vivo')).toBeInTheDocument()
  })

  it('detalhe do reporte aberto mostra o contador grande', () => {
    abrir('/zelador/ex-poste-vila-nova')
    expect(screen.getByRole('heading', { name: 'Iluminação · Vila Garibaldi' })).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('dias sem resposta')).toBeInTheDocument()
  })

  it('telão abre em tela cheia, sem navegação inferior, e anuncia o ponto novo', () => {
    abrir('/telao')
    expect(screen.queryByRole('navigation', { name: 'Navegação principal' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: `Problemas de ${city.cidade}` })).toBeInTheDocument()
    expect(screen.getByText('Últimos reportes')).toBeInTheDocument()
    act(() => {
      gravar('reportes-locais', [
        {
          id: 'r-telao',
          categoria: 'buraco',
          descricao: 'Chegou agora',
          foto: CATEGORIAS_REPORTE.buraco.foto,
          lat: -23.87,
          lng: -49.8,
          bairro: 'Vila Verde',
          autor: 'Jurado',
          status: 'aberto',
          criadoEm: new Date().toISOString(),
        },
      ])
    })
    expect(screen.getByRole('status')).toHaveTextContent(/Novo reporte agora.*Buraco · Vila Verde/)
    expect(screen.getByText('Novo')).toBeInTheDocument()
  })

  it('início mostra o mapa da cidade, os serviços e os números de emergência', () => {
    abrir('/')
    expect(screen.getByRole('link', { name: 'Abrir o mapa da cidade' })).toHaveAttribute('href', '/mapa')
    expect(screen.getByRole('heading', { name: 'Hospital São Sebastião' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ligar para Hospital São Sebastião/ })).toHaveAttribute('href', 'tel:4335281100')
    expect(screen.getByRole('link', { name: /Ligar 192, SAMU/ })).toHaveAttribute('href', 'tel:192')
    // Fotos reais da equipe em public/img/servicos: os três cards mostram a foto, não o placeholder
    for (const s of servicosDaCidade) expect(screen.getByRole('img', { name: s.nome }), s.id).toHaveAttribute('src', s.foto)
    expect(screen.getByText('Foto da equipe, editada para preservar a privacidade de pacientes')).toBeInTheDocument()
    // Posto sem coordenada: não oferece "Ver no mapa"
    expect(screen.getAllByRole('link', { name: /Ver no mapa/ })).toHaveLength(1)
    expect(screen.getAllByText('Local a confirmar')).toHaveLength(2)
    // Prefeitura saiu; a Câmara entra só com o que foi informado (nº 78), sem telefone inventado
    expect(screen.queryByRole('heading', { name: /Prefeitura/ })).not.toBeInTheDocument()
    const camara = screen.getByRole('heading', { name: 'Câmara de Vereadores de Wenceslau Braz' }).closest('article')!
    expect(camara).toHaveTextContent('Nº 78 · rua a confirmar')
    expect(within(camara).getByText('Telefone a confirmar')).toBeInTheDocument()
    expect(within(camara).queryByRole('link', { name: /Ligar/ })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Unidade Básica de Saúde da Família do Toyoki' }).closest('article')).toHaveTextContent('Nº 210 · rua a confirmar')
    // Sem fotos em public/img/cidade, o topo fica como antes
    expect(screen.queryByTestId('capa-cidade')).not.toBeInTheDocument()
  })
})
