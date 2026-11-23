KOHAT ZALMI CRICKET PERFORMANCE DASHBOARD
Professional UI/UX redesign — September 2026

Upload ALL files and the assets folder to your GitHub repository, replacing
index.html, app.js, style.css. Your GitHub Pages URL does not change.

Files:
- index.html
- app.js
- style.css
- assets/hero.webp
- assets/bilal.webp
- assets/jibran.webp

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

SOLO LEVELING x BLUE LOCK + GIYU TOMIOKA (WATER BREATHING) UPDATE
- Dashboard hero: same team photo, new layout with three live 3D cards
  (Top Wicket Taker, Top Run Scorer, Team Win Rate) that follow the mouse.
- Player cards (Players + Meet Our Team): 3D tilt with moving glare, flip-in entrance.
- Cinematic page transitions: slash panels + [ PAGE ] label (effects.js).
- Giyu / Water Breathing theme: splash (split haori emblem, wave glyph, katana slash,
  rising water, "Water Breathing - Eleventh Form - Dead Calm"), animated water
  background (waves, ripples, bubbles, droplets, seigaiha + kikko patterns),
  card borders with flowing water-light glow (hover = faster flow on lists).
- Styles: style.css sections DS-15 and DS-16. Logic: effects.js (+ 2 small hooks in app.js).

HANGING LANYARD FLIP CARDS (Leaders + Meet Our Team)
- Both pages now use lanyard-badge cards hanging from a rail, like the reference video.
- Front = player photo (name, role, jersey, Captain/Vice tag). Back = player details
  (role, batting, bowling, jersey, status, barcode, and live Matches/Runs/Wkts when the
  player exists in the database).
- Click/tap or Enter flips the card. Click-and-drag tosses it: each card is a pendulum.
- Code: effects.js (hanging cards section), style.css (DS-17), renderTeam() hook in app.js.

LATEST UPDATE
1. New splash (8s): "Dead Calm" - a water drop falls, ripples + splash crown, the emblem
   rises from the water with a whirlpool, KOHAT ZALMI rises out of the water, "We Are
   Friends", then a wave takes the screen (style.css DS-19, index.html top).
2. Fits every screen: audited 320px to 1920px on every page - no sideways scroll,
   16px inputs (no iOS zoom), 44px tap targets, one readable card per row on phones,
   themed file picker, safe header on tiny phones (style.css DS-20).
3. Dashboard hero: the 3 cards (top scorer, top wicket taker, win rate) removed; photo + text only.
4. Rankings: top-3 cards (swipe carousel on phones) + Complete Rankings as animated cards
   with medal ranks, progress bars, 6 stat tiles and sort chips (Overall, Runs, Wickets,
   Average, Strike Rate, Economy). Code: renderRankings() in app.js, style.css DS-18.

NIGHT MATCH THEME (replaces the water theme)
- Look: pitch green + floodlight gold + cricket-ball red. Day and night modes.
- Animated background: sweeping floodlight beams, crowd camera flashes, moving turf with a
  boundary rope, cricket balls flying across the sky, dust/fireflies drifting in the lights.
- New 8-second splash: floodlights flicker on, a cricket ball lands, the KZ crest pops,
  KOHAT ZALMI flips in like a scoreboard, "We Are Friends", six balls light up (an over),
  then a floodlight flash. Code: index.html (top), style.css section DS-21.

ONE PIECE THEME (replaces Night Match)
- Look: straw-hat gold + Grand Line blue + sail red + parchment. Pirata One headings. Day + night modes.
- Animated background: starry/sunny sky, drifting clouds, seagulls, a pirate ship sailing the horizon,
  moving ocean waves, floating treasure coins and bubbles.
- Splash (8s) "Set Sail": starry night turns to dawn, sun-rays spin, the ship crosses the sea, a skull-and-
  straw-hat crest rises, a parchment banner unrolls and stamps KOHAT ZALMI, "We Are Friends",
  a bounty counter counts up to 1,500,000,000, then a wave covers the screen.
- Hanging cards: wooden rail; the back of every card is a WANTED poster with a BOUNTY
  (runs + 20 x wickets, in millions) when the player has stats. Rankings: "Bounty" ranking.
- Code: index.html (top), style.css section DS-22, effects.js (card back), app.js (rank label).


GOJO SATORU / JUJUTSU KAISEN THEME UPDATE (Infinite Void)
1. Opening splash (exactly 9s, once per browser session): fade into the Void (0-2s), a Gojo-inspired blindfold
   silhouette appears while Blue and Red cursed energy gather (2-5s), they merge into Hollow Purple with the
   crest + KOHAT ZALMI title (5-7s), progress hits 100% and a purple blast dissolves to reveal the site (7.3-9s).
   Small "Skip intro" button. Code: index.html (top), style.css DS-23 A.
2. Page-change splash (1.2s, different design "Limitless"): blue/violet energy panels sweep in (0-0.3s), a
   rotating hex sigil with the destination title (0.3-0.8s), panels sweep out (0.8-1.2s). Only on real page
   changes. Code: effects.js (section 4), style.css DS-23 B.
3. Back/forward: pages write #page to the URL, so Back/Forward work (with the splash); index.html#rankings
   opens that page. No other logic changed.
