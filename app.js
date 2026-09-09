// KOHAT ZALMI — Supabase-powered dashboard
const SUPABASE_URL = "https://szojybwguxkydkdombqo.supabase.co";
const SUPABASE_KEY = "sb_publishable_yKCdQBSPvkisSWncHbGmBg_-6u9DEyP";
const OWNER_UID = "f62ca7bc-486d-462f-92dd-6415e0e90973";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let state = { players: [], matches: [], funds: [], expenses: [] };
let isAdmin = false;
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const n = v => Number(v || 0);
const esc = v => String(v ?? "").replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));
const avg = p => n(p.dismissals) ? n(p.runs) / n(p.dismissals) : 0;
const sr = p => n(p.balls) ? n(p.runs) / n(p.balls) * 100 : 0;
const eco = p => n(p.overs) ? n(p.conceded) / n(p.overs) : 0;
const fmt = v => n(v).toFixed(2);
function toast(msg){ alert(msg); }
function avatar(p, cls=""){ return p.photo ? `<div class="avatar ${cls}"><img src="${p.photo}" alt="${esc(p.name)}"></div>` : `<div class="avatar ${cls}">${esc((p.name||"?")[0].toUpperCase())}</div>`; }
function results(){ const m=state.matches; return {w:m.filter(x=>x.result==="Won").length,l:m.filter(x=>x.result==="Lost").length,t:m.filter(x=>x.result==="Tied").length,n:m.filter(x=>x.result==="No Result").length}; }
function go(page){
  if (["add","addPlayer"].includes(page) && !isAdmin){ toast("Admin login is required."); openAuth(); return; }
  $$(".page").forEach(x=>x.classList.toggle("active",x.id===page));
  $$(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
  const titles={dashboard:"Team Dashboard",players:"Players",matches:"Matches",rankings:"Rankings",analytics:"Analytics",venues:"Venues",leaders:"The Leaders of Kohat Zalmi",funds:"Kohat Zalmi Funds",add:"Add Performance",addPlayer:"Add Player"};
  $("#title").textContent=titles[page]||"Kohat Zalmi";
  $("#desc").textContent=page==="dashboard"?"Kohat Zalmi performance center":isAdmin?"Kohat Zalmi • admin connected":"Kohat Zalmi • public view";
  $("#side").classList.remove("open"); render(); window.scrollTo({top:0,behavior:"smooth"});
}
function bar(name,pct,val){return `<div class="bar"><div class="barTop"><span>${esc(name)}</span><b>${esc(val)}</b></div><div class="track"><div class="fill" style="width:${Math.max(0,Math.min(100,pct))}%"></div></div></div>`;}
function render(){
  const p=state.players||[],m=state.matches||[],r=results(),runs=p.reduce((a,x)=>a+n(x.runs),0),wk=p.reduce((a,x)=>a+n(x.wickets),0),pct=m.length?r.w/m.length*100:0;
  $("#summary").innerHTML=[["Players",p.length,"Team squad"],["Matches",m.length,"Recorded matches"],["Total Runs",runs,"All players"],["Total Wickets",wk,"All bowlers"]].map(x=>`<div class="stat reveal"><div class="label">${x[0]}</div><div class="value">${x[1]}</div><small>${x[2]}</small></div>`).join("");
  $("#wins").textContent=r.w;$("#losses").textContent=r.l;$("#ties").textContent=r.t;$("#nr").textContent=r.n;$("#circle").textContent=fmt(pct)+"%";
  $("#bars").innerHTML=bar("Win rate",pct,fmt(pct)+"%")+bar("Matches played",Math.min(100,m.length*10),m.length)+bar("Squad active",p.length?100:0,p.length+" players");
  const top=[...p].sort((a,b)=>n(b.runs)-n(a.runs)).slice(0,5); $("#top").innerHTML=top.map(x=>`<div class="performer">${avatar(x)}<div class="grow"><b>${esc(x.name)}</b><small>${esc(x.role)} • #${esc(x.jersey)} • ${n(x.matches)} matches</small></div><b>${n(x.runs)}</b></div>`).join("")||`<div class="muted">No players yet.</div>`;
  $("#recent").innerHTML=[...m].sort((a,b)=>String(b.date).localeCompare(String(a.date))).slice(0,5).map(x=>`<div class="performer"><div class="grow"><b>${esc(x.opponent)}</b><small>${esc(x.date)} • ${esc(x.venue)}</small></div><b>${esc(x.result)}</b></div>`).join("")||`<div class="muted">No matches yet.</div>`;
  renderPlayers();renderMatches();renderRankings();renderAnalytics();renderVenues();renderFunds();fillPlayerSelect();updateAccessUI();
}
function renderPlayers(){const q=( $("#search")?.value||"" ).toLowerCase(),role=$("#role")?.value||"all",p=state.players.filter(x=>String(x.name||"").toLowerCase().includes(q)&&(role==="all"||x.role===role));$("#playerGrid").innerHTML=p.map(x=>`<div class="playerCard" onclick="showPlayer('${String(x.id)}')"><div class="playerTop">${avatar(x)}<div class="grow"><h3>${esc(x.name)}</h3><small>${esc(x.role)} • #${esc(x.jersey)}</small></div></div><div class="mini"><div><b>${n(x.runs)}</b><small>Runs</small></div><div><b>${fmt(sr(x))}</b><small>SR</small></div><div><b>${n(x.wickets)}</b><small>Wkts</small></div></div>${isAdmin?`<div class="actions"><button class="action" onclick="event.stopPropagation();editPlayer('${String(x.id)}')">Edit</button><button class="action danger" onclick="event.stopPropagation();deletePlayer('${String(x.id)}')">Delete</button></div>`:""}</div>`).join("")||`<div class="muted">No players found.</div>`;}
function showPlayer(id){const p=state.players.find(x=>String(x.id)===String(id));if(!p)return;$("#playerDetail").innerHTML=`<div class="detailHead">${avatar(p,"large")}<div><h2>${esc(p.name)}</h2><p>${esc(p.role)} • #${esc(p.jersey)}</p></div></div><div class="mini"><div><b>${n(p.matches)}</b><small>Matches</small></div><div><b>${n(p.runs)}</b><small>Runs</small></div><div><b>${n(p.wickets)}</b><small>Wickets</small></div></div><p>Average <b>${fmt(avg(p))}</b> • Strike Rate <b>${fmt(sr(p))}</b> • Economy <b>${n(p.overs)?fmt(eco(p)):"—"}</b></p>${isAdmin?`<div class="actions"><button class="primary" onclick="editPlayer('${String(p.id)}')">Edit Player</button><button class="action danger" onclick="deletePlayer('${String(p.id)}');closePlayerModal()">Delete Player</button></div>`:""}`;$("#playerModal").classList.add("show");}
function closePlayerModal(){$("#playerModal").classList.remove("show");}
async function editPlayer(id){if(!isAdmin)return toast("Admin login required.");const p=state.players.find(x=>String(x.id)===String(id));if(!p)return;const name=prompt("Player name:",p.name||"");if(name===null)return;const jersey=prompt("Jersey number:",p.jersey||"");if(jersey===null)return;const role=prompt("Role:",p.role||"");if(role===null)return;const {data,error}=await db.from("kohat zalmi").update({name:name.trim(),jersey:jersey.trim(),role:role.trim()}).eq("id",id).select().single();if(error)return toast("Update failed: "+error.message);Object.assign(p,data);closePlayerModal();render();toast("Player updated successfully.");}
async function deletePlayer(id){if(!isAdmin)return toast("Admin login required.");const p=state.players.find(x=>String(x.id)===String(id));if(!p||!confirm(`Delete ${p.name}? This cannot be undone.`))return;const {error}=await db.from("kohat zalmi").delete().eq("id",id);if(error)return toast("Delete failed: "+error.message);state.players=state.players.filter(x=>String(x.id)!==String(id));closePlayerModal();render();toast("Player deleted.");}
function renderMatches(){const season=$("#season")?.value||"all",m=state.matches.filter(x=>season==="all"||String(x.date||"").startsWith(season));$("#matchTable").innerHTML=m.length?m.map(x=>`<tr><td>${esc(x.date)}</td><td>${esc(x.opponent)}</td><td>${esc(x.venue)}</td><td class="${x.result==="Won"?"win":x.result==="Lost"?"loss":""}">${esc(x.result)}</td><td>${esc(x.score)}</td><td>${isAdmin?`<button class="action" onclick="editMatch('${String(x.id)}')">Edit</button> <button class="action danger" onclick="deleteMatch('${String(x.id)}')">Delete</button>`:"View"}</td></tr>`).join(""):`<tr><td colspan="6">No matches recorded.</td></tr>`;const years=[...new Set(state.matches.map(x=>String(x.date||"").slice(0,4)).filter(Boolean))];const cur=$("#season").value;$("#season").innerHTML='<option value="all">All seasons</option>'+years.map(y=>`<option value="${y}">${y}</option>`).join("");$("#season").value=years.includes(cur)?cur:"all";}
async function editMatch(id){if(!isAdmin)return toast("Admin login required.");const m=state.matches.find(x=>String(x.id)===String(id));if(!m)return;const date=prompt("Date (YYYY-MM-DD):",m.date||"");if(date===null)return;const opponent=prompt("Opponent:",m.opponent||"");if(opponent===null)return;const venue=prompt("Venue:",m.venue||"");if(venue===null)return;const result=prompt("Result (Won, Lost, Tied, No Result):",m.result||"");if(result===null)return;const score=prompt("Score:",m.score||"");if(score===null)return;const {data,error}=await db.from("matches").update({date,opponent,venue,result,score}).eq("id",id).select().single();if(error)return toast("Update failed: "+error.message);Object.assign(m,data);render();toast("Match updated successfully.");}
async function deleteMatch(id){if(!isAdmin)return toast("Admin login required.");if(!confirm("Delete this match? This cannot be undone."))return;const {error}=await db.from("matches").delete().eq("id",id);if(error)return toast("Delete failed: "+error.message);state.matches=state.matches.filter(x=>String(x.id)!==String(id));render();toast("Match deleted.");}
function rankRows(a,val,label){return a.slice(0,3).map((p,i)=>`<div class="rankrow"><b>${i+1}</b>${avatar(p)}<div class="grow"><b>${esc(p.name)}</b><small>${esc(p.role)}</small></div><b>${val(p)}<small>${label}</small></b></div>`).join("")||`<div class="muted">No players.</div>`;}
function renderRankings(){const bat=[...state.players].sort((a,b)=>n(b.runs)-n(a.runs)),bowl=[...state.players].sort((a,b)=>n(b.wickets)-n(a.wickets)),ar=[...state.players].filter(x=>String(x.role||"").toLowerCase().replace(/[ -]/g,"")==="allrounder").sort((a,b)=>n(b.runs)+20*n(b.wickets)-n(a.runs)-20*n(a.wickets));$("#bat").innerHTML=rankRows(bat,p=>n(p.runs),"runs");$("#bowl").innerHTML=rankRows(bowl,p=>n(p.wickets),"wickets");$("#ar").innerHTML=rankRows(ar,p=>`${n(p.runs)}/${n(p.wickets)}`,"runs/wkts");const all=[...state.players].sort((a,b)=>n(b.runs)+20*n(b.wickets)-n(a.runs)-20*n(a.wickets));$("#rankTable").innerHTML=all.map((p,i)=>`<tr><td>${i+1}</td><td>${esc(p.name)}</td><td>${esc(p.role)}</td><td>${n(p.runs)}</td><td>${fmt(avg(p))}</td><td>${fmt(sr(p))}</td><td>${n(p.wickets)}</td><td>${n(p.overs)?fmt(eco(p)):"—"}</td><td>${n(p.matches)}</td></tr>`).join("")||`<tr><td colspan="9">No players yet.</td></tr>`;}
function renderAnalytics(){const r=results(),m=state.matches,total=Math.max(1,m.length),best=[...state.players].sort((a,b)=>sr(b)-sr(a))[0];$("#analyticsCards").innerHTML=[["Win Rate",fmt(r.w/total*100)+"%","Overall"],["Wins",r.w,"Matches won"],["Losses",r.l,"Matches lost"],["Best SR",best?fmt(sr(best)):"—",best?.name||""]].map(x=>`<div class="stat"><div class="label">${x[0]}</div><div class="value">${x[1]}</div><small>${esc(x[2])}</small></div>`).join("");$("#resultBars").innerHTML=bar("Won",r.w/total*100,r.w)+bar("Lost",r.l/total*100,r.l)+bar("Tied",r.t/total*100,r.t)+bar("No Result",r.n/total*100,r.n);const runs=state.players.reduce((a,p)=>a+n(p.runs),0),wk=state.players.reduce((a,p)=>a+n(p.wickets),0);$("#performanceBars").innerHTML=bar("Total runs",Math.min(100,runs/5),runs)+bar("Total wickets",Math.min(100,wk*5),wk);$("#efficiency").innerHTML=[...state.players].sort((a,b)=>n(b.runs)+15*n(b.wickets)-n(a.runs)-15*n(a.wickets)).slice(0,8).map(p=>bar(p.name,Math.min(100,n(p.runs)/3+n(p.wickets)*3),`${n(p.runs)} runs • ${n(p.wickets)} wkts`)).join("")||`<div class="muted">No player data yet.</div>`;}
function renderVenues(){const map={};state.matches.forEach(m=>{const v=m.venue||"Unknown";map[v]??={m:0,w:0};map[v].m++;if(m.result==="Won")map[v].w++;});const a=Object.entries(map);$("#venueCards").innerHTML=a.map(([v,x])=>`<div class="stat"><div class="label">VENUE</div><div class="value">${esc(v)}</div><small>${x.m} matches • ${fmt(x.w/x.m*100)}% wins</small></div>`).join("")||`<div class="muted">No venue data.</div>`;$("#venueTable").innerHTML=a.map(([v,x])=>`<tr><td>${esc(v)}</td><td>${x.m}</td><td>${x.w}</td><td>${fmt(x.w/x.m*100)}%</td></tr>`).join("")||`<tr><td colspan="4">No venue data.</td></tr>`;}

const FUND_MONTHLY = 200;
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function money(v){ return "Rs " + n(v).toLocaleString("en-PK"); }
function selectedFundYear(){
  const y = Number($("#fundYear")?.value || new Date().getFullYear());
  return Number.isFinite(y) ? y : new Date().getFullYear();
}
// Fund collection officially starts on the first day of NEXT month.
// Before that start date, months are not marked Pending.
function fundStartDate(){
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth()+1, 1);
}
function dueMonthsForYear(year){
  const start = fundStartDate();
  const startYear = start.getFullYear();
  const startMonth = start.getMonth()+1;
  if(year < startYear) return 0;
  if(year === startYear) return 12-startMonth+1;
  return 12;
}
function activeMonthForYear(year, monthNo){
  const start = fundStartDate();
  const keyDate = new Date(year, monthNo-1, 1);
  return keyDate >= start;
}
function renderFunds(){
  const year = selectedFundYear();
  const due = dueMonthsForYear(year);
  const start = fundStartDate();
  const allPlayers = state.players || [];
  const search = String($("#fundSearch")?.value || "").trim().toLowerCase();
  const players = search ? allPlayers.filter(p => `${p.name||""} ${p.jersey||""}`.toLowerCase().includes(search)) : allPlayers;
  const yearFunds = (state.funds||[]).filter(f=>String(f.fund_month||"").startsWith(String(year)+"-"));
  const yearExpenses = (state.expenses||[]).filter(e=>String(e.date||"").startsWith(String(year)+"-"));
  const collected = yearFunds.reduce((a,f)=>a+n(f.amount),0);
  const expected = players.length * due * FUND_MONTHLY;
  const pending = Math.max(0, expected-collected);
  const used = yearExpenses.reduce((a,e)=>a+n(e.amount),0);
  const available = collected-used;
  $("#fundExpected").textContent=money(expected);
  $("#fundCollected").textContent=money(collected);
  $("#fundPending").textContent=money(pending);
  $("#fundUsed").textContent=money(used);
  $("#fundAvailable").textContent=money(available);
  const years = new Set([new Date().getFullYear(), year]);
  (state.funds||[]).forEach(f=>{const y=String(f.fund_month||"").slice(0,4);if(y)years.add(Number(y));});
  (state.expenses||[]).forEach(e=>{const y=String(e.date||"").slice(0,4);if(y)years.add(Number(y));});
  const sortedYears=[...years].filter(Boolean).sort((a,b)=>b-a);
  const cur=String(year);
  $("#fundYear").innerHTML=sortedYears.map(y=>`<option value="${y}">${y}</option>`).join("");
  $("#fundYear").value=sortedYears.includes(year)?cur:String(sortedYears[0]||new Date().getFullYear());

  $("#fundPlayers").innerHTML = players.map(p=>{
    const pf=yearFunds.filter(f=>String(f.player_id)===String(p.id));
    const paid=pf.reduce((a,f)=>a+n(f.amount),0);
    const dueForPlayer=due*FUND_MONTHLY;
    const playerPending=Math.max(0,dueForPlayer-paid);
    return `<div class="fundPlayerCard">
      <div class="fundPlayerHead">${avatar(p,"fundAvatar")}<div class="grow"><h3>${esc(p.name)}</h3><small>#${esc(p.jersey)} • ${esc(p.role)}</small></div>
        <div class="fundTotals"><span><b>${money(paid)}</b><small>Total Paid</small></span><span><b>${money(playerPending)}</b><small>Pending</small></span></div>
      </div>
      <div class="fundMonths">${MONTHS.map((m,i)=>{
        const monthNo=i+1, key=`${year}-${String(monthNo).padStart(2,"0")}`;
        const record=pf.find(f=>String(f.fund_month)===key);
        const active=activeMonthForYear(year, monthNo);
        const upcoming=!active;
        if(upcoming) {
          const label = new Date(year, monthNo-1, 1) < start ? "Not Active" : "Upcoming";
          return `<div class="fundMonth upcoming"><b>${m}</b><span>Rs 200</span><small>${label}</small></div>`;
        }
        if(record) return `<div class="fundMonth paid"><b>${m}</b><span>${money(record.amount)}</span><small>✓ Paid</small>${isAdmin?`<button onclick="undoFund('${String(record.id)}')">Undo</button>`:""}</div>`;
        return `<div class="fundMonth pending"><b>${m}</b><span>Rs 200</span><small>⏳ Pending</small>${isAdmin?`<button onclick="markFundPaid('${String(p.id)}','${key}')">Mark Paid</button>`:""}</div>`;
      }).join("")}</div>
    </div>`;
  }).join("") || `<div class="muted">No players yet. Add players first.</div>`;

  $("#expenseTable").innerHTML = yearExpenses.length ? [...yearExpenses].sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(e=>`<tr><td>${esc(e.date)}</td><td>${esc(e.description)}</td><td>${money(e.amount)}</td><td>${isAdmin?`<button class="action danger" onclick="deleteExpense('${String(e.id)}')">Delete</button>`:"View"}</td></tr>`).join("") : `<tr><td colspan="4">No expenses recorded for ${year}.</td></tr>`;
}
async function markFundPaid(playerId, month){
  if(!isAdmin)return openAuth();
  if((state.funds||[]).some(f=>String(f.player_id)===String(playerId)&&String(f.fund_month)===month)) return;
  const {data,error}=await db.from("player_funds").insert([{player_id:String(playerId),fund_month:month,amount:FUND_MONTHLY,status:"Paid"}]).select().single();
  if(error)return toast("Could not save fund: "+error.message);
  state.funds.push(data); renderFunds(); toast("Fund marked as paid.");
}
async function undoFund(id){
  if(!isAdmin)return;
  if(!confirm("Undo this monthly fund payment?"))return;
  const {error}=await db.from("player_funds").delete().eq("id",id);
  if(error)return toast("Could not undo fund: "+error.message);
  state.funds=state.funds.filter(f=>String(f.id)!==String(id)); renderFunds(); toast("Fund payment marked pending.");
}
async function deleteExpense(id){
  if(!isAdmin)return;
  if(!confirm("Delete this expense? This cannot be undone."))return;
  const {error}=await db.from("fund_expenses").delete().eq("id",id);
  if(error)return toast("Could not delete expense: "+error.message);
  state.expenses=state.expenses.filter(e=>String(e.id)!==String(id)); renderFunds(); toast("Expense deleted.");
}

