/* ==========================================================================
   KOHAT ZALMI — CRICKET PERFORMANCE DASHBOARD
   Supabase-powered. Data logic, tables and queries are unchanged.
   ========================================================================== */

const SUPABASE_URL = "https://szojybwguxkydkdombqo.supabase.co";
const SUPABASE_KEY = "sb_publishable_yKCdQBSPvkisSWncHbGmBg_-6u9DEyP";
const OWNER_UID = "f62ca7bc-486d-462f-92dd-6415e0e90973";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let state = { players: [], matches: [], photosLoaded: false };
let isAdmin = false;
let supportsInnings = true;
let dataRevision = 0;
let teamRenderedRevision = -1;
let leadersRenderedRevision = -1;
let playerPhotosPromise = null;
let performanceHistory = [];

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const n = v => Number(v || 0);
const esc = v => String(v ?? "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[m]));
const avg = p => n(p.dismissals) ? n(p.runs) / n(p.dismissals) : 0;
const sr = p => n(p.balls) ? n(p.runs) / n(p.balls) * 100 : 0;
const eco = p => n(p.overs) ? n(p.conceded) / n(p.overs) : 0;
const fmt = v => n(v).toFixed(2);

/* ---------- Toasts (replaces blocking alert) ------------------------- */

function toast(msg, kind) {
  const box = $("#toasts");
  if (!box) { console.log(msg); return; }
  const type = kind || (/fail|error|could not|required|invalid|enter a/i.test(String(msg)) ? "err" : "ok");
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.textContent = String(msg);
  box.appendChild(el);
  setTimeout(() => {
    el.classList.add("out");
    setTimeout(() => el.remove(), 300);
  }, 3600);
  while (box.children.length > 3) box.firstElementChild.remove();
}

/* ---------- Small shared renderers ----------------------------------- */

function avatar(p, cls = "") {
  return p.photo
    ? `<div class="avatar ${cls}"><img src="${p.photo}" alt="${esc(p.name)}" loading="lazy"></div>`
    : `<div class="avatar ${cls}">${esc((p.name || "?")[0].toUpperCase())}</div>`;
}

function results() {
  const m = state.matches;
  return {
    w: m.filter(x => x.result === "Won").length,
    l: m.filter(x => x.result === "Lost").length,
    t: m.filter(x => x.result === "Tied").length,
    n: m.filter(x => x.result === "No Result").length
  };
}

function bar(name, pct, val) {
  const w = Math.max(0, Math.min(100, pct));
  return `<div class="bar"><div class="barTop"><span>${esc(name)}</span><b>${esc(val)}</b></div>
    <div class="track"><div class="fill" style="--w:${w}%"></div></div></div>`;
}

/* ---------- Navigation ------------------------------------------------ */

function closeNav() {
  $("#side").classList.remove("open");
  document.body.classList.remove("navOpen");
  $("#backdrop").hidden = true;
  $("#menu").setAttribute("aria-expanded", "false");
}

function openNav() {
  $("#side").classList.add("open");
  document.body.classList.add("navOpen");
  $("#backdrop").hidden = false;
  $("#menu").setAttribute("aria-expanded", "true");
}

function go(page) {
  if (["add", "addPlayer"].includes(page) && !isAdmin) { toast("Admin login is required.", "info"); openAuth(); return; }
  $$(".page").forEach(x => x.classList.toggle("active", x.id === page));
  $$(".nav").forEach(x => x.classList.toggle("active", x.dataset.page === page));
  const titles = {
    dashboard: "Team Dashboard", players: "Players", matches: "Matches", rankings: "Rankings",
    analytics: "Analytics", venues: "Venues", leaders: "The Leaders of Kohat Zalmi", team: "Meet Our Team",
    journey: "Our Journey", add: "Add Performance", addPlayer: "Add Player"
  };
  $("#title").textContent = titles[page] || "Kohat Zalmi";
  $("#desc").textContent = page === "dashboard"
    ? "Kohat Zalmi performance center"
    : isAdmin ? "Kohat Zalmi • admin connected" : "Kohat Zalmi • public view";
  closeNav();
  render();
  window.scrollTo(0, 0);
}

/* ---------- Render ---------------------------------------------------- */

function renderDashboard() {
  const p = state.players || [], m = state.matches || [], r = results();
  const runs = p.reduce((a, x) => a + n(x.runs), 0);
  const wk = p.reduce((a, x) => a + n(x.wickets), 0);
  const pct = m.length ? r.w / m.length * 100 : 0;

  $("#summary").innerHTML = [
    ["Players", p.length, "Team squad"],
    ["Matches", m.length, "Recorded matches"],
    ["Total Runs", runs, "All players"],
    ["Total Wickets", wk, "All bowlers"]
  ].map((x, i) => `<div class="stat reveal" style="--d:${i * 70}ms"><div class="label">${x[0]}</div><div class="value">${x[1]}</div><small>${x[2]}</small></div>`).join("");

  $("#wins").textContent = r.w;
  $("#losses").textContent = r.l;
  $("#ties").textContent = r.t;
  $("#nr").textContent = r.n;
  $("#circle").textContent = fmt(pct) + "%";
  $("#circle").style.setProperty("--pct", pct.toFixed(2));

  $("#bars").innerHTML =
    bar("Win rate", pct, fmt(pct) + "%") +
    bar("Matches played", Math.min(100, m.length * 10), m.length) +
    bar("Squad active", p.length ? 100 : 0, p.length + " players");

  const top = [...p].sort((a, b) => n(b.runs) - n(a.runs)).slice(0, 5);
  $("#top").innerHTML = top.map((x, i) => `<div class="performer" style="animation-delay:${i * 60}ms">${avatar(x)}<div class="grow"><b>${esc(x.name)}</b><small>${esc(x.role)} • #${esc(x.jersey)} • ${n(x.matches)} matches</small></div><b>${n(x.runs)}</b></div>`).join("") || `<div class="muted">No players yet.</div>`;

  $("#recent").innerHTML = [...m].sort((a, b) => String(b.date).localeCompare(String(a.date))).slice(0, 5)
    .map((x, i) => `<div class="performer" style="animation-delay:${i * 60}ms"><div class="grow"><b>${esc(x.opponent)}</b><small>${esc(x.date)} • ${esc(x.venue)}</small></div><b>${esc(x.result)}</b></div>`).join("") || `<div class="muted">No matches yet.</div>`;

  animateNumbers();
  observeReveals($("#dashboard"));
}

function render() {
  const active = $(".page.active")?.id || "dashboard";
  if (active === "dashboard") renderDashboard();
  else if (active === "players") {
    renderPlayers();
    ensurePlayerPhotos();
  }
  else if (active === "matches") renderMatches();
  else if (active === "rankings") renderRankings();
  else if (active === "analytics") { renderAnalytics(); observeReveals($("#analytics")); }
  else if (active === "venues") { renderVenues(); observeReveals($("#venues")); }
  else if (active === "team") renderTeam();
  else if (active === "leaders") renderLeaders();
  else if (active === "journey") observeReveals($("#journey"));
  fillPlayerSelect();
  updateAccessUI();
}

/* ---------- Players ---------------------------------------------------- */

const TEAM_ROSTER = [
  {name:"M. Usman", role:"Bowler", bowling:"Right-Arm Fast Bowler", batting:"", photo:"assets/team/M.Usman-RA_Fast_Bowler.webp"},
  {name:"Sikander", role:"Bowler", bowling:"Right-Arm Fast Bowler", batting:"", photo:"assets/team/Sikander-RA_Fast_Bowler.webp"},
  {name:"Awais Jameel", role:"All-Rounder", bowling:"Right-Arm Off-Break Bowler", batting:"Right-Hand Batsman", photo:"assets/team/Awais-Jameel-All-Rounder.webp"},
  {name:"M. Luqman", role:"All-Rounder", bowling:"Right-Arm Fast Bowler", batting:"Right-Hand Batsman", photo:"assets/team/M.Luqman-RA_Fast_Bowler-RH_Batsman.webp"},
  {name:"Janzaib", role:"Wicket Keeper • Batsman", bowling:"", batting:"Batsman", photo:"assets/team/Janzaib-WK_Batsman.webp"},
  {name:"Sohail", role:"Batsman", bowling:"", batting:"Right-Hand Batsman", photo:"assets/team/Sohail-RH_Batsman.webp"},
  {name:"Farhan", role:"Bowler", bowling:"Left-Arm Wrist Spinner", batting:"", photo:"assets/team/Farhan-LA_Wrist_Spiner.webp"},
  {name:"Adnan", role:"All-Rounder", bowling:"Right-Arm Fast Bowler", batting:"Right-Hand Batsman", photo:"assets/team/Adnan-RA_Fast_Bowler-RH_Batsman.webp"},
  {name:"Shahzad", role:"All-Rounder", bowling:"Right-Arm Off-Break Bowler", batting:"Right-Hand Batsman", photo:"assets/team/Shahzad-RA_Off_Break-RH_Batsman.webp"},
  {name:"Naimat", role:"Bowler", bowling:"Right-Arm Leg-Break Bowler", batting:"", photo:"assets/team/Naimat-RA_Leg_Break.webp"},
  {name:"M. Bilal", role:"All-Rounder", bowling:"Right-Arm Slow Wrist Spinner", batting:"Right-Hand Batsman", captain:"Vice Captain", jersey:"56", photo:"assets/team/M.Bilal-RH_Slow_Wrist_Spiner-RH_Batsman-Vice_Captain.webp"},
  {name:"M. Jibran", role:"All-Rounder", bowling:"Right-Arm Fast Bowler", batting:"Right-Hand Batsman", captain:"Captain", jersey:"07", photo:"assets/team/M.Jibran-RA_Fast_Bowler-RH_Batsman-Captain.webp"},
  {name:"Maidad", role:"Wicket Keeper • Batsman", bowling:"", batting:"Batsman", photo:"assets/team/Maidad-WK_Batsman.webp"},
  {name:"SanaUllah", role:"Bowler", bowling:"Right-Arm Fast Bowler", batting:"", photo:"assets/team/SanaUllah-RA_Fast_Bowler.webp"},
  {name:"Shahab", role:"Batsman", bowling:"", batting:"Right-Hand Batsman", photo:"assets/team/Shahab-RH_Batsman.webp"}
];

function renderTeam() {
  const grid = $("#teamGrid");
  if (!grid) return;
  if (teamRenderedRevision === dataRevision && grid.children.length) return;
  $("#teamCount").textContent = TEAM_ROSTER.length + " Players";
  if (typeof buildTeamReel === "function") buildTeamReel(TEAM_ROSTER);
  if (typeof renderHangCards === "function") {
    renderHangCards(grid, TEAM_ROSTER, "team");
  } else {
    grid.innerHTML = TEAM_ROSTER.map((p,i) => `
      <article class="teamPlayerCard" style="--delay:${Math.min(i,11)*55}ms">
        <div class="teamCardGlow"></div><div class="teamPhotoFrame"><div class="teamPhotoHalo"></div>
          <img src="${esc(p.photo)}" alt="${esc(p.name)}" loading="lazy" decoding="async">
          ${p.captain ? `<span class="teamCaptainBadge ${p.captain === "Captain" ? "isCaptain" : "isVice"}">${esc(p.captain)}</span>` : ""}
        </div><div class="teamCardBody"><div class="teamRole">${esc(p.role)}</div><h3>${esc(p.name)}</h3>
          ${p.jersey ? `<div class="teamJersey">#${esc(p.jersey)}</div>` : ""}
          <div class="teamInfoList">${p.batting ? `<span><b>BAT</b>${esc(p.batting)}</span>` : ""}${p.bowling ? `<span><b>BOWL</b>${esc(p.bowling)}</span>` : ""}</div>
        </div>
      </article>`).join("");
  }
  teamRenderedRevision = dataRevision;
}

function renderLeaders() {
  const host = $("#leaderHang");
  if (!host || (leadersRenderedRevision === dataRevision && host.children.length)) return;
  const leaders = TEAM_ROSTER.filter(p => p.captain).sort((a, b) => (a.captain === "Captain" ? -1 : 1) - (b.captain === "Captain" ? -1 : 1));
  if (typeof renderHangCards === "function") renderHangCards(host, leaders, "leader");
  leadersRenderedRevision = dataRevision;
}

function renderPlayers() {
  const q = ($("#search")?.value || "").toLowerCase();
  const role = $("#role")?.value || "all";
  const p = state.players.filter(x => String(x.name || "").toLowerCase().includes(q) && (role === "all" || x.role === role));
  $("#playerGrid").innerHTML = p.map((x, i) => `<div class="playerCard" style="animation-delay:${Math.min(i, 8) * 50}ms" tabindex="0" aria-label="View details for ${esc(x.name)}" onclick="showPlayer('${String(x.id)}')">
    <div class="playerTop">${avatar(x)}<div class="grow"><h3>${esc(x.name)}</h3><small>${esc(x.role)} • #${esc(x.jersey)}</small></div></div>
    <div class="mini playerStats">
      <div><b>${n(x.matches)}</b><small>Matches</small></div>
      <div><b>${n(x.innings)}</b><small>Innings</small></div>
      <div><b>${n(x.runs)}</b><small>Runs</small></div>
      <div><b>${fmt(avg(x))}</b><small>Avg</small></div>
      <div><b>${fmt(sr(x))}</b><small>SR</small></div>
      <div><b>${n(x.wickets)}</b><small>Wkts</small></div>
      <div><b>${n(x.overs) ? fmt(eco(x)) : "—"}</b><small>Eco</small></div>
    </div>
    ${isAdmin ? `<div class="actions"><button class="action" onclick="event.stopPropagation();editPlayer('${String(x.id)}')">Edit</button><button class="action danger" onclick="event.stopPropagation();deletePlayer('${String(x.id)}')">Delete</button></div>` : ""}
  </div>`).join("") || `<div class="muted">No players found.</div>`;
}

function showPlayer(id) {
  const p = state.players.find(x => String(x.id) === String(id));
  if (!p) return;
  $("#playerDetail").innerHTML = `<div class="detailHead">${avatar(p, "large")}<div><h2>${esc(p.name)}</h2><p>${esc(p.role)} • #${esc(p.jersey)}</p></div></div>
    <div class="mini">
      <div><b>${n(p.matches)}</b><small>Matches</small></div>
      <div><b>${n(p.innings)}</b><small>Innings</small></div>
      <div><b>${n(p.runs)}</b><small>Runs</small></div>
      <div><b>${n(p.wickets)}</b><small>Wickets</small></div>
    </div>
    <p>Average <b>${fmt(avg(p))}</b> • Strike Rate <b>${fmt(sr(p))}</b> • Economy <b>${n(p.overs) ? fmt(eco(p)) : "—"}</b></p>
    ${isAdmin ? `<div class="actions"><button class="primary" onclick="editPlayer('${String(p.id)}')">Edit Player</button><button class="action danger" onclick="deletePlayer('${String(p.id)}');closePlayerModal()">Delete Player</button></div>` : ""}`;
  openModal("#playerModal");
}

function closePlayerModal() { closeModal("#playerModal"); }

function editPlayer(id) {
  if (!isAdmin) return toast("Admin login required.", "info");
  const p = state.players.find(x => String(x.id) === String(id));
  if (!p) return;
  const f = $("#editPlayerForm");
  const setField = (name, value) => {
    const field = f.elements.namedItem(name);
    if (field) field.value = value ?? "";
  };
  setField("id", String(p.id));
  setField("name", p.name || "");
  setField("jersey", p.jersey || "");
  setField("role", p.role || "");
  setField("matches", n(p.matches));
  setField("innings", n(p.innings));
  closeModal("#playerModal");
  openModal("#editPlayerModal");
}

async function deletePlayer(id) {
  if (!isAdmin) return toast("Admin login required.", "info");
  const p = state.players.find(x => String(x.id) === String(id));
  if (!p || !confirm(`Delete ${p.name}? This cannot be undone.`)) return;
  const { error } = await db.from("kohat zalmi").delete().eq("id", id);
  if (error) return toast("Delete failed: " + error.message, "err");
  state.players = state.players.filter(x => String(x.id) !== String(id));
  dataRevision++; teamRenderedRevision = -1; leadersRenderedRevision = -1;
  closePlayerModal(); render(); toast("Player deleted.");
}

/* ---------- Matches ---------------------------------------------------- */

function renderMatches() {
  const season = $("#season")?.value || "all";
  const m = state.matches.filter(x => season === "all" || String(x.date || "").startsWith(season));
  $("#matchTable").innerHTML = m.length ? m.map(x => `<tr>
    <td data-label="Date">${esc(x.date)}</td>
    <td data-label="Opponent"><b>${esc(x.opponent)}</b></td>
    <td data-label="Venue">${esc(x.venue)}</td>
    <td data-label="Result" class="${x.result === "Won" ? "win" : x.result === "Lost" ? "loss" : ""}">${esc(x.result)}</td>
    <td data-label="Score">${esc(x.score)}</td>
    <td data-label="Best Performance"><div class="matchBest">
      <span><b>🏏 Best Batter</b> ${esc(x.best_batter || "—")} ${x.best_batter_runs != null ? `• ${n(x.best_batter_runs)} runs${x.best_batter_balls != null ? ` off ${n(x.best_batter_balls)} balls` : ""}${x.best_batter_balls ? ` • SR ${fmt(n(x.best_batter_runs) / n(x.best_batter_balls) * 100)}` : ""}` : ""}</span>
      <span><b>🎯 Best Bowler</b> ${esc(x.best_bowler || "—")} ${x.best_bowler_wickets != null ? `• ${n(x.best_bowler_wickets)} wkts${x.best_bowler_overs != null ? ` in ${n(x.best_bowler_overs)} ov` : ""}${x.best_bowler_runs != null ? ` • ${n(x.best_bowler_runs)} runs` : ""}${x.best_bowler_overs ? ` • Eco ${fmt(n(x.best_bowler_runs) / n(x.best_bowler_overs))}` : ""}` : ""}</span>
    </div></td>
    <td data-label="Action">${isAdmin ? `<div class="actions"><button class="action" onclick="editMatch('${String(x.id)}')">Edit</button><button class="action danger" onclick="deleteMatch('${String(x.id)}')">Delete</button></div>` : "View"}</td>
  </tr>`).join("") : `<tr><td colspan="7">No matches recorded.</td></tr>`;

  const years = [...new Set(state.matches.map(x => String(x.date || "").slice(0, 4)).filter(Boolean))];
  const cur = $("#season").value;
  $("#season").innerHTML = '<option value="all">All seasons</option>' + years.map(y => `<option value="${y}">${y}</option>`).join("");
  $("#season").value = years.includes(cur) ? cur : "all";
}

function editMatch(id) {
  if (!isAdmin) return toast("Admin login required.", "info");
  const m = state.matches.find(x => String(x.id) === String(id));
  if (!m) return;
  const f = $("#editMatchForm");
  const setField = (name, value) => {
    const field = f.elements.namedItem(name);
    if (field) field.value = value ?? "";
  };
  setField("id", String(m.id));
  setField("date", m.date || "");
  setField("opponent", m.opponent || "");
  setField("venue", m.venue || "");
  setField("result", m.result || "Won");
  setField("score", m.score || "");
  openModal("#editMatchModal");
}

async function deleteMatch(id) {
  if (!isAdmin) return toast("Admin login required.", "info");
  if (!confirm("Delete this match? This cannot be undone.")) return;
  const { error } = await db.from("matches").delete().eq("id", id);
  if (error) return toast("Delete failed: " + error.message, "err");
  state.matches = state.matches.filter(x => String(x.id) !== String(id));
  render(); toast("Match deleted.");
}

/* ---------- Rankings ---------------------------------------------------- */

/* ---- ranking cards ---- */
let rankSort = "all";
const RK_SORTS = {
  all:  { label: "POWER",      val: p => n(p.runs) + 20 * n(p.wickets), show: v => Math.round(v) + " BP", dir: -1 },
  runs: { label: "RUNS",        val: p => n(p.runs),                      show: v => String(v), dir: -1 },
  wkts: { label: "WICKETS",     val: p => n(p.wickets),                   show: v => String(v), dir: -1 },
  avg:  { label: "AVERAGE",     val: p => avg(p),                         show: v => fmt(v), dir: -1 },
  sr:   { label: "STRIKE RATE", val: p => sr(p),                          show: v => fmt(v), dir: -1 },
  eco:  { label: "ECONOMY",     val: p => eco(p),                         show: v => fmt(v), dir: 1, only: p => n(p.overs) > 0 }
};

function rkPhoto(p) {
  if (p.photo) return p.photo;
  const r = TEAM_ROSTER.find(x => String(x.name).toLowerCase().replace(/^m\.\s*/, "") === String(p.name || "").toLowerCase().replace(/^m\.\s*/, ""));
  return r ? r.photo : "";
}
function rkAva(p, cls = "") {
  const src = rkPhoto(p);
  return `<div class="rkAva ${cls}">${src ? `<img src="${esc(src)}" alt="" loading="lazy" draggable="false">` : `<b>${esc((p.name || "?")[0].toUpperCase())}</b>`}</div>`;
}

function rkTop(a, val, label) {
  if (!a.length) return `<p class="rkEmpty">No players yet.</p>`;
  const [f, ...rest] = a.slice(0, 3);
  return `<div class="rkLead">
      ${rkAva(f)}
      <div class="rkLeadInfo"><span class="rkCrown">♛ No.1</span><h4>${esc(f.name)}</h4><small>${esc(f.role)}</small></div>
      <div class="rkBig"><b>${val(f)}</b><small>${label}</small></div>
    </div>` + rest.map((p, i) => `<div class="rkNext"><i>${i + 2}</i>${rkAva(p, "sm")}<span>${esc(p.name)}</span><b>${val(p)}<small>${label}</small></b></div>`).join("");
}

function renderRankings() {
  const bat = [...state.players].sort((a, b) => n(b.runs) - n(a.runs));
  const bowl = [...state.players].sort((a, b) => n(b.wickets) - n(a.wickets));
  const ar = [...state.players]
    .filter(x => String(x.role || "").toLowerCase().replace(/[ -]/g, "") === "allrounder")
    .sort((a, b) => n(b.runs) + 20 * n(b.wickets) - n(a.runs) - 20 * n(a.wickets));
  $("#bat").innerHTML = rkTop(bat, p => n(p.runs), "RUNS");
  $("#bowl").innerHTML = rkTop(bowl, p => n(p.wickets), "WKTS");
  $("#ar").innerHTML = rkTop(ar, p => `${n(p.runs)}/${n(p.wickets)}`, "RUNS/WKTS");

  document.querySelectorAll(".rkChip").forEach(c => {
    const on = c.dataset.sort === rankSort;
    c.classList.toggle("on", on); c.setAttribute("aria-selected", on ? "true" : "false");
  });
  const S = RK_SORTS[rankSort] || RK_SORTS.all;
  const list = state.players.filter(S.only || (() => true)).sort((a, b) => S.dir * (S.val(b) - S.val(a)) * -1);
  const vals = list.map(S.val);
  const best = S.dir === 1 ? Math.min(...vals) : Math.max(...vals);
  const pctOf = v => !list.length ? 0 : S.dir === 1 ? (v ? Math.max(8, best / v * 100) : 100) : (best ? Math.max(6, v / best * 100) : 6);
  const tile = (k, v, l) => `<div class="${S.label.startsWith(l) || (k && k === rankSort) ? "on" : ""}"><b>${v}</b><small>${l}</small></div>`;
  $("#rankList").innerHTML = list.map((p, i) => `
    <article class="rkCard ${i < 3 ? "m" + (i + 1) : ""}" style="--i:${i};--pct:${pctOf(S.val(p)).toFixed(1)}%">
      <div class="rkRank"><b>${i + 1}</b>${i === 0 ? "<em>♛</em>" : ""}</div>
      ${rkAva(p)}
      <div class="rkMain"><h4>${esc(p.name)}</h4><span class="rkRole">${esc(p.role || "Player")}</span></div>
      <div class="rkScore"><b>${S.show(S.val(p))}</b><small>${S.label}</small></div>
      <div class="rkBar"><u></u></div>
      <div class="rkStats">
        ${tile("runs", n(p.runs), "RUNS")}${tile("innings", n(p.innings), "INNINGS")}${tile("avg", fmt(avg(p)), "AVG")}
        ${tile("sr", fmt(sr(p)), "SR")}${tile("wkts", n(p.wickets), "WKTS")}${tile("eco", n(p.overs) ? fmt(eco(p)) : "—", "ECO")}${tile("", n(p.matches), "MATCHES")}
      </div>
    </article>`).join("") || `<p class="rkEmpty">No players to rank yet.</p>`;
}

document.addEventListener("click", e => {
  const c = e.target.closest && e.target.closest(".rkChip");
  if (!c) return;
  rankSort = c.dataset.sort || "all";
  renderRankings();
});

/* ---------- Analytics ---------------------------------------------------- */

function renderAnalytics() {
  const r = results(), m = state.matches, total = Math.max(1, m.length);
  const best = [...state.players].sort((a, b) => sr(b) - sr(a))[0];
  $("#analyticsCards").innerHTML = [
    ["Win Rate", fmt(r.w / total * 100) + "%", "Overall"],
    ["Wins", r.w, "Matches won"],
    ["Losses", r.l, "Matches lost"],
    ["Best SR", best ? fmt(sr(best)) : "—", best?.name || ""]
  ].map((x, i) => `<div class="stat reveal" style="--d:${i * 70}ms"><div class="label">${x[0]}</div><div class="value">${x[1]}</div><small>${esc(x[2])}</small></div>`).join("");

  $("#resultBars").innerHTML = bar("Won", r.w / total * 100, r.w) + bar("Lost", r.l / total * 100, r.l) + bar("Tied", r.t / total * 100, r.t) + bar("No Result", r.n / total * 100, r.n);

  const runs = state.players.reduce((a, p) => a + n(p.runs), 0);
  const wk = state.players.reduce((a, p) => a + n(p.wickets), 0);
  $("#performanceBars").innerHTML = bar("Total runs", Math.min(100, runs / 5), runs) + bar("Total wickets", Math.min(100, wk * 5), wk);

  $("#efficiency").innerHTML = [...state.players]
    .sort((a, b) => n(b.runs) + 15 * n(b.wickets) - n(a.runs) - 15 * n(a.wickets))
    .slice(0, 8)
    .map(p => bar(p.name, Math.min(100, n(p.runs) / 3 + n(p.wickets) * 3), `${n(p.runs)} runs • ${n(p.wickets)} wkts`))
    .join("") || `<div class="muted">No player data yet.</div>`;
}

/* ---------- Venues ------------------------------------------------------- */

function renderVenues() {
  const map = {};
  state.matches.forEach(m => {
    const v = m.venue || "Unknown";
    map[v] ??= { m: 0, w: 0 };
    map[v].m++;
    if (m.result === "Won") map[v].w++;
  });
  const a = Object.entries(map);
  $("#venueCards").innerHTML = a.map(([v, x], i) => `<div class="stat reveal" style="--d:${Math.min(i, 8) * 60}ms"><div class="label">VENUE</div><div class="value">${esc(v)}</div><small>${x.m} matches • ${fmt(x.w / x.m * 100)}% wins</small></div>`).join("") || `<div class="muted">No venue data.</div>`;
  $("#venueTable").innerHTML = a.map(([v, x]) => `<tr><td data-label="Venue"><b>${esc(v)}</b></td><td data-label="Matches">${x.m}</td><td data-label="Wins">${x.w}</td><td data-label="Win Rate">${fmt(x.w / x.m * 100)}%</td></tr>`).join("") || `<tr><td colspan="4">No venue data.</td></tr>`;
}

/* ---------- Access / selects --------------------------------------------- */

function fillPlayerSelect() {
  $("#perfPlayer").innerHTML = state.players.map(p => `<option value="${String(p.id)}">${esc(p.name)} — ${esc(p.role)} (#${esc(p.jersey)})</option>`).join("") || `<option value="">No players — add a player first</option>`;
}


function ensurePlayerPhotos() {
  if (state.photosLoaded || playerPhotosPromise) return playerPhotosPromise;
  playerPhotosPromise = db.from("kohat zalmi").select("id,photo").then(({ data, error }) => {
    if (error) { console.warn("Player photos could not be loaded:", error.message); return; }
    const byId = new Map((data || []).map(x => [String(x.id), x.photo || ""]));
    state.players.forEach(p => { if (byId.has(String(p.id))) p.photo = byId.get(String(p.id)); });
    state.photosLoaded = true;
    if ($(".page.active")?.id === "players") renderPlayers();
  }).catch(err => console.warn("Player photos could not be loaded:", err));
  return playerPhotosPromise;
}

function fillBestPlayerSelects() {
  const opts = '<option value="">Select player</option>' + state.players.map(p => `<option value="${esc(p.name)}">${esc(p.name)} • #${esc(p.jersey)}</option>`).join("");
  if ($("#bestBatterSelect")) $("#bestBatterSelect").innerHTML = opts;
  if ($("#bestBowlerSelect")) $("#bestBowlerSelect").innerHTML = opts;
}

function updateAccessUI() {
  $$(".admin").forEach(x => x.classList.toggle("hide", !isAdmin));
  $("#login").classList.toggle("hide", isAdmin);
  $("#logout").classList.toggle("hide", !isAdmin);
  $("#badge").textContent = isAdmin ? "🔐 Admin Access" : "👁️ Visitor View";
}

/* ---------- Modals -------------------------------------------------------- */

let lastFocused = null;

function openModal(sel) {
  const el = typeof sel === "string" ? $(sel) : sel;
  if (!el) return;
  lastFocused = document.activeElement;
  el.classList.add("show");
  document.body.classList.add("modalOpen");
  setTimeout(() => {
    const focusable = el.querySelector("input:not([type=hidden]),select,textarea,button.primary,.x");
    focusable?.focus();
  }, 60);
}

function closeModal(sel) {
  const el = typeof sel === "string" ? $(sel) : sel;
  if (!el) return;
  el.classList.remove("show");
  if (!$(".modal.show")) document.body.classList.remove("modalOpen");
  if (lastFocused && document.contains(lastFocused)) { try { lastFocused.focus(); } catch (e) { } }
}

function openAuth() { $("#authError").textContent = ""; openModal("#auth"); }
function closeAuth() { closeModal("#auth"); }

/* ---------- Animation helpers --------------------------------------------- */

const countMemo = Object.create(null);

function countUp(el, key) {
  const text = el.textContent;
  if (countMemo[key] === text) return;
  countMemo[key] = text;
  const m = text.match(/^([^\d-]*)(-?[\d,]*\.?\d+)(.*)$/);
  if (!m) return;
  const raw = m[2].replace(/,/g, "");
  const target = Number(raw);
  if (!Number.isFinite(target)) return;
  const grouped = m[2].includes(",");
  const decimals = (raw.split(".")[1] || "").length;
  const format = v => {
    const num = decimals ? v.toFixed(decimals) : String(Math.round(v));
    return m[1] + (grouped ? Number(num).toLocaleString("en-PK", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : num) + m[3];
  };
  const duration = 850, t0 = performance.now();
  const step = now => {
    const k = Math.min(1, (now - t0) / duration);
    const eased = 1 - Math.pow(1 - k, 3);
    el.textContent = format(target * eased);
    if (k < 1) requestAnimationFrame(step); else el.textContent = text;
  };
  requestAnimationFrame(step);
}

function animateNumbers() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  $$("#summary .stat").forEach((s, i) => {
    const v = s.querySelector(".value");
    if (v) countUp(v, "summary" + i);
  });
  ["#wins", "#losses", "#ties", "#nr"].forEach(id => {
    const el = $(id); if (el) countUp(el, id);
  });
}

let revealObserver = null;
function observeReveals(root = document) {
  if (!root) return;
  if (!("IntersectionObserver" in window)) {
    root.querySelectorAll(".reveal,.journeyReveal").forEach(el => el.classList.add("in"));
    return;
  }
  revealObserver ??= new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); revealObserver.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
  root.querySelectorAll(".reveal:not(.in),.journeyReveal:not(.in)").forEach(el => revealObserver.observe(el));
}

/* ---------- Theme ---------------------------------------------------------- */

function applyTheme(night) {
  document.body.classList.toggle("night", night);
  $("#themeIcon").textContent = night ? "☀️" : "🌙";
  $("#theme").setAttribute("aria-label", night ? "Switch to day mode" : "Switch to night mode");
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", night ? "#0c0614" : "#fff1f7");
}

// Saved preference is respected exactly; night is the default when nothing is saved.
applyTheme(localStorage.kzTheme !== "day");

$("#theme").addEventListener("click", () => {
  const night = !document.body.classList.contains("night");
  applyTheme(night);
  localStorage.kzTheme = night ? "night" : "day";
});

/* ---------- Event wiring ---------------------------------------------------- */

$$(".nav").forEach(b => b.addEventListener("click", () => go(b.dataset.page)));
$$("[data-go]").forEach(b => b.addEventListener("click", () => go(b.dataset.go)));
$$("main [data-page]").forEach(b => b.addEventListener("click", () => go(b.dataset.page)));

$("#menu").addEventListener("click", () => {
  if ($("#side").classList.contains("open")) closeNav(); else openNav();
});
$("#backdrop").addEventListener("click", closeNav);

$("#login").addEventListener("click", openAuth);
$("#closeAuth").addEventListener("click", closeAuth);
$("#closeMatch").addEventListener("click", () => closeModal("#matchModal"));
$("#closePlayer").addEventListener("click", closePlayerModal);
$("#closeEditPlayer").addEventListener("click", () => closeModal("#editPlayerModal"));
$("#closeEditMatch").addEventListener("click", () => closeModal("#editMatchModal"));

$("#addMatch").addEventListener("click", () => {
  if (isAdmin) { fillBestPlayerSelects(); openModal("#matchModal"); } else openAuth();
});

// Close a modal by clicking its backdrop, or with Escape.
$$(".modal").forEach(mod => mod.addEventListener("click", e => { if (e.target === mod) closeModal(mod); }));
document.addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  const open = [...$$(".modal.show")].pop();
  if (open) { closeModal(open); return; }
  if ($("#side").classList.contains("open")) closeNav();
});

// Keyboard access for player cards.
$("#playerGrid").addEventListener("keydown", e => {
  const card = e.target.closest(".playerCard");
  if (!card) return;
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.click(); }
});

