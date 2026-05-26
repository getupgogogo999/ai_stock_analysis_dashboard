-- 如果建表后 API 报 401，在 Supabase SQL Editor 运行此修复脚本

grant usage on schema public to anon, authenticated;
grant select, insert on public.stock_analyses to anon, authenticated;
