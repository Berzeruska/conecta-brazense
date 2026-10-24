import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/plus-jakarta-sans'
import './index.css'
import App from './App'
import { aplicarCoresDaCidade, city } from './lib/city'

aplicarCoresDaCidade()
document.title = `${city.appName} · ${city.cidade}`

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// Tira o splash do index.html assim que o app desenhou a primeira tela.
requestAnimationFrame(() => {
  const splash = document.getElementById('splash')
  if (!splash) return
  splash.classList.add('saindo')
  setTimeout(() => splash.remove(), 350)
})
