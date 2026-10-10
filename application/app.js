const O = { vehicles: [], drivers: [], routes: [], passengers: [], trips: [], bookings: [], payments: [], maintenance: [], feedback: [] };
const M = { vehicle_media: [], reviews: [], announcements: [], trip_media: [], users: [] };
window.O = O; window.M = M;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
function toast(m, ok = true) { const t = $("toastEl"); t.style.display = "block"; t.style.borderColor = ok ? "#10b981" : "#ef4444"; t.textContent = m; clearTimeout(t._x); t._x = setTimeout(() => t.style.display = "none", 3200); }
const PAGE_META={dash:["Dashboard","Overview"],vehicles:["Vehicles","Fleet + media"],drivers:["Drivers","Staff"],routes:["Routes","Network"],pass:["Passengers","Registry"],trips:["Trips","Schedule"],bookings:["Bookings","sp_book_ticket"],payments:["Payments","Revenue"],maint:["Maintenance","Upkeep"],feedback:["Feedback","Ratings"],community:["Community","MongoDB"],ann:["Announcements","MongoDB"],about:["About us","SmartMove"],settings:["Settings","App"],profile:["Profile","Account"]};
function nav(p){if(!$("pg-"+p))p="dash";document.querySelectorAll(".page").forEach(e=>e.classList.remove("on"));$("pg-"+p).classList.add("on");document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("on",b.dataset.p===p));document.querySelectorAll(".mnav button").forEach(b=>b.classList.toggle("on",b.dataset.p===p));const m=PAGE_META[p]||[p,""];if($("pageTitleEl"))$("pageTitleEl").textContent=m[0];if($("pageSubEl"))$("pageSubEl").textContent=m[1];toggleSide(false);document.documentElement.classList.toggle("hideScroll",p==="dash");document.querySelectorAll('.page').forEach(x=>x.classList.remove('stuck'));R[p]&&R[p]();window.scrollTo(0,0);fixStick();setTimeout(()=>{fixStick();updateStuck();},50);}
function toggleSide(force){const s=document.querySelector(".side");const sc=$("scrim");const open=typeof force==="boolean"?force:!s.classList.contains("open");s.classList.toggle("open",open);if(sc)sc.classList.toggle("on",open);}
window.toggleSide=toggleSide;
function renderUserChip(){
  const el = $("userChip");
  if (!el) return;
  let u = "";
  try { u = localStorage.getItem("sm_session") || ""; } catch (e) {}
  if (!u) { el.innerHTML = "<button onclick=\"nav('profile')\">Sign in</button>"; return; }
  const me = window._me && window._me.username === u ? window._me : null;
  const pic = me && me.pic ? me.pic : "";
  el.innerHTML = "<span class=ubadge>" + (pic ? "<img src='" + pic + "' alt=''>" : u[0].toUpperCase()) + "</span><b>" + u.replace(/[<>&]/g, "").replace(/[\"']/g, "") + "</b><button type='button' class='ghost' aria-label='Log out of SmartMove' onclick='return window.doLogout ? window.doLogout() : false'>Logout</button>";
  try {
    if (window.liveUsers && localStorage.getItem("sm_api_base")) {
      window.liveUsers("get", { username: u }).then(function (j) {
        if (j && j.username && (localStorage.getItem("sm_session") || "") === u) { window._me = j; renderUserChip(); }
      }).catch(function () {});
    }
  } catch (e) {}
}
window.renderUserChip=renderUserChip;
function getLayout(){try{return localStorage.getItem("sm_layout")||"auto"}catch(e){return "auto"}}
function setLayout(m){try{localStorage.setItem("sm_layout",m)}catch(e){}applyLayout();syncLayoutUI();}
window.setLayout=setLayout;
function applyLayout(){const m=getLayout();if(m==="auto")document.body.removeAttribute("data-layout");else document.body.setAttribute("data-layout",m);}
window.applyLayout=applyLayout;
function fixStick(){try{const bar=$("connBar");let h=0;if(bar&&bar.style.display!=="none"&&getComputedStyle(bar).display!=="none")h=Math.ceil(bar.getBoundingClientRect().height);document.body.style.setProperty("--rep-top",h+"px");}catch(e){}}
window.fixStick=fixStick;
window.addEventListener("resize",()=>{if(window.fixStick)fixStick();});
let tourRsT = null;
window.addEventListener("resize",()=>{clearTimeout(tourRsT);tourRsT=setTimeout(()=>{try{if(document.querySelector("#pg-dash.on")&&$("tourTrack"))renderTour();}catch(e){}},250);});
window.addEventListener("pagehide",()=>{const sp=document.getElementById("splash");if(sp)sp.classList.remove("off");});
function updateStuck(){try{const pg=document.querySelector(".page.on");if(!pg)return;const rep=pg.querySelector(".repbar");if(!rep){pg.classList.remove("stuck");return;}const bar=$("connBar");let bh=0;if(bar&&bar.style.display!=="none"&&getComputedStyle(bar).display!=="none")bh=Math.ceil(bar.getBoundingClientRect().height);const stuck=rep.getBoundingClientRect().top<=bh+2&&window.scrollY>10;pg.classList.toggle("stuck",stuck);}catch(e){}}
window.updateStuck=updateStuck;
window.addEventListener("scroll",()=>{if(window.updateStuck)updateStuck();},{passive:true});
document.querySelectorAll(".page").forEach(pg=>{const rep=pg.querySelector(":scope > .repbar");if(!rep||rep.parentElement.classList.contains("stickWrap"))return;const wrap=document.createElement("div");wrap.className="stickWrap";pg.insertBefore(wrap,rep);wrap.appendChild(rep);const crud=pg.querySelector(":scope > .panel.crud");if(!crud)return;let n=wrap.nextSibling,seenCrud=false;while(n){const nx=n.nextSibling;if(n.nodeType===1){const isC=n.classList.contains("crud"),isS=n.classList.contains("stick");if(!seenCrud){wrap.appendChild(n);if(isC)seenCrud=true;}else if(isS){wrap.appendChild(n);}else break;}n=nx;}});
{const side=document.querySelector(".side");if(side&&!side.querySelector(".sideHead")){const head=document.createElement("div");head.className="sideHead";const navEl=side.querySelector(".nav");side.insertBefore(head,navEl);[".logo",".sub","#userChip"].forEach(s=>{const el=side.querySelector(":scope > "+s);if(el)head.appendChild(el);});}}
function syncLayoutUI(){const m=getLayout();document.querySelectorAll('input[name="layoutMode"]').forEach(r=>{r.checked=r.value===m;});}
window.syncLayoutUI=syncLayoutUI;
window.nav = nav;
const vName = id => { const v = O.vehicles.find(x => x.id == id); return v ? v.reg + " (" + v.type + ")" : id; };
const dName = id => { const d = O.drivers.find(x => x.id == id); return d ? d.fn + " " + d.ln : id; };
const mediaId = m => (m._id && (m._id.$oid || m._id)) || "";
const rName = id => { const r = O.routes.find(x => x.id == id); return r ? r.from + " - " + r.to : id; };
const pName = id => { const p = O.passengers.find(x => x.id == id); return p ? p.fn + " " + p.ln : id; };
function tbl(heads, rows) { return "<div style='overflow:auto'><table><tr>" + heads.map(h => "<th>" + h + "</th>").join("") + "</tr>" + rows.map(r => "<tr>" + r.map(c => "<td>" + c + "</td>").join("") + "</tr>").join("") + "</table></div>"; }
function opts(list, v, t) { return list.map(x => "<option value='" + x[v] + "'>" + esc(x[t] ?? x[v]) + "</option>").join(""); }
function tripCap(t) { const v = O.vehicles.find(x => x.id === t.vehicle); return v ? v.cap : 30; }
function tripTaken(tid) { return O.bookings.filter(b => b.trip === tid && b.status === "Confirmed").map(b => b.seat); }
function renderSeatAvail() {
  const t = O.trips.find(x => x.id === +$("bkTrip").value); if (!t || !$("seatAvailEl")) return;
  const cap = tripCap(t), taken = tripTaken(t.id).sort((a, b) => a - b);
  $("seatTitle").textContent = "Seat availability  -  Trip #" + t.id + " " + rName(t.route) + " (" + taken.length + "/" + cap + " taken)";
  $("seatAvailEl").textContent = taken.length ? "Taken seats: " + taken.join(", ") + ". Type free seat numbers separated by commas, e.g. 6,7,8." : "All " + cap + " seats free. Type seat numbers separated by commas, e.g. 6,7,8.";
}
async function delAnn(i) {
  const a = M.announcements[i]; if (!a) return;
  if (!requireLive()) return;
  try {
    await apiPost({ action: "modify", op: "del_announcement", title: a.title });
    await loadLive(); toast("Announcement removed from MongoDB [ok]");
  } catch (err) { toast("Remove failed: " + err, false); }
  R.ann(); R.dash();
}
window.delAnn = delAnn;
let annIdx = 0; const ANN_PER = 3;
function annCard(a) { return "<div class=card><b style='font-size:14px'>[" + esc(a.priority) + "] " + esc(a.title) + "</b><div style='font-size:13px;color:#94a3b8'>" + esc(a.message) + "</div><div style='font-size:11px;color:#64748b'>" + esc((a.created || "") + (a.time ? " " + a.time : "")) + "</div></div>"; }
function renderAnn() {
  const n = Math.max(1, Math.ceil(M.announcements.length / ANN_PER));
  annIdx = ((annIdx % n) + n) % n;
  $("annEl").innerHTML = M.announcements.slice(annIdx * ANN_PER, annIdx * ANN_PER + ANN_PER).map(annCard).join("");
  const c = $("annCaps"); if (c) c.textContent = (annIdx + 1) + " / " + n;
  annAuto();
}
function annNext() { annIdx++; renderAnn(); }
window.annNext = annNext;
let annTimer = null;
function annAuto() {
  if (annTimer) clearInterval(annTimer);
  annTimer = setInterval(() => { if (document.querySelector("#pg-dash.on") && $("annEl")) annNext(); }, 5000);
}
document.addEventListener("dblclick", e => {
  const p = e.target && e.target.closest ? e.target.closest("#annPanel") : null;
  if (!p || (e.target.closest && e.target.closest("#annCaps"))) return;
  const r = p.getBoundingClientRect();
  annIdx += (e.clientX < r.left + r.width / 2 ? -1 : 1);
  renderAnn();
});
let fbTab = "oracle";
function setFbTab(t) {
  fbTab = t;
  if ($("fbTabOracle")) $("fbTabOracle").classList.toggle("on", t === "oracle");
  if ($("fbTabMongo")) $("fbTabMongo").classList.toggle("on", t === "mongo");
  R.feedback();
}
window.setFbTab = setFbTab;
const R = {
  dash() {
    if (!getApiBase()) { $("statEl").innerHTML = "<div class=card><h3>Backend</h3><b>Not linked</b></div><div class=card><h3>Setup</h3><b style='font-size:13px'>Set backend URL in Settings</b></div>"; renderAnn(); renderTour(); return; }
    const rev = O.payments.filter(p => p.status === "Paid").reduce((a, p) => a + p.amt, 0);
    $("statEl").innerHTML = [["Vehicles", O.vehicles.length], ["Drivers", O.drivers.length], ["Routes", O.routes.length], ["Passengers", O.passengers.length], ["Trips", O.trips.length], ["Bookings", O.bookings.length], ["Revenue", "Rs " + rev.toLocaleString()]].map(s => "<div class=card><h3>" + s[0] + "</h3><b>" + s[1] + "</b></div>").join("");
    renderAnn();
    renderTour();
  },
  vehicles() {
    $("vehEl").innerHTML = tbl(["ID", "Reg", "Type", "Cap", "Status", "Media", "Actions"], O.vehicles.map(v => {
      const n = M.vehicle_media.filter(m => m.vehicle_id === v.id).length;
      return [v.id, esc(v.reg), v.type, v.cap, "<span class=tag>" + v.status + "</span>", n ? "[file] " + n + " file(s)" : " - ",
        "<button class=ghost onclick=\"cycleVehicle(" + v.id + ")\">Next&nbsp;status</button> <button class=ghost onclick=\"delRow('vehicle'," + v.id + ")\">Del</button>"];
    }));
  },
  pass() {
    $("passEl").innerHTML = tbl(["ID", "First", "Last", "Phone", "Email", "Actions"], O.passengers.map(p =>
      [p.id, esc(p.fn), esc(p.ln), esc(p.phone), esc(p.email || " - "),
      "<button class=ghost onclick=\"editRow('passenger'," + p.id + ")\">Edit</button> <button class=ghost onclick=\"delRow('passenger'," + p.id + ")\">Del</button>"]));
  },
  drivers() { $("drvEl").innerHTML = tbl(["ID", "Name", "License", "Phone", "Status", "Actions"], O.drivers.map(d => [d.id, esc(d.fn + " " + d.ln), d.lic, d.phone, "<span class=tag>" + d.status + "</span>",
    "<button class=ghost onclick=\"editRow('driver'," + d.id + ")\">Edit</button> <button class=ghost onclick=\"delRow('driver'," + d.id + ")\">Del</button>"])); },
  routes() { $("rouEl").innerHTML = tbl(["ID", "From", "To", "KM", "Status", "Actions"], O.routes.map(r => [r.id, esc(r.from), esc(r.to), r.km, r.status,
    "<button class=ghost onclick=\"editRow('route'," + r.id + ")\">Edit</button> <button class=ghost onclick=\"delRow('route'," + r.id + ")\">Del</button>"])); },
  trips() {
    $("tripEl").innerHTML = tbl(["ID", "Route", "Date", "Dep", "Vehicle", "Driver", "Seats", "Status", "Mongo", "Del"], O.trips.map(t => {
      const m = M.trip_media.filter(x => x.trip_id === t.id).length + M.announcements.filter(a => a.route_id === t.route).length;
      const cap = tripCap(t), tk = tripTaken(t.id).length;
      return [t.id, esc(rName(t.route)), t.date, t.dep, esc(vName(t.vehicle)), esc(dName(t.driver)), tk + "/" + cap + (tk >= cap ? " FULL" : ""), "<span class=tag>" + t.status + "</span>", m ? "[file]" + m : " - ",
        "<button class=ghost onclick=\"delRow('trip'," + t.id + ")\">Del</button>"];
    }));
  },
  bookings() {
    $("bookEl").innerHTML = tbl(["ID", "Passenger", "Trip", "Seat", "Fare", "Status", "Action"], O.bookings.map(b => [b.id, esc(pName(b.pass)), "#" + b.trip + " " + esc(rName((O.trips.find(t => t.id === b.trip) || {}).route)), b.seat, b.fare, b.status,
      b.status === "Confirmed" ? "<button class=ghost onclick=\"cancelBooking(" + b.id + ")\">Cancel</button>" : " - "]));
  },
  payments() { $("payEl").innerHTML = tbl(["ID", "Booking (seat)", "Trip", "Date", "Amt", "Method", "Status"], O.payments.map(p => { const b = O.bookings.find(x => x.id === p.booking) || {}; const t = O.trips.find(x => x.id === b.trip) || {}; return [p.id, "#" + p.booking + " * seat " + (b.seat ?? " - "), "#" + (b.trip ?? " - ") + " " + esc(rName(t.route)), p.date, p.amt, p.method, p.status]; })); },
  maint() { $("mntEl").innerHTML = tbl(["ID", "Vehicle", "Date", "Next", "Type", "Cost", "Status", "Actions"], O.maintenance.map(m => [m.id, esc(vName(m.vehicle)), m.date, m.next, esc(m.type), m.cost, m.status,
    "<button class=ghost onclick=\"cycleMaint(" + m.id + ")\">Next&nbsp;status</button> <button class=ghost onclick=\"delRow('maint'," + m.id + ")\">Del</button>"])); },
  feedback() {
    if ($("fbTabOracle")) $("fbTabOracle").classList.toggle("on", fbTab === "oracle");
    if ($("fbTabMongo")) $("fbTabMongo").classList.toggle("on", fbTab === "mongo");
    if (fbTab === "mongo") {
      $("fbEl").innerHTML = tbl(["Passenger", "Route", "Rating", "Comment", "Tags", "Date"], M.reviews.map(r => [esc(pName(r.passenger_id)), esc(rName(r.route_id)), "*".repeat(r.rating), esc(r.comment), (r.tags || []).join(", "), r.created_at || r.created || " - "]));
    } else {
      $("fbEl").innerHTML = tbl(["ID", "Passenger", "Trip", "Rating", "Comment", "Date"], O.feedback.map(f => [f.id, esc(pName(f.pass)), "#" + f.trip, "*".repeat(f.rating), esc(f.text), f.date || " - "]));
    }
  },
  ann() {
    $("annEl2").innerHTML = M.announcements.map((a, i) => "<div class=card><b>[" + esc(a.priority) + "] " + esc(a.title) + "</b><div style='font-size:13px;color:#94a3b8'>" + esc(a.message) + "</div><div style='font-size:11px;color:#64748b'>" + esc((a.created || "") + (a.time ? " " + a.time : "")) + "</div><div style='margin-top:8px'><button class=ghost onclick=\"delAnn(" + i + ")\">Remove</button></div></div>").join("");
  },
  community() {
    const src = u => "media/" + encodeURI(u);
    const me = currentUser();
    const like = (col, m) => { const l = m.liked_by || [], on = !!me && l.includes(me);
      return "<button class='mlike" + (on ? " on" : "") + "' data-col='" + col + "' data-id='" + esc(mediaId(m)) + "' title='" + (on ? "Unlike" : "Like") + "'>" + "<svg viewBox='0 0 24 24' width='15' height='15' fill='" + (on ? "currentColor" : "none") + "' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' style='vertical-align:-2px'><path d='M7 10v11H3V10h4zM7 10l4-8c1.7 0 3 1.3 3 3v3h5.5a2 2 0 0 1 2 2.3l-1.2 7.5A2 2 0 0 1 18.3 21H7'/></svg>" + " <span>" + l.length + "</span></button>"; };
    const card = (col, m, href, color, title, sub, tag, isImg) =>
      "<div class=mcard style='border-color:" + color + "'><a class=mlink href='" + esc(href) + "' target=_blank rel=noopener>" +
      (isImg ? "<img src='" + esc(href) + "' alt='' loading=lazy onerror=\"this.style.display='none'\">" : "<div class=mdoc style='color:" + color + "'>" + esc(tag) + "</div>") +
      "<div class=mcap><b>" + esc(title) + "</b><span>" + sub + "</span></div></a><div class=mfoot>" + like(col, m) + "</div></div>";
    const veh = M.vehicle_media.map(m => card("vehicle_media", m, src(m.url), m.color, m.title, esc(vName(m.vehicle_id)) + (m.uploaded ? " &middot; " + esc(m.uploaded) : ""), (m.doc_type || m.media_type || "file").toUpperCase(), m.media_type === "image")).join("");
    const trip = M.trip_media.map(m => card("trip_media", m, src(m.url || ("trip" + m.trip_id + ".jpg")), "#22d3ee", m.title || "Trip media", esc(rName((O.trips.find(t => t.id === m.trip_id) || {}).route)) + (m.note ? " &middot; " + esc(m.note) : ""), "TRIP", (m.kind || "photo") === "photo")).join("");
    $("medEl").innerHTML = "<div class=media>" + (veh || "<p class=muted>No vehicle media.</p>") + "</div>";
    $("tripMedEl").innerHTML = "<div class=media>" + (trip || "<p class=muted>No trip media.</p>") + "</div>";
    if (!window._likeHook) {
      window._likeHook = true;
      document.addEventListener("click", async e => {
        const b = e.target.closest ? e.target.closest(".mlike") : null; if (!b) return;
        const u = currentUser(); if (!u) { toast("Log in to like media", false); return; }
        const col = b.dataset.col, item = M[col].find(x => mediaId(x) === b.dataset.id); if (!item) return;
        const was = (item.liked_by || []).includes(u);
        const set = on => { item.liked_by = (item.liked_by || []).filter(x => x !== u); if (on) item.liked_by.push(u); R.community(); };
        set(!was);
        try {
          const base = getApiBase(); if (!base) throw "backend URL not set (Settings)";
          const r = await fetch(base, { method: "POST", body: new URLSearchParams({ action: "like", col: col, id: b.dataset.id, user: u, on: was ? 0 : 1 }) });
          const txt = await r.text(); let j = null;
          try { j = JSON.parse(txt); } catch (x) { throw "HTTP " + r.status + ", not JSON: " + txt.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 140); }
          if (!r.ok || !j.ok) throw (j.error || ("HTTP " + r.status));
          toast(was ? "Like removed" : "Liked");
        }
        catch (err) { set(was); toast("Like failed: " + err, false); }
      });
    }
  },
  about() {},
  profile() { if (window.renderProfile) window.renderProfile(); },
  settings() { if (window.syncLayoutUI) window.syncLayoutUI(); if (window.syncConnToggle) window.syncConnToggle(); },
};
function fixStickSoon(){setTimeout(()=>{if(window.fixStick)fixStick();},50);}
function syncConnToggle(){const t=$("connBarToggle"),bar=$("connBar");if(!t||!bar)return;const on=bar.style.display!=="none"&&getComputedStyle(bar).display!=="none";t.classList.toggle("bad",!on);t.innerHTML="<span class='dot'></span>Connection bar: "+(on?"ON":"OFF");}
window.syncConnToggle=syncConnToggle;
function toggleConnBar(on) {
  const bar = $("connBar");
  if(on===undefined)on=bar.style.display==="none"||getComputedStyle(bar).display==="none";
  if (bar) bar.style.display = on ? "" : "none";
  try { localStorage.setItem("sm_connbar", on ? "1" : "0"); } catch (e) {} syncConnToggle(); fixStickSoon();
}
window.toggleConnBar = toggleConnBar;
function checkConns() {
  const base = (typeof getApiBase === "function") ? getApiBase() : "";
  if (!base) {
    CONNS.oracle.ok = false; CONNS.mongo.ok = false;
    CONNS.oracle.db = "not linked  -  set backend URL";
    CONNS.mongo.db = "not linked  -  set backend URL";
    renderConns();
    toast("Not linked  -  set backend URL in Settings for live Oracle + MongoDB", false);
    return;
  }
  pingConns().then(j => {
    const bad = Object.keys(CONNS).filter(k => !CONNS[k].ok);
    if (!bad.length) toast("LIVE  -  Oracle (" + CONNS.oracle.db + ") + MongoDB (" + CONNS.mongo.db + ")");
    else toast("Connection failed  -  " + bad.map(k => CONNS[k].label + " (" + CONNS[k].db + ")" + (CONNS[k].err ? ": " + String(CONNS[k].err).slice(0,100) : "")).join(", "), false);
  });
}
window.checkConns = checkConns;


window.R = R;
function fill() {
  $("bkPass").innerHTML = O.passengers.map(p => "<option value='" + p.id + "'>" + esc(p.fn + " " + p.ln) + "</option>").join("");
  $("bkTrip").innerHTML = O.trips.map(t => "<option value='" + t.id + "'>#" + t.id + " " + esc(rName(t.route)) + " " + t.date + "</option>").join("");
  $("fbPass").innerHTML = $("bkPass").innerHTML; $("fbTrip").innerHTML = $("bkTrip").innerHTML;
  $("payBook").innerHTML = O.bookings.filter(b => b.status === "Confirmed").map(b => "<option value='" + b.id + "'>#" + b.id + " " + esc(pName(b.pass)) + " * seat " + b.seat + " * Rs" + b.fare + "</option>").join("") || "<option value=''> -  no unpaid bookings  - </option>";
  if ($("tVeh")) $("tVeh").innerHTML = O.vehicles.map(v => "<option value='" + v.id + "'>" + esc(v.reg + " (" + v.type + ", cap " + v.cap + ")") + "</option>").join("");
  if ($("tDrv")) $("tDrv").innerHTML = O.drivers.map(d => "<option value='" + d.id + "'>" + esc(d.fn + " " + d.ln) + "</option>").join("");
  if ($("tRou")) $("tRou").innerHTML = O.routes.map(r => "<option value='" + r.id + "'>" + esc(r.from + " - " + r.to) + "</option>").join("");
  if ($("mVeh")) $("mVeh").innerHTML = O.vehicles.map(v => "<option value='" + v.id + "'>" + esc(v.reg) + "</option>").join("");
  if ($("fltPass") && !$("fltPass").options.length) $("fltPass").innerHTML = "<option value=''>all passengers</option>" + $("bkPass").innerHTML;
  if ($("fltRoute") && !$("fltRoute").options.length) $("fltRoute").innerHTML = "<option value=''>all routes</option>" + O.routes.map(r => "<option value='" + r.id + "'>" + esc(r.from + " - " + r.to) + "</option>").join("");
  if ($("bkTrip")) $("bkTrip").onchange = () => { const t = O.trips.find(x => x.id === +$("bkTrip").value); if (t) { const r = O.routes.find(x => x.id === t.route); $("bkFare").value = Math.round((r ? r.km : 100) * 2.5); } renderSeatAvail(); };
  renderSeatAvail();
}
function refreshAll() {
  fill();
  const onPg = document.querySelector(".page.on");
  if (onPg) {
    const p = onPg.id.replace("pg-", "");
    if (R[p]) R[p]();
  }
  if (window.renderProfile) window.renderProfile();
  if (window.renderUserChip) window.renderUserChip();
  if (window.renderSeatAvail) window.renderSeatAvail();
}
window.refreshAll = refreshAll;
async function refreshFromServer(page) {
  if (!getApiBase()) { refreshAll(); return false; }
  try {
    await loadLive();
    fill();
    if (page && R[page]) R[page]();
    else refreshAll();
    if (page === 'drivers') {
      const el = $("drvEl");
      if (el && R.drivers) R.drivers();
    }
    return true;
  } catch (err) {
    toast("Live refresh failed: " + err, false);
    refreshAll();
    return false;
  }
}
window.refreshFromServer = refreshFromServer;
async function doBook(e) {
  e.preventDefault();
  const seats = ($("bkSeats").value || "").split(/[,\s]+/).map(x => +x).filter(x => Number.isFinite(x) && x >= 1);
  if (!seats.length) { toast("Enter seat numbers, e.g. 6,7,8.", false); return; }
  const dup = seats.filter((x, i) => seats.indexOf(x) !== i);
  if (dup.length) { toast("Duplicate seats in request: " + [...new Set(dup)].join(", "), false); return; }
  if (!requireLive()) return;
  const ids = [];
  try {
    for (const st of seats) {
      const j = await apiPost({ action: "book", passenger_id: +$("bkPass").value, trip_id: +$("bkTrip").value, seat: st, fare: +$("bkFare").value });
      ids.push(j.booking_id);
    }
    await loadLive();
    toast("Booked " + ids.length + " seat(s) via sp_book_ticket [ok] IDs " + ids.join(", "));
    R.bookings(); R.trips(); fill(); renderSeatAvail();
  } catch (err) { toast("Booking failed at seat " + (ids.length + 1) + ": " + err, false); R.bookings(); R.trips(); fill(); renderSeatAvail(); }
}

async function doPay(e) {
  e.preventDefault();
  const b = +$("payBook").value;
  if (!requireLive()) return;
  try {
    const bk = O.bookings.find(x => x.id === b);
    await apiPost({ action: "add", table: "pay", booking: b, amt: bk ? bk.fare : +$("payAmt").value, method: $("payMethod").value });
    await loadLive(); toast("Payment saved to Oracle via sp_record_payment [ok]");
  } catch (err) { toast("Payment failed: " + err, false); }
  R.payments();
}

async function doFb(e) {
  e.preventDefault();
  const r = +$("fbRate").value; if (!(r >= 1 && r <= 5)) return toast("Rating must be 1-5.", false);
  if (!requireLive()) return;
  const t = O.trips.find(x => x.id == $("fbTrip").value);
  try {
    if (fbTab === "mongo") {
      await apiPost({ action: "feedback", target: "mongo", passenger_id: +$("fbPass").value, trip_id: +$("fbTrip").value, route_id: t ? t.route : null, rating: r, comment: $("fbText").value });
      await loadLive(); toast("Feedback saved to Mongo reviews [ok]");
    } else {
      await apiPost({ action: "feedback", target: "oracle", passenger_id: +$("fbPass").value, trip_id: +$("fbTrip").value, rating: r, comment: $("fbText").value });
      await loadLive(); toast("Feedback saved to Oracle FEEDBACK [ok]");
    }
  } catch (err) { toast("Feedback failed: " + err, false); }
  $("fbText").value = ""; R.feedback(); R.community();
}

async function addVehicle(e) {
  e.preventDefault();
  if (!requireLive()) return;
  try {
    await apiPost({ action: "add", table: "vehicle", reg: $("vReg").value, type: $("vType").value, cap: +$("vCap").value, status: $("vStat").value });
    await loadLive(); toast("Vehicle saved to Oracle VEHICLE [ok]");
  } catch (err) { toast("Save failed: " + err, false); return; }
  e.target.reset(); refreshAll();
}
async function editRow(kind, id) {
  const g = (msg, cur) => prompt(msg, cur);
  if (!requireLive()) return;
  try {
    if (kind === "vehicle") {
      const v = O.vehicles.find(x => x.id === id); const st = g("Status (Available/In Service/Inactive):", v.status); if (!st) return;
      await apiPost({ action: "modify", op: "edit_vehicle", id, status: st });
    } else if (kind === "driver") {
      const d = O.drivers.find(x => x.id === id); const p = g("Phone:", d.phone); if (p === null) return;
      const st = g("Status (Available/On Trip/Inactive):", d.status); if (st === null) return;
      await apiPost({ action: "modify", op: "edit_driver", id, phone: p, status: st });
    } else if (kind === "route") {
      const r = O.routes.find(x => x.id === id); const km = g("Distance KM (>0):", r.km); if (km === null) return;
      const st = g("Status (Active/Inactive):", r.status) || r.status;
      await apiPost({ action: "modify", op: "edit_route", id, km, status: st });
    } else if (kind === "passenger") {
      const p = O.passengers.find(x => x.id === id); const ph = g("Phone:", p.phone); if (ph === null) return;
      const em = g("Email (optional):", p.email || "");
      await apiPost({ action: "modify", op: "edit_passenger", id, phone: ph, email: em || "" });
    } else return;
    await loadLive();
    toast("Updated in Oracle [ok] (" + kind.toUpperCase() + ")");
    fill();
    if (R[kind === 'driver' ? 'drivers' : kind === 'passenger' ? 'pass' : kind === 'vehicle' ? 'vehicles' : kind === 'route' ? 'routes' : kind]) R[kind === 'driver' ? 'drivers' : kind === 'passenger' ? 'pass' : kind === 'vehicle' ? 'vehicles' : kind === 'route' ? 'routes' : kind]();
  } catch (err) { toast("Update failed: " + err, false); return; }
}

async function addDriver(e) {
  e.preventDefault();
  if (!requireLive()) return;
  try {
    await apiPost({ action: "add", table: "driver", fn: $("dFn").value.trim(), ln: $("dLn").value.trim(), lic: $("dLic").value.trim(), phone: $("dPhone").value.trim(), status: $("dStat").value });
    await loadLive();
    e.target.reset();
    fill();
    R.drivers();
    toast("Driver saved to Oracle DRIVER [ok]");
  } catch (err) { toast("Save failed: " + err, false); return; }
}
async function addRoute(e) {
  e.preventDefault();
  const km = +$("rKm").value;
  if (!(km > 0)) return toast("Distance must be > 0 (CK_ROUTE_DISTANCE).", false);
  if (!requireLive()) return;
  try {
    await apiPost({ action: "add", table: "route", from: $("rFrom").value.trim(), to: $("rTo").value.trim(), km, status: $("rStat").value });
    await loadLive(); toast("Route saved to Oracle ROUTE [ok]");
  } catch (err) { toast("Save failed: " + err, false); return; }
  e.target.reset(); refreshAll();
}
async function addPassenger(e) {
  e.preventDefault();
  if (!requireLive()) return;
  try {
    await apiPost({ action: "add", table: "passenger", fn: $("pFn").value.trim(), ln: $("pLn").value.trim(), phone: $("pPhone").value.trim(), email: $("pEmail").value.trim() });
    await loadLive(); toast("Passenger saved to Oracle PASSENGER [ok]");
  } catch (err) { toast("Save failed: " + err, false); return; }
  e.target.reset(); refreshAll();
}
async function addTrip(e) {
  e.preventDefault();
  if (!requireLive()) return;
  try {
    await apiPost({ action: "add", table: "trip", vehicle: +$("tVeh").value, driver: +$("tDrv").value, route: +$("tRou").value, date: $("tDate").value, dep: $("tDep").value, status: $("tStat").value });
    await loadLive(); toast("Trip saved to Oracle TRIP [ok]");
  } catch (err) { toast("Save failed: " + err, false); return; }
  refreshAll(); renderSeatAvail();
}
async function addMaint(e) {
  e.preventDefault();
  if ($("mNext").value < $("mDate").value) return toast("Next date must be >= date (CK_MAINTENANCE_DATES).", false);
  if (!requireLive()) return;
  try {
    await apiPost({ action: "add", table: "maintenance", vehicle: +$("mVeh").value, date: $("mDate").value, next: $("mNext").value, type: $("mType").value, cost: +$("mCost").value });
    await loadLive(); toast("Maintenance saved to Oracle MAINTENANCE [ok]");
  } catch (err) { toast("Save failed: " + err, false); return; }
  e.target.reset(); refreshAll();
}
async function addAnn(e) {
  e.preventDefault();
  if (!requireLive()) return;
  try {
    await apiPost({ action: "add", table: "announcement", title: $("aTitle").value, message: $("aMsg").value, priority: $("aPri").value });
    await loadLive(); toast("Announcement saved to MongoDB [ok]");
  } catch (err) { toast("Post failed: " + err, false); return; }
  e.target.reset(); R.ann(); R.dash();
}
async function delRow(kind, id) {
  if (!requireLive()) return;
  try {
    await apiPost({ action: "modify", op: "delete", kind, id });
    await loadLive();
    fill();
    const page = kind === 'driver' ? 'drivers' : kind === 'passenger' ? 'pass' : kind === 'vehicle' ? 'vehicles' : kind === 'route' ? 'routes' : kind === 'maint' ? 'maint' : kind + 's';
    if (R[page]) R[page]();
    toast("Deleted from Oracle [ok] (" + kind.toUpperCase() + " id=" + id + ")");
  } catch (err) { toast("Delete blocked: " + err, false); return; }
}
async function cancelBooking(id) {
  if (!requireLive()) return;
  try {
    await apiPost({ action: "modify", op: "cancel_booking", id });
    await loadLive(); toast("Booking #" + id + " cancelled in Oracle [ok]");
  } catch (err) { toast("Cancel failed: " + err, false); }
  refreshAll(); renderSeatAvail();
}
async function cycleVehicle(id) {
  const v = O.vehicles.find(x => x.id === id); if (!v) return;
  const seq = ["Available", "In Service", "Maintenance"];
  const ns = seq[(seq.indexOf(v.status) + 1) % seq.length];
  if (!requireLive()) return;
  try {
    await apiPost({ action: "modify", op: "cycle_vehicle", id, status: ns });
    await loadLive(); toast("Vehicle status -> " + ns + " (Oracle live)");
  } catch (err) { toast("Update failed: " + err, false); }
  R.vehicles();
}
window.cycleVehicle = cycleVehicle;
async function cycleMaint(id) {
  const m = O.maintenance.find(x => x.id === id); if (!m) return;
  const seq = ["Scheduled", "In Progress", "Completed", "Cancelled"];
  const ns = seq[(seq.indexOf(m.status) + 1) % seq.length];
  if (!requireLive()) return;
  try {
    await apiPost({ action: "modify", op: "cycle_maint", id, status: ns });
    await loadLive(); toast("Maintenance #" + id + " - " + ns + " (Oracle live)");
  } catch (err) { toast("Update failed: " + err, false); }
  R.maint();
}
window.renderSeatAvail = renderSeatAvail; window.doBook = doBook; window.doPay = doPay; window.doFb = doFb; window.addVehicle = addVehicle; window.addDriver = addDriver; window.addRoute = addRoute; window.addPassenger = addPassenger; window.addTrip = addTrip; window.addMaint = addMaint; window.addAnn = addAnn; window.delRow = delRow; window.editRow = editRow; window.cancelBooking = cancelBooking; window.cycleMaint = cycleMaint;
const DB_CONFIG = { oracleDb: "XEPDB1", mongoDb: "smartmove" };
function getApiBase(){ try { return localStorage.getItem("sm_api_base") || ""; } catch(e){ return ""; } }
function setApiBase(v){ try { localStorage.setItem("sm_api_base", (v||"").trim()); } catch(e){} syncApiUI(); pingConns().then(()=>{ if (getApiBase()) loadLive().then(()=>{ refreshAll(); }).catch(e=>toast("Live load failed: "+e,false)); }); }
function requireLive() {
  if (getApiBase()) return true;
  toast("Not linked to database  -  set backend URL in Settings.", false);
  return false;
}
window.requireLive = requireLive;
window.setApiBase = setApiBase;
async function pingConns(){
  const base = getApiBase();
  if (!base) {
    CONNS.oracle.ok = false; CONNS.mongo.ok = false;
    CONNS.oracle.db = "not linked"; CONNS.mongo.db = "not linked";
    renderConns(); return { mode: "unlinked" };
  }
  CONNS.oracle.db = "checking..."; CONNS.mongo.db = "checking..."; renderConns();
  try {
    const ctl = new AbortController(); const to = setTimeout(()=>ctl.abort(), 7000);
    const r = await fetch(base + (base.includes("?") ? "&" : "?") + "action=ping", { signal: ctl.signal });
    clearTimeout(to);
    const j = await r.json();
    CONNS.oracle.ok = !!j.oracle_ok; CONNS.mongo.ok = !!j.mongo_ok;
    CONNS.oracle.db = j.oracleDb || DB_CONFIG.oracleDb; CONNS.mongo.db = j.mongoDb || DB_CONFIG.mongoDb;
    CONNS.oracle.err = j.oracle_error || ""; CONNS.mongo.err = j.mongo_error || "";
    renderConns(); return j;
  } catch(e) {
    CONNS.oracle.ok = false; CONNS.mongo.ok = false;
    CONNS.oracle.db = "unreachable"; CONNS.mongo.db = "unreachable";
    renderConns(); return { error: String(e).slice(0,120) };
  }
}
window.pingConns = pingConns;
function syncApiUI(){
  const i = $("apiBaseInput"); if (i && document.activeElement !== i) i.value = getApiBase();
  const ai = $("authApiBaseInput"); if (ai && document.activeElement !== ai) ai.value = getApiBase();
  const m = $("apiModeEl"); if (m) m.textContent = getApiBase() ? "Linked  -  pills show live Oracle + Mongo status." : "Not linked  -  set the backend URL to connect.";
  const se = $("authSetErr"); if (se) { if (getApiBase()) { se.style.color = "#4ade80"; se.textContent = "Backend linked: " + getApiBase(); } else { se.style.color = "#f87171"; se.textContent = "Not linked"; } }
}
window.syncApiUI = syncApiUI;
async function apiPost(params){
  const base = getApiBase(); if (!base) return null;
  const body = new URLSearchParams(params);
  const r = await fetch(base, { method: "POST", body });
  const j = await r.json().catch(()=>({}));
  if (!r.ok) throw (j.error || ("HTTP " + r.status));
  return j;
}
async function loadLive(){
  const base = getApiBase(); if (!base) return false;
  const sep = base.includes("?") ? "&" : "?";
  const r = await fetch(base + sep + "action=list_all&_ts=" + Date.now(), { cache: "no-store", headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" } });
  const j = await r.json();
  if (j.error) throw j.error;
  const num = v => (v === null || v === undefined || v === "") ? v : (+v);
  if (Array.isArray(j.vehicles)) O.vehicles = j.vehicles.map(v => ({ ...v, id: num(v.id), cap: num(v.cap) }));
  if (Array.isArray(j.drivers)) O.drivers = j.drivers.map(d => ({ ...d, id: num(d.id) }));
  if (Array.isArray(j.routes)) O.routes = j.routes.map(r => ({ ...r, id: num(r.id), km: num(r.km) }));
  if (Array.isArray(j.passengers)) O.passengers = j.passengers.map(p => ({ ...p, id: num(p.id) }));
  if (Array.isArray(j.trips)) O.trips = j.trips.map(t => ({ id: num(t.id), vehicle: num(t.vehicle), driver: num(t.driver), route: num(t.route), date: t.date || t.DATE, dep: t.dep || t.DEP, arr: t.arr || t.ARR, status: t.status || t.STATUS }));
  if (Array.isArray(j.bookings)) O.bookings = j.bookings.map(b => ({ id: num(b.id), pass: num(b.pass ?? b.PASS), trip: num(b.trip ?? b.TRIP), date: b.date || b.DATE, seat: num(b.seat ?? b.SEAT), fare: num(b.fare ?? b.FARE), status: b.status || b.STATUS }));
  if (Array.isArray(j.payments)) O.payments = j.payments.map(p => ({ id: num(p.id), booking: num(p.booking ?? p.BOOKING), date: p.date || p.DATE, amt: num(p.amt ?? p.AMT), method: p.method || p.METHOD, status: p.status || p.STATUS }));
  if (Array.isArray(j.maintenance)) O.maintenance = j.maintenance.map(m => ({ id: num(m.id), vehicle: num(m.vehicle ?? m.VEHICLE), date: m.date || m.DATE, next: m.next || m.NEXT, type: m.type || m.TYPE, desc: m.desc ?? m.DESC, cost: num(m.cost ?? m.COST), status: m.status || m.STATUS }));
  if (Array.isArray(j.feedback)) O.feedback = j.feedback.map(f => ({ id: num(f.id), pass: num(f.pass ?? f.PASS), trip: num(f.trip ?? f.TRIP), rating: num(f.rating ?? f.RATING), text: f.text ?? f.TEXT, date: f.date || f.DATE }));
  if (Array.isArray(j.announcements)) M.announcements = j.announcements.map(a => ({ title: a.title ?? a.TITLE, message: a.message ?? a.MESSAGE, route_id: a.route_id ?? a.ROUTE_ID ?? null, priority: a.priority ?? a.PRIORITY ?? "info", created: a.created ?? a.created_at ?? a.CREATED_AT, time: a.time ?? a.TIME ?? "" }));
  if (Array.isArray(j.reviews)) M.reviews = j.reviews;
  if (Array.isArray(j.vehicle_media)) M.vehicle_media = j.vehicle_media.map(m => ({ vehicle_id: +m.vehicle_id, _id: m._id, liked_by: Array.isArray(m.liked_by) ? m.liked_by : [], media_type: m.media_type, doc_type: m.doc_type || "", url: m.url || "", title: m.title || m.description || "media", description: m.description || "", uploaded: m.uploaded || m.uploaded_date || m.created_at || "", color: m.color || "#0ea5e9" }));
  if (Array.isArray(j.trip_media)) M.trip_media = j.trip_media;
  return true;
}
window.loadLive = loadLive;
const CONNS = {
  oracle: { el: "connOracle", label: "Oracle", db: "not linked", ok: false },
  mongo: { el: "connMongo", label: "MongoDB", db: "not linked", ok: false }
};
function renderConns() {
  for (const k in CONNS) {
    const c = CONNS[k], el = $(c.el);
    if (!el) continue;
    el.classList.toggle("bad", !c.ok);
    el.innerHTML = "<span class='dot'></span>" + esc(c.label + " (" + c.db + "): " + (c.ok ? "connected" : "connection failed"));
  }
}
["mouseover","mouseout"].forEach(ev => document.addEventListener(ev, e => {
  const ib = e.target.closest ? e.target.closest("[data-info]") : null;
  if (!ib) return;
  const t = document.getElementById(ib.getAttribute("data-info"));
  if (t) t.hidden = (ev === "mouseout");
}));
document.addEventListener("DOMContentLoaded", () => {
  renderConns();
  $("connX").addEventListener("click", () => {
    toggleConnBar(false);
  });
  try { if (localStorage.getItem("sm_connbar") === "0") toggleConnBar(false); } catch (e) {}
  document.title = "SmartMove Transport Solutions";
  let fav = document.querySelector("link[rel=icon]");
  if (!fav) { fav = document.createElement("link"); fav.rel = "icon"; fav.type = "image/svg+xml"; fav.href = "assets/logo.svg"; document.head.appendChild(fav); }
  applyLayout(); fill(); nav("dash"); renderUserChip(); syncLayoutUI(); syncConnToggle(); if (window.syncApiUI) syncApiUI(); if (window.pingConns && getApiBase()) { pingConns(); loadLive().then(()=>{ refreshAll(); }).catch(()=>{}); } else renderConns(); document.addEventListener("change",e=>{if(e.target&&e.target.name==="layoutMode")setLayout(e.target.value);});
  setTimeout(() => { if (window.authGate) window.authGate(); else document.getElementById("splash").classList.add("off"); }, 1100);
});

let tourIdx = 0, tourTimer = null;
function tourChunk(rows, per) { const out = []; for (let i = 0; i < rows.length; i += per) out.push(rows.slice(i, i + per)); return out.length ? out : [[]]; }
function tourSlides() {
  var PER = (window.innerWidth && window.innerWidth < 700) ? 4 : 10;
  const dep = O.trips.filter(function(t){ return t.status === "Departed"; });
  const onTrip = O.drivers.filter(function(d){ return d.status === "On Trip"; });
  const S = [{ logo: true }];
  tourChunk(O.trips, PER).forEach(function(rows){ S.push({ head: "\uD83D\uDD52 Upcoming trips", body: tbl(["Trip", "Route", "Date", "Dep", "Vehicle"], rows.map(function(t){ return ["#" + t.id, esc(rName(t.route)), t.date, t.dep, esc(vName(t.vehicle))]; })) }); });
  tourChunk(O.routes, PER).forEach(function(rows){ S.push({ head: "\uD83D\uDDFA\uFE0F Routes + trip IDs", body: tbl(["Route", "KM", "Trips"], rows.map(function(r){ return [esc(r.from + " \u2192 " + r.to), r.km, O.trips.filter(function(t){ return t.route === r.id; }).map(function(t){ return "#" + t.id; }).join(" ") || "\u2014"]; })) }); });
  tourChunk(O.trips, PER).forEach(function(rows){ S.push({ head: "\uD83D\uDE8C Vehicles + available seats", body: tbl(["Trip", "Vehicle", "Free"], rows.map(function(t){ const v = O.vehicles.find(function(x){ return x.id === t.vehicle; }); const cap = v ? v.cap : 30; const tk = O.bookings.filter(function(b){ return b.trip === t.id && b.status === "Confirmed"; }).length; return ["#" + t.id, esc(vName(t.vehicle)), (cap - tk) + "/" + cap]; })) }); });
  tourChunk(dep, PER).forEach(function(rows){ S.push({ head: "\uD83D\uDEE3\uFE0F Departed vehicles", body: rows.length ? tbl(["Trip", "Vehicle", "Driver", "Status"], rows.map(function(t){ return ["#" + t.id, esc(vName(t.vehicle)), esc(dName(t.driver)), t.status]; })) : "<div class=mut>No departed vehicles</div>" }); });
  tourChunk(onTrip, PER).forEach(function(rows){ S.push({ head: "On-trip drivers", body: rows.length ? tbl(["Driver", "License", "Status"], rows.map(function(d){ return [esc(d.fn + " " + d.ln), d.lic, d.status]; })) : "<div class=mut>No drivers on trip</div>" }); });
  return S;
}
function renderTour() {
  const track = $("tourTrack");
  if (!track) return;
  const S = tourSlides();
  track.innerHTML = S.map(function(s){ return s.logo
    ? "<div class='tourSlide tourLogo'><div class=tourEnd><img src='assets/logo.svg'><div class=tourTitle>Smart<span>Move</span></div><div class=mut>Transport Solutions' Updates</div></div></div>"
    : "<div class=tourSlide><h3>" + s.head + "</h3>" + s.body + "</div>"; }).join("");
  tourIdx = 0;
  tourCaps();
  tourTimer = null; ifNoActionAutomateSlide();
}
function tourCaps() { const c = $("tourCaps"), track = $("tourTrack"); if (c && track) c.textContent = (tourIdx + 1) + " / " + track.children.length; }
function tourGo(i) {
  const track = $("tourTrack");
  if (!track) return;
  const n = track.children.length;
  tourIdx = ((i % n) + n) % n;
  track.scrollTo({ left: track.children[tourIdx].offsetLeft - track.offsetLeft, behavior: "smooth" });
  tourCaps();
}
window.tourGo = tourGo;
function slideRight() { tourGo(tourIdx + 1); }
function slideLeft() { tourGo(tourIdx - 1); }
window.slideRight = slideRight; window.slideLeft = slideLeft;
let tourIdle = null;
function ifNoActionAutomateSlide() {
  if (tourIdle) clearTimeout(tourIdle);
  tourIdle = setTimeout(() => {
    if (document.querySelector("#pg-dash.on") && $("tourTrack")) tourGo(tourIdx + 1);
    ifNoActionAutomateSlide();
  }, 5000);
}
window.ifNoActionAutomateSlide = ifNoActionAutomateSlide;
function noteTourAction() {
  if (tourTimer) { clearInterval(tourTimer); tourTimer = null; }
  ifNoActionAutomateSlide();
}
let lastRC = 0;
document.addEventListener("contextmenu", e => {
  const el = e.target && e.target.closest ? e.target.closest("#tourEl") : null;
  if (!el) return;
  e.preventDefault();
  const now = Date.now();
  if (now - lastRC < 450) {
    if (tourTimer) { clearInterval(tourTimer); tourTimer = null; }
    if (tourIdle) { clearTimeout(tourIdle); tourIdle = null; }
    toast("Cover held");
  } else noteTourAction();
  lastRC = now;
});
document.addEventListener("dblclick", e => {
  const t = e.target && e.target.closest ? e.target.closest("#tourEl") : null;
  if (!t) return;
  const r = t.getBoundingClientRect();
  tourGo(tourIdx + (e.clientX < r.left + r.width / 2 ? -1 : 1));
});
document.addEventListener("pointerdown", e => { if (e.target && e.target.closest && e.target.closest("#tourEl")) { if (tourTimer) { clearInterval(tourTimer); tourTimer = null; } } });
