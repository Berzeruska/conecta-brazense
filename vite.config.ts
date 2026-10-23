/// <reference types="vitest" />
import { existsSync, readdirSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'
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

export default defineConfig({
  plugins: [
    react(),
    fotosLocais(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: city.appName,
        short_name: city.appName,
        description: `O app de ${city.cidade}, feito por nós, para nós.`,
        lang: 'pt-BR',
        theme_color: city.cores.primaria,
        background_color: city.cores.fundo,
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
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
