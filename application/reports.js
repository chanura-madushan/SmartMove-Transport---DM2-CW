(function () {
  Object.defineProperty(window, 'SM_ORACLE', { get: function() { return window.O || { vehicles: [], drivers: [], routes: [], passengers: [], trips: [], bookings: [], payments: [], maintenance: [], feedback: [] }; }, configurable: true });
  Object.defineProperty(window, 'SM_MONGO', { get: function() { return window.M || { vehicle_media: [], reviews: [], announcements: [], trip_media: [], users: [] }; }, configurable: true });
  var O = window.SM_ORACLE, M = window.SM_MONGO;
  var SEC_NAME = { r1: "Routes", r2: "Payments", r3: "Passengers", r4: "Maintenance", r5: "Drivers" };
  var OP_HOME = { v1: "r1", "c-routes": "r1", "f-route": "r1", "p-route": "r1", "t-route": "r1", v2: "r2", "p-pay": "r2", "f-rev": "r2", "f-trip": "r2", "t-payamt": "r2", "c-paymethod": "r2", v3: "r3", "p-book": "r3", "t-fare": "r3", "f-passtotal": "r3", "c-passbook": "r3", v4: "r4", "p-maint": "r4", "t-maintdate": "r4", "c-maintdue": "r4", "f-maintover": "r4", v5: "r5", "p-fb": "r5", "f-drvavg": "r5", "t-fbrate": "r5", "c-drvperf": "r5" };
  var activeSec = "r1";
  var driverMinRating = 0;
  var driverSortMode = "rating-desc";
  function revDefault() {
    return O.payments.filter(function (p) { return p.status === "Paid"; })
      .reduce(function (a, p) { return a + p.amt; }, 0);
  }
  function fmtNum(v, dp) {
    var n = (typeof v === "number") ? v : parseFloat(String(v == null ? "" : v).replace(",", "."));
    if (isNaN(n)) return "no numeric value returned (raw: " + esc(JSON.stringify(v)) + ")";
    return dp != null ? n.toFixed(dp) : n.toLocaleString();
  }
  var OPS = [
    { id: "v1", kind: "view", keys: "route usage frequent all r1", title: "route usage (R1)", run: function () {
      if (!getApiBase()) return needLive();
      var rows = O.routes.map(function (r) {
        var ts = O.trips.filter(function (t) { return t.route === r.id; }).map(function (t) { return t.id; });
        var bs = O.bookings.filter(function (b) { return ts.indexOf(b.trip) > -1 && b.status === "Confirmed"; });
        return [esc(r.from + " -> " + r.to), bs.length, bs.reduce(function (a, b) { return a + b.fare; }, 0)];
      }).sort(function (a, b) { return b[1] - a[1]; });
      return "<p>VIEW vw_report_route_usage  -  " + rows.length + " routes (live Oracle data).</p>" + tbl(["Route", "Bookings", "Revenue"], rows);
    } },
    { id: "v2", kind: "view", keys: "revenue period money payments all r2", title: "revenue in period (R2)", run: function () {
      if (!getApiBase()) return needLive();
      var f = (document.getElementById("wFrom-r2") || {}).value || "2026-01-01";
      var t = (document.getElementById("wTo-r2") || {}).value || "2026-01-31";
      var pays = O.payments.filter(function (p) { return p.status === "Paid" && p.date >= f && p.date <= t; });
      return "From <input id='wFrom-r2' type='date' value='" + f + "'> To <input id='wTo-r2' type='date' value='" + t + "'> "
        + "<button class='btn' data-apply='v2'>Apply</button>"
        + "<p>Revenue " + f + " -> " + t + ": <b>Rs " + pays.reduce(function (a, p) { return a + p.amt; }, 0).toLocaleString() + "</b>  -  " + pays.length + " payments (live Oracle data).</p>"
        + tbl(["ID", "Booking (seat)", "Date", "Amt", "Method"], pays.map(function (p) {
          var b = O.bookings.filter(function (x) { return x.id === p.booking; })[0] || {};
          return [p.id, "#" + p.booking + " * seat " + (b.seat == null ? " - " : b.seat), p.date, p.amt, p.method];
        }));
    } },
    { id: "v3", kind: "view", keys: "passenger travel history trips all r3", title: "passenger history (R3)", run: function () {
      if (!getApiBase()) return needLive();
      var sel = document.getElementById("wPass-r3");
      var pid = (sel && sel.value) || (O.passengers.length ? String(O.passengers[0].id) : "");
      var opts = O.passengers.map(function (p) { return "<option value='" + p.id + "'" + (String(p.id) === String(pid) ? " selected" : "") + ">" + esc(p.fn + " " + p.ln) + "</option>"; }).join("");
      var rows = O.bookings.filter(function (b) { return b.pass == pid; }).map(function (b) {
        var t = O.trips.filter(function (x) { return x.id === b.trip; })[0] || {};
        return [esc(pName(b.pass)), "#" + b.trip, esc(rName(t.route)), b.date, b.seat, b.fare, b.status];
      });
      return "<select id='wPass-r3'>" + opts + "</select> <button class='btn' data-apply='v3'>Load</button>"
        + tbl(["Passenger", "Trip", "Route", "Date", "Seat", "Fare", "Status"], rows.length ? rows : [[" - ", " - ", "No bookings for this passenger yet", "", "", "", ""]]);
    } },
    { id: "v4", kind: "view", keys: "maintenance due vehicles all r4", title: "maintenance due (R4)", run: function () {
      if (!getApiBase()) return needLive();
      return "<p>VIEW vw_report_maintenance_due  -  " + O.maintenance.length + " records (live Oracle data).</p>"
        + tbl(["Vehicle", "Next due", "Type", "Status"], O.maintenance.map(function (m) { return [esc(vName(m.vehicle)), m.next, esc(m.type), m.status]; }));
    } },
    { id: "v5", kind: "view", keys: "driver trip performance rating stars average minimum sort highest lowest all r5", title: "driver performance (R5)", run: function () {
      if (!getApiBase()) return needLive();
      var sel = document.getElementById("wRate-r5");
      var sortSel = document.getElementById("wSort-r5");
      if (sel) driverMinRating = Math.max(0, Math.min(5, Number(sel.value) || 0));
      if (sortSel && sortSel.value) driverSortMode = sortSel.value;
      function rateOpt(v) { return "<option value='" + v + "'" + (driverMinRating === v ? " selected" : "") + ">" + (v === 0 ? "Any rating" : v + "+ stars") + "</option>"; }
      function sortOpt(v, label) { return "<option value='" + v + "'" + (driverSortMode === v ? " selected" : "") + ">" + label + "</option>"; }
      var performance = O.drivers.map(function (d) {
        var ts = O.trips.filter(function (t) { return Number(t.driver) === Number(d.id); });
        var tripIds = ts.map(function (t) { return Number(t.id); });
        var fb = O.feedback.filter(function (f) { return tripIds.indexOf(Number(f.trip)) !== -1 && Number(f.rating) >= 1 && Number(f.rating) <= 5; });
        var avg = fb.length ? fb.reduce(function (a, f) { return a + Number(f.rating); }, 0) / fb.length : 0;
        return { d: d, trips: ts.length, avg: Math.round(avg * 100) / 100, ratings: fb.length, rated: fb.length > 0 };
      }).filter(function (row) { return driverMinRating === 0 || (row.rated && row.avg >= driverMinRating); });
      performance.sort(function (a, b) {
        if (driverSortMode === "rating-asc") return (a.avg - b.avg) || (b.trips - a.trips) || String(a.d.fn + " " + a.d.ln).localeCompare(String(b.d.fn + " " + b.d.ln));
        if (driverSortMode === "trips-desc") return (b.trips - a.trips) || (b.avg - a.avg) || String(a.d.fn + " " + a.d.ln).localeCompare(String(b.d.fn + " " + b.d.ln));
        if (driverSortMode === "name-asc") return String(a.d.fn + " " + a.d.ln).localeCompare(String(b.d.fn + " " + b.d.ln));
        return (b.avg - a.avg) || (b.trips - a.trips) || String(a.d.fn + " " + a.d.ln).localeCompare(String(b.d.fn + " " + b.d.ln));
      });
      var rows = performance.map(function (row) { return [esc(row.d.fn + " " + row.d.ln), row.trips, row.ratings, row.rated ? row.avg.toFixed(1) : "Not rated"]; });
      return "<div class='reportControls'><label for='wRate-r5'>Minimum average rating</label><select id='wRate-r5'>" + [0,1,2,3,4,5].map(rateOpt).join("") + "</select>"
        + "<label for='wSort-r5'>Sort by</label><select id='wSort-r5'>" + sortOpt("rating-desc", "Highest rating first") + sortOpt("rating-asc", "Lowest rating first") + sortOpt("trips-desc", "Most trips first") + sortOpt("name-asc", "Driver name A-Z") + "</select>"
        + "<button class='btn' data-apply='v5'>Apply filters</button></div>"
        + "<p class='reportSummary'>Showing " + performance.length + " of " + O.drivers.length + " drivers. Ratings are calculated from Oracle feedback for each driver's trips.</p>"
        + (rows.length ? tbl(["Driver", "Trips", "Ratings", "Average rating"], rows) : "<p class='reportEmpty'>No drivers match this minimum rating. Lower the rating threshold and apply again.</p>");
    } },
    { id: "p-book", kind: "procedure", keys: "sp_book_ticket booking seats reserve", title: "sp_book_ticket (live booking)", run: async function () {
      if (!getApiBase()) return needLive();
      var t = O.trips[1], cap = tripCap(t);
      var taken = tripTaken(t.id), x = 1;
      while (taken.indexOf(x) > -1 && x <= cap) x++;
      try {
        var j = await apiPost({ action: "book", passenger_id: 1, trip_id: t.id, seat: x, fare: 300 });
        if (window.refreshAll) refreshAll();
        return "BEGIN sp_book_ticket(1, " + t.id + ", " + x + ", 300); END;<br>=> SUCCESS booking_id=" + j.booking_id + " (real Oracle commit)";
      } catch (e) { return "BEGIN sp_book_ticket ... END;<br>=> Oracle error: " + esc(e) + hint(e); }
    } },
    { id: "p-pay", kind: "procedure", keys: "sp_record_payment pay money", title: "sp_record_payment (first unpaid)", run: async function () {
      if (!getApiBase()) return needLive();
      var b = O.bookings.filter(function (x) { return x.status === "Confirmed" && !O.payments.some(function (p) { return p.booking === x.id; }); })[0];
      if (!b) return "=> nothing to do: every confirmed booking already has a payment.";
      try {
        await apiPost({ action: "add", table: "pay", booking: b.id, amt: b.fare, method: "Card" });
        if (window.refreshAll) refreshAll();
        return "BEGIN sp_record_payment(" + b.id + ", " + b.fare + ", Card); END;<br>=> SUCCESS payment recorded for booking #" + b.id + " (real Oracle commit)";
      } catch (e) { return "BEGIN sp_record_payment ... END;<br>=> Oracle error: " + esc(e) + hint(e); }
    } },
    { id: "p-fb", kind: "procedure", keys: "sp_add_feedback rating stars", title: "sp_add_feedback (live)", run: async function () {
      if (!getApiBase()) return needLive();
      var pair = null;
      outer: for (var pi = 0; pi < O.passengers.length; pi++) for (var ti = 0; ti < O.trips.length; ti++) {
        var p = O.passengers[pi].id, t = O.trips[ti].id;
        if (!O.feedback.some(function (f) { return f.pass === p && f.trip === t; })) { pair = [p, t]; break outer; }
      }
      if (!pair) return "=> every passengerxtrip pair already has feedback.";
      try {
        await apiPost({ action: "feedback", target: "oracle", passenger_id: pair[0], trip_id: pair[1], rating: 5, comment: "Added via smart bar" });
        if (window.refreshAll) refreshAll();
        return "BEGIN sp_add_feedback(" + pair[0] + ", " + pair[1] + ", 5, ...); END;<br>=> SUCCESS feedback saved (real Oracle commit)";
      } catch (e) { return "BEGIN sp_add_feedback ... END;<br>=> Oracle error: " + esc(e) + hint(e); }
    } },
    { id: "p-route", kind: "procedure", keys: "sp_add_trip route schedule procedure r1", title: "sp_add_trip (on busiest route)", run: async function () {
      if (!getApiBase()) return needLive();
      var best = null, bestN = -1;
      O.routes.forEach(function (r) {
        var n = O.trips.filter(function (t) { return t.route === r.id; }).length;
        if (n > bestN) { bestN = n; best = r; }
      });
      try {
        await apiPost({ action: "add", table: "trip", via: "proc", vehicle: O.vehicles[0].id, driver: O.drivers[0].id, route: best.id, date: "2026-03-01", dep: "09:00", status: "Scheduled" });
        if (window.refreshAll) refreshAll();
        return "BEGIN sp_add_trip(route_id =&gt; " + best.id + "); END;<br>=> SUCCESS trip scheduled on " + esc(best.from + " -> " + best.to) + " (real Oracle commit)";
      } catch (e) { return "BEGIN sp_add_trip ... END;<br>=> Oracle error: " + esc(e) + hint(e); }
    } },
    { id: "p-maint", kind: "procedure", keys: "sp_schedule_maintenance vehicle service procedure r4", title: "sp_schedule_maintenance (due vehicle)", run: async function () {
      if (!getApiBase()) return needLive();
      var m = O.maintenance.slice().sort(function (a, b) { return a.next < b.next ? -1 : 1; })[0];
      try {
        await apiPost({ action: "add", table: "maintenance", via: "proc", vehicle: m.vehicle, date: "2026-03-01", next: "2026-06-01", type: "General Service", cost: 180 });
        if (window.refreshAll) refreshAll();
        return "BEGIN sp_schedule_maintenance(vehicle_id =&gt; " + m.vehicle + "); END;<br>=> SUCCESS maintenance scheduled for " + esc(vName(m.vehicle)) + " (real Oracle commit)";
      } catch (e) { return "BEGIN sp_schedule_maintenance ... END;<br>=> Oracle error: " + esc(e) + hint(e); }
    } },
    { id: "f-rev", kind: "function", keys: "fn_revenue_period total money", title: "fn_revenue_period -> total", run: async function () {
      if (!getApiBase()) return needLive();
      var f = (document.getElementById("wFrom-r2") || {}).value || "2026-01-01";
      var t = (document.getElementById("wTo-r2") || {}).value || "2026-01-31";
      try {
        var j = await apiPost({ action: "plsql", probe: "fn", fn: "fn_revenue_period", args: f + "," + t });
        return "SELECT fn_revenue_period(DATE'" + f + "',DATE'" + t + "') FROM DUAL;<br>=> <b>Rs " + fmtNum(j.value) + "</b> (real Oracle value)";
      } catch (e) { return "SELECT fn_revenue_period ...<br>=> Oracle error: " + esc(e) + hint(e); }
    } },
    { id: "f-trip", kind: "function", keys: "fn_trip_revenue trip money", title: "fn_trip_revenue(trip 1)", run: async function () {
      if (!getApiBase()) return needLive();
      try {
        var j = await apiPost({ action: "plsql", probe: "fn", fn: "fn_trip_revenue", args: "1" });
        return "SELECT fn_trip_revenue(1) FROM DUAL;<br>=> trip 1 revenue = <b>Rs " + fmtNum(j.value) + "</b> (real Oracle value)";
      } catch (e) { return "SELECT fn_trip_revenue ...<br>=> Oracle error: " + esc(e) + hint(e); }
    } },
    { id: "f-route", kind: "function", keys: "fn_route_revenue route money total r1", title: "fn_route_revenue (busiest route)", run: async function () {
      if (!getApiBase()) return needLive();
      var best = null, bestN = -1;
      O.routes.forEach(function (r) {
        var ts = O.trips.filter(function (t) { return t.route === r.id; }).map(function (t) { return t.id; });
        var n = O.bookings.filter(function (b) { return ts.indexOf(b.trip) > -1 && b.status === "Confirmed"; }).length;
        if (n > bestN) { bestN = n; best = r; }
      });
      try {
        var j = await apiPost({ action: "plsql", probe: "fn", fn: "fn_route_revenue", args: String(best.id) });
        return "SELECT fn_route_revenue(" + best.id + ") FROM DUAL;<br>=> " + esc(best.from + " -> " + best.to) + ": <b>Rs " + fmtNum(j.value) + "</b> (real Oracle value)";
      } catch (e) { return "SELECT fn_route_revenue ...<br>=> Oracle error: " + esc(e) + hint(e); }
    } },
    { id: "f-passtotal", kind: "function", keys: "fn_passenger_total_spent passenger money total r3", title: "fn_passenger_total_spent", run: async function () {
      if (!getApiBase()) return needLive();
      var sel = document.getElementById("wPass-r3");
      var p = O.passengers.filter(function (x) { return String(x.id) === String(sel && sel.value); })[0] || O.passengers[0];
      try {
        var j = await apiPost({ action: "plsql", probe: "fn", fn: "fn_passenger_total_spent", args: String(p.id) });
        return "SELECT fn_passenger_total_spent(" + p.id + ") FROM DUAL;<br>=> " + esc(p.fn + " " + p.ln) + " spent <b>Rs " + fmtNum(j.value) + "</b> (real Oracle value)";
      } catch (e) { return "SELECT fn_passenger_total_spent ...<br>=> Oracle error: " + esc(e) + hint(e); }
    } },
    { id: "f-maintover", kind: "function", keys: "fn_overdue_count maintenance function r4", title: "fn_overdue_count", run: async function () {
      if (!getApiBase()) return needLive();
      try {
        var j = await apiPost({ action: "plsql", probe: "fn", fn: "fn_overdue_count", args: "" });
        return "SELECT fn_overdue_count FROM DUAL;<br>=> <b>" + j.value + "</b> vehicle(s) overdue (real Oracle value)";
      } catch (e) { return "SELECT fn_overdue_count ...<br>=> Oracle error: " + esc(e) + hint(e); }
    } },
    { id: "f-drvavg", kind: "function", keys: "fn_driver_avg_rating driver function r5", title: "fn_driver_avg_rating (top driver)", run: async function () {
      if (!getApiBase()) return needLive();
      var best = O.drivers[0], bestA = -1;
      O.drivers.forEach(function (d) {
        var ts = O.trips.filter(function (t) { return t.driver === d.id; }).map(function (t) { return t.id; });
        var fb = O.feedback.filter(function (f) { return ts.indexOf(f.trip) > -1; });
        var avg = fb.length ? fb.reduce(function (a, f) { return a + f.rating; }, 0) / fb.length : 0;
        if (avg > bestA) { bestA = avg; best = d; }
      });
      try {
        var j = await apiPost({ action: "plsql", probe: "fn", fn: "fn_driver_avg_rating", args: String(best.id) });
        return "SELECT fn_driver_avg_rating(" + best.id + ") FROM DUAL;<br>=> " + esc(best.fn + " " + best.ln) + ": <b>" + fmtNum(j.value, 1) + "</b> (real Oracle value)";
      } catch (e) { return "SELECT fn_driver_avg_rating ...<br>=> Oracle error: " + esc(e) + hint(e); }
    } },
    { id: "t-fare", kind: "trigger", keys: "trg_booking_fare_check negative fare block", title: "trigger: negative fare blocked", run: async function () {
      if (!getApiBase()) return needLive();
      try {
        var j = await apiPost({ action: "plsql", probe: "neg_fare" });
        if (j.error && j.blocked === undefined) return "probe could not run: " + esc(j.error);
        return esc(j.sql) + "<br>=> " + (j.blocked ? "Oracle blocked it (rolled back, nothing committed):<br><b>" + trigMsg(j.error) + "</b>" + trigNote(j.error) : "! unexpectedly inserted  -  check trg_booking_fare_check exists");
      } catch (e) { return "trigger probe failed: " + esc(e); }
    } },
    { id: "t-payamt", kind: "trigger", keys: "trg_payment_amount_check negative amount block exception r2", title: "trigger: negative amount blocked", run: async function () {
      if (!getApiBase()) return needLive();
      try {
        var j = await apiPost({ action: "plsql", probe: "neg_amount" });
        if (j.error && j.blocked === undefined) return "probe could not run: " + esc(j.error);
        return esc(j.sql || "") + "<br>=> " + (j.blocked ? "Oracle blocked it (rolled back, nothing committed):<br><b>" + trigMsg(j.error) + "</b>" + trigNote(j.error) : "! unexpectedly updated");
      } catch (e) { return "trigger probe failed: " + esc(e); }
    } },
    { id: "t-fbrate", kind: "trigger", keys: "feedback rating 1-5 check trigger exception r5", title: "trigger: bad rating blocked", run: async function () {
      if (!getApiBase()) return needLive();
      try {
        var j = await apiPost({ action: "plsql", probe: "bad_rating" });
        if (j.error && j.blocked === undefined) return "probe could not run: " + esc(j.error);
        return esc(j.sql || "") + "<br>=> " + (j.blocked ? "Oracle blocked it (rolled back, nothing committed):<br><b>" + trigMsg(j.error) + "</b>" + trigNote(j.error) : "! unexpectedly updated");
      } catch (e) { return "trigger probe failed: " + esc(e); }
    } },
    { id: "t-maintdate", kind: "trigger", keys: "maintenance dates check next before date block exception r4", title: "trigger: bad maint. dates blocked", run: async function () {
      if (!getApiBase()) return needLive();
      try {
        var j = await apiPost({ action: "plsql", probe: "bad_dates" });
        if (j.error && j.blocked === undefined) return "probe could not run: " + esc(j.error);
        return esc(j.sql || "") + "<br>=> " + (j.blocked ? "Oracle blocked it (rolled back, nothing committed):<br><b>" + trigMsg(j.error) + "</b>" + trigNote(j.error) : "! unexpectedly inserted");
      } catch (e) { return "trigger probe failed: " + esc(e); }
    } },
    { id: "t-route", kind: "trigger", keys: "route delete guard trigger fk exception r1", title: "trigger: route delete blocked", run: async function () {
      if (!getApiBase()) return needLive();
      try {
        var j = await apiPost({ action: "plsql", probe: "del_route" });
        if (j.error && j.blocked === undefined) return "probe could not run: " + esc(j.error);
        return esc(j.sql || "") + "<br>=> " + (j.blocked ? "Oracle blocked it (rolled back, nothing committed):<br><b>" + trigMsg(j.error) + "</b>" + trigNote(j.error) : "! unexpectedly deleted");
      } catch (e) { return "trigger probe failed: " + esc(e); }
    } },
    { id: "c-routes", kind: "cursor", keys: "cursor bookings per route fetch loop", title: "cursor: bookings per route", run: async function () {
      if (!getApiBase()) return needLive();
      try {
        var j = await apiPost({ action: "plsql", probe: "cursor", q: "routes" });
        return esc(j.sql) + "<br>" + liveTbl(j.rows) + "<br>CLOSE c; (" + j.rows.length + " real rows fetched)";
      } catch (e) { return "cursor probe failed: " + esc(e); }
    } },
    { id: "c-paymethod", kind: "cursor", keys: "cursor payments per method fetch loop r2", title: "cursor: revenue per method", run: async function () {
      if (!getApiBase()) return needLive();
      try {
        var j = await apiPost({ action: "plsql", probe: "cursor", q: "paymethod" });
        return esc(j.sql) + "<br>" + liveTbl(j.rows) + "<br>CLOSE c; (" + j.rows.length + " real rows fetched)";
      } catch (e) { return "cursor probe failed: " + esc(e); }
    } },
    { id: "c-passbook", kind: "cursor", keys: "cursor passenger bookings fetch loop r3", title: "cursor: bookings of passenger", run: async function () {
      if (!getApiBase()) return needLive();
      var sel = document.getElementById("wPass-r3");
      var pid = (sel && sel.value) || String((O.passengers[0] || {}).id || 0);
      try {
        var j = await apiPost({ action: "plsql", probe: "cursor", q: "passbook", pid: pid });
        return esc(j.sql) + "<br>" + liveTbl(j.rows) + "<br>CLOSE c; (" + j.rows.length + " real rows fetched)";
      } catch (e) { return "cursor probe failed: " + esc(e); }
    } },
    { id: "c-maintdue", kind: "cursor", keys: "cursor maintenance due vehicles fetch loop r4", title: "cursor: due vehicles", run: async function () {
      if (!getApiBase()) return needLive();
      try {
        var j = await apiPost({ action: "plsql", probe: "cursor", q: "due" });
        return esc(j.sql) + "<br>" + liveTbl(j.rows) + "<br>CLOSE c; (" + j.rows.length + " real rows fetched)";
      } catch (e) { return "cursor probe failed: " + esc(e); }
    } },
    { id: "c-drvperf", kind: "cursor", keys: "cursor driver performance trips rating fetch loop r5", title: "cursor: driver performance", run: async function () {
      if (!getApiBase()) return needLive();
      try {
        var j = await apiPost({ action: "plsql", probe: "cursor", q: "drivers" });
        return esc(j.sql) + "<br>" + liveTbl(j.rows) + "<br>CLOSE c; (" + j.rows.length + " real rows fetched)";
      } catch (e) { return "cursor probe failed: " + esc(e); }
    } }
  ];
  function needLive() { return "<p style='color:#f87171'>Backend not linked  -  set the backend URL in Settings, then reload data.</p>"; }
  function liveTbl(rows) {
    if (!rows || !rows.length) return "<p>No rows returned.</p>";
    var h = Object.keys(rows[0]);
    return tbl(h, rows.map(function (r) { return h.map(function (k) { return esc(r[k]); }); }));
  }
function matchOps(q) {
    q = (q || "").trim().toLowerCase();
    if (!q) return null;
    var toks = q.split(/\s+/);
    if (q === "view all" || q === "views" || q === "all views") return OPS.filter(function (o) { return o.kind === "view"; });
    return OPS.filter(function (o) {
      var hay = o.kind + " " + o.title.toLowerCase() + " " + o.keys;
      return toks.every(function (tk) { return hay.indexOf(tk) > -1; });
    });
  }
  function hint(e) {
    var s = String(e);
    return /PLS-00905|PLS-00201|ORA-04063|ORA-06575|ORA-00904|ORA-00942/.test(s)
      ? "<br><i style='color:#fbbf24'>Hint: this PL/SQL object is missing or invalid in Oracle. Run plsql_clean.sql in SQL Developer (F5), then try again.</i>" : "";
  }
  function trigMsg(e) {
    var s = String(e), first = s.split(/\s+ORA-06512/)[0], t = (s.match(/at "[^"]*\.([^".]+)"/) || [])[1];
    return esc(first) + (t ? "<br><span style='font-weight:400;color:#94a3b8'>Raised by trigger " + esc(t) + "</span>" : "");
  }
  function trigNote(e) {
    return /ORA-0229[0-2]/.test(String(e))
      ? "<br><i style='color:#fbbf24'>Note: a table constraint blocked this before any trigger ran, so the trigger is not installed. Run plsql_clean.sql in SQL Developer (F5).</i>" : "";
  }
  function opHeading(o) {
    var k = o.kind.charAt(0).toUpperCase() + o.kind.slice(1), t = o.title;
    if (t.toLowerCase().indexOf(o.kind + ":") === 0) return k + ": " + t.slice(o.kind.length + 1).trim();
    return k + " - " + t;
  }
  async function runOp(sec, opId) {
    var o = OPS.filter(function (x) { return x.id === opId; })[0];
    if (!o) return;
    var blk = document.getElementById("repBlock-" + sec);
    if (blk && blk.hidden) { await openViewer(sec, opId); return; }
    var resEl = document.getElementById("res-" + sec);
    var hd = blk ? blk.querySelector(".repHead b") : null;
    if (hd) {
      if (!blk.getAttribute("data-title")) blk.setAttribute("data-title", hd.textContent);
      hd.textContent = o.kind === "view" ? blk.getAttribute("data-title") : opHeading(o);
    }
    try {
      var pending = o.run();
      resEl.innerHTML = "<p style='color:#94a3b8'>Running against live database...</p>";
      resEl.innerHTML = await pending;
    } catch (e) {
      resEl.innerHTML = "<p style='color:#f87171'>Failed: " + esc(String(e).slice(0, 200)) + "</p>";
    }
  }
  async function openViewer(sec, opId) {
    activeSec = sec;
    var b = document.getElementById("repBlock-" + sec);
    if (!b) return;
    dockToBody(b);
    b.hidden = false;
    b.classList.add("open");
    if (typeof getApiBase === "function" && getApiBase() && typeof loadLive === "function") {
      try { await loadLive(); if (typeof fill === "function") fill(); } catch (e) {
        var er = document.getElementById("res-" + sec);
        if (er) er.innerHTML = "<p style='color:#f87171'>Live data refresh failed: " + esc(String(e).slice(0, 200)) + "</p>";
      }
    }
    var result = document.getElementById("res-" + sec);
    if (opId) {
      await runOp(sec, opId);
    } else if (result) {
      result.innerHTML = "<div class='reportWelcome'><h3>Search before running a report</h3><p>Use the larger Smart Search panel to find an operation for <b>" + esc(SEC_NAME[sec] || sec.toUpperCase()) + "</b>. Type a keyword, then select a result to run it against the connected database.</p><p class='reportExamples'>Try: <b>view</b>, <b>driver rating</b>, <b>procedure</b>, <b>trigger</b>, <b>cursor</b>, or <b>function</b>.</p></div>";
    }
    var si = document.getElementById("smartCmd"); if (si) si.value = "";
    showSmart();
    if (si) si.focus();
  }
  window.openReport = openViewer;
  if (!window._reportCaptureHook) {
    window._reportCaptureHook = true;
    document.addEventListener("click", function (e) {
      var b = e.target && e.target.closest ? e.target.closest("[data-rep]") : null;
      if (!b) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      openViewer(b.getAttribute("data-rep"));
    }, true);
  }
  function anyViewerOpen() {
    var open = document.querySelectorAll(".repBlock.open");
    for (var i = 0; i < open.length; i++) if (!open[i].hidden) return true;
    return false;
  }
  function showSmart() {
    var s = document.getElementById("smartBar");
    if (s) { s.hidden = false; renderSmart(); }
  }
  function hideSmartIfAlone() {
    if (!anyViewerOpen()) { var s = document.getElementById("smartBar"); if (s) s.hidden = true; }
  }
  function renderSmart() {
    var inp = document.getElementById("smartCmd"), box = document.getElementById("smartOps");
    if (!inp || !box) return;
    var lbl = document.getElementById("smartCtx");
    if (lbl) lbl.textContent = SEC_NAME[activeSec] || activeSec.toUpperCase();
    var query = inp.value.trim();
    if (!query) {
      box.innerHTML = "<p class='searchHint'>Start typing to search this report's operations. Nothing runs until you choose a matching result.</p>";
      return;
    }
    var list = (matchOps(query) || []).filter(function (o) { return OP_HOME[o.id] === activeSec; });
    box.innerHTML = list.length
      ? list.map(function (o) {
        return "<button class='opbtn' data-op='" + o.id + "' data-sec='" + activeSec + "'><i>" + o.kind + "</i><span>" + esc(o.title) + "</span></button>";
      }).join("")
      : "<p class='searchHint'>No " + esc((SEC_NAME[activeSec] || activeSec).toLowerCase()) + " operation matches. Try a shorter keyword such as view, procedure, trigger, cursor, or function.</p>";
  }
  function dockToBody(blk) {
    if (!blk._home) blk._home = { parent: blk.parentNode, next: blk.nextSibling };
    if (blk.parentNode !== document.body) document.body.appendChild(blk);
  }
  function restoreHome(blk) {
    if (blk._home && blk._home.parent) blk._home.parent.insertBefore(blk, blk._home.next);
  }
  document.addEventListener("DOMContentLoaded", function () {
    if (!document.getElementById("smartBar")) {      var s = document.createElement("div");
      s.id = "smartBar"; s.hidden = true;
      s.innerHTML = "<div class='row repHead'><div><b>Smart Search</b><div class='searchSubtitle'>Search database operations before running them</div></div><span class='sp'></span><span id='smartCtx' class='smartContext'></span><button type='button' class='ghost' id='smartHide' aria-label='Hide Smart Search'>Hide</button></div>"
        + "<label class='searchLabel' for='smartCmd'>Search this report</label>"
        + "<input id='smartCmd' type='search' autocomplete='off' placeholder='Try: driver rating, view, procedure, trigger...'>"
        + "<div class='opList' id='smartOps' aria-live='polite' style='margin-top:12px'></div>";
      document.body.appendChild(s);
      document.getElementById("smartCmd").addEventListener("input", renderSmart);
      document.getElementById("smartCmd").addEventListener("keydown", function (e) {
        if (e.key === "Enter") { var first = document.querySelector("#smartOps .opbtn"); if (first) first.click(); }
      });
      document.getElementById("smartHide").addEventListener("click", function () { s.hidden = true; });
    }

    var fl = document.querySelectorAll("[data-float]");
    for (var j = 0; j < fl.length; j++) (function (b) {
      b.addEventListener("click", function () {
        var blk = document.getElementById("repBlock-" + b.getAttribute("data-float"));
        dockToBody(blk);
        blk.classList.toggle("floating");
        if (!blk.classList.contains("floating")) { blk.style.left = ""; blk.style.top = ""; }
        b.textContent = blk.classList.contains("floating") ? "Unfloat" : "Float";
      });
    })(fl[j]);
    var cl = document.querySelectorAll("[data-close]");
    for (var k = 0; k < cl.length; k++) (function (b) {
      b.addEventListener("click", function () {
        var blk = document.getElementById("repBlock-" + b.getAttribute("data-close"));
        blk.hidden = true; blk.classList.remove("floating"); blk.classList.remove("open"); blk.classList.remove("searched");
        blk.style.left = ""; blk.style.top = "";
        restoreHome(blk);
        var f = document.querySelector("[data-float='" + b.getAttribute("data-close") + "']");
        if (f) f.textContent = "Float";
        hideSmartIfAlone();
      });
    })(cl[k]);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        var open = document.querySelectorAll(".repBlock.open");
        for (var i = 0; i < open.length; i++) {
          open[i].hidden = true; open[i].classList.remove("open"); open[i].classList.remove("floating"); open[i].classList.remove("searched");
          open[i].style.left = ""; open[i].style.top = "";
          restoreHome(open[i]);
        }
        var fs = document.querySelectorAll("[data-float]");
        for (var j = 0; j < fs.length; j++) fs[j].textContent = "Float";
        var sb = document.getElementById("smartBar"); if (sb) sb.hidden = true;
      }
    });
    (function () {
      var drag = null;
      document.addEventListener("pointerdown", function (e) {
        var head = e.target.closest ? (e.target.closest(".repBlock.open.floating .repHead") || e.target.closest("#smartBar .repHead")) : null;
        if (!head || e.target.closest("button") || e.target.closest("input")) return;
        var blk = head.closest(".repBlock") || document.getElementById("smartBar");
        var r = blk.getBoundingClientRect();
        drag = { blk: blk, dx: e.clientX - r.left, dy: e.clientY - r.top };
        head.setPointerCapture && e.pointerId !== undefined && head.setPointerCapture(e.pointerId);
        e.preventDefault();
      });
      document.addEventListener("pointermove", function (e) {
        if (!drag) return;
        var x = Math.max(0, Math.min(window.innerWidth - 120, e.clientX - drag.dx));
        var y = Math.max(0, Math.min(window.innerHeight - 60, e.clientY - drag.dy));
        drag.blk.style.left = x + "px"; drag.blk.style.top = y + "px";
      });
      document.addEventListener("pointerup", function () { drag = null; });
    })();
    document.addEventListener("click", function (e) {
      var op = e.target.closest ? e.target.closest("[data-op]") : null;
      if (op) { activeSec = op.getAttribute("data-sec"); runOp(op.getAttribute("data-sec"), op.getAttribute("data-op")); return; }
      var ap = e.target.closest ? e.target.closest("[data-apply]") : null;
      if (ap) {
        var blk = ap.closest(".repBlock");
        var sec = blk.id.replace("repBlock-", "");
        runOp(sec, ap.getAttribute("data-apply"));
      }
    });
  });
})();
