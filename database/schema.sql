-- Base inicial para Supabase. Revisar e habilitar RLS antes de produção.
create extension if not exists pgcrypto;
create table if not exists public.products (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 code bigint not null,
 name text not null,
 platform text not null check (platform in ('Mercado Livre','Shopee','Outro')),
 price numeric(12,2), original_price numeric(12,2), description text, affiliate_url text not null, image_url text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(user_id,code)
);
create table if not exists public.product_clicks (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 product_id uuid not null references public.products(id) on delete cascade,
 clicked_at timestamptz not null default now(), source text
);
alter table public.products enable row level security;
alter table public.product_clicks enable row level security;
create policy "Users manage own products" on public.products for all using(auth.uid()=user_id) with check(auth.uid()=user_id);
create policy "Users read own clicks" on public.product_clicks for select using(auth.uid()=user_id);
create policy "Users insert own clicks" on public.product_clicks for insert with check(auth.uid()=user_id);
create index if not exists products_user_created_idx on public.products(user_id,created_at desc);
create index if not exists product_clicks_user_clicked_idx on public.product_clicks(user_id,clicked_at desc);


-- Campos opcionais usados nos modelos de divulgação.
alter table public.products add column if not exists coupon text not null default '';
alter table public.products add column if not exists installments text not null default '';
