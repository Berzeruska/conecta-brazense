# Conecta Brazense — app da cidade, feito por nós, para nós

> MVP para a 1ª Feira de Ideias de Wenceslau Braz (Conecta WB 2026), categoria Ensino Médio/Profissional.
> Apresentação: 2/12/2026, Casa da Cultura. Pitch de no máximo 5 minutos.

## A ideia em uma frase

O app da cidade, feito por nós, para nós: o feirão do Facebook virou um mercado organizado onde moradores, comércio local e produtores rurais compram, vendem e trocam direto, sem atravessador e mais barato. No mesmo app, o morador reporta problemas da cidade num mapa público (Zelador) e tira dúvidas sobre serviços municipais com um assistente que responde com base nos documentos oficiais (Pergunte à Cidade).

## O problema

- Em cidade pequena, a compra e venda local acontece em grupos de Facebook: bagunçado, sem busca, sem preço claro, com risco de golpe.
- O produtor rural vende pouco direto ao morador; o atravessador fica com a margem e o morador paga mais caro.
- O comércio local perde para grandes apps e marcas que não entregam bem em cidade pequena.

## A solução

Um único app, **Conecta Brazense**. O nome segue o gentílico da cidade e muda via configuração: Conecta Brazense em Wenceslau Braz, Conecta Platinense em Santo Antônio da Platina, e assim por diante.

**Núcleo (o trunfo):**
1. **Do Produtor** — hortaliças, ovos, queijo, mel, frutas direto de quem produz, com perfil do produtor (sítio, bairro/estrada, foto, dias de entrega).
2. **Comércio Local** — vitrine das lojas da cidade (mercado, farmácia, roupas, agro, serviços).
3. **Feirão** — classificados entre moradores: vender, trocar, doar. É o tráfego do Facebook trazido para dentro do app.
- Busca única por produto, filtro por preço e categoria, comparação "produtor x loja".
- Reserva com retirada combinada ou entrega local; contato pelo app.
- Selo "Compre de quem é daqui" e contador "R$ que ficaram na cidade" (simulado).

**Extras (para impressionar):**
4. **Zelador** — morador fotografa um problema urbano, marca no mapa; mapa público com contador de "dias sem resposta"; **modo telão** atualizando ao vivo.
5. **Pergunte à Cidade** — chat que responde dúvidas sobre serviços municipais citando a fonte (documento oficial; notícias do jornal local como integração futura).

## Regras do MVP (obrigatórias)

- É um **protótipo navegável com dados de demonstração**. Nada no app pode afirmar que está em operação.
- **Nenhum nome, logo ou marca real** de loja, produtor ou jornal. Tudo fictício e crível.
- Notícias de exemplo marcadas como "exemplo — integração futura com jornal local".
- A demo **nunca pode quebrar**: sem internet ou sem chave de API, tudo continua funcionando com dados locais e respostas prontas.
- Prioridade: **bonito, intuitivo, rápido**. Simplicidade vence recurso.

## Especificações técnicas

| Camada | Escolha | Por quê |
|---|---|---|
| App | PWA mobile-first (abre no celular por QR code, instalável, sem loja de apps) | Zero burocracia, demo instantânea |
| Front | Vite + React + TypeScript | Rápido e padrão |
| Estilo | Tailwind CSS + Framer Motion (animações leves) + lucide-react (ícones) | Visual polido sem esforço |
| Rotas | React Router | Simples |
| Mapa | Leaflet + react-leaflet + OpenStreetMap, centrado na cidade | Gratuito, sem chave |
| Dados | JSON mock em `/src/data` + localStorage | Sem backend para o núcleo |
| Tempo real | Supabase (plano gratuito), **só** para Zelador e telão | O ponto que o visitante cria precisa aparecer no telão de outro aparelho |
| Chat | Função serverless `/api/chat` na Vercel + SDK da Anthropic (modelo `claude-haiku-5-5`), chave em variável de ambiente | Chave fica escondida; custo baixo |
| Fallback do chat | 10–15 perguntas/respostas prontas em JSON | Demo sem internet |
| PWA | vite-plugin-pwa | Ícone na tela inicial |
| Deploy | Vercel | Gratuito, gera link para o QR code |
| Config da cidade | `src/config/city.json` (nome do app, gentílico, cidade, cores, coordenadas, bairros) | Trocar de cidade = trocar um arquivo |

**Ambiente do desenvolvedor:** Ubuntu 24.04, Node LTS.

### Estrutura sugerida

```
conecta-brazense/
├─ api/chat.ts                # serverless: chama a API, cai para fallback
├─ docs/                      # textos-base do chat (documentos oficiais, exemplos)
├─ public/                    # ícones, imagens
├─ src/
│  ├─ config/city.json
│  ├─ data/                   # produtores, lojas, produtos, anúncios, faq
│  ├─ components/             # UI reutilizável
│  ├─ pages/                  # Home, Produtor, Loja, Feirão, Carrinho, Zelador, Telão, Chat, Vendedor
│  ├─ lib/                    # supabase, storage, busca
│  └─ App.tsx
├─ .env.example
└─ README.md
```

## Identidade visual

