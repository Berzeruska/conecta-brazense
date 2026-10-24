// Extrai o texto das leis em docs/leis (PDF ou .txt) para src/data/leis.json, separado por artigo.
// É a base que o Pergunte à Cidade usa para citar "Lei nº X, art. Y". Pasta vazia = base vazia: o chat não cita lei.
// Uso: npm run leis (roda sozinho antes do dev e do build). Opcional: node scripts/extrair-leis.mjs <pasta> <saida.json>
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, extname, join } from 'node:path'

const PASTA = process.argv[2] ?? 'docs/leis'
const SAIDA = process.argv[3] ?? 'src/data/leis.json'

const limpar = (s) =>
  s
    .replace(/­/g, '')
    .replace(/(\w)-\n(\w)/g, '$1$2') // palavra quebrada no fim da linha
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

async function textoDoPdf(arquivo) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const doc = await pdfjs.getDocument({ data: new Uint8Array(readFileSync(arquivo)), useSystemFonts: true, verbosity: 0 }).promise
  const paginas = []
  for (let i = 1; i <= doc.numPages; i++) {
    const conteudo = await (await doc.getPage(i)).getTextContent()
    paginas.push(conteudo.items.map((it) => ('str' in it ? it.str + (it.hasEOL ? '\n' : '') : '')).join(''))
  }
  await doc.cleanup?.()
  return paginas.join('\n')
}

/** "LEI Nº 1.234, DE 10 DE MAIO DE 2019" → "Lei nº 1.234/2019" */
function identificar(texto, arquivo) {
  const cabeca = texto.slice(0, 1500)
  if (/LEI\s+ORG[ÂA]NICA/i.test(cabeca)) return 'Lei Orgânica do Município'
  const m = cabeca.match(/\b(LEI(?:\s+COMPLEMENTAR)?)(?:\s+MUNICIPAL)?\s+N\s*[º°o.]*\s*([\d.]+)(?:\s*\/\s*(\d{2,4}))?/i)
  if (m) {
    const tipo = /COMPLEMENTAR/i.test(m[1]) ? 'Lei Complementar' : 'Lei'
    const ano = m[3] ?? cabeca.slice(m.index ?? 0, (m.index ?? 0) + 120).match(/\b(19|20)\d{2}\b/)?.[0]
    return `${tipo} nº ${m[2].replace(/\.$/, '')}${ano ? `/${ano}` : ''}`
  }
  return basename(arquivo, extname(arquivo)).replace(/[-_]+/g, ' ')
}

/** A ementa costuma vir logo depois do número da lei e antes de "A Câmara..." / "O Prefeito...". */
function ementa(texto) {
  const corpo = texto.slice(0, 2500).replace(/\s+/g, ' ')
  const m = corpo.match(/\b(?:19|20)\d{2}\.?\s+(.{20,400}?)(?=\s+(?:A\s+C[ÂA]MARA|O\s+PREFEITO|A\s+PREFEITA|Fa[çc]o saber|Art\.?\s*1))/i)
  return m ? m[1].trim() : ''
}

/** Corta o texto em artigos. Números só sobem: "art. 3º" citado dentro de outro artigo não abre artigo novo. */
function artigos(texto) {
  const re = /(?:^|\n|\s)Art(?:igo)?\.?\s*(\d+)\s*(?:[º°o]|\.)?(?:\s*-\s*([A-Z])\b)?/g
  const marcas = []
  let ultimo = 0
  for (const m of texto.matchAll(re)) {
    const n = Number(m[1])
    if (n <= ultimo || n > ultimo + 20) continue
    ultimo = n
    marcas.push({ n, letra: m[2], inicio: m.index ?? 0, fimRotulo: (m.index ?? 0) + m[0].length })
  }
  return marcas.map((mk, i) => ({
    numero: `${mk.n}${mk.n < 10 ? 'º' : ''}${mk.letra ? `-${mk.letra}` : ''}`,
    texto: limpar(texto.slice(mk.fimRotulo, marcas[i + 1]?.inicio ?? texto.length))
      .replace(/^[\s.–-]+/, '')
      .replace(/\n/g, ' '),
  }))
}

async function main() {
  const arquivos = existsSync(PASTA) ? readdirSync(PASTA).filter((f) => /\.(pdf|txt)$/i.test(f)).sort() : []
  const documentos = []
  const avisos = []
  for (const nome of arquivos) {
    const caminho = join(PASTA, nome)
    try {
      const bruto = /\.pdf$/i.test(nome) ? await textoDoPdf(caminho) : readFileSync(caminho, 'utf8')
      const texto = limpar(bruto)
      if (texto.replace(/\s/g, '').length < 80) {
        avisos.push(`${nome}: sem texto (PDF escaneado?). Rode um OCR, ex.: ocrmypdf "${nome}" saida.pdf`)
        continue
      }
      const arts = artigos(texto)
      if (!arts.length) avisos.push(`${nome}: nenhum "Art." encontrado; o texto entra inteiro como um trecho só`)
      const titulo = identificar(texto, nome)
      documentos.push({
        id: basename(nome, extname(nome)).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        arquivo: nome,
        titulo,
        ementa: ementa(texto),
        artigos: arts.length ? arts : [{ numero: '', texto: texto.replace(/\n/g, ' ') }],
      })
    } catch (e) {
      avisos.push(`${nome}: não consegui ler (${e.message})`)
    }
  }
  const novo = JSON.stringify({ documentos }, null, 2) + '\n'
  const atual = existsSync(SAIDA) ? readFileSync(SAIDA, 'utf8') : ''
  if (novo !== atual) writeFileSync(SAIDA, novo)
  const total = documentos.reduce((s, d) => s + d.artigos.length, 0)
  console.log(
    documentos.length
      ? `leis: ${documentos.length} documento(s), ${total} artigo(s) → ${SAIDA}\n` + documentos.map((d) => `  · ${d.titulo} (${d.arquivo}): ${d.artigos.length} art.`).join('\n')
      : `leis: nenhuma lei em ${PASTA}/ (o chat não vai citar lei)`,
  )
  for (const a of avisos) console.warn(`  ! ${a}`)
}

main().catch((e) => {
  // Nunca derruba o dev/build: fica valendo o leis.json que já existe.
  console.warn(`leis: extração falhou (${e.message}); mantendo ${SAIDA}`)
  if (!existsSync(SAIDA)) writeFileSync(SAIDA, JSON.stringify({ documentos: [] }, null, 2) + '\n')
})
