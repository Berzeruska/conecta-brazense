# Leis do município (base do Pergunte à Cidade)

Coloque aqui os PDFs oficiais das leis municipais (ou `.txt` com o texto copiado).

- `npm run leis` extrai o texto para `src/data/leis.json`, separado por artigo.
  Também roda sozinho antes do `npm run dev` e do `npm run build`.
- O chat só cita **"Lei nº X, art. Y"** de documento que está nesta pasta. Pasta vazia = o chat não cita lei nenhuma.
- PDF escaneado (imagem) não tem texto: o comando avisa. Passe um OCR antes, ex.: `ocrmypdf entrada.pdf saida.pdf`.
- O número da lei é lido do cabeçalho ("LEI Nº 1.234, DE ... DE 2019"). Se não achar, usa o nome do arquivo:
  nesse caso, renomeie o arquivo para algo como `lei-1234-2019.pdf`.
