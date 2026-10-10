function pwHash(s) { s = "sm$" + s; let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return (h >>> 0).toString(16); }
function isLive() { try { return !!localStorage.getItem("sm_api_base"); } catch (e) { return false; } }
window.isLive = isLive;
async function liveUsers(op, params) {
  const j = await apiPost({ action: "users", op, ...(params || {}) });
  return j;
}
window.liveUsers = liveUsers;
function currentUser() { try { return localStorage.getItem("sm_session") || ""; } catch (e) { return ""; } }
function setSession(u) { try { if (u) localStorage.setItem("sm_session", u); else localStorage.removeItem("sm_session"); } catch (e) {} }
function validUsername(u) { return /^[A-Za-z0-9_]{3,16}$/.test(u); }
function validPassword(p) { return p.length >= 6 && /[A-Za-z]/.test(p) && /[0-9]/.test(p); }
function authTab(which) {
  const panes = { login: "authLoginPane", reg: "authRegPane", forgot: "authForgotPane", settings: "authSettingsPane" };
  for (const k in panes) { const el = document.getElementById(panes[k]); if (el) el.hidden = k !== which; }
  const tl = document.getElementById("tabLogin"); if (tl) tl.classList.toggle("on", which === "login");
  const tr = document.getElementById("tabReg"); if (tr) tr.classList.toggle("on", which === "reg");
  const ts = document.getElementById("tabSettings"); if (ts) ts.classList.toggle("on", which === "settings");
  ["loginErr", "regErr", "fgErr1", "fgErr2", "fgErr3", "authSetErr"].forEach(id => { const e = document.getElementById(id); if (e) { e.textContent = ""; e.style.color = ""; } });
  if (which === "forgot") { document.getElementById("fgStep1").hidden = false; document.getElementById("fgStep2").hidden = true; document.getElementById("fgStep3").hidden = true; }
  if (which === "settings" && window.syncApiUI) { window.syncApiUI(); }
}
window.authTab = authTab;
function splashRun(fn) { const sp = document.getElementById("splash"); if (sp) sp.classList.remove("off"); setTimeout(() => { if (sp) sp.classList.add("off"); fn(); }, 900); }
window.splashRun = splashRun;
window._authEpoch = Number(window._authEpoch || 0);
function enterApp(u) {
  const epoch = window._authEpoch;
  splashRun(() => {
    // A queued login animation must not hide the gate after the user has logged out.
    if (epoch !== window._authEpoch || currentUser() !== u) return;
    const gate = document.getElementById("authGate");
    if (gate) gate.hidden = true;
    toast("Welcome, " + u);
    if (window.renderUserChip) window.renderUserChip();
    if (window.renderProfile) window.renderProfile();
    nav("dash");
  });
}
async function authGate() {
  const epoch = window._authEpoch;
  const sp0 = document.getElementById("splash"); if (sp0) sp0.classList.add("off");
  if (!isLive()) {
    setSession("");
    authTab("login");
    document.getElementById("authGate").hidden = false;
    document.getElementById("loginErr").textContent = "Backend not linked  -  use the settings icon above or set backend URL.";
    return;
  }
  const u = currentUser();
  if (u) {
    try {
      const me = await liveUsers("get", { username: u });
      if (epoch !== window._authEpoch || currentUser() !== u) return;
      if (me && me.username) { window._me = me; enterAppSilent(u); return; }
    } catch (x) {}
  }
  setSession("");
  authTab("login");
  document.getElementById("authGate").hidden = false;
}
window.authGate = authGate;
function enterAppSilent(u) { document.getElementById("authGate").hidden = true; if (window.renderUserChip) window.renderUserChip(); nav("dash"); }
async function doLogin(e) {
  e.preventDefault();
  const u = document.getElementById("loginUser").value.trim(), p = document.getElementById("loginPass").value;
  const err = document.getElementById("loginErr");
  if (!u || !p) { err.textContent = "Enter your username and password."; return false; }
  if (!isLive()) { err.textContent = "Backend not linked  -  set the backend URL in Settings."; return false; }
  try {
    const me = await liveUsers("login", { username: u, h: pwHash(p) });
    window._me = me;
    setSession(u);
  } catch (le) { err.textContent = "Invalid username or password."; return false; }
  document.getElementById("loginPass").value = "";
  enterApp(u);
  return false;
}
window.doLogin = doLogin;
async function doRegister(e) {
  e.preventDefault();
  const u = document.getElementById("regUser").value.trim(), p = document.getElementById("regPass").value, p2 = document.getElementById("regPass2").value;
  const err = document.getElementById("regErr");
  if (!validUsername(u)) { err.textContent = "Username must be 3-16 characters: letters, numbers, _ only."; return false; }
  if (!validPassword(p)) { err.textContent = "Password needs min 6 characters with at least one letter and one number."; return false; }
  if (p !== p2) { err.textContent = "Passwords do not match."; return false; }
  if (!isLive()) { err.textContent = "Backend not linked  -  set the backend URL in Settings."; return false; }
  try {
    await liveUsers("register", { username: u, h: pwHash(p) });
  } catch (re) { err.textContent = "Register failed: " + re; return false; }
  setSession("");
  document.getElementById("regPass").value = ""; document.getElementById("regPass2").value = "";
  splashRun(() => {
    authTab("login");
    document.getElementById("loginUser").value = u;
    document.getElementById("loginPass").value = "";
    const le = document.getElementById("loginErr");
    le.style.color = "#4ade80";
    le.textContent = "Account created in MongoDB users  -  please log in.";
  });
  return false;
}
window.doRegister = doRegister;
async function doForgotSend(e) {
  e.preventDefault();
  const u = document.getElementById("fgUser").value.trim();
  const err = document.getElementById("fgErr1");
  if (!isLive()) { err.textContent = "Backend not linked  -  set the backend URL in Settings."; return false; }
  try {
    const j = await liveUsers("reset_issue", { username: u });
    window._resetUser = u;
    document.getElementById("fgCodeHint").textContent = "Reset code for " + u + ": " + j.code + " (valid 10 min)";
    document.getElementById("fgStep1").hidden = true; document.getElementById("fgStep2").hidden = false;
  } catch (re) { err.textContent = "Reset failed: " + re; }
  return false;
}
window.doForgotSend = doForgotSend;
async function doForgotVerify(e) {
  e.preventDefault();
  const err = document.getElementById("fgErr2");
  if (!isLive()) { err.textContent = "Backend not linked."; return false; }
  try {
    await liveUsers("reset_verify", { username: window._resetUser || "", code: document.getElementById("fgCode").value.trim() });
    document.getElementById("fgStep2").hidden = true; document.getElementById("fgStep3").hidden = false;
  } catch (re) { err.textContent = "Verification failed: " + re; }
  return false;
}
window.doForgotVerify = doForgotVerify;
async function doForgotReset(e) {
  e.preventDefault();
  const err = document.getElementById("fgErr3");
  const p = document.getElementById("fgNew").value, p2 = document.getElementById("fgNew2").value;
  if (!validPassword(p)) { err.textContent = "Password needs min 6 characters with at least one letter and one number."; return false; }
  if (p !== p2) { err.textContent = "Passwords do not match."; return false; }
  if (!isLive()) { err.textContent = "Backend not linked."; return false; }
  try {
    await liveUsers("reset_reset", { username: window._resetUser || "", code: document.getElementById("fgCode").value.trim(), h: pwHash(p) });
  } catch (re) { err.textContent = "Reset failed: " + re; return false; }
  setSession(window._resetUser || "");
  enterApp(window._resetUser || "");
  return false;
}
window.doForgotReset = doForgotReset;
function doLogout(){
  // Logout is local, synchronous, and never depends on backend availability.
  window._authEpoch = Number(window._authEpoch || 0) + 1;
  setSession("");
  window._me = null;
  window._accList = null;
  window._delArm = false;
  const lu = document.getElementById("loginUser"); if (lu) lu.value = "";
  const lp = document.getElementById("loginPass"); if (lp) lp.value = "";
  const err = document.getElementById("loginErr"); if (err) { err.textContent = ""; err.style.color = ""; }
  const g = document.getElementById("authGate"); if (g) { g.hidden = false; g.setAttribute("aria-modal", "true"); }
  authTab("login");
  if (window.renderUserChip) window.renderUserChip();
  if (window.renderProfile) window.renderProfile();
  try { window.scrollTo(0, 0); } catch (e) {}
  if (lu) { try { lu.focus({ preventScroll: true }); } catch (e) { lu.focus(); } }
  if (typeof toast === "function") toast("Logged out");
  return false;
}
window.doLogout = doLogout;
async function switchAccount(n) {
  setSession("");
  window._me = null;
  if (window.renderUserChip) window.renderUserChip();
  nav("dash");
  authTab("login");
  document.getElementById("loginUser").value = n;
  document.getElementById("loginPass").value = "";
  document.getElementById("authGate").hidden = false;
}
window.switchAccount = switchAccount;
function accBtnHandler(e) {
  var b = e.target && e.target.closest ? e.target.closest("[data-acc-use]") : null;
  if (!b || !window._accList) return;
  var n = window._accList[+b.getAttribute("data-acc-use")];
  if (!n) return;
  switchAccount(n);
}
document.addEventListener("click", accBtnHandler);
if (!window._picHook) {
  window._picHook = true;
  document.addEventListener("change", function (e) {
    if (!e.target || e.target.id !== "picInput" || !e.target.files || !e.target.files[0]) return;
    var file = e.target.files[0];
    var rd = new FileReader();
    rd.onload = function () {
      var img = new Image();
      img.onload = function () {
        var s = 128, cv = document.createElement("canvas");
        cv.width = s; cv.height = s;
        var cx = cv.getContext("2d"), sc = Math.max(s / img.width, s / img.height);
        var w = img.width * sc, h = img.height * sc;
        cx.drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
        var u = currentUser();
        if (!u) return;
        var data = cv.toDataURL("image/jpeg", 0.8);
        liveUsers("set_pic", { username: u, pic: data }).then(function () {
          if (window._me) window._me.pic = data;
          renderProfile();
          if (window.renderUserChip) window.renderUserChip();
        }).catch(function (x) { toast("Picture save failed: " + x, false); });
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  });
}
function doUnarmDelete() { window._delArm = false; if (window.renderProfile) window.renderProfile(); }
window.doUnarmDelete = doUnarmDelete;
async function doDeleteAccount() {
  const u = currentUser();
  if (!u) return;
  if (!isLive()) { toast("Backend not linked.", false); return; }
  if (!window._delArm) { window._delArm = true; renderProfile(); setTimeout(() => { if (window._delArm && currentUser() === u) { window._delArm = false; renderProfile(); } }, 6000); return; }
  window._delArm = false;
  try { await liveUsers("delete", { username: u }); } catch (x) { toast("Delete failed: " + x, false); return; }
  setSession("");
  window._me = null;
  if (window.renderUserChip) window.renderUserChip();
  nav("dash");
  authTab("login");
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
  document.getElementById("authGate").hidden = true;
  splashRun(() => { document.getElementById("authGate").hidden = false; });
}
window.doDeleteAccount = doDeleteAccount;
async function renderProfile() {
  const el = document.getElementById("profEl");
  if (!el) return;
  const u = currentUser();
  if (!u || !isLive()) {
    el.innerHTML = "<p style='font-size:13px;color:#94a3b8'>Not signed in.</p><button class='btn' onclick='doLogout()'>Go to login</button>";
    const acc0 = document.getElementById("accEl");
    if (acc0) acc0.innerHTML = "<p style='font-size:13px;color:#94a3b8'>Backend not linked.</p>";
    return;
  }
  let me = window._me && window._me.username === u ? window._me : null;
  if (!me) {
    try {
      me = await liveUsers("get", { username: u });
      window._me = me;
    } catch (x) {
      el.innerHTML = "<p style='font-size:13px;color:#94a3b8'>Profile unavailable: " + esc(String(x).slice(0, 100)) + "</p>";
      return;
    }
  }
  el.innerHTML = "<div class='row' style='align-items:center'><div class='picWrap'><div class='avatar'>" + (me.pic ? "<img src='" + me.pic + "'>" : u[0].toUpperCase()) + "</div><label class='picAdd' title='Add picture'>+<input type='file' id='picInput' accept='image/*' hidden></label></div><div><b style='font-size:16px'>" + u.replace(/[<>&"]/g, "") + "</b><div style='font-size:12px;color:#94a3b8'>Member since " + (me.since || " - ") + " (MongoDB users)</div></div><span style='flex:1'></span><button class='ghost' onclick='doLogout()'>Logout</button>" + (window._delArm ? "<button class=ghost onclick='doDeleteAccount()'>Yes, delete</button> <button class=ghost onclick='doUnarmDelete()'>Cancel</button>" : "<button class='ghost' onclick='doDeleteAccount()'>Delete account</button>") + "</div>";
  const acc = document.getElementById("accEl");
  if (acc) {
    try {
      const list = await liveUsers("list", {});
      window._accList = list.map(x => x.username);
      acc.innerHTML = list.length ? list.map(function (n, i) {
        var cur = n.username === u ? " (current)" : "";
        return '<div class="row" style="align-items:center"><div class="avatar" style="width:32px;height:32px;font-size:14px">' + (n.pic ? "<img src='" + n.pic + "'>" : n.username[0].toUpperCase()) + '</div><b>' + n.username + cur + '</b><span style="flex:1"></span><button class="ghost" data-acc-use="' + i + '">Use</button></div>';
      }).join("") : '<p style="font-size:13px;color:#94a3b8">No registered accounts yet.</p>';
    } catch (x) {
      acc.innerHTML = '<p style="font-size:13px;color:#94a3b8">Accounts unavailable.</p>';
    }
  }
}
window.renderProfile = renderProfile;
async function doChangePass(e) {
  e.preventDefault();
  const err = document.getElementById("cpErr");
  const u = currentUser();
  if (!u) { err.textContent = "You are not signed in."; return false; }
  if (!isLive()) { err.textContent = "Backend not linked."; return false; }
  const cur = document.getElementById("cpCur").value, nw = document.getElementById("cpNew").value, nw2 = document.getElementById("cpNew2").value;
  try {
    await liveUsers("verify", { username: u, h: pwHash(cur) });
  } catch (x) { err.textContent = "Current password is wrong."; return false; }
  if (!validPassword(nw)) { err.textContent = "New password needs min 6 characters with at least one letter and one number."; return false; }
  if (nw !== nw2) { err.textContent = "New passwords do not match."; return false; }
  try {
    await liveUsers("set_pass", { username: u, h: pwHash(nw) });
  } catch (x) { err.textContent = "Update failed: " + x; return false; }
  document.getElementById("cpCur").value = ""; document.getElementById("cpNew").value = ""; document.getElementById("cpNew2").value = "";
  err.textContent = "";
  splashRun(() => { toast("Password updated in MongoDB users"); });
  return false;
}
window.doChangePass = doChangePass;
function exitSite(){
  var sp=document.getElementById("splash"); if(sp) sp.classList.remove("off");
  var g=document.getElementById("authGate"); if(g) g.hidden=true;
  setTimeout(function(){
    window.close();
    setTimeout(function(){ if(!window.closed) location.href='about:blank'; },300);
  },900);
}
window.exitSite=exitSite;