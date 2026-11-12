-- Execute uma vez no SQL Editor do Supabase para atualizar a tabela existente.
alter table public.products add column if not exists original_price numeric(12,2);
