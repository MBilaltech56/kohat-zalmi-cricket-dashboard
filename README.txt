KOHAT ZALMI CRICKET PERFORMANCE DASHBOARD
Professional UI/UX redesign — September 2026

Upload ALL files and the assets folder to your GitHub repository, replacing
index.html, app.js, style.css. Your GitHub Pages URL does not change.

Files:
- index.html
- app.js
- style.css
- assets/hero.jpg
- assets/bilal.jpg
- assets/jibran.jpg

Supabase:
- Project URL and publishable key are unchanged.
- Owner/admin UUID: f62ca7bc-486d-462f-92dd-6415e0e90973
- Tables used: public."kohat zalmi", public.matches, public.player_funds,
  public.fund_expenses — none were renamed or altered.
- RLS policies should allow public SELECT and owner-only INSERT/UPDATE/DELETE.
- No database changes are required for this update. SUPABASE_FUNDS_SQL.sql is
  included only for reference; if you already ran it, do NOT run it again.

Important: never put a Supabase service_role/secret key in this website. The
publishable key is intended for browser use with RLS.


WHAT CHANGED IN THIS UPDATE
---------------------------
This is a UI/UX-only update. Every page, query, calculation and admin control
works exactly as before.

Design
- New premium dark sports-dashboard theme with a gold (#BA56 family) accent,
  plus a matching professional light theme.
- Fixed header with brand crest, sidebar navigation grouped into
  Team / Insights / Admin, and a clear Visitor / Admin badge.
- Redesigned hero, player cards, ranking rows, match cards, fund cards,
  leaders cards, forms and modals.
- Typography: Sora for headings, Manrope for body text (Google Fonts, with
  system font fallbacks if the fonts fail to load).

Animation (pure CSS + a little IntersectionObserver — no libraries)
- Page entrance fades, staggered card reveals on scroll.
- Animated number counters on dashboard and fund totals.
- Animated progress bars and a conic-gradient win-rate ring.
- Hover lift on cards, photo zoom, light sweep on buttons and leader cards.
- Animated hamburger, sliding mobile drawer with backdrop blur.
- Modals fade and slide; sheet style on mobile, centred on desktop.
- All motion is disabled automatically for users with
  "prefers-reduced-motion" enabled.

Mobile
- Designed from 360px up; verified at 360, 390 and 1440px with no horizontal
  scrolling on any page.
- Tables (matches, rankings, venues, expenses) become readable cards on small
  screens instead of scrolling sideways.
- Touch targets are at least 38-46px.

Accessibility
- Skip link, visible focus rings, aria-labels, alt text, labelled form
  controls, keyboard-accessible player cards, Escape closes menus and modals.

Small improvements (nothing removed)
- Admin Edit for players and matches now uses proper modal forms instead of
  browser prompt() boxes. The Supabase update payloads are identical to before.
- Notifications are now on-screen toasts instead of alert() pop-ups.
  confirm() is still used for deletes, so nothing is deleted without asking.
- The "+ Add Player" button on the Players page is now wired up (it previously
  did nothing).
- Match cards now also show the best batter's strike rate and the best
  bowler's economy, calculated from data already stored.
- Day/Night: your saved preference is respected exactly as before
  (localStorage key "kzTheme"). Night is now the default for first-time
  visitors who have no saved preference. To make day the default instead,
  open app.js and change
      applyTheme(localStorage.kzTheme !== "day");
  to
      applyTheme(localStorage.kzTheme === "night");

Tested with a headless browser at 360px, 390px and 1440px across every page:
zero JavaScript console errors, zero horizontal overflow.
