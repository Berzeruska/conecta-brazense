# Pergunte à Cidade: chave da API e base de leis

## Como responde

1. **Cartões de serviço** (hospital, posto, prefeitura, 190/192/193) vêm sempre de `src/data/servicos.json`, com ou sem internet.
   Campo ainda não confirmado aparece como "a confirmar", nunca estimado.
2. **Com internet e chave:** o app chama `/api/chat` (função da Vercel), que manda ao modelo `claude-haiku-5-5`
   só o cadastro de serviços, os artigos de lei que combinam com a pergunta e o resumo do app.
   A resposta só é aceita se citar lei e artigo que estavam nesse contexto; senão, vale a resposta pronta.
3. **Sem internet, sem chave ou erro:** respostas prontas (`src/data/faq.json` + cadastro + leis), na hora.

## Chave da Anthropic (só no servidor)

1. Crie a chave em https://platform.claude.com → *API Keys*. Coloque um limite de gasto baixo no console
   (o Haiku custa centavos para a feira inteira).
2. **Local:** no `.env`, `ANTHROPIC_API_KEY=sk-ant-...` e reinicie o `npm run dev`. O `/api/chat` local usa a mesma função da Vercel.
3. **Vercel:** *Settings → Environment Variables* → `ANTHROPIC_API_KEY` (Production e Preview) → **Redeploy**.
- **Nunca** com prefixo `VITE_`: tudo que começa com `VITE_` vai para o navegador.
- Conferir: no chat, a resposta passa a mostrar o selo **"Assistente on-line"**. Sem a chave, aparece "Resposta pronta".

## Leis (`docs/leis/`)

- Coloque os PDFs oficiais (ou `.txt`) em `docs/leis/` e rode `npm run leis` (também roda sozinho no `dev` e no `build`).
  O texto vai para `src/data/leis.json`, separado por artigo. O comando lista o que achou: confira o número da lei e a quantidade de artigos.
- Pasta vazia = o chat **não cita lei nenhuma** e diz que a base está vazia.
- PDF escaneado não tem texto: o comando avisa. Rode um OCR (`ocrmypdf entrada.pdf saida.pdf`) e coloque o resultado.
- Depois de adicionar leis, faça commit do PDF **e** do `src/data/leis.json`.

## Editar as respostas prontas

`src/data/faq.json`: `sugestoes` são os botões da tela; cada item tem `palavras` (início de palavra, sem acento),
`resposta`, `fonte` e, opcionalmente, `servicos` (cartões) e `link` (botão para uma tela do app).
Não coloque horário, valor ou prazo que não esteja num documento oficial.
