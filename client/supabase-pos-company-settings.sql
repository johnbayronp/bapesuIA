alter table public.bapesu_companies
  add column if not exists uses_pos boolean not null default false,
  add column if not exists pos_business_type text not null default 'retail';

alter table public.bapesu_companies
  drop constraint if exists bapesu_companies_pos_business_type_check;

alter table public.bapesu_companies
  add constraint bapesu_companies_pos_business_type_check
  check (pos_business_type in ('retail', 'restaurant'));
