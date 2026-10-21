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