$("#search").addEventListener("input", () => { renderPlayers(); });
$("#role").addEventListener("change", renderPlayers);
$("#season").addEventListener("change", renderMatches);

/* ---------- Forms ------------------------------------------------------------ */

$("#loginForm").addEventListener("submit", async e => {
  e.preventDefault();
  const { data, error } = await db.auth.signInWithPassword({ email: $("#email").value.trim(), password: $("#password").value });
  if (error) { $("#authError").textContent = error.message; return; }
  if (String(data.user.id) !== OWNER_UID) {
    await db.auth.signOut();
    $("#authError").textContent = "This account is view-only. Only the owner account can edit data.";
    return;
  }
  isAdmin = true; closeAuth(); updateAccessUI(); render(); toast("Admin logged in successfully.");
});

$("#logout").addEventListener("click", async () => {
  await db.auth.signOut(); isAdmin = false; updateAccessUI(); render(); toast("Logged out.", "info");
});


/* ---------- Individual performance history / Undo / Redo ---------- */

const PERFORMANCE_TABLE = "player_performances";
const performanceFields = ["matches", "innings", "runs", "balls", "dismissals", "overs", "conceded", "wickets"];

function performanceDelta(formData) {
  const didBat = formData.get("batted") === "on" || n(formData.get("runs")) > 0 || n(formData.get("balls")) > 0;
  return {
    matches: 1,
    innings: didBat ? 1 : 0,
    runs: n(formData.get("runs")),
    balls: n(formData.get("balls")),
    dismissals: n(formData.get("dismissed")),
    overs: n(formData.get("overs")),
    conceded: n(formData.get("conceded")),
    wickets: n(formData.get("wickets"))
  };
}