function fillPlayerSelect(){$("#perfPlayer").innerHTML=state.players.map(p=>`<option value="${String(p.id)}">${esc(p.name)} — ${esc(p.role)} (#${esc(p.jersey)})</option>`).join("")||`<option value="">No players — add a player first</option>`;}
function updateAccessUI(){$$(".admin").forEach(x=>x.classList.toggle("hide",!isAdmin));$("#login").classList.toggle("hide",isAdmin);$("#logout").classList.toggle("hide",!isAdmin);$("#badge").textContent=isAdmin?"🔐 Admin Access":"👁️ Visitor View";}
function openAuth(){$("#auth").classList.add("show");$("#authError").textContent="";}
function closeAuth(){$("#auth").classList.remove("show");}
$$('.nav').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));
$$('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
$("#menu").addEventListener('click',()=>$("#side").classList.toggle('open'));
$("#login").addEventListener('click',openAuth);$("#closeAuth").addEventListener('click',closeAuth);$("#closeMatch").addEventListener('click',()=>$("#matchModal").classList.remove('show'));$("#closePlayer").addEventListener('click',closePlayerModal);$("#addMatch").addEventListener('click',()=>{if(isAdmin)$("#matchModal").classList.add('show');else openAuth();});
$("#search").addEventListener('input',renderPlayers);$("#role").addEventListener('change',renderPlayers);$("#season").addEventListener('change',renderMatches);$("#fundYear").addEventListener('change',renderFunds);$("#fundSearch").addEventListener('input',renderFunds);$("#addExpense").addEventListener('click',()=>{if(isAdmin)$("#expenseModal").classList.add("show");else openAuth();});$("#closeExpense").addEventListener('click',()=>$("#expenseModal").classList.remove("show"));
$("#loginForm").addEventListener('submit',async e=>{e.preventDefault();const {data,error}=await db.auth.signInWithPassword({email:$("#email").value.trim(),password:$("#password").value});if(error){$("#authError").textContent=error.message;return;}if(String(data.user.id)!==OWNER_UID){await db.auth.signOut();$("#authError").textContent="This account is view-only. Only the owner account can edit data.";return;}isAdmin=true;closeAuth();updateAccessUI();render();toast("Admin logged in successfully.");});
$("#logout").addEventListener('click',async()=>{await db.auth.signOut();isAdmin=false;updateAccessUI();render();toast('Logged out.');});
$("#playerForm").addEventListener('submit',async e=>{e.preventDefault();if(!isAdmin)return openAuth();const f=new FormData(e.target),file=f.get('photo');let photo='';if(file&&file.size)photo=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);});const p={name:String(f.get('name')||'').trim(),jersey:String(f.get('jersey')||'').trim(),role:String(f.get('role')||''),photo,matches:0,runs:0,balls:0,dismissals:0,overs:0,conceded:0,wickets:0};if(!p.name)return toast('Enter a player name.');const {data,error}=await db.from('kohat zalmi').insert([p]).select().single();if(error)return toast('Could not add player: '+error.message);state.players.push(data);e.target.reset();render();go('players');toast('Player added successfully.');});
$("#perfForm").addEventListener('submit',async e=>{e.preventDefault();if(!isAdmin)return openAuth();const f=new FormData(e.target),p=state.players.find(x=>String(x.id)===String(f.get('player')));if(!p)return toast('Add a player first.');const u={matches:n(p.matches)+1,runs:n(p.runs)+n(f.get('runs')),balls:n(p.balls)+n(f.get('balls')),dismissals:n(p.dismissals)+n(f.get('dismissed')),overs:n(p.overs)+n(f.get('overs')),conceded:n(p.conceded)+n(f.get('conceded')),wickets:n(p.wickets)+n(f.get('wickets'))};const {data,error}=await db.from('kohat zalmi').update(u).eq('id',p.id).select().single();if(error)return toast('Could not save performance: '+error.message);Object.assign(p,data);e.target.reset();render();go('players');toast('Performance saved successfully.');});
$("#matchForm").addEventListener('submit',async e=>{e.preventDefault();if(!isAdmin)return openAuth();const f=new FormData(e.target),m={date:f.get('date'),opponent:f.get('opponent'),venue:f.get('venue'),result:f.get('result'),score:f.get('score')};const {data,error}=await db.from('matches').insert([m]).select().single();if(error)return toast('Could not save match: '+error.message);state.matches.push(data);e.target.reset();$("#matchModal").classList.remove('show');render();go('matches');toast('Match saved successfully.');});

