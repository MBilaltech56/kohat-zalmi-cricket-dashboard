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
- Tables used by this website version: public."kohat zalmi", public.matches.
- RLS policies should allow public SELECT and owner-only INSERT/UPDATE/DELETE.
- This version removes the Funds page from the website UI. Existing Supabase fund tables are NOT deleted by this ZIP.

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
- Redesigned hero, player cards, ranking rows, match cards, leaders cards,
  forms and modals.
- Typography: Sora for headings, Manrope for body text (Google Fonts, with
  system font fallbacks if the fonts fail to load).

Animation (pure CSS + a little IntersectionObserver — no libraries)
- Page entrance fades, staggered card reveals on scroll.
- Animated number counters on the dashboard.
- Animated progress bars and a conic-gradient win-rate ring.
- Hover lift on cards, photo zoom, light sweep on buttons and leader cards.
- Animated hamburger, sliding mobile drawer with backdrop blur.
- Modals fade and slide; sheet style on mobile, centred on desktop.
- All motion is disabled automatically for users with
  "prefers-reduced-motion" enabled.

Mobile
- Designed from 360px up; verified at 360, 390 and 1440px with no horizontal
  scrolling on any page.
- Tables (matches, rankings, venues) become readable cards on small
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


LATEST UPDATE
- Added Shahab to Meet Our Team.
- Shahab role: Right Hand Batsman.
- Added SUPABASE_MATCHES_PKEY_FIX.sql for the duplicate matches_pkey database issue.
- Match saving also retries with a safe primary-key value when the old sequence is behind.


DEMON SLAYER UPDATE  (Nezuko x Zenitsu love-story theme)
---------------------------------------------------------
1. Roles reversed everywhere: M. Jibran is now CAPTAIN (#07) and M. Bilal is
   now VICE CAPTAIN (#56) - Leaders page, Meet Our Team hero, player badges.
   The two team photos were renamed (...-Captain.png / ...-Vice_Captain.png).
2. New theme: Nezuko sakura-pink + Zenitsu thunder-yellow, hemp-leaf and
   triangle haori patterns, gradient-border animated cards, falling petals,
   hearts and thunder sparks, lightning flashes. Day and Night modes both
   re-coloured. All code is in the end of style.css (section DS-1 .. DS-12)
   and in the new file effects.js.
3. 8-second splash screen: "KOHAT ZALMI - We Are Friends" (index.html top,
   styles in style.css section DS-11). Fades out between 7.3s and 8.0s.

Upload ALL files (index.html, app.js, style.css, effects.js, assets/) to GitHub.

LEADERS + TEAM HERO REDESIGN
- Leaders page rebuilt: two large animated trading-style cards. Captain M. Jibran = Zenitsu
  thunder (yellow, lightning flashes, sparks). Vice Captain M. Bilal = Nezuko bloom (pink,
  falling petals). Rotating light border, breathing glow, floating motion, shine sweep,
  and a 3D tilt that follows the mouse on desktop. A heart-bolt links the two cards.
- Meet Our Team hero rebuilt from scratch: big MEET OUR TEAM title, thunder crack, haori
  patterns, count chips, and two moving rows of every squad member's photo.
  Captain/Vice photos are NOT in this hero (they live on the Leaders page).
- Files changed: index.html, style.css (DS-13, DS-14), effects.js, app.js (one line).

- Leaders page: heart between Captain and Vice Captain replaced by a neutral pink/yellow KZ team badge.


MATCH SAVE + PERFORMANCE UNDO/REDO FIX
--------------------------------------
This version removes the client-side manual-ID retry for matches. The website
lets Supabase generate the match ID and sends both `date` and `match_date`,
plus zero defaults for required numeric summary fields.

Before uploading this ZIP:
1. Back up `public."kohat zalmi"` and `public.matches` to private CSV files.
2. In Supabase SQL Editor, run SUPABASE_SETUP_UNDO_REDO.sql once.
3. Upload ALL files and folders from this ZIP to the existing GitHub repository,
   replacing matching files.
4. Wait for GitHub Pages to publish, then open the site and hard-refresh.
5. Log in as the owner admin and test adding one match and one performance.
6. Test Undo, Redo, Edit, and Delete on a new test performance record.

Individual performance history begins when the new table is installed and new
performances are saved. Existing career totals already stored on player rows are
preserved as-is; they cannot be split into individual historical records because
the old website stored only cumulative totals. Do not use Undo on a pre-existing
performance that has no individual history row.

Funds tables are not modified or deleted by this SQL or this ZIP.