function renderPerformanceHistory() {
  const host = $("#performanceHistory");
  if (!host) return;
  if (!performanceHistory.length) {
    host.innerHTML = '<p class="muted">No performance records yet. New saved performances will appear here.</p>';
    return;
  }
  host.innerHTML = `<div class="tableWrap"><table><thead><tr><th>Player</th><th>Date</th><th>Batting</th><th>Bowling</th><th>Status</th><th>Action</th></tr></thead><tbody>${
    performanceHistory.map(r => {
      const active = !r.is_undone;
      return `<tr>
        <td data-label="Player"><b>${esc(r.player_name || playerName(r.player_id))}</b></td>
        <td data-label="Date">${esc(r.created_at ? new Date(r.created_at).toLocaleString() : "—")}</td>
        <td data-label="Batting">${n(r.runs)} runs / ${n(r.balls)} balls</td>
        <td data-label="Bowling">${n(r.wickets)} wkts / ${n(r.overs)} ov / ${n(r.conceded)} runs</td>
        <td data-label="Status"><span class="statusPill">${active ? "Active" : "Undone"}</span></td>
        <td data-label="Action">${isAdmin ? (active
          ? `<button class="action danger" onclick="undoPerformance('${String(r.id)}')">Undo</button>`
          : `<button class="action" onclick="redoPerformance('${String(r.id)}')">Redo</button>`) : "Admin only"}</td>
      </tr>`;
    }).join("")
  }</tbody></table></div>`;
}
function playerName(id) {
  const p = state.players.find(x => String(x.id) === String(id));
  return p ? p.name : "Unknown player";
}
async function loadPerformanceHistory() {
  const { data, error } = await db.from(PERFORMANCE_TABLE).select("*").order("created_at", { ascending: false }).limit(100);
  if (error) {
    const host = $("#performanceHistory");
    if (host) host.innerHTML = '<p class="muted">Run SUPABASE_UNDO_REDO_SETUP.sql in Supabase SQL Editor to enable performance history.</p>';
    return;
  }
  performanceHistory = data || [];
  renderPerformanceHistory();
}
async function changePlayerTotals(record, direction) {
  const p = state.players.find(x => String(x.id) === String(record.player_id));
  if (!p) throw new Error("The player for this performance was not found. No changes were made.");
  const payload = {};
  for (const field of performanceFields) {
    if (field === "innings" && !supportsInnings) continue;
    payload[field] = Math.max(0, n(p[field]) + direction * n(record[field]));
  }
  const { data, error } = await db.from("kohat zalmi").update(payload).eq("id", p.id).select().single();
  if (error) throw error;
  Object.assign(p, data);
}
async function undoPerformance(id) {
  if (!isAdmin) return toast("Admin login required.", "info");
  const record = performanceHistory.find(x => String(x.id) === String(id));
  if (!record || record.is_undone) return;
  if (!confirm(`Undo ${record.player_name || playerName(record.player_id)}'s performance?`)) return;
  try {
    await changePlayerTotals(record, -1);
    const { error } = await db.from(PERFORMANCE_TABLE).update({ is_undone: true, undone_at: new Date().toISOString() }).eq("id", record.id).eq("is_undone", false);
    if (error) {
      await changePlayerTotals(record, 1);
      throw error;
    }
    record.is_undone = true;
    dataRevision++; teamRenderedRevision = -1; leadersRenderedRevision = -1;
    render(); renderPerformanceHistory();
    toast("Performance undone. Player's totals have been updated.");
  } catch (err) { toast("Undo failed: " + err.message, "err"); }
}
async function redoPerformance(id) {
  if (!isAdmin) return toast("Admin login required.", "info");
  const record = performanceHistory.find(x => String(x.id) === String(id));
  if (!record || !record.is_undone) return;
  if (!confirm(`Redo ${record.player_name || playerName(record.player_id)}'s performance?`)) return;
  try {
    await changePlayerTotals(record, 1);
    const { error } = await db.from(PERFORMANCE_TABLE).update({ is_undone: false, undone_at: null }).eq("id", record.id).eq("is_undone", true);
    if (error) {
      await changePlayerTotals(record, -1);
      throw error;
    }
    record.is_undone = false;
    dataRevision++; teamRenderedRevision = -1; leadersRenderedRevision = -1;
    render(); renderPerformanceHistory();
    toast("Performance restored successfully.");
  } catch (err) { toast("Redo failed: " + err.message, "err"); }
}
window.undoPerformance = undoPerformance;
window.redoPerformance = redoPerformance;

