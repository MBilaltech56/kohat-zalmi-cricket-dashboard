/* ==========================================================================
   KOHAT ZALMI — Demon Slayer theme effects (Giyu Tomioka, Water Breathing)
   Visual only. Builds slow rising water bubbles for the background.
   Uses only CSS transform/opacity animations so it stays smooth.
   Does not touch any site data or logic.
   ========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var small = window.matchMedia && window.matchMedia("(max-width: 700px)").matches;

  function rnd(a, b) { return a + Math.random() * (b - a); }

  function build(host, count, opts) {
    if (!host || reduce) return;
    opts = opts || {};
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var el = document.createElement("i");
      var dur = rnd(16, 30);
      el.className = "gyB";
      el.style.setProperty("--x", rnd(1, 99).toFixed(1) + "%");
      el.style.setProperty("--s", rnd(opts.min || 5, opts.max || 16).toFixed(1) + "px");
      el.style.setProperty("--d", dur.toFixed(1) + "s");
      el.style.setProperty("--dl", (-rnd(0, dur)).toFixed(1) + "s");
      el.style.setProperty("--dr", rnd(-60, 60).toFixed(0) + "px");
      el.style.setProperty("--o", (opts.opacity || rnd(0.25, 0.6)).toFixed(2));
      frag.appendChild(el);
    }
    host.appendChild(frag);
  }

  function init() {
    build(document.getElementById("dsItems"), small ? 9 : 16);
    build(document.getElementById("dsFront"), small ? 2 : 4, { opacity: 0.3, min: 8, max: 20 });
  }

  /* Pause background motion when the tab is hidden (saves battery). */
  document.addEventListener("visibilitychange", function () {
    document.body.classList.toggle("dsPaused", document.hidden);
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();


/* ==========================================================================
   Meet Our Team hero: squad overview (visual only).
   Fills the facts row and a tidy roster sheet. Selecting a face scrolls to that
   player's hanging card and gives it a gentle sway.
   ========================================================================== */
function buildTeamReel(roster) {
  var esc = function (v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (m) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]; }); };
  var set = function (id, txt) { var el = document.getElementById(id); if (el) el.textContent = txt; };
  set("tmCount", roster.length);
  var cap = roster.filter(function (p) { return p.captain === "Captain"; })[0];
  var vice = roster.filter(function (p) { return p.captain === "Vice Captain"; })[0];
  set("tmCaptain", cap ? cap.name : "—");
  set("tmVice", vice ? vice.name : "—");

  var host = document.getElementById("gySquad");
  if (!host || !roster.length) return;
  host.innerHTML = roster.map(function (p, i) {
    var first = String(p.name || "").replace(/^M\.\s*/, "").split(" ")[0];
    var badge = p.captain === "Captain" ? '<b class="gyRank" title="Captain">C</b>' : p.captain === "Vice Captain" ? '<b class="gyRank vc" title="Vice captain">VC</b>' : "";
    return '<button type="button" class="gyFace" role="listitem" style="--i:' + i + '" data-i="' + i + '" aria-label="Go to ' + esc(p.name) + ' card">' +
      '<span class="gyShot"><img src="' + esc(p.photo) + '" alt="" decoding="async" draggable="false">' + badge + '</span>' +
      '<em>' + esc(first) + '</em></button>';
  }).join("");
}
window.buildTeamReel = buildTeamReel;

