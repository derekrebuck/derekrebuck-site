# Derek Rebuck portfolio V7

This iteration is built from V6.3 and adds the agreed content architecture and CMS foundation.

## Public structure

- Home: green hero plus Selected Work
- Work: discipline-first categories rather than employers
- Category pages: related projects from multiple roles and organizations
- About: green introduction plus four collapsed major content blocks
- Contact
- Services: optional and hidden from navigation by default
- Archive: remains unlinked

## Admin structure

The footer contains an Admin link. The admin dashboard uses Supabase Auth and Row Level Security, and manages:

- optional section visibility
- work categories
- projects
- featured and published state
- sort order and project/category copy

See `SETUP-SUPABASE.md` before using the admin dashboard.
