/* ==========================================================================
   KOHAT ZALMI — CRICKET PERFORMANCE DASHBOARD
   Supabase-powered. Data logic, tables and queries are unchanged.
   ========================================================================== */

const SUPABASE_URL = "https://szojybwguxkydkdombqo.supabase.co";
const SUPABASE_KEY = "sb_publishable_yKCdQBSPvkisSWncHbGmBg_-6u9DEyP";
const OWNER_UID = "f62ca7bc-486d-462f-92dd-6415e0e90973";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let state = { players: [], matches: [] };
let isAdmin = false;

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
    add: "Add Performance", addPlayer: "Add Player"
  };
  $("#title").textContent = titles[page] || "Kohat Zalmi";
  $("#desc").textContent = page === "dashboard"
    ? "Kohat Zalmi performance center"
    : isAdmin ? "Kohat Zalmi • admin connected" : "Kohat Zalmi • public view";
  closeNav();
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ---------- Render ---------------------------------------------------- */

function render() {
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

  renderPlayers(); renderMatches(); renderRankings(); renderAnalytics(); renderVenues(); renderTeam();
  fillPlayerSelect(); updateAccessUI();
  animateNumbers(); observeReveals();
}

/* ---------- Players ---------------------------------------------------- */

const TEAM_ROSTER = [
  {name:"M. Usman", role:"Bowler", bowling:"Right-Arm Fast Bowler", batting:"", photo:"assets/team/M.Usman-RA_Fast_Bowler.jpg"},
  {name:"Sikander", role:"Bowler", bowling:"Right-Arm Fast Bowler", batting:"", photo:"assets/team/Sikander-RA_Fast_Bowler.jpg"},
  {name:"Awais", role:"All-Rounder", bowling:"Right-Arm Off-Break Bowler", batting:"Right-Hand Batsman", photo:"assets/team/Awais-RA_Off_Break-RH_Batsman.jpg"},
  {name:"M. Luqman", role:"All-Rounder", bowling:"Right-Arm Fast Bowler", batting:"Right-Hand Batsman", photo:"assets/team/M.Luqman-RA_Fast_Bowler-RH_Batsman.jpg"},
  {name:"Janzaib", role:"Wicket Keeper • Batsman", bowling:"", batting:"Batsman", photo:"assets/team/Janzaib-WK_Batsman.jpg"},
  {name:"Sohail", role:"Batsman", bowling:"", batting:"Right-Hand Batsman", photo:"assets/team/Sohail-RH_Batsman.jpg"},
  {name:"Farhan", role:"Bowler", bowling:"Left-Arm Wrist Spinner", batting:"", photo:"assets/team/Farhan-LA_Wrist_Spiner.jpg"},
  {name:"Adnan", role:"All-Rounder", bowling:"Right-Arm Fast Bowler", batting:"Right-Hand Batsman", photo:"assets/team/Adnan-RA_Fast_Bowler-RH_Batsman.jpg"},
  {name:"Shahzad", role:"All-Rounder", bowling:"Right-Arm Off-Break Bowler", batting:"Right-Hand Batsman", photo:"assets/team/Shahzad-RA_Off_Break-RH_Batsman.jpg"},
  {name:"Naimat", role:"Bowler", bowling:"Right-Arm Leg-Break Bowler", batting:"", photo:"assets/team/Naimat-RA_Leg_Break.jpg"},
  {name:"M. Bilal", role:"All-Rounder", bowling:"Right-Arm Slow Wrist Spinner", batting:"Right-Hand Batsman", captain:"Vice Captain", jersey:"56", photo:"assets/team/M.Bilal-RH_Slow_Wrist_Spiner-RH_Batsman-Vice_Captain.jpg"},
  {name:"M. Jibran", role:"All-Rounder", bowling:"Right-Arm Fast Bowler", batting:"Right-Hand Batsman", captain:"Captain", jersey:"07", photo:"assets/team/M.Jibran-RA_Fast_Bowler-RH_Batsman-Captain.jpg"},
  {name:"Maidad", role:"Wicket Keeper • Batsman", bowling:"", batting:"Batsman", photo:"assets/team/Maidad-WK_Batsman.jpg"},
  {name:"SanaUllah", role:"Bowler", bowling:"Right-Arm Fast Bowler", batting:"", photo:"assets/team/SanaUllah-RA_Fast_Bowler.jpg"},
  {name:"Shahab", role:"Batsman", bowling:"", batting:"Right-Hand Batsman", photo:"assets/team/Shahab-RH_Batsman.jpg"}
];

