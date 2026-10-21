import { motion } from 'framer-motion'
import { MapPinned, MessageCircleQuestion, Construction } from 'lucide-react'
import { BotaoCarrinho } from '../components/BotaoCarrinho'
import { RodapeDemo } from '../components/Diversos'

const TELAS = {
  zelador: {
    titulo: 'Zelador',
    Icone: MapPinned,
    frase: 'Viu um buraco, poste apagado ou lixo acumulado? Fotografe, marque no mapa e acompanhe quantos dias está sem resposta.',
    itens: ['Foto + categoria + ponto no mapa', 'Mapa público com status de cada problema', 'Contador de dias sem resposta', 'Modo telão ao vivo'],
  },
  pergunte: {
    titulo: 'Pergunte à Cidade',
    Icone: MessageCircleQuestion,
    frase: 'Tire dúvidas sobre serviços municipais e receba a resposta com a fonte: o documento oficial de onde ela saiu.',
    itens: ['Horários e endereços de serviços', 'Documentos e taxas', 'Respostas sempre com a fonte', 'Funciona até sem internet'],
  },
}

export function EmBreve({ tela }: { tela: keyof typeof TELAS }) {
  const { titulo, Icone, frase, itens } = TELAS[tela]
  return (
    <div>
      <header className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-2xl font-extrabold text-tinta">{titulo}</h1>
        <BotaoCarrinho />
      </header>
      <div className="px-4 pt-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-3xl bg-primaria p-6 text-white"
        >
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/15">
            <Icone className="h-8 w-8" />
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-destaque">
            <Construction className="h-4 w-4" /> Em construção
          </p>
          <p className="mt-1 text-lg font-bold leading-snug">{frase}</p>
        </motion.div>
        <ul className="mt-4 space-y-2">
          {itens.map((t, i) => (
            <motion.li
              key={t}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              className="flex items-center gap-3 rounded-2xl bg-white p-4 text-sm font-medium text-tinta shadow-cartao"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-destaque/10 text-xs font-bold text-destaque">{i + 1}</span>
              {t}
            </motion.li>
          ))}
        </ul>
      </div>
      <RodapeDemo />
    </div>
  )
}