- Azul escuro como base + uma cor quente de destaque (laranja/terracota); verde só para itens do produtor.
- Cartões com foto grande, cantos arredondados, tipografia limpa, barra de navegação inferior com 5 abas: **Início · Feirão · Zelador · Pergunte · Perfil**.
- Primeira tela tem que gerar "quero isso na minha cidade": destaque do produtor do dia, ofertas, contador de dinheiro que ficou na cidade.

## Fases de desenvolvimento — 3 tiros

Cada tiro termina **rodando e com deploy**. Só começa o próximo depois que o anterior estiver aprovado. Se faltar tempo, o que já existe é um MVP completo.

### Tiro 1 — Núcleo: mercado local, produtores e feirão
- Setup do projeto, Tailwind, rotas, PWA, `city.json`, navegação inferior.
- Dados mock: 8 produtores, 8 lojas, ~60 produtos, ~20 anúncios do feirão (todos fictícios, com fotos genéricas/ilustrações).
- Telas: Início, busca única, página do produtor, página da loja, Feirão (vender/trocar/doar), detalhe do item, carrinho/reserva com confirmação, perfil.
- Painel do vendedor: publicar produto ou anúncio com foto pelo celular (salva em localStorage).
- Comparação de preço produtor x loja e selo "Compre de quem é daqui".
- Deploy na Vercel.
- **Pronto quando:** dá para comprar algo do produtor e publicar um anúncio no feirão pelo celular, sem travar, e está bonito.

### Tiro 2 — Zelador + telão ao vivo
- Reportar problema: foto, categoria (buraco, iluminação, lixo, outros), ponto no mapa.
- Mapa público com pinos coloridos por status (aberto / em andamento / resolvido) e contador de dias sem resposta.
- Supabase com tabela `reports` e realtime; fallback para localStorage se não houver conexão.
- Rota `/telao`: tela cheia, mapa + lista dos últimos reportes, atualiza sozinho, com animação quando chega ponto novo.
- 10 reportes de exemplo pré-carregados.
- **Pronto quando:** um celular reporta e o ponto aparece no telão de outro aparelho em poucos segundos.

### Tiro 3 — Pergunte à Cidade + polimento + demo
- Tela de chat com sugestões de perguntas; respostas citam a fonte.
- `/api/chat` usa os textos de `/docs` como contexto; sem chave ou sem rede, usa o fallback em JSON.
- Polimento geral: estados vazios, carregamentos, transições, ícone e splash do PWA.
- Página `/qr` com o QR code do link para imprimir na mesa.
- Roteiro de demo (abaixo) testado de ponta a ponta, inclusive em modo avião.
- **Pronto quando:** o roteiro de 5 minutos roda inteiro sem erro, com e sem internet.

## Roteiro de demo (5 minutos)

1. **Problema (40s):** o feirão do Facebook é bagunça; o produtor vende pouco direto; o dinheiro sai da cidade.
2. **Núcleo (2min):** busca "ovos", compara produtor x loja, reserva do produtor; publica um anúncio no feirão.
3. **Zelador (1min):** jurado escaneia o QR, reporta um problema, o ponto aparece no telão.
4. **Pergunte (40s):** uma pergunta sobre serviço municipal, resposta com fonte.
5. **Visão (40s):** trocar a cidade é trocar um arquivo; escala para as cidades pequenas do Brasil, onde os grandes apps não chegam bem.

## Como rodar

```bash
npm install
cp .env.example .env   # preencher chaves (opcional: sem elas o app usa fallback)
npm run dev
```

Variáveis em `.env.example`:
```
ANTHROPIC_API_KEY=
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_URL_PUBLICA=
```

Deploy: conectar o repositório à Vercel, configurar as mesmas variáveis no painel, publicar.

- **Supabase (Zelador ao vivo):** passo a passo em [`docs/supabase.md`](docs/supabase.md); SQL em [`supabase/schema.sql`](supabase/schema.sql).
- **Mapa offline:** os tiles do OpenStreetMap da cidade ficam em `public/tiles` (`node scripts/baixar-tiles.mjs` para baixar de novo, ex.: ao trocar de cidade).
- **Fotos reais da equipe:** `public/img/servicos/` (hospital.jpg, posto-toyoki.jpg, camara.jpg) e `public/img/cidade/` (capa do Início). Basta colocar o arquivo; sem ele o app mostra um placeholder.
- **Pergunte à Cidade:** chave da API e leis em [`docs/pergunte.md`](docs/pergunte.md). PDFs das leis em `docs/leis/` (`npm run leis`).
- **QR code da mesa:** página `/qr` (imprimir). **Roteiro da demo:** [`docs/roteiro-demo.md`](docs/roteiro-demo.md).
- **Testes:** `npm test` (unidade e telas) e `npm run build:e2e && npm run preview` + `npm run e2e` (roteiro completo, inclusive modo avião; o build:e2e desliga o Supabase para não gravar no banco real).

## Instrução ao Claude Code

Leia este README inteiro. Execute **apenas o Tiro 1**. Antes de codar, mostre o plano de pastas e telas em no máximo 15 linhas e espere aprovação. Ao terminar cada tiro, liste o que foi feito, o que ficou simulado e como testar.