$("#playerForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!isAdmin) return openAuth();
  const f = new FormData(e.target), file = f.get("photo");
  let photo = "";
  if (file && file.size) photo = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file);
  });
  const p = {
    name: String(f.get("name") || "").trim(),
    jersey: String(f.get("jersey") || "").trim(),
    role: String(f.get("role") || ""),
    photo, matches: 0, runs: 0, balls: 0, dismissals: 0, overs: 0, conceded: 0, wickets: 0
  };
  if (supportsInnings) p.innings = 0;
  if (!p.name) return toast("Enter a player name.", "err");
  const { data, error } = await db.from("kohat zalmi").insert([p]).select().single();
  if (error) return toast("Could not add player: " + error.message, "err");
  state.players.push(data); dataRevision++; teamRenderedRevision = -1; leadersRenderedRevision = -1;
  if (photo) p.photo = photo;
  e.target.reset(); render(); go("players"); toast("Player added successfully.");
});

$("#perfForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!isAdmin) return openAuth();
  const f = new FormData(e.target);
  const p = state.players.find(x => String(x.id) === String(f.get("player")));
  if (!p) return toast("Add a player first.", "err");
  const d = performanceDelta(f);
  const record = {
    player_id: String(p.id),
    player_name: p.name,
    runs: d.runs, balls: d.balls, dismissals: d.dismissals,
    overs: d.overs, conceded: d.conceded, wickets: d.wickets,
    matches: d.matches, innings: d.innings,
    is_undone: false
  };
  // Save the individual record first so it can be corrected later.
  const { data: saved, error: historyError } = await db.from(PERFORMANCE_TABLE).insert([record]).select().single();
  if (historyError) return toast("Could not save performance history: " + historyError.message + ". Run SUPABASE_UNDO_REDO_SETUP.sql first.", "err");
  const payload = {};
  for (const field of performanceFields) {
    if (field === "innings" && !supportsInnings) continue;
    payload[field] = n(p[field]) + n(d[field]);
  }
  const { data, error } = await db.from("kohat zalmi").update(payload).eq("id", p.id).select().single();
  if (error) {
    await db.from(PERFORMANCE_TABLE).delete().eq("id", saved.id);
    return toast("Could not update player totals: " + error.message, "err");
  }
  Object.assign(p, data);
  performanceHistory.unshift(saved);
  dataRevision++; teamRenderedRevision = -1; leadersRenderedRevision = -1;
  e.target.reset(); render(); renderPerformanceHistory(); go("players");
  toast(supportsInnings ? "Performance saved with Undo/Redo history." : "Performance saved. Run the innings migration to enable innings tracking.", supportsInnings ? "ok" : "info");
});

