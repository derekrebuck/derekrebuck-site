-- Derek Rebuck portfolio CMS setup for Supabase
-- Run this in the Supabase SQL Editor after creating the project.

create table if not exists public.site_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.site_sections (
  key text primary key,
  label text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.work_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  image_url text not null default '',
  accent text not null default 'green' check (accent in ('green','yellow','blue','crimson')),
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category_slug text not null references public.work_categories(slug) on update cascade on delete restrict,
  organization text not null default '',
  summary text not null default '',
  image_url text not null default '',
  year text not null default '',
  featured boolean not null default false,
  published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.site_sections (key, label, enabled) values
  ('services', 'Services page and navigation link', false),
  ('home_selected_work', 'Selected work on homepage', true),
  ('about_featured_work', 'Featured work on About page', true),
  ('resume_link', 'Resume link', true),
  ('accepting_freelance', 'Freelance availability note', false)
on conflict (key) do nothing;

insert into public.work_categories (slug, title, description, image_url, accent, sort_order, published) values
  ('branding-identity', 'Branding & Identity', 'Identity systems, logos and visual direction built to make organizations more recognizable and consistent.', 'touzled-tressez.png', 'crimson', 1, true),
  ('web-ui', 'Web & UI', 'Web experiences and interfaces shaped around clear structure, accessibility and the way people actually use them.', 'bakerb-solutions.png', 'blue', 2, true),
  ('visual-communications', 'Visual Communications', 'Campaigns, publications, marketing materials and communications designed to make information easier to understand.', 'marketing-materials.png', 'yellow', 3, true),
  ('infographics-data', 'Infographics & Data', 'Information design that turns dense content and data into useful visual stories.', 'infographics.png', 'green', 4, true),
  ('motion-video', 'Motion & Video', 'Motion graphics, training content and video work that supports explanation, instruction and storytelling.', 'social-media-content.png', 'crimson', 5, true),
  ('photography', 'Photography', 'Photography created to document spaces, people and projects with a strong sense of composition and purpose.', 'ktv-properties.png', 'blue', 6, true),
  ('fine-art', 'Fine Art', 'Personal work and exhibitions that explore visual ideas outside the constraints of client work.', 'leaf-graphic.png', 'yellow', 7, true)
on conflict (slug) do nothing;

insert into public.projects (slug, title, category_slug, organization, summary, image_url, year, featured, published, sort_order) values
  ('touzled-tressez', 'Touzled Tressez', 'branding-identity', 'Freelance', 'Branding and web work created to establish a cohesive and recognizable visual presence.', 'touzled-tressez.png', '', true, true, 1),
  ('ktv-properties', 'KTV Properties', 'branding-identity', 'Freelance', 'Identity and marketing work balancing a professional real estate presence with a more approachable personality.', 'ktv-properties.png', '', true, true, 2),
  ('bakerb-solutions', 'BakerB Solutions', 'web-ui', 'Saenger Group', 'Digital and communications work focused on hierarchy, clarity and a stronger user experience.', 'bakerb-solutions.png', '', true, true, 1)
on conflict (slug) do nothing;

-- Row Level Security
alter table public.site_admins enable row level security;
alter table public.site_sections enable row level security;
alter table public.work_categories enable row level security;
alter table public.projects enable row level security;

create or replace function public.is_site_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.site_admins a where a.user_id = auth.uid()
  );
$$;

revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;

-- Grants first, then policies decide which rows may be used.
revoke all on table public.site_admins from anon, authenticated;
revoke all on table public.site_sections from anon, authenticated;
revoke all on table public.work_categories from anon, authenticated;
revoke all on table public.projects from anon, authenticated;

grant select on table public.site_sections to anon, authenticated;
grant insert, update, delete on table public.site_sections to authenticated;

grant select on table public.work_categories to anon, authenticated;
grant insert, update, delete on table public.work_categories to authenticated;

grant select on table public.projects to anon, authenticated;
grant insert, update, delete on table public.projects to authenticated;

grant select on table public.site_admins to authenticated;

-- Policies
create policy "Admins can read own admin row"
on public.site_admins for select to authenticated
using (auth.uid() = user_id);

create policy "Everyone can read site section visibility"
on public.site_sections for select to anon, authenticated
using (true);

create policy "Admins can insert site sections"
on public.site_sections for insert to authenticated
with check (public.is_site_admin());
create policy "Admins can update site sections"
on public.site_sections for update to authenticated
using (public.is_site_admin()) with check (public.is_site_admin());
create policy "Admins can delete site sections"
on public.site_sections for delete to authenticated
using (public.is_site_admin());

create policy "Public can read published categories"
on public.work_categories for select to anon
using (published = true);
create policy "Authenticated users can read published categories or admin drafts"
on public.work_categories for select to authenticated
using (published = true or public.is_site_admin());
create policy "Admins can insert categories"
on public.work_categories for insert to authenticated
with check (public.is_site_admin());
create policy "Admins can update categories"
on public.work_categories for update to authenticated
using (public.is_site_admin()) with check (public.is_site_admin());
create policy "Admins can delete categories"
on public.work_categories for delete to authenticated
using (public.is_site_admin());

create policy "Public can read published projects"
on public.projects for select to anon
using (published = true);
create policy "Authenticated users can read published projects or admin drafts"
on public.projects for select to authenticated
using (published = true or public.is_site_admin());
create policy "Admins can insert projects"
on public.projects for insert to authenticated
with check (public.is_site_admin());
create policy "Admins can update projects"
on public.projects for update to authenticated
using (public.is_site_admin()) with check (public.is_site_admin());
create policy "Admins can delete projects"
on public.projects for delete to authenticated
using (public.is_site_admin());

-- IMPORTANT: create the Auth user in Supabase first, then run this statement
-- once to grant that user access to the portfolio admin.
--
-- insert into public.site_admins (user_id, email)
-- select id, email from auth.users
-- where lower(email) = lower('Derekrebuck@gmail.com')
-- on conflict (user_id) do update set email = excluded.email;
