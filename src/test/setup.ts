import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { apagarTudo } from '../lib/storage'

afterEach(() => {
  cleanup()
  apagarTudo()
})

window.scrollTo = (() => {}) as typeof window.scrollTo
