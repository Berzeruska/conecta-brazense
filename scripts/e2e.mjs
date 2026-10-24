// Roteiro da demo num navegador de verdade, com tela de celular, online e em modo avião.
// Uso: npm run build:e2e && npm run preview (em outro terminal) && npm run e2e
// build:e2e desliga o Supabase: o roteiro nunca grava reporte de teste no banco real da demo.
import { chromium, devices } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.BASE_URL ?? 'http://localhost:4173'
const PRINTS = process.env.PRINTS ?? 'test-results/prints'
mkdirSync(PRINTS, { recursive: true })

const erros = []
let passos = 0
const ok = (msg) => console.log(`  ✓ ${msg}`, ++passos && '')
function verificar(cond, msg) {
  if (!cond) throw new Error(`FALHOU: ${msg}`)
  ok(msg)
}

const browser = await chromium.launch()
const ctx = await browser.newContext({ ...devices['Pixel 7'], locale: 'pt-BR' })
// Trava de segurança: se o build tiver o Supabase ligado, para antes de gravar qualquer coisa no banco real.
let tocouSupabase = false
await ctx.route(/supabase\.co/, (r) => {
  tocouSupabase = true
  return r.abort()
})
const page = await ctx.newPage()
page.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`))
page.on('console', (m) => m.type() === 'error' && erros.push(`console: ${m.text()}`))
page.on('requestfailed', (r) => !r.url().includes('/sw.js') && erros.push(`falhou: ${r.url()}`))

const print = (nome) => page.screenshot({ path: `${PRINTS}/${nome}.png`, fullPage: false })

async function imagensQuebradas() {
  return page.evaluate(() =>
    [...document.images].filter((i) => i.complete && i.getAttribute('loading') !== 'lazy' && i.naturalWidth === 0).map((i) => i.src),
  )
}

try {
  console.log('Online')
  await page.goto(BASE)
  await page.getByText('Produtor do dia').waitFor()
  await page.goto(`${BASE}/zelador`)
  await page.waitForTimeout(800)
  if (tocouSupabase) throw new Error('Este build está com o Supabase ligado (.env). Rode "npm run build:e2e" para testar sem tocar o banco real.')
  await page.goto(BASE)
  await page.getByText('Produtor do dia').waitFor()
  await page.waitForTimeout(1600)
  await print('01-inicio')
  await page.mouse.wheel(0, 900)
  await page.waitForTimeout(400)
  await print('02-inicio-rolado')
  verificar((await imagensQuebradas()).length === 0, 'início sem imagem quebrada')

  // Busca "ovos" e compara
  await page.getByRole('button', { name: /Busque ovos/ }).click()
  await page.getByRole('searchbox').fill('ovos')
  await page.getByText(/Comparando: ovos caipiras/).waitFor()
  await page.waitForTimeout(500)
  await print('03-busca-ovos')
  ok('busca "ovos" mostra comparação produtor x loja')

  // Reserva do produtor
  await page.getByRole('link', { name: /Produtor R\$ 13,00/ }).first().click()
  await page.getByRole('heading', { name: 'Ovos caipiras' }).waitFor()
  await page.waitForTimeout(500)
  await print('04-produto')
  await page.getByRole('button', { name: 'Aumentar' }).click()
  await page.getByRole('button', { name: /Reservar/ }).click()
  await page.getByRole('heading', { name: 'Minha reserva' }).waitFor()
  await page.getByRole('textbox', { name: 'Seu nome' }).fill('Jurado da Feira')
  await page.waitForTimeout(300)
  await print('05-carrinho')
  await page.getByRole('button', { name: 'Confirmar reserva' }).click()
  await page.getByText('Reserva feita!').waitFor()
  await page.waitForTimeout(900)
  await print('06-confirmacao')
  ok('reserva do produtor confirmada')

  // Publica anúncio no Feirão com foto do "celular"
  await page.getByRole('link', { name: 'Feirão', exact: true }).click()
  await page.getByText('Classificados entre vizinhos').waitFor()
  await page.waitForTimeout(500)
  await print('07-feirao')
  await page.getByRole('link', { name: 'Anunciar' }).click()
  await page.getByTestId('entrada-foto').setInputFiles('public/img/f-bicicleta.jpg')
  await page.getByAltText('Prévia da foto').waitFor()
  await page.getByRole('textbox', { name: 'Título' }).fill('Bicicleta do meu irmão')
  await page.getByRole('textbox', { name: 'Preço (R$)' }).fill('250,00')
  await print('08-painel-anuncio')
  await page.getByRole('button', { name: /Publicar no Feirão/ }).click()
  await page.getByRole('heading', { name: 'Bicicleta do meu irmão' }).waitFor()
  await page.waitForTimeout(500)
  await print('09-anuncio-publicado')
  verificar(await page.getByText('R$ 250,00').first().isVisible(), 'anúncio publicado com preço')
  const fotoOk = await page.evaluate(() => [...document.images].some((i) => i.src.startsWith('data:image/jpeg') && i.naturalWidth > 0))
  verificar(fotoOk, 'foto enviada foi comprimida e aparece no anúncio')

  // Perfil
  await page.getByRole('link', { name: 'Perfil', exact: true }).click()
  await page.getByText('Jurado da Feira').first().waitFor()
  await page.waitForTimeout(800)
  await print('10-perfil')
  ok('perfil lista a reserva')

  // Páginas de produtor e loja
  await page.goto(`${BASE}/produtor/horta-dona-cida`)
  await page.getByText('Da banca').waitFor()
  await page.waitForTimeout(600)
  await print('11-produtor')
  await page.goto(`${BASE}/loja/mercado-vale-verde`)
  await page.getByText('Vitrine').waitFor()
  ok('páginas de produtor e loja abrem')

  // Zelador: o "telão" fica aberto em outra aba; o celular reporta e o ponto aparece lá
  const telao = await ctx.newPage()
  telao.on('pageerror', (e) => erros.push(`telão pageerror: ${e.message}`))
  await telao.setViewportSize({ width: 1280, height: 720 })
  await telao.goto(`${BASE}/telao`)
  await telao.getByText('Últimos reportes').waitFor()

  await page.getByRole('link', { name: 'Zelador', exact: true }).click()
  await page.getByText('Todos (10)').waitFor()
  await page.waitForTimeout(900)
  await print('13-zelador')
  verificar((await page.locator('.mapa .leaflet-marker-icon').count()) === 10, 'mapa do Zelador com os 10 pinos de exemplo')
  const tilesOk = await page.evaluate(() => [...document.querySelectorAll('.leaflet-tile')].filter((i) => i.src.includes('/tiles/') && i.complete && i.naturalWidth > 0).length)
  verificar(tilesOk > 0, `tiles locais do mapa carregaram (${tilesOk})`)

  await page.getByRole('link', { name: /Reportar problema/ }).click()
  await page.getByRole('radio', { name: /Buraco/ }).click()
  await page.getByTestId('entrada-foto').setInputFiles('public/img/zelador/z-buraco-chuva.jpg')
  await page.getByAltText('Prévia da foto').waitFor()
  const mapa = page.getByRole('region', { name: 'Toque no mapa para marcar o local' })
  await mapa.scrollIntoViewIfNeeded()
  const caixa = await mapa.boundingBox()
  await page.mouse.click(caixa.x + caixa.width * 0.4, caixa.y + caixa.height * 0.6)
  await page.getByText('Local marcado').waitFor()
  await page.getByRole('combobox', { name: 'Bairro' }).selectOption('Vila Verde')
  await page.getByRole('textbox', { name: /Conte mais/ }).fill('Buraco novo na frente da escola')
  await print('14-novo-reporte')
  await page.getByRole('button', { name: /Enviar reporte/ }).click()
  await page.getByRole('heading', { name: 'Buraco · Vila Verde' }).waitFor()
  await page.waitForTimeout(600)
  await print('15-reporte-enviado')
  verificar((await page.getByText('dias sem resposta', { exact: true }).isVisible()) && (await page.getByText('0', { exact: true }).isVisible()), 'reporte criado com contador zerado')

  await telao.getByText('Novo reporte agora').waitFor({ timeout: 5000 })
  await telao.waitForTimeout(1500)
  await telao.screenshot({ path: `${PRINTS}/16-telao-ponto-novo.png` })
  verificar((await telao.locator('.pino-novo').count()) === 1, 'telão mostrou o ponto novo pulsando e o aviso')
  await telao.close()

  // Mapa da cidade e serviços
  await page.goto(`${BASE}/mapa?foco=hospital-sao-sebastiao`)
  await page.locator('.leaflet-popup').getByText('Hospital São Sebastião').waitFor()
  await print('17-mapa-hospital')
  ok('mapa abre no hospital com o balão aberto')

  // Pergunte à Cidade: assistente on-line (simulado aqui, sem gastar chave) e depois o servidor real sem chave
  await page.route('**/api/chat', (r) =>
    r.fulfill({ json: { ok: true, texto: 'O Hospital São Sebastião fica na Rua Paraná, 26, no Centro. O horário ainda está a confirmar.', fontes: [], servicos: ['hospital-sao-sebastiao'] } }),
  )
  await page.getByRole('link', { name: 'Pergunte', exact: true }).click()
  await page.getByText('Experimente').waitFor()
  await page.waitForTimeout(400)
  await print('18-pergunte')
  await page.getByRole('button', { name: 'Onde fica o hospital?' }).click()
  await page.getByText('Assistente on-line').waitFor()
  verificar(await page.getByRole('link', { name: /Ligar para Hospital São Sebastião/ }).isVisible(), 'chat on-line: resposta do assistente com o cartão do hospital')
  await page.unroute('**/api/chat')
  await page.getByRole('textbox', { name: 'Sua pergunta' }).fill('Qual o horário da prefeitura?')
  await page.keyboard.press('Enter')
  await page.getByRole('heading', { name: 'Prefeitura Municipal' }).waitFor()
  await page.waitForTimeout(700)
  await print('19-pergunte-prefeitura')
  verificar((await page.getByText('Resposta pronta · funciona sem internet').count()) === 1, 'chat sem chave no servidor: cai para a resposta pronta')
  verificar(await page.getByText(/horário ainda está a confirmar/).last().isVisible(), 'chat não inventa horário')
  await page.getByRole('heading', { name: 'Prefeitura Municipal' }).locator('xpath=ancestor::article').getByRole('link', { name: /Ver no mapa/ }).click()
  await page.locator('.leaflet-popup').getByText('Prefeitura Municipal').waitFor()
  await page.goBack()
  await page.getByText('Qual o horário da prefeitura?').first().waitFor()
  ok('"Ver no mapa" abre o mapa e a conversa continua ao voltar')

  await page.goto(`${BASE}/qr`)
  await page.locator('[data-testid=qr] svg').nth(1).waitFor()
  await print('20-qr')
  verificar((await page.locator('[data-testid=qr] svg').count()) === 2, 'página /qr com os dois QR codes')

  // Sem rolagem horizontal em nenhuma tela principal
  for (const rota of ['/', '/buscar?q=mel', '/feirao', '/carrinho', '/perfil', '/vendedor', '/produto/queijo-frescal', '/feirao/sofa-3-lugares', '/zelador', '/zelador/novo', '/zelador/ex-lixo-flores', '/mapa', '/pergunte', '/qr']) {
    await page.goto(BASE + rota)
    await page.waitForTimeout(300)
    const larg = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    verificar(larg <= 0, `sem rolagem horizontal em ${rota}`)
  }

  console.log('Modo avião')
  await page.goto(BASE)
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await page.waitForFunction(() => !!navigator.serviceWorker.controller)
  await ctx.setOffline(true)
  erros.length = 0
  for (const rota of ['/', '/buscar?q=queijo', '/feirao', '/produtor/apiario-serra-azul', '/produto/morango', '/perfil', '/feirao/gatinhos-doacao', '/zelador', '/zelador/ex-poste-vila-nova', '/mapa', '/pergunte', '/qr', '/telao']) {
    await page.goto(BASE + rota)
    await page.waitForLoadState('load')
    await page.waitForTimeout(400)
    // força o carregamento de imagens lazy
    await page.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach((i) => (i.loading = 'eager')))
    await page.waitForTimeout(400)
    const quebradas = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src))
    verificar(quebradas.length === 0, `offline: ${rota} abre com todas as fotos (${quebradas.join(', ')})`)
  }
  const tilesOffline = await page.evaluate(() => [...document.querySelectorAll('.leaflet-tile')].filter((i) => i.src.includes('/tiles/') && i.naturalWidth > 0).length)
  verificar(tilesOffline > 0, `offline: mapa do telão com tiles do cache (${tilesOffline})`)
  await print('12-offline-telao')

  // Reportar em modo avião também funciona (fica no aparelho)
  await page.goto(`${BASE}/zelador/novo`)
  await page.getByRole('radio', { name: /Lixo/ }).click()
  const mapa2 = page.getByRole('region', { name: 'Toque no mapa para marcar o local' })
  await mapa2.scrollIntoViewIfNeeded()
  const m2 = await mapa2.boundingBox()
  await page.mouse.click(m2.x + m2.width / 2, m2.y + m2.height / 2)
  await page.getByRole('button', { name: /Enviar reporte/ }).click()
  await page.getByRole('heading', { name: /^Lixo · / }).waitFor()
  ok('offline: reporte salvo no aparelho')

  // Pergunte à Cidade em modo avião: resposta pronta, com cartão e botão de ligar
  await page.goto(`${BASE}/pergunte`)
  await page.getByRole('button', { name: /Nova conversa/ }).click()
  await page.getByRole('button', { name: 'Qual o telefone do posto do Toyoki?' }).click()
  await page.getByRole('heading', { name: 'Posto de saúde do Toyoki' }).waitFor()
  await page.waitForTimeout(600)
  await print('21-offline-pergunte')
  verificar(await page.getByRole('link', { name: /Ligar para Posto de saúde do Toyoki/ }).isVisible(), 'offline: chat responde com o cartão do posto')
  verificar((await page.locator('[data-testid=qr] svg').count()) === 0, 'offline: (sanidade) fora do /qr')
  await page.goto(`${BASE}/qr`)
  await page.locator('[data-testid=qr] svg').nth(1).waitFor()
  ok('offline: /qr gera os QR codes sem internet')
  await ctx.setOffline(false)

  verificar(erros.length === 0, `nenhum erro no console ${erros.join(' | ')}`)
  console.log(`\n${passos} verificações OK. Prints em ${PRINTS}/`)
} catch (e) {
  console.error(e.message)
  console.error(erros.join('\n'))
  await print('erro').catch(() => {})
  process.exitCode = 1
} finally {
  await browser.close()
}
