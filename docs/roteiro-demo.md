# Roteiro da demo (5 minutos), testado com e sem internet

Testado de ponta a ponta pelo `npm run e2e` (celular simulado, online e em modo avião). Abaixo, o roteiro para a mesa.

## Antes da feira (até 1/12)

- [ ] Abrir o app publicado alguns dias antes: o Supabase gratuito pausa projetos parados há ~1 semana.
- [ ] Limpar os reportes de teste: `delete from public.reports;` no *SQL Editor* do Supabase.
- [ ] Vercel: conferir as variáveis `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `ANTHROPIC_API_KEY` (ver [`pergunte.md`](pergunte.md)) e, opcionalmente, `VITE_URL_PUBLICA`.
- [ ] Imprimir a página `/qr` (dois QR codes: abrir o app e reportar um problema). Abra pelo link da Vercel: se abrir por `localhost`, o QR só funciona no seu computador (a página avisa).
- [ ] Em cada aparelho da mesa: abrir o app **uma vez com internet** e tocar em Início, Zelador, Pergunte e Mapa. É isso que guarda tudo para o modo avião. Instalar na tela inicial ("Adicionar à tela inicial").

## Na mesa

- **Notebook / TV:** `/telao` em tela cheia (botão no canto). Selo "Ao vivo" = Supabase ligado.
- **Celular do apresentador:** app aberto no Início, cesta vazia.

## Os 5 minutos

| Tempo | O que fazer | O que mostrar |
|---|---|---|
| 0:00–0:40 | **Problema.** Fala, sem tocar no app. | Feirão do Facebook bagunçado, produtor vende pouco direto, dinheiro sai da cidade. |
| 0:40–2:40 | **Núcleo.** Início → busca **"ovos"** → comparação produtor x loja → abre o do produtor → **Reservar** → nome → **Confirmar reserva**. Depois Perfil → **Painel do vendedor** → aba anúncio → foto pelo celular → título e preço → **Publicar no Feirão**. | Selo "Compre de quem é daqui", código da reserva, contador "R$ que ficaram na cidade", anúncio aparecendo no Feirão. |
| 2:40–3:40 | **Zelador.** O jurado escaneia o QR **2** → escolhe categoria, tira foto, toca no mapa → **Enviar reporte**. Todos olham o telão. | O ponto novo pulsa no telão com o aviso "Novo reporte agora". Opcional: no Supabase, mude o `status` para `andamento` e o pino muda de cor ao vivo. |
| 3:40–4:20 | **Pergunte.** Aba Pergunte → toque em **"Qual o horário da prefeitura?"** (ou "Onde fica o hospital?"). | Resposta com **Fonte**, cartão com **Ligar** e **Ver no mapa**. O app diz "a confirmar" em vez de inventar. Com leis carregadas: pergunte sobre o assunto de uma delas e abra a citação "Lei nº X, art. Y". |
| 4:20–5:00 | **Visão.** Fala; se der, pergunte no chat "Funciona em outra cidade?". | Trocar de cidade = trocar um arquivo (`city.json`). Escala para as cidades pequenas, onde os grandes apps não chegam bem. |

## Se algo falhar

- **Internet caiu:** continue normalmente. Catálogo, mapa, reserva, Feirão e chat (respostas prontas, selo "funciona sem internet") rodam do celular.
  O reporte fica no aparelho e sobe sozinho quando a rede volta; o telão de outro aparelho só recebe quando os dois tiverem rede. Mostre o ponto no **próprio celular** (mapa do Zelador) e diga que vai para o telão quando a rede voltar.
- **Chat sem chave ou API fora:** o chat responde com as respostas prontas na hora (mesmos cartões, sem o selo "Assistente on-line").
- **Telão parou de atualizar:** recarregue a página `/telao`. Selo "Sem conexão" = sem internet no notebook.
- **Celular do jurado não abre o QR:** use o celular da mesa, que já está com o app instalado.

## Testar antes (computador)

```bash
npm run build:e2e      # build sem Supabase: o teste nunca grava no banco real
npm run preview        # em outro terminal
npm run e2e            # roteiro completo + modo avião; prints em test-results/prints/
```
