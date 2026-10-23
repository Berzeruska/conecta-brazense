-- Conecta Brazense · Zelador
-- Tabela dos reportes + regras de acesso para a demo + realtime para o telão.
-- Rode tudo de uma vez no Supabase: SQL Editor → New query → colar → Run.
-- Pode rodar de novo sem problema (é idempotente).

create table if not exists public.reports (
  id            text primary key check (char_length(id) between 4 and 40),
  categoria     text not null check (categoria in ('buraco', 'iluminacao', 'lixo', 'outros')),
  descricao     text not null default '' check (char_length(descricao) <= 400),
  -- Foto comprimida no celular (data URL JPEG, ~40-80 KB) ou foto padrão do app.
  foto          text not null check (
                  char_length(foto) <= 400000
                  and (foto like 'data:image/jpeg;base64,%' or foto like '/img/%')
                ),
  -- Só pontos dentro da área do mapa da cidade.
  lat           double precision not null check (lat between -23.944 and -23.804),
  lng           double precision not null check (lng between -49.873 and -49.733),
  bairro        text not null check (char_length(bairro) between 1 and 60),
  autor         text not null check (char_length(autor) between 1 and 60),
  status        text not null default 'aberto' check (status in ('aberto', 'andamento', 'resolvido')),
  criado_em     timestamptz not null default now(),
  respondido_em timestamptz,
  resolvido_em  timestamptz
);

create index if not exists reports_criado_em_idx on public.reports (criado_em desc);

-- ---------- Acesso (Row Level Security) ----------
-- Visitante (chave anon/publishable): pode LER tudo e CRIAR reporte novo, sempre "aberto".
-- Não pode alterar nem apagar nada. Quem muda status é a equipe, pelo painel do Supabase.

alter table public.reports enable row level security;

drop policy if exists "reportes: leitura publica" on public.reports;
create policy "reportes: leitura publica"
  on public.reports for select
  to anon, authenticated
  using (true);

drop policy if exists "reportes: qualquer um reporta" on public.reports;
create policy "reportes: qualquer um reporta"
  on public.reports for insert
  to anon, authenticated
  with check (
    status = 'aberto'
    and respondido_em is null
    and resolvido_em is null
    and criado_em between now() - interval '5 minutes' and now() + interval '1 minute'
  );

revoke update, delete, truncate on public.reports from anon, authenticated;
grant select, insert on public.reports to anon, authenticated;

-- ---------- Realtime (o telão recebe o ponto novo na hora) ----------

do $$
begin
  alter publication supabase_realtime add table public.reports;
exception
  when duplicate_object then null;
end $$;

-- ---------- Úteis na demo (rodar à mão quando quiser) ----------
-- Simular resposta da prefeitura (o telão atualiza ao vivo):
--   update public.reports set status = 'andamento', respondido_em = now() where id = '<id>';
--   update public.reports set status = 'resolvido', resolvido_em = now() where id = '<id>';
-- Limpar os testes antes da feira:
--   delete from public.reports;
