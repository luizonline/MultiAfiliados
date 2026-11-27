-- Execute este arquivo no Supabase SQL Editor para habilitar cupom e parcelamento.
alter table public.products add column if not exists coupon text not null default '';
alter table public.products add column if not exists installments text not null default '';
