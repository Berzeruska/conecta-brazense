import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { ShoppingBasket } from 'lucide-react'
import { totalItens, useCarrinho } from '../lib/carrinho'

export function BotaoCarrinho({ className = 'bg-white shadow-sm' }: { className?: string }) {
  const n = totalItens(useCarrinho())
  return (
    <Link
      to="/carrinho"
      aria-label={n ? `Minha reserva, ${n} itens` : 'Minha reserva'}
      className={`relative grid h-9 w-9 place-items-center rounded-full text-tinta ${className}`}
    >
      <ShoppingBasket className="h-5 w-5" />
      <AnimatePresence>
        {n > 0 && (
          <motion.span
            key={n}
            initial={{ scale: 0.4 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-destaque px-1 text-[10px] font-bold text-white"
          >
            {n}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  )
}
