/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primaria: v('primaria'),
        'primaria-clara': v('primaria-clara'),
        destaque: v('destaque'),
        produtor: v('produtor'),
        fundo: v('fundo'),
        tinta: v('tinta'),
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        cartao: '0 1px 2px rgb(15 23 42 / 0.06), 0 8px 24px -12px rgb(15 23 42 / 0.18)',
      },
    },
  },
  plugins: [],
}