(function () {
  function bind() {
    document.addEventListener("click", function (e) {
      var face = e.target.closest ? e.target.closest(".gyFace") : null;
      if (face) {
        var grid = document.getElementById("teamGrid");
        var card = grid && grid.children[+face.dataset.i];
        if (!card) return;
        card.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(function () { if (card._hc) { card._hc.w += 1.3; card._hc.wake(); } }, 450);
        return;
      }
      var go = e.target.closest ? e.target.closest("[data-scroll]") : null;
      if (go) {
        var t = document.getElementById(go.getAttribute("data-scroll"));
        if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})();

/* ==========================================================================
   Leaders page: soft 3D tilt that follows the pointer (desktop only)
   ========================================================================== */
(function () {
  var fine = window.matchMedia && window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || calm) return;
  function bind() {
    document.querySelectorAll(".ldCard").forEach(function (card) {
      var tilt = card.querySelector(".ldTilt");
      var raf = 0, ev = null;
      function apply() {
        raf = 0;
        var r = card.getBoundingClientRect();
        var x = (ev.clientX - r.left) / r.width, y = (ev.clientY - r.top) / r.height;
        tilt.style.setProperty("--ry", ((x - 0.5) * 14).toFixed(2) + "deg");
        tilt.style.setProperty("--rx", ((0.5 - y) * 12).toFixed(2) + "deg");
        tilt.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
        tilt.style.setProperty("--my", (y * 100).toFixed(1) + "%");
      }
      card.addEventListener("pointermove", function (e) { ev = e; if (!raf) raf = requestAnimationFrame(apply); });
      card.addEventListener("pointerleave", function () {
        tilt.style.setProperty("--rx", "0deg"); tilt.style.setProperty("--ry", "0deg");
      });
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();
})();


/* ==========================================================================
   SOLO LEVELING x BLUE LOCK layer
   1) live data for the 3D hero cards   2) 3D tilt on player cards
   3) pointer parallax on the hero      4) cinematic page transitions
   ========================================================================== */

/* ---- 1. dashboard hero cards (data only; markup lives in index.html) ---- */
function renderHeroCards(players, matches, res, pct) {
  var $ = function (id) { return document.getElementById(id); };
  if (!$("dhStack")) return;
  var num = function (v) { v = Number(v); return isFinite(v) ? v : 0; };
  var photoFor = function (p) {
    if (p && p.photo) return p.photo;
    try {
      var r = (typeof TEAM_ROSTER !== "undefined" ? TEAM_ROSTER : []).filter(function (x) { return x.name === (p && p.name); })[0];
      return r ? r.photo : "";
    } catch (e) { return ""; }
  };
  function fill(prefix, p, val, max) {
    var name = p ? String(p.name || "—") : "—";
    $(prefix + "Name").textContent = name;
    $(prefix + "Val").textContent = p ? val : 0;
    $(prefix + "Ini").textContent = (name[0] || "–").toUpperCase();
    var img = $(prefix + "Img"), src = p ? photoFor(p) : "";
    if (src) { if (img.getAttribute("src") !== src) img.src = src; img.hidden = false; $(prefix + "Ini").hidden = true; }
    else { img.hidden = true; $(prefix + "Ini").hidden = false; }
    $(prefix + "Bar").style.width = (max ? Math.max(6, Math.min(100, val / max * 100)) : 0) + "%";
  }
  var bat = players.slice().sort(function (a, b) { return num(b.runs) - num(a.runs); })[0];
  var bowl = players.slice().sort(function (a, b) { return num(b.wickets) - num(a.wickets); })[0];
  fill("dhBat", bat, bat ? num(bat.runs) : 0, bat ? num(bat.runs) * 1.15 : 0);
  fill("dhBowl", bowl, bowl ? num(bowl.wickets) : 0, bowl ? num(bowl.wickets) * 1.15 : 0);
  var p = Math.round(pct * 10) / 10;
  $("dhPct").textContent = p + "%";
  $("dhRing").style.setProperty("--pct", p);
  $("dhW").textContent = res.w; $("dhL").textContent = res.l;
  $("dhWinBar").style.width = Math.max(4, Math.min(100, p)) + "%";
}
window.renderHeroCards = renderHeroCards;

(function () {
  var fine = window.matchMedia && window.matchMedia("(hover:hover) and (pointer:fine)").matches;
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- 2. 3D tilt for player cards (uses the CSS `rotate` property) ---- */
  if (fine && !calm) {
    var SEL = ".playerCard,.teamPlayerCard", cur = null, raf = 0, last = null;
    function paint() {
      raf = 0; if (!cur || !last) return;
      var r = cur.getBoundingClientRect();
      var x = (last.clientX - r.left) / r.width, y = (last.clientY - r.top) / r.height;
      var a = (0.5 - y) * 16, b = (x - 0.5) * 16, m = Math.sqrt(a * a + b * b);
      cur.style.rotate = m < 0.05 ? "none" : a.toFixed(2) + " " + b.toFixed(2) + " 0 " + m.toFixed(2) + "deg";
      cur.style.setProperty("--mx", (x * 100).toFixed(1) + "%");
      cur.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    }
    function release(el) { if (el) el.style.rotate = "none"; }
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType && e.pointerType !== "mouse") return;
      var c = e.target.closest ? e.target.closest(SEL) : null;
      if (c !== cur) { release(cur); cur = c; }
      if (!cur) return;
      last = e; if (!raf) raf = requestAnimationFrame(paint);
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", function () { release(cur); cur = null; });
  }

  /* ---- 3. dashboard hero: cards follow the pointer ---- */
  function bindHero() {
    var hero = document.getElementById("dhHero"), stack = document.getElementById("dhStack");
    if (!hero || !stack || !fine || calm) return;
    var raf2 = 0, ev = null;
    function ap() {
      raf2 = 0; var r = hero.getBoundingClientRect();
      var x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
      stack.style.setProperty("--ry", (x * 22).toFixed(2) + "deg");
      stack.style.setProperty("--rx", (-y * 14).toFixed(2) + "deg");
    }
    hero.addEventListener("pointermove", function (e) { ev = e; if (!raf2) raf2 = requestAnimationFrame(ap); });
    hero.addEventListener("pointerleave", function () { stack.style.setProperty("--ry", "0deg"); stack.style.setProperty("--rx", "0deg"); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bindHero); else bindHero();

  /* ---- 4. page-change splash (1.2s) + browser back/forward ----
     0-0.3s water rises | 0.3-0.8s emblem + destination title | 0.8-1.2s water clears.
     The page swap happens while the screen is covered. Real navigation only: same-page clicks never trigger it. */
  var TITLES = { dashboard: "Dashboard", players: "Players", matches: "Matches", rankings: "Rankings", analytics: "Analytics",
                 venues: "Venues", leaders: "The Leaders", team: "Meet Our Team", add: "Add Performance", addPlayer: "Add Player" };
  function installRouter() {
    var raw = window.go, warp = document.getElementById("gyWarp"), label = document.getElementById("gyTitle");
    if (typeof raw !== "function" || window.go.kz) return;
    var fx = !!(warp && label) && !calm, busy = false, target = null, pending = null;

    function activeId() { var a = document.querySelector(".page.active"); return a ? a.id : "dashboard"; }
    function valid(p) { var el = p && document.getElementById(p); return !!(el && el.classList.contains("page")); }
    function denied(p) { return (p === "add" || p === "addPlayer") && typeof isAdmin !== "undefined" && !isAdmin; }
    function remember(page, replace) {
      try { history[replace ? "replaceState" : "pushState"]({ kzPage: page }, "", "#" + page); } catch (x) {}
    }
    function swap(page) {
      try { window.scrollTo({ top: 0, behavior: "instant" }); } catch (x) { window.scrollTo(0, 0); }
      try { raw(page); } catch (x) { if (window.console) console.error(x); }
    }
    function run(page) {
      busy = true; target = page;
      var swapped = false, t1 = 0, t2 = 0;
      function doSwap() { if (swapped) return; swapped = true; swap(page); }
      function end() {
        clearTimeout(t1); clearTimeout(t2); doSwap();
        warp.classList.remove("on"); busy = false; target = null;
        if (pending) { var q = pending; pending = null; if (q !== activeId() && valid(q) && !denied(q)) run(q); }
      }
      try {
        label.textContent = TITLES[page] || String(page);
        warp.classList.remove("on"); void warp.offsetWidth;      /* restart the CSS timeline cleanly */
        warp.classList.add("on");
        t1 = setTimeout(doSwap, 330);                            /* swap while fully covered */
        t2 = setTimeout(end, 1200);                              /* the overlay can never outlive 1.2s */
      } catch (x) { end(); }
    }
    function navigate(page, fromHistory) {
      if (!valid(page) || denied(page)) return raw(page);        /* original behaviour (login prompt, etc.) */
      if (page === (busy ? target : activeId())) { if (!fromHistory && !busy) raw(page); return; }
      if (!fromHistory) remember(page);
      if (!fx) { swap(page); return; }
      if (busy) { pending = page; return; }
      run(page);
    }

    window.go = function (page) { return navigate(page, false); };
    window.go.kz = true;

    window.addEventListener("popstate", function () {
      var p = (location.hash || "").replace(/^#/, "") || "dashboard";
      if (!valid(p)) return;                                     /* e.g. the skip link (#title) */
      if (denied(p)) { remember(activeId(), true); return; }
      navigate(p, true);
    });

    /* opening on a deep link such as #players */
    var first = (location.hash || "").replace(/^#/, "");
    if (valid(first) && !denied(first) && first !== activeId()) swap(first);
    try { history.replaceState({ kzPage: activeId() }, "", location.hash || location.pathname + location.search); } catch (x) {}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", installRouter); else installRouter();
})();


/* ==========================================================================
   Water background: gentle pointer + scroll parallax, and a lighter mode for weak devices
   ========================================================================== */
(function () {
  var bg = document.getElementById("dsBg");
  if (!bg) return;
  var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia && matchMedia("(hover:hover) and (pointer:fine)").matches;
  var weak = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4);
  if (weak) document.body.classList.add("kzLite");
  if (calm) return;
  var px = 0, py = 0, sy = 0, raf = 0;
  function apply() {
    raf = 0;
    bg.style.setProperty("--px", px.toFixed(2)); bg.style.setProperty("--py", py.toFixed(2)); bg.style.setProperty("--sy", sy.toFixed(2));
  }
  function queue() { if (!raf) raf = requestAnimationFrame(apply); }
  if (fine && !weak) document.addEventListener("pointermove", function (ev) {
    var x = (ev.clientX / window.innerWidth - 0.5) * 2, y = (ev.clientY / window.innerHeight - 0.5) * 2;
    if (Math.abs(x - px) > 0.04 || Math.abs(y - py) > 0.04) { px = x; py = y; queue(); }
  }, { passive: true });
  window.addEventListener("scroll", function () {
    var v = Math.min(1, (window.scrollY || 0) / 900);
    if (Math.abs(v - sy) > 0.012) { sy = v; queue(); }
  }, { passive: true });
})();


/* ==========================================================================
   HANGING LANYARD CARDS  (Leaders + Meet Our Team)
   Front = player photo, back = player details. Click to flip,
   click-and-drag to toss: each card is a real pendulum.
   ========================================================================== */
(function () {
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var LEADER_PHOTO = { "M. Jibran": "assets/jibran.jpg", "M. Bilal": "assets/bilal.jpg" };

  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); }
  function seed(str) { var h = 1779033703 ^ str.length; for (var i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return function () { h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }; }

  function barcode(name) {
    var r = seed(name), x = 0, out = "";
    while (x < 196) { var w = 1 + Math.floor(r() * 3); if (r() > 0.34) out += '<rect x="' + x + '" y="0" width="' + w + '" height="30"/>'; x += w + 1.4; }
    return '<svg viewBox="0 0 200 30" preserveAspectRatio="none" aria-hidden="true" fill="currentColor">' + out + "</svg>";
  }
  function norm(s) { return String(s || "").toLowerCase().replace(/^m\.\s*/, "").replace(/\s+/g, " ").trim(); }
  function findStats(name) {
    try {
      var list = (typeof state !== "undefined" && state.players) ? state.players : [];
      for (var i = 0; i < list.length; i++) if (norm(list[i].name) === norm(name)) return list[i];
    } catch (e) {}
    return null;
  }
  function cardHTML(p, i, mode) {
    var cap = p.captain === "Captain", vice = p.captain === "Vice Captain";
    var cls = "hc " + (cap ? "cap" : vice ? "vice" : (i % 2 ? "b" : "a"));
    var photo = mode === "leader" && LEADER_PHOTO[p.name] ? LEADER_PHOTO[p.name] : p.photo;
    var status = p.captain || "Squad Player";
    var tag = p.captain ? p.captain.toUpperCase() : String(p.role || "PLAYER").toUpperCase();
    var code = "KZ-" + (p.jersey ? String(p.jersey).padStart(2, "0") : String(i + 1).padStart(2, "0"));
    var st = findStats(p.name);
    var bounty = st ? ((+st.runs || 0) + 20 * (+st.wickets || 0)) + " BP" : "??? BP";
    var stats = st ? '<div class="hcStats"><div><b>' + (+st.matches || 0) + "</b><small>MATCHES</small></div><div><b>" + (+st.runs || 0) + "</b><small>RUNS</small></div><div><b>" + (+st.wickets || 0) + "</b><small>WKTS</small></div></div>" : "";
    var rows = "";
    if (p.batting) rows += "<div><dt>BAT</dt><dd>" + esc(p.batting) + "</dd></div>";
    if (p.bowling) rows += "<div><dt>BOWL</dt><dd>" + esc(p.bowling) + "</dd></div>";
    rows += "<div><dt>JERSEY</dt><dd>" + (p.jersey ? "#" + esc(p.jersey) : "—") + "</dd></div>";
    rows += "<div><dt>STATUS</dt><dd>" + esc(status) + "</dd></div>";
    var strap = "KOHAT ZALMI • WE ARE FRIENDS • KOHAT ZALMI • WE ARE FRIENDS";
    return '<article class="' + cls + '" tabindex="0" role="button" aria-pressed="false" aria-label="' + esc(p.name) + ' player card. Press Enter to flip.">' +
      '<i class="hcRail"></i>' +
      '<div class="hcRig">' +
        '<div class="hcStrap"><span>' + strap + '</span></div><u class="hcClip"></u>' +
        '<div class="hcWrap"><div class="hcBadge">' +
          '<div class="hcFace hcFront">' +
            '<div class="hcPhoto"><img src="' + esc(photo) + '" alt="' + esc(p.name) + '" loading="lazy" draggable="false"></div><div class="hcShade"></div>' +
            '<i class="hcHole"></i>' +
            '<div class="hcTop"><b class="hcLogo">kz.</b><span class="hcTag">' + esc(tag) + "</span></div>" +
            '<div class="hcBottom"><small>' + esc(p.role) + "</small><h3>" + esc(p.name) + '</h3><div class="hcRow">' + (p.jersey ? '<span class="hcNo">#' + esc(p.jersey) + "</span>" : "<span></span>") + '<span class="hcFlipHint">&#10227; FLIP</span></div></div>' +
          "</div>" +
          '<div class="hcFace hcBack"><i class="hcHole"></i><div class="hcBackIn">' +
            '<div class="hcWanted">SLAYER FILE</div><div class="hcCrew">KOHAT ZALMI • ' + code + "</div>" +
            '<div class="hcWho"><small>WATER BREATHING</small><b>' + esc(p.name) + '</b><div class="hcRole">' + esc(p.role) + "</div></div>" +
            '<dl class="hcList">' + rows + "</dl>" + stats +
            '<div class="hcBounty"><small>BREATH POWER</small><b>' + bounty + "</b></div>" +
          "</div></div>" +
        "</div></div>" +
      "</div></article>";
  }

  /* ---------- pendulum physics ---------- */
  var K = 9.5, C = 1.25, MAX = 1.15;
  var live = [], awake = new Set(), raf = 0, lastT = 0;

  function Card(el) {
    this.el = el; this.rig = el.querySelector(".hcRig");
    this.th = 0; this.w = 0; this.drag = false; this.target = 0; this.prev = 0; this.vel = 0;
    this.sx = 0; this.sy = 0; this.st = 0; this.moved = 0; this.pid = null; this.seen = false;
  }
  Card.prototype.pivot = function () {
    var r = this.el.getBoundingClientRect(), fs = parseFloat(getComputedStyle(this.el).fontSize) || 14;
    return { x: r.left + r.width / 2, y: r.top + fs * 0.3 };
  };
  Card.prototype.apply = function () { this.rig.style.transform = "rotate(" + this.th.toFixed(4) + "rad)"; };
  Card.prototype.wake = function () { awake.add(this); if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(loop); } };
  Card.prototype.flip = function () {
    var on = this.el.classList.toggle("flipped");
    this.el.setAttribute("aria-pressed", on ? "true" : "false");
    if (!calm) { this.w += (Math.random() < 0.5 ? -1 : 1) * (0.9 + Math.random() * 0.8); this.wake(); }
  };

  function loop(now) {
    raf = 0;
    var dt = Math.min(0.033, (now - lastT) / 1000 || 0.016); lastT = now;
    awake.forEach(function (c) {
      if (c.drag) {
        var prev = c.th;
        c.th += (c.target - c.th) * Math.min(1, dt * 22);
        c.vel = (c.th - prev) / dt;
      } else {
        var acc = -K * Math.sin(c.th) - C * c.w;
        c.w += acc * dt; c.th += c.w * dt;
        if (Math.abs(c.th) < 0.0015 && Math.abs(c.w) < 0.012) { c.th = 0; c.w = 0; awake.delete(c); }
      }
      c.apply();
    });
    if (awake.size) raf = requestAnimationFrame(loop);
  }

  function bind(c) {
    var el = c.el, rig = c.rig;
    function down(e) {
      if (e.button != null && e.button > 0) return;
      c.drag = true; c.pid = e.pointerId; c.sx = e.clientX; c.sy = e.clientY; c.st = performance.now(); c.moved = 0; c.w = 0; c.vel = 0;
      c.target = c.th; el.classList.add("dragging");
      try { rig.setPointerCapture(e.pointerId); } catch (x) {}
      c.wake();
    }
    function move(e) {
      if (c.drag && e.pointerId === c.pid) {
        c.moved = Math.max(c.moved, Math.hypot(e.clientX - c.sx, e.clientY - c.sy));
        var p = c.pivot(), dx = e.clientX - p.x, dy = Math.max(30, e.clientY - p.y);
        c.target = Math.max(-MAX, Math.min(MAX, -Math.atan2(dx, dy)));
        c.wake();
      } else if (!c.drag && !calm && e.pointerType === "mouse" && Math.abs(e.movementX) > 1) {
        c.w = Math.max(-2.2, Math.min(2.2, c.w - e.movementX * 0.010)); c.wake();
      }
    }
    function up(e) {
      if (!c.drag || e.pointerId !== c.pid) return;
      c.drag = false; el.classList.remove("dragging");
      try { rig.releasePointerCapture(e.pointerId); } catch (x) {}
      var tap = c.moved < 8 && performance.now() - c.st < 600;
      if (tap) { c.w = 0; c.flip(); } else { c.w = Math.max(-9, Math.min(9, c.vel * 0.9)); }
      c.wake();
    }
    if (calm) {
      el.addEventListener("click", function () { c.flip(); });
    } else {
      rig.addEventListener("pointerdown", down);
      rig.addEventListener("pointermove", move);
      rig.addEventListener("pointerup", up);
      rig.addEventListener("pointercancel", function (e) { if (c.drag) { c.drag = false; el.classList.remove("dragging"); c.w = 0; c.wake(); } });
    }
    el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); c.flip(); } });
  }

  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var c = en.target._hc;
      if (en.isIntersecting && c && !c.seen) {
        c.seen = true; io.unobserve(en.target);
        if (!calm) { c.th = (Math.random() < 0.5 ? -1 : 1) * (0.10 + Math.random() * 0.14); c.w = 0; c.wake(); }
      }
    });
  }, { threshold: 0.25 }) : null;

  window.renderHangCards = function (host, list, mode) {
    if (!host) return;
    live = live.filter(function (c) { return document.body.contains(c.el); });
    host.innerHTML = list.map(function (p, i) { return cardHTML(p, i, mode); }).join("");
    host.querySelectorAll(".hc").forEach(function (el) {
      var c = new Card(el); el._hc = c; live.push(c); bind(c);
      if (io) io.observe(el);
    });
  };
})();
