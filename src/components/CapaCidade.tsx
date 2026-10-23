import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { fotosDaCidade } from '../lib/servicos'

/**
 * Fundo do topo do Início com as fotos reais da cidade (public/img/cidade).
 * 1 foto = capa fixa; 2 ou mais = carrossel. Sem fotos, não renderiza nada.
 */
export function CapaCidade({ fotos = fotosDaCidade, intervalo = 6000 }: { fotos?: string[]; intervalo?: number }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (fotos.length < 2) return
    const t = setInterval(() => setI((x) => (x + 1) % fotos.length), intervalo)
    return () => clearInterval(t)
  }, [fotos.length, intervalo])

  if (!fotos.length) return null
  return (
    <div className="absolute inset-0" aria-hidden data-testid="capa-cidade">
      <AnimatePresence initial={false}>
        <motion.img
          key={fotos[i]}
          src={fotos[i]}
          alt=""
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </AnimatePresence>
      {/* Mantém o texto branco legível sobre qualquer foto */}
      <div className="absolute inset-0 bg-gradient-to-b from-primaria/70 via-primaria/80 to-primaria" />
    </div>
  )
}
