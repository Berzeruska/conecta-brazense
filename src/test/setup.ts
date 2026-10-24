import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { apagarTudo } from '../lib/storage'

// Os testes do servidor (/api/chat) rodam no ambiente node, sem window.
if (typeof window !== 'undefined') {
  afterEach(() => {
    cleanup()
    apagarTudo()
  })
  window.scrollTo = (() => {}) as typeof window.scrollTo
}