$("#matchForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!isAdmin) return openAuth();
  const f = new FormData(e.target);
  const m = {
    date: f.get("date"), opponent: f.get("opponent"), venue: f.get("venue"),
    result: f.get("result"), score: f.get("score"),
    best_batter: f.get("best_batter"),
    best_batter_runs: f.get("best_batter_runs") ? n(f.get("best_batter_runs")) : null,
    best_batter_balls: f.get("best_batter_balls") ? n(f.get("best_batter_balls")) : null,
    best_bowler: f.get("best_bowler"),
    best_bowler_overs: f.get("best_bowler_overs") ? n(f.get("best_bowler_overs")) : null,
    best_bowler_runs: f.get("best_bowler_runs") ? n(f.get("best_bowler_runs")) : null,
    best_bowler_wickets: f.get("best_bowler_wickets") ? n(f.get("best_bowler_wickets")) : null
  };
  let { data, error } = await db.from("matches").insert([m]).select().single();

  // Some older matches tables have a broken/behind primary-key sequence.
  // If that happens, retry once with a guaranteed-next id based on the
  // existing table type (numeric id or UUID id).
  if (error && /duplicate key value violates unique constraint.*matches_pkey/i.test(error.message || "")) {
    const existingIds = state.matches.map(x => x.id).filter(v => v !== null && v !== undefined && v !== "");
    const numericIds = existingIds.map(Number).filter(Number.isFinite);
    const numericMode = existingIds.length > 0 && numericIds.length === existingIds.length;
    if (numericMode) {
      m.id = Math.max(0, ...numericIds) + 1;
      ({ data, error } = await db.from("matches").insert([m]).select().single());
    } else if (window.crypto?.randomUUID) {
      m.id = crypto.randomUUID();
      ({ data, error } = await db.from("matches").insert([m]).select().single());
    }
  }
  if (error) return toast("Could not save match: " + error.message, "err");
  state.matches.push(data); dataRevision++; e.target.reset(); closeModal("#matchModal"); render(); go("matches"); toast("Match saved successfully.");
});

