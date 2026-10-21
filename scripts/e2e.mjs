// Roteiro da demo num navegador de verdade, com tela de celular, online e em modo avião.
// Uso: npm run build && npm run preview (em outro terminal) && npm run e2e
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

  // Sem rolagem horizontal em nenhuma tela principal
  for (const rota of ['/', '/buscar?q=mel', '/feirao', '/carrinho', '/perfil', '/vendedor', '/produto/queijo-frescal', '/feirao/sofa-3-lugares']) {
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
  for (const rota of ['/', '/buscar?q=queijo', '/feirao', '/produtor/apiario-serra-azul', '/produto/morango', '/perfil', '/feirao/gatinhos-doacao']) {
    await page.goto(BASE + rota)
    await page.waitForLoadState('load')
    await page.waitForTimeout(400)
    // força o carregamento de imagens lazy
    await page.evaluate(() => document.querySelectorAll('img[loading=lazy]').forEach((i) => (i.loading = 'eager')))
    await page.waitForTimeout(400)
    const quebradas = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.src))
    verificar(quebradas.length === 0, `offline: ${rota} abre com todas as fotos (${quebradas.join(', ')})`)
  }
  await print('12-offline-inicio')
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
