/// <reference types="vitest" />
import { existsSync, readdirSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createServer, defineConfig, loadEnv, type Plugin, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import city from './src/config/city.json'

/**
 * Lista as fotos reais que a equipe coloca em public/img/servicos e public/img/cidade.
 * O app só mostra <img> de arquivo que existe: sem 404 e sem ícone quebrado na demo.
 */
function fotosLocais(): Plugin {
  const ID = 'virtual:fotos-locais'
  const RESOLVIDO = '\0' + ID
  const PASTAS = ['servicos', 'cidade']
  const listar = (pasta: string) => {
    const dir = `public/img/${pasta}`
    if (!existsSync(dir)) return []
    return readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .sort()
      .map((f) => `/img/${pasta}/${f}`)
  }
  return {
    name: 'fotos-locais',
    resolveId: (id) => (id === ID ? RESOLVIDO : undefined),
    load(id) {
      if (id !== RESOLVIDO) return
      return PASTAS.map((p) => `export const ${p} = ${JSON.stringify(listar(p))}`).join('\n')
    },
    configureServer(server) {
      const mudou = (arquivo: string) => {
        if (!/public[\\/]img[\\/](servicos|cidade)[\\/]/.test(arquivo)) return
        const mod = server.moduleGraph.getModuleById(RESOLVIDO)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', mudou)
      server.watcher.on('unlink', mudou)
    },
  }
}

/**
 * /api/chat também no `npm run dev` e no `npm run preview`, com o mesmo código da função da Vercel.
 * A ANTHROPIC_API_KEY do .env vai só para o processo do servidor (nunca para o navegador).
 */
function apiLocal(): Plugin {
  let carregador: ViteDevServer | undefined
  const atender = (obter: () => Promise<ViteDevServer>) => async (req: IncomingMessage, res: ServerResponse, seguir: () => void) => {
    if (req.url?.split('?')[0] !== '/api/chat') return seguir()
    try {
      const vite = await obter()
      const { POST } = (await vite.ssrLoadModule('/api/chat.ts')) as { POST: (r: Request) => Promise<Response> }
      const pedacos: Buffer[] = []
      for await (const p of req) pedacos.push(p as Buffer)
      const resposta = await POST(
        new Request('http://local/api/chat', { method: req.method, headers: { 'content-type': 'application/json' }, body: req.method === 'POST' ? Buffer.concat(pedacos) : undefined }),
      )
      res.writeHead(resposta.status, Object.fromEntries(resposta.headers))
      res.end(await resposta.text())
    } catch (e) {
      console.error('api/chat local:', e)
      res.writeHead(500).end()
    }
  }
  return {
    name: 'api-local',
    config(_, { mode }) {
      const env = loadEnv(mode, process.cwd(), '')
      if (env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_API_KEY) process.env.ANTHROPIC_API_KEY = env.ANTHROPIC_API_KEY
    },
    configureServer(server) {
      server.middlewares.use(atender(async () => server))
    },
    configurePreviewServer(server) {
      server.middlewares.use(
        atender(async () => (carregador ??= await createServer({ configFile: false, logLevel: 'silent', appType: 'custom', server: { middlewareMode: true, hmr: false } }))),
      )
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    fotosLocais(),
    apiLocal(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: city.appName,
        short_name: city.appName,
        description: `O app de ${city.cidade}, feito por nós, para nós.`,
        lang: 'pt-BR',
        theme_color: city.cores.primaria,
        background_color: city.cores.primaria, // splash do Android: ícone sobre o azul da cidade
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Tudo (inclusive as fotos) fica em cache: a demo precisa rodar em modo avião.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,webp,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // Os testes não dependem do .env de quem roda: sem Supabase e sem chave de API.
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '', ANTHROPIC_API_KEY: '' },
    css: false,
  },
})
