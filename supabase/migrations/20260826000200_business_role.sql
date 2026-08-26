-- 1. If role is of type public.user_role ENUM, add 'business' value
do $$
begin
  alter type public.user_role add value 'business';
exception
  when duplicate_object then null;
  when others then null;
end $$;

-- 2. If profiles has a check constraint, update it safely
alter table public.profiles 
  drop constraint if exists profiles_role_check;

alter table public.profiles 
  drop constraint if exists profiles_role_check1;

do $$
begin
  alter table public.profiles 
    add constraint profiles_role_check 
    check (role::text in ('professional', 'company', 'business', 'admin'));
exception
  when others then null;
end $$;

-- 3. Update products RLS policy to allow product listing inserts for sellers (business, professional, company, admin)
drop policy if exists "Authenticated sellers can insert products" on public.products;
drop policy if exists "Authenticated users can insert products" on public.products;

create policy "Authenticated users can insert products" 
  on public.products for insert 
  with check (
    auth.uid() = seller_id and 
    exists (
      select 1 from public.profiles 
      where profiles.id = auth.uid() 
      and profiles.role::text in ('business', 'professional', 'company', 'admin')
    )
  );