$("#expenseForm").addEventListener("submit",async e=>{
  e.preventDefault(); if(!isAdmin)return openAuth();
  const f=new FormData(e.target);
  const expense={date:f.get("date"),description:String(f.get("description")||"").trim(),amount:n(f.get("amount"))};
  if(!expense.description||expense.amount<=0)return toast("Enter a valid expense.");
  const {data,error}=await db.from("fund_expenses").insert([expense]).select().single();
  if(error)return toast("Could not save expense: "+error.message);
  state.expenses.push(data); e.target.reset(); $("#expenseModal").classList.remove("show"); renderFunds(); toast("Expense saved successfully.");
});

$("#theme").addEventListener('click',()=>{const night=!document.body.classList.contains('night');document.body.classList.toggle('night',night);localStorage.kzTheme=night?'night':'day';});if(localStorage.kzTheme==='night')document.body.classList.add('night');
async function init(){try{const session=await db.auth.getSession();isAdmin=String(session.data.session?.user?.id||'')===OWNER_UID;const [p,m,f,e]=await Promise.all([db.from('kohat zalmi').select('*').order('id',{ascending:true}),db.from('matches').select('*').order('date',{ascending:false}),db.from('player_funds').select('*').order('fund_month',{ascending:false}),db.from('fund_expenses').select('*').order('date',{ascending:false})]);if(p.error)console.error(p.error);else state.players=p.data||[];if(m.error)console.error(m.error);else state.matches=m.data||[];if(f.error)console.error("Funds table:",f.error);else state.funds=f.data||[];if(e.error)console.error("Expenses table:",e.error);else state.expenses=e.data||[];updateAccessUI();render();}catch(err){console.error(err);toast('Website initialization error: '+err.message);}}
db.auth.onAuthStateChange((_event,session)=>{isAdmin=String(session?.user?.id||'')===OWNER_UID;updateAccessUI();render();});
init();
