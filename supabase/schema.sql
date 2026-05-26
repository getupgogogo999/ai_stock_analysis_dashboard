-- Run this SQL in Supabase SQL Editor to create the analyses table

create table if not exists stock_analyses (
  id uuid primary key default gen_random_uuid(),
  symbol text not null,
  summary text not null,
  sentiment text not null check (sentiment in ('Bullish', 'Neutral', 'Bearish')),
  risk_level text not null,
  stock_data jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_analyses_symbol on stock_analyses (symbol);
create index if not exists idx_stock_analyses_created_at on stock_analyses (created_at desc);

alter table stock_analyses enable row level security;

create policy "Allow public read access"
  on stock_analyses for select
  using (true);

create policy "Allow public insert access"
  on stock_analyses for insert
  with check (true);

-- 授予 anon 角色读写权限（否则 API 会返回 401）
grant usage on schema public to anon, authenticated;
grant select, insert on public.stock_analyses to anon, authenticated;
