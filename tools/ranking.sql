-- Ranking do NOC: rode este arquivo inteiro no SQL Editor do Supabase (uma vez).
-- Modelo: o navegador só pode INSERIR linhas na tabela e LER a visão ranking_top.
-- Não pode ler a tabela crua (o id do jogador fica escondido), nem alterar ou apagar nada.

create table if not exists public.ranking (
  id         bigint generated always as identity primary key,
  player     uuid        not null,                       -- id anônimo do aparelho, nunca exibido
  name       text        not null check (char_length(name) between 2 and 24),
  linkedin   text        check (linkedin is null or linkedin ~ '^https://www\.linkedin\.com/in/[A-Za-z0-9_-]{3,100}$'),
  board      text        not null check (board = 'campanha' or board ~ '^dia-\d{4}-\d{2}-\d{2}$'),
  score      integer     not null check (score >= 0),
  stars      integer     not null default 0,
  hidden     boolean     not null default false,         -- moderação: marque true para esconder
  created_at timestamptz not null default now(),
  -- Tetos com folga para fases futuras: campanha e desafio diário (5 perguntas + bônus).
  constraint ranking_stars_check check (stars between 0 and 300),
  constraint ranking_check check ((board = 'campanha' and score <= 200000) or (board <> 'campanha' and score <= 3000))
);
-- Atualiza os limites de bancos criados pela versão anterior deste arquivo (até 15 fases).
alter table public.ranking drop constraint if exists ranking_stars_check;
alter table public.ranking add constraint ranking_stars_check check (stars between 0 and 300);
alter table public.ranking drop constraint if exists ranking_check;
alter table public.ranking add constraint ranking_check check ((board = 'campanha' and score <= 200000) or (board <> 'campanha' and score <= 3000));
create index if not exists ranking_board_score on public.ranking (board, score desc);

alter table public.ranking enable row level security;
drop policy if exists "qualquer um insere" on public.ranking;
create policy "qualquer um insere" on public.ranking for insert to anon with check (hidden = false);

revoke all on public.ranking from anon, authenticated;
grant insert (player, name, linkedin, board, score, stars) on public.ranking to anon;

-- Visão pública: melhor pontuação de cada jogador por quadro, com o nome mais recente dele.
-- Moderação: um jogador com qualquer linha escondida some do ranking inteiro.
create or replace view public.ranking_top as
with best as (
  select distinct on (board, player) board, player, score, stars, created_at
  from public.ranking
  order by board, player, score desc, created_at asc
), who as (
  select distinct on (player) player, name, linkedin
  from public.ranking
  order by player, created_at desc
)
select b.board, w.name, w.linkedin, b.score, b.stars, b.created_at
from best b join who w using (player)
where not exists (select 1 from public.ranking h where h.player = b.player and h.hidden);

revoke all on public.ranking_top from anon, authenticated;
grant select on public.ranking_top to anon;
