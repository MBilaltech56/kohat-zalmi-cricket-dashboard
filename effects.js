/* ==========================================================================
   KOHAT ZALMI — Demon Slayer theme effects (Nezuko x Zenitsu)
   Visual only. Builds falling sakura petals, hearts and thunder sparks.
   Uses only CSS transform/opacity animations so it stays smooth.
   Does not touch any site data or logic.
   ========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var small = window.matchMedia && window.matchMedia("(max-width: 700px)").matches;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }

  /* type: petal (falls, pink)  heart (falls, pink/yellow)  spark (rises, yellow) */
  function build(host, count, opts) {
    if (!host || reduce) return;
    opts = opts || {};
    var speed = opts.speed || 1;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var r = Math.random();
      var type = r < 0.55 ? "petal" : r < 0.78 ? "heart" : "spark";
      var el = document.createElement("i");
      var dur = rnd(11, 20) / speed;
      var size = type === "spark" ? rnd(3, 7) : rnd(opts.minSize || 12, opts.maxSize || 26);
      el.className = "dsP " + type + " " + (type === "spark" ? "" : pick(["a", "b", "a"]));
      if (type === "heart" && Math.random() < 0.45) el.className += " y";
      el.style.setProperty("--x", rnd(-2, 100).toFixed(1) + "%");
      el.style.setProperty("--s", size.toFixed(1) + "px");
      el.style.setProperty("--d", dur.toFixed(1) + "s");
      el.style.setProperty("--dl", (opts.positiveDelay ? rnd(0, 3) : -rnd(0, dur)).toFixed(1) + "s");
      el.style.setProperty("--dr", rnd(-140, 140).toFixed(0) + "px");
      el.style.setProperty("--rot", rnd(-540, 540).toFixed(0) + "deg");
      el.style.setProperty("--o", (opts.opacity || rnd(0.55, 0.95)).toFixed(2));
      frag.appendChild(el);
    }
    host.appendChild(frag);
  }

  function init() {
    build(document.getElementById("dsItems"), small ? 12 : 22);
    build(document.getElementById("dsFront"), small ? 3 : 6, { opacity: 0.5, minSize: 10, maxSize: 20 });
    build(document.getElementById("spItems"), small ? 22 : 38, { speed: 1.6, positiveDelay: true, minSize: 12, maxSize: 30 });
  }

  /* Pause background motion when the tab is hidden (saves battery). */
  document.addEventListener("visibilitychange", function () {
    document.body.classList.toggle("dsPaused", document.hidden);
  });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();


/* ==========================================================================
   Meet Our Team hero: two moving rows of squad photos (visual only)
   ========================================================================== */
function buildTeamReel(roster) {
  var t1 = document.getElementById("tmTrack1"), t2 = document.getElementById("tmTrack2");
  var cnt = document.getElementById("tmCount");
  if (cnt) cnt.textContent = roster.length;
  if (!t1 || !t2 || !roster.length) return;
  function item(p, i) {
    var first = String(p.name || "").replace(/^M\.\s*/, "").split(" ")[0];
    var esc = function (v) { return String(v).replace(/[&<>"']/g, function (m) { return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]; }); };
    return '<span class="tmFace ' + (i % 2 ? "y" : "p") + '"><img src="' + esc(p.photo) + '" alt="" decoding="async"><em>' + esc(first) + '</em></span>';
  }
  function fill(el, list) {
    var once = list.map(item).join("");
    el.innerHTML = once + once;           /* duplicated for a seamless loop */
  }
  fill(t1, roster);
  fill(t2, roster.slice().reverse());
}
window.buildTeamReel = buildTeamReel;

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