4. Background "Infinite Void": drifting Blue / Red / Purple energy orbs, light rays, rotating hex barrier,
   floor lattice, a faint silhouette, cursed-energy motes, gentle parallax, smooth day/night crossfade.
5. Cards (Leaders + Meet Our Team): back is now a dark "sorcerer file" with bright, larger text (WANTED ->
   SORCERER, Bounty -> Cursed Energy "CE"). Phones show 1 card per row.
6. Smoothness: photos resized (11.5 MB -> 3.8 MB), heavy glow/blur animations removed, transform/opacity-only
   motion, background pauses when hidden, lighter mode on weak devices.
Palette: Limitless blue, Reversal red, Hollow Purple, white-hair silver on deep indigo (dark) / lavender (light).
All art is original vector artwork (no official anime images). Upload ALL files and the assets folder to GitHub.


DEMON SLAYER x GIYU TOMIOKA THEME UPDATE (Water Breathing, Water Hashira)
1. Theme: replaces the Gojo / Infinite Void look. Palette is deep-water ink, water blue and haori jade, with a little kikko rust
   and ochre. Day and night modes. Headings use Shippori Mincho B1 (Google Fonts, with serif fallbacks), body stays Manrope.
   All art is original vector artwork inspired by Water Breathing (split-haori emblem, kikko pattern, seigaiha waves, ripples);
   no official anime images are used.
2. Opening splash "Dead Calm" (about 6s, once per browser session, Skip intro button): a drop falls, ripples spread, water
   ribbons draw across, the split-haori emblem and KOHAT ZALMI appear, then water rises and reveals the site.
3. Page-change transition (1.2s): water rises, shows the destination title, clears.
4. Background: calm water at night with seigaiha pattern, light shafts, drifting waves and slow rising bubbles.
5. MEET OUR TEAM hero rebuilt from scratch with a clean, professional layout: large serif title with a water-wave line,
   one short intro line, three facts (players, captain, vice captain), two buttons, and a squad sheet of every player's photo.
   Selecting a photo scrolls to that player's hanging card and gives it a gentle sway. A split-haori band runs along the top
   (jade on one half, kikko on the other). The plain page heading is hidden on this page because the hero carries the title.
6. Hanging cards recoloured for the theme. Card back: "Slayer File" with bright, large text and "Breath Power" (BP) in place
   of Cursed Energy; Rankings "Power" shows BP.
Files changed: index.html, style.css (DS-25 replaces the Gojo sections), effects.js, app.js (one label).
Checked at 320, 390, 768, 1440 and 1920px: no sideways scroll on any page, no JavaScript errors.
Upload ALL files and the assets folder to GitHub.


NOVEMBER 2026 UPDATE — PERFORMANCE, INNINGS & OUR JOURNEY
---------------------------------------------------------
- Pages now render only when opened. Rankings, Meet Our Team and hidden sections
  no longer rebuild on every render. The long page-transition overlay is removed.
- The opening brand reveal is shortened; decorative background effects are
  reduced on phones and low-powered devices. Hanging cards stay still until
  the visitor interacts with them.
- Player photos stored in Supabase are fetched only when the Players page is
  opened, instead of downloading every photo during the first page load.
- Large website JPG assets were converted to optimized WebP files.
- Added a separate Batting Innings statistic. Saving a player's match performance
  always increases Matches. Tick “Player batted in this match” to increase
  Innings; entered runs or balls also count as a batting innings automatically.
  Admins can adjust Matches and Innings from Edit Player.
- Added the animated, mobile-friendly Our Journey page with an English / Roman
  Urdu toggle. The hero quote stays in English in both modes.

IMPORTANT — ONE-TIME SUPABASE SETUP
----------------------------------
Before deploying the updated website, open Supabase Dashboard > SQL Editor and
run SUPABASE_INNINGS_MIGRATION.sql. This adds the innings column to the existing
public."kohat zalmi" table. Existing players start at 0 innings because the old
data did not record whether each appearance included batting; you can set the
correct historic totals through Admin Login > Players > Edit.

Upload the full contents of this updated ZIP (including the .webp assets and
SUPABASE_INNINGS_MIGRATION.sql) to your existing website repository.


NOVEMBER 2026 — INDIVIDUAL PERFORMANCE HISTORY + UNDO/REDO
----------------------------------------------------------
New file: SUPABASE_UNDO_REDO_SETUP.sql

Before deploying, run this SQL once in Supabase Dashboard > SQL Editor.
It creates public.player_performances and owner-only write policies.
It does not delete or reset any existing player, match, or career data.

When an admin saves a new performance, the website saves a separate
history record and updates that player's totals. The Add Performance page
shows the latest 100 records. Admin can Undo or Redo each individual record;
the selected record's contribution is subtracted/restored in the player's
aggregate statistics. Visitors can view history but cannot change it.

IMPORTANT LIMITATION:
Existing totals from before this update are not converted into historical
performance records. Undo/Redo applies to performances saved after the SQL
and website update are installed. Existing career totals are preserved.
Run SUPABASE_INNINGS_MIGRATION.sql as well if it has not already been run.
