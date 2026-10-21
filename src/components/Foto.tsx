import { useState } from 'react'

interface Props {
  src: string
  alt: string
  className?: string
  prioridade?: boolean
}

/** Foto com fundo de espera e plano B se o arquivo falhar: a demo nunca mostra ícone quebrado. */
export function Foto({ src, alt, className = '', prioridade }: Props) {
  const [carregou, setCarregou] = useState(false)
  const [falhou, setFalhou] = useState(false)
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-stone-200 to-stone-300 ${className}`}>
      {!falhou && (
        <img
          src={src}
          alt={alt}
          loading={prioridade ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setCarregou(true)}
          onError={() => setFalhou(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ${carregou ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  )
}
