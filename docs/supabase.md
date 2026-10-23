# Supabase: ligar o Zelador ao vivo (celular → telão)

Sem Supabase o app funciona igual, mas cada aparelho só vê os próprios reportes.
Com Supabase, o reporte feito no celular do jurado aparece no telão em poucos segundos.

Use **só a chave pública** (anon / publishable). A chave `service_role` / `secret` **nunca** vai no front,
nem no `.env` do app, nem na Vercel. Se ela for colada por engano, o app recusa e desliga o Supabase.

## 1. Pegar a URL e a chave pública

No painel do projeto (https://supabase.com/dashboard → seu projeto):

1. **URL do projeto:** botão **Connect** no topo do projeto (ou *Project Settings → Data API*).
   É algo como `https://abcdefghijkl.supabase.co`.
2. **Chave pública:** *Project Settings → API Keys*.
   - Se aparecer **Publishable key** (`sb_publishable_...`), use essa.
   - Se o projeto mostrar as chaves antigas, abra a aba **Legacy API keys** e copie a **anon public** (começa com `eyJ...`).
   - **Não** copie a `secret` (`sb_secret_...`) nem a `service_role`.

## 2. Criar a tabela

1. *SQL Editor → New query*.
2. Cole o conteúdo de [`supabase/schema.sql`](../supabase/schema.sql) e clique em **Run**.
3. Confira em *Table Editor* que a tabela `reports` existe (vazia). Os 10 exemplos ficam no app, não no banco.

O que o SQL garante:
- qualquer visitante **lê** todos os reportes e **cria** reporte novo, sempre com status "aberto";
- ninguém de fora **altera** ou **apaga** nada;
- só aceita pontos dentro do mapa da cidade, textos curtos e foto até ~400 KB;
- liga o **realtime** da tabela (é isso que faz o telão atualizar sozinho).

## 3. Variáveis de ambiente

### No seu computador (`.env` na raiz do projeto)

```
VITE_SUPABASE_URL=https://abcdefghijkl.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...   (ou a anon eyJ...)
```

Depois **reinicie** o `npm run dev` (o Vite só lê o `.env` ao iniciar).
O `.env` está no `.gitignore`: não vai para o GitHub.

### Na Vercel

*Project → Settings → Environment Variables*, adicione as mesmas duas
(`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`) para **Production** e **Preview**, e faça um **Redeploy**.
As variáveis `VITE_` entram no código do navegador. Por isso só a chave pública pode ir nelas:
quem protege os dados são as regras do passo 2.
(`ANTHROPIC_API_KEY` é do Tiro 3 e fica sem `VITE_`, só no servidor.)

## 4. Conferir

1. Abra `/zelador`: o selo no canto do mapa deve mudar de "Conectando..." para **Ao vivo**.
   - "Neste aparelho" = variáveis não foram lidas (reinicie o dev / redeploy).
   - "Sem conexão" = URL/chave erradas, SQL não rodado, ou sem internet.
2. Faça um reporte: na tela do reporte deve aparecer "No mapa público: já aparece no telão".
3. Em *Table Editor → reports* a linha nova aparece.

## Durante a demo

- **Simular resposta da prefeitura** (o telão muda a cor do pino ao vivo): no *Table Editor*, edite a linha e
  mude `status` para `andamento` e preencha `respondido_em`; ou use os comandos no fim do `schema.sql`.
- **Limpar os testes antes da feira:** `delete from public.reports;` no SQL Editor.
- O plano gratuito pausa projetos parados há ~1 semana. Abra o app alguns dias antes de 2/12 para acordar o projeto.
- Se a internet da feira cair, os celulares guardam o reporte e enviam sozinhos quando a rede voltar.
