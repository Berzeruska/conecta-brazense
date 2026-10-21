import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2 } from 'lucide-react'

type Mostrar = (mensagem: string) => void
const Contexto = createContext<Mostrar>(() => {})

export function ProvedorToast({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState<{ id: number; texto: string } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const mostrar = useCallback<Mostrar>((texto) => {
    clearTimeout(timer.current)
    setMsg({ id: Date.now(), texto })
    timer.current = setTimeout(() => setMsg(null), 2200)
  }, [])
  return (
    <Contexto.Provider value={mostrar}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
        <AnimatePresence>
          {msg && (
            <motion.div
              key={msg.id}
              role="status"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex max-w-sm items-center gap-2 rounded-full bg-tinta/95 px-4 py-2.5 text-sm font-medium text-white shadow-xl"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
              {msg.texto}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Contexto.Provider>
  )
}

export const useToast = () => useContext(Contexto)
