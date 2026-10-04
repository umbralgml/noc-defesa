-- Papéis do banco para a API própria (PostgREST), equivalentes aos do Supabase.
-- Rode ANTES de tools/ranking.sql. Pode rodar de novo sem problema.
--   anon           papel público: o que o navegador pode fazer (definido em tools/ranking.sql)
--   authenticated  existe só porque tools/ranking.sql faz "revoke ... from anon, authenticated"
--   authenticator  o login que o PostgREST usa; troca para anon a cada requisição
-- A senha do authenticator NÃO fica aqui: o instalador define com ALTER ROLE e grava só em /etc/postgrest/noc.conf.
do $$
begin
  if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
  if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
  if not exists (select from pg_roles where rolname = 'authenticator') then create role authenticator login noinherit; end if;
end $$;
grant anon to authenticator;
grant usage on schema public to anon;
-- Nada além do que tools/ranking.sql libera: tira os privilégios padrão do esquema public.
revoke create on schema public from public;