$("#editPlayerForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!isAdmin) return openAuth();
  const f = new FormData(e.target);
  const id = String(f.get("id"));
  const p = state.players.find(x => String(x.id) === id);
  if (!p) return;
  const payload = {
    name: String(f.get("name") || "").trim(),
    jersey: String(f.get("jersey") || "").trim(),
    role: String(f.get("role") || "").trim(),
    matches: Math.max(0, Math.floor(n(f.get("matches"))))
  };
  if (supportsInnings) payload.innings = Math.max(0, Math.floor(n(f.get("innings"))));
  if (!payload.name) return toast("Enter a player name.", "err");
  const { data, error } = await db.from("kohat zalmi").update(payload).eq("id", id).select().single();
  if (error) return toast("Update failed: " + error.message, "err");
  Object.assign(p, data); dataRevision++; teamRenderedRevision = -1; leadersRenderedRevision = -1;
  closeModal("#editPlayerModal"); render(); toast("Player updated successfully.");
});

$("#editMatchForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!isAdmin) return openAuth();
  const f = new FormData(e.target);
  const id = String(f.get("id"));
  const m = state.matches.find(x => String(x.id) === id);
  if (!m) return;
  const payload = {
    date: f.get("date"), opponent: f.get("opponent"), venue: f.get("venue"),
    result: f.get("result"), score: f.get("score")
  };
  const { data, error } = await db.from("matches").update(payload).eq("id", id).select().single();
  if (error) return toast("Update failed: " + error.message, "err");
  Object.assign(m, data); dataRevision++;
  closeModal("#editMatchModal"); render(); toast("Match updated successfully.");
});


