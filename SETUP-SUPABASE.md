# Portfolio admin setup

The public portfolio continues to work as a static GitHub Pages site even before Supabase is configured. The admin dashboard and live content controls become active after the following setup.

## 1. Create a Supabase project

Create a project in Supabase and keep the project URL and browser publishable key handy.

## 2. Create the admin Auth user

In Supabase Authentication, create a user for:

`Derekrebuck@gmail.com`

Use a new password. Do not reuse a password that has been posted in a chat, repository, issue, or other shared location.

## 3. Run the database setup

Open the Supabase SQL Editor and run `supabase/setup.sql`.

After the Auth user exists, run the final commented `insert into public.site_admins...` statement in that file to designate the account as the portfolio administrator.

## 4. Connect the website

Edit `js/supabase-config.js` and replace:

- `YOUR_SUPABASE_URL`
- `YOUR_SUPABASE_PUBLISHABLE_KEY`

Do not place a Supabase service-role key in the website. The browser uses only the publishable key. Row Level Security controls who may edit content.

## 5. Deploy

Commit the site to GitHub Pages. The footer's Admin link opens `/admin/`.

The dashboard supports:

- section visibility toggles, including Services
- Work categories
- projects, published/draft state, featured state, ordering, copy, and image paths/URLs

Image uploads are not wired into Supabase Storage in this iteration. For now, the image field accepts either a file already committed with the website, such as `touzled-tressez.png`, or a full HTTPS image URL.