function renderTeam() {
  const grid = $("#teamGrid");
  if (!grid) return;
  $("#teamCount").textContent = TEAM_ROSTER.length + " Players";
  if (typeof buildTeamReel === "function") buildTeamReel(TEAM_ROSTER);
  if (typeof renderHangCards === "function") {
    renderHangCards(grid, TEAM_ROSTER, "team");
    renderHangCards($("#leaderHang"), TEAM_ROSTER.filter(p => p.captain).sort((a, b) => (a.captain === "Captain" ? -1 : 1) - (b.captain === "Captain" ? -1 : 1)), "leader");
    return;
  }
  grid.innerHTML = TEAM_ROSTER.map((p,i) => `
    <article class="teamPlayerCard" style="--delay:${Math.min(i,11)*55}ms">
      <div class="teamCardGlow"></div>
      <div class="teamPhotoFrame">
        <div class="teamPhotoHalo"></div>
        <img src="${p.photo}" alt="${esc(p.name)}" loading="lazy">
        ${p.captain ? `<span class="teamCaptainBadge ${p.captain === "Captain" ? "isCaptain" : "isVice"}">${esc(p.captain)}</span>` : ""}
      </div>
      <div class="teamCardBody">
        <div class="teamRole">${esc(p.role)}</div>
        <h3>${esc(p.name)}</h3>
        ${p.jersey ? `<div class="teamJersey">#${esc(p.jersey)}</div>` : ""}
        <div class="teamInfoList">
          ${p.batting ? `<span><b>BAT</b>${esc(p.batting)}</span>` : ""}
          ${p.bowling ? `<span><b>BOWL</b>${esc(p.bowling)}</span>` : ""}
        </div>
      </div>
    </article>`).join("");
}

function renderPlayers() {
  const q = ($("#search")?.value || "").toLowerCase();
  const role = $("#role")?.value || "all";
  const p = state.players.filter(x => String(x.name || "").toLowerCase().includes(q) && (role === "all" || x.role === role));
  $("#playerGrid").innerHTML = p.map((x, i) => `<div class="playerCard" style="animation-delay:${Math.min(i, 8) * 50}ms" tabindex="0" aria-label="View details for ${esc(x.name)}" onclick="showPlayer('${String(x.id)}')">
    <div class="playerTop">${avatar(x)}<div class="grow"><h3>${esc(x.name)}</h3><small>${esc(x.role)} • #${esc(x.jersey)}</small></div></div>
    <div class="mini playerStats">
      <div><b>${n(x.matches)}</b><small>Matches</small></div>
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
  f.id.value = String(p.id);
  f.name.value = p.name || "";
  f.jersey.value = p.jersey || "";
  f.role.value = p.role || "";
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
  f.id.value = String(m.id);
  f.date.value = m.date || "";
  f.opponent.value = m.opponent || "";
  f.venue.value = m.venue || "";
  f.result.value = m.result || "Won";
  f.score.value = m.score || "";
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
  all:  { label: "POWER",      val: p => n(p.runs) + 20 * n(p.wickets), show: v => Math.round(v) + " CE", dir: -1 },
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
        ${tile("runs", n(p.runs), "RUNS")}${tile("avg", fmt(avg(p)), "AVG")}${tile("sr", fmt(sr(p)), "SR")}
        ${tile("wkts", n(p.wickets), "WKTS")}${tile("eco", n(p.overs) ? fmt(eco(p)) : "—", "ECO")}${tile("", n(p.matches), "MATCHES")}
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
function observeReveals() {
  if (!("IntersectionObserver" in window)) {
    $$(".reveal").forEach(el => el.classList.add("in"));
    return;
  }
  revealObserver ??= new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); revealObserver.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: .08 });
  $$(".reveal:not(.in)").forEach(el => revealObserver.observe(el));
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
  if (!p.name) return toast("Enter a player name.", "err");
  const { data, error } = await db.from("kohat zalmi").insert([p]).select().single();
  if (error) return toast("Could not add player: " + error.message, "err");
  state.players.push(data); e.target.reset(); render(); go("players"); toast("Player added successfully.");
});

$("#perfForm").addEventListener("submit", async e => {
  e.preventDefault();
  if (!isAdmin) return openAuth();
  const f = new FormData(e.target);
  const p = state.players.find(x => String(x.id) === String(f.get("player")));
  if (!p) return toast("Add a player first.", "err");
  const u = {
    matches: n(p.matches) + 1,
    runs: n(p.runs) + n(f.get("runs")),
    balls: n(p.balls) + n(f.get("balls")),
    dismissals: n(p.dismissals) + n(f.get("dismissed")),
    overs: n(p.overs) + n(f.get("overs")),
    conceded: n(p.conceded) + n(f.get("conceded")),
    wickets: n(p.wickets) + n(f.get("wickets"))
  };
  const { data, error } = await db.from("kohat zalmi").update(u).eq("id", p.id).select().single();
  if (error) return toast("Could not save performance: " + error.message, "err");
  Object.assign(p, data); e.target.reset(); render(); go("players"); toast("Performance saved successfully.");
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
  state.matches.push(data); e.target.reset(); closeModal("#matchModal"); render(); go("matches"); toast("Match saved successfully.");
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
    role: String(f.get("role") || "").trim()
  };
  if (!payload.name) return toast("Enter a player name.", "err");
  const { data, error } = await db.from("kohat zalmi").update(payload).eq("id", id).select().single();
  if (error) return toast("Update failed: " + error.message, "err");
  Object.assign(p, data);
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
  Object.assign(m, data);
  closeModal("#editMatchModal"); render(); toast("Match updated successfully.");
});

/* ---------- Init --------------------------------------------------------------- */

async function init() {
  try {
    const session = await db.auth.getSession();
    isAdmin = String(session.data.session?.user?.id || "") === OWNER_UID;
    const [p, m] = await Promise.all([
      db.from("kohat zalmi").select("*").order("id", { ascending: true }),
      db.from("matches").select("*").order("date", { ascending: false })
    ]);
    if (p.error) console.error(p.error); else state.players = p.data || [];
    if (m.error) console.error(m.error); else state.matches = m.data || [];
    updateAccessUI(); render();
  } catch (err) {
    console.error(err);
    toast("Website initialization error: " + err.message, "err");
  }
}

db.auth.onAuthStateChange((_event, session) => {
  isAdmin = String(session?.user?.id || "") === OWNER_UID;
  updateAccessUI(); render();
});

init();