/* ---------- Our Journey language switch ----------------------------------- */
document.addEventListener("click", e => {
  const button = e.target.closest("[data-journey-lang]");
  if (!button) return;
  const lang = button.dataset.journeyLang === "ur" ? "ur" : "en";
  const page = $("#journey");
  if (!page) return;
  page.dataset.language = lang;
  page.querySelectorAll("[data-journey-en]").forEach(el => { el.hidden = lang !== "en"; });
  page.querySelectorAll("[data-journey-ur]").forEach(el => { el.hidden = lang !== "ur"; });
  page.querySelectorAll("[data-journey-copy]").forEach(el => { el.hidden = el.dataset.journeyCopy !== lang; });
  page.querySelectorAll("[data-journey-lang]").forEach(btn => {
    const active = btn.dataset.journeyLang === lang;
    btn.classList.toggle("isActive", active);
    btn.setAttribute("aria-pressed", active ? "true" : "false");
  });
});

/* ---------- Init --------------------------------------------------------------- */

async function init() {
  try {
    const session = await db.auth.getSession();
    isAdmin = String(session.data.session?.user?.id || "") === OWNER_UID;
    const [pResult, m] = await Promise.all([
      db.from("kohat zalmi").select("id,name,jersey,role,matches,innings,runs,balls,dismissals,overs,conceded,wickets").order("id", { ascending: true }),
      db.from("matches").select("*").order("date", { ascending: false })
    ]);
    let p = pResult;
    if (p.error && /innings/i.test(p.error.message || "")) {
      supportsInnings = false;
      p = await db.from("kohat zalmi").select("id,name,jersey,role,matches,runs,balls,dismissals,overs,conceded,wickets").order("id", { ascending: true });
      toast("One-time setup needed: run SUPABASE_INNINGS_MIGRATION.sql in your Supabase SQL Editor.", "info");
    }
    if (p.error) console.error(p.error);
    else state.players = (p.data || []).map(player => ({ ...player, innings: n(player.innings) }));
    if (m.error) console.error(m.error); else state.matches = m.data || [];
    dataRevision++;
    updateAccessUI(); render();
    await loadPerformanceHistory();
  } catch (err) {
    console.error(err);
    toast("Website initialization error: " + err.message, "err");
  }
}

db.auth.onAuthStateChange((_event, session) => {
  isAdmin = String(session?.user?.id || "") === OWNER_UID;
  updateAccessUI(); render(); renderPerformanceHistory();
});

init();
