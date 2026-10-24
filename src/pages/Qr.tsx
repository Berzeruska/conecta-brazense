import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Camera, Printer, TriangleAlert } from 'lucide-react'
import { city } from '../lib/city'

/** Link que vai no QR: ?url=... > VITE_URL_PUBLICA > o endereço onde a página está aberta. */
export function urlPublica(param: string | null): string {
  const base = param || import.meta.env.VITE_URL_PUBLICA || window.location.origin
  return base.replace(/\/+$/, '')
}

const ehLocal = (url: string) => /\/\/(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(url)

function CodigoQr({ url, rotulo }: { url: string; rotulo: string }) {
  const [svg, setSvg] = useState('')
  useEffect(() => {
    let vivo = true
    // A biblioteca só carrega nesta página (e fica no cache offline como o resto do app).
    import('qrcode').then(({ default: QR }) =>
      QR.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: city.cores.primaria, light: '#ffffff' } }).then(
        (s) => vivo && setSvg(s),
      ),
    )
    return () => {
      vivo = false
    }
  }, [url])
  return (
    <div
      role="img"
      aria-label={`QR code: ${rotulo}`}
      data-testid="qr"
      className="aspect-square w-full [&>svg]:h-full [&>svg]:w-full"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export function Qr() {
  const [params, setParams] = useSearchParams()
  const url = urlPublica(params.get('url'))
  const [rascunho, setRascunho] = useState(url)
  const cartoes = [
    { titulo: `Abra o ${city.appName}`, texto: 'Aponte a câmera do celular. Abre no navegador, sem instalar nada.', link: `${url}/` },
    { titulo: 'Reporte um problema da cidade', texto: 'Tire a foto, marque no mapa e veja o ponto aparecer no telão.', link: `${url}/zelador/novo` },
  ]

  return (
    <div className="min-h-dvh bg-fundo px-4 py-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 space-y-3 print:hidden">
          <div className="flex items-center justify-between gap-2">
            <Link to="/perfil" className="flex items-center gap-1 text-sm font-semibold text-slate-600">
              <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar ao app
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-full bg-primaria px-4 py-2 text-sm font-bold text-white shadow-md"
            >
              <Printer className="h-4 w-4" aria-hidden /> Imprimir
            </button>
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setParams(rascunho.trim() ? { url: rascunho.trim() } : {})
            }}
          >
            <input
              value={rascunho}
              onChange={(e) => setRascunho(e.target.value)}
              aria-label="Link do app no QR code"
              inputMode="url"
              className="h-10 min-w-0 flex-1 rounded-xl bg-white px-3 text-sm text-tinta ring-1 ring-slate-200 outline-none focus:ring-2 focus:ring-destaque"
            />
            <button type="submit" className="h-10 shrink-0 rounded-xl bg-white px-4 text-sm font-bold text-tinta ring-1 ring-slate-200">
              Usar link
            </button>
          </form>
          {ehLocal(url) && (
            <p className="flex items-start gap-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              <TriangleAlert className="mt-px h-4 w-4 shrink-0" aria-hidden />
              Este QR aponta para {url}, que só abre neste computador. Para imprimir, abra esta página pelo link da Vercel ou cole o link acima.
            </p>
          )}
        </div>

        <header className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-destaque">1ª Feira de Ideias · {city.cidade}</p>
          <h1 className="mt-1 text-4xl font-extrabold text-primaria sm:text-5xl">{city.appName}</h1>
          <p className="mt-1 text-lg text-slate-600">O app da cidade, feito por nós, para nós.</p>
        </header>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 print:mt-10 print:grid-cols-2 print:gap-8">
          {cartoes.map((c, i) => (
            <section key={c.link} className="flex flex-col items-center rounded-3xl bg-white p-6 text-center shadow-cartao print:shadow-none print:ring-2 print:ring-slate-200">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-destaque text-base font-extrabold text-white">{i + 1}</span>
              <h2 className="mt-2 text-xl font-extrabold text-tinta">{c.titulo}</h2>
              <div className="mt-4 w-full max-w-[260px]">
                <CodigoQr url={c.link} rotulo={c.titulo} />
              </div>
              <p className="mt-3 flex items-start gap-1.5 text-sm text-slate-600">
                <Camera className="mt-0.5 h-4 w-4 shrink-0 text-destaque" aria-hidden />
                {c.texto}
              </p>
              <p className="mt-2 break-all font-mono text-[11px] text-slate-400">{c.link}</p>
            </section>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">Protótipo navegável com dados de demonstração · projeto de estudantes</p>
      </div>
    </div>
  )
}
