require('dotenv').config();
const path = require('path');
const express = require('express');
const oracledb = require('oracledb');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

let pool, mongo, mdb;
const wrap = fn => (req, res, next) => fn(req, res).catch(next);
const lower = row => Object.fromEntries(Object.entries(row).map(([k, v]) => [k.toLowerCase(), v]));
const D = c => `TO_CHAR(${c},'YYYY-MM-DD')`;
const TS = c => `TO_CHAR(${c},'YYYY-MM-DD"T"HH24:MI')`;
const idStr = d => ({ ...d, _id: String(d._id) });

// ---------- Oracle helper ----------
async function q(sql, binds = {}) {
  const c = await pool.getConnection();
  try {
    const r = await c.execute(sql, binds, { outFormat: oracledb.OUT_FORMAT_OBJECT, autoCommit: true });
    return (r.rows || []).map(lower);
  } finally { await c.close(); }
}
const one = async (sql, binds) => (await q(sql, binds))[0];

// ---------- Health ----------
app.get('/api/health', wrap(async (req, res) => {
  const out = { oracle: false, mongo: false };
  try { await q('SELECT 1 AS x FROM DUAL'); out.oracle = true; } catch (e) { out.oracleError = e.message; }
  try { await mdb.command({ ping: 1 }); out.mongo = true; } catch (e) { out.mongoError = e.message; }
  res.json(out);
}));

// ---------- Dashboard (Oracle stats + Mongo announcements) ----------
app.get('/api/dashboard', wrap(async (req, res) => {
  const stats = await one(`SELECT
    (SELECT COUNT(*) FROM VEHICLE) vehicles, (SELECT COUNT(*) FROM DRIVER) drivers,
    (SELECT COUNT(*) FROM PASSENGER) passengers, (SELECT COUNT(*) FROM ROUTE) routes,
    (SELECT COUNT(*) FROM TRIP WHERE TripStatus IN ('Scheduled','Departed')) activetrips,
    (SELECT COUNT(*) FROM BOOKING WHERE BookingStatus='Confirmed') bookings,
    (SELECT NVL(SUM(Amount),0) FROM PAYMENT WHERE PaymentStatus='Paid') revenue,
    (SELECT COUNT(DISTINCT VehicleID) FROM MAINTENANCE WHERE MaintenanceStatus IN ('Scheduled','In Progress') AND NextMaintenanceDate <= SYSDATE+30) duemaintenance
    FROM DUAL`);
  const announcements = (await mdb.collection('announcements').find({ active: true }).sort({ publishedAt: -1 }).limit(5).toArray()).map(idStr);
  res.json({ stats, announcements });
}));

// ---------- Generic CRUD for simple Oracle tables ----------
function crud(base, table, pk, listSql, insertSql, insertBinds, updateSql, updateBinds) {
  app.get(`/api/${base}`, wrap(async (req, res) => res.json(await q(listSql))));
  app.post(`/api/${base}`, wrap(async (req, res) => { await q(insertSql, insertBinds(req.body)); res.status(201).json({ ok: true }); }));
  app.put(`/api/${base}/:id`, wrap(async (req, res) => { await q(updateSql, { ...updateBinds(req.body), id: +req.params.id }); res.json({ ok: true }); }));
  app.delete(`/api/${base}/:id`, wrap(async (req, res) => { await q(`DELETE FROM ${table} WHERE ${pk}=:id`, { id: +req.params.id }); res.json({ ok: true }); }));
}

crud('vehicles', 'VEHICLE', 'VehicleID',
  'SELECT VehicleID, RegistrationNo, VehicleType, Capacity, VehicleStatus FROM VEHICLE ORDER BY VehicleID',
  'INSERT INTO VEHICLE (RegistrationNo,VehicleType,Capacity,VehicleStatus) VALUES (:reg,:type,:cap,:status)',
  b => ({ reg: b.registrationNo, type: b.vehicleType, cap: +b.capacity, status: b.vehicleStatus || 'Available' }),
  'UPDATE VEHICLE SET RegistrationNo=:reg,VehicleType=:type,Capacity=:cap,VehicleStatus=:status WHERE VehicleID=:id',
  b => ({ reg: b.registrationNo, type: b.vehicleType, cap: +b.capacity, status: b.vehicleStatus }));

crud('drivers', 'DRIVER', 'DriverID',
  'SELECT DriverID, FirstName, LastName, LicenseNo, Phone, DriverStatus FROM DRIVER ORDER BY DriverID',
  'INSERT INTO DRIVER (FirstName,LastName,LicenseNo,Phone,DriverStatus) VALUES (:fn,:ln,:lic,:ph,:status)',
  b => ({ fn: b.firstName, ln: b.lastName, lic: b.licenseNo, ph: b.phone || null, status: b.driverStatus || 'Available' }),
  'UPDATE DRIVER SET FirstName=:fn,LastName=:ln,LicenseNo=:lic,Phone=:ph,DriverStatus=:status WHERE DriverID=:id',
  b => ({ fn: b.firstName, ln: b.lastName, lic: b.licenseNo, ph: b.phone || null, status: b.driverStatus }));

crud('routes', 'ROUTE', 'RouteID',
  'SELECT RouteID, StartLocation, EndLocation, DistanceKM, RouteStatus FROM ROUTE ORDER BY RouteID',
  'INSERT INTO ROUTE (StartLocation,EndLocation,DistanceKM,RouteStatus) VALUES (:s,:e,:d,:status)',
  b => ({ s: b.startLocation, e: b.endLocation, d: +b.distanceKM, status: b.routeStatus || 'Active' }),
  'UPDATE ROUTE SET StartLocation=:s,EndLocation=:e,DistanceKM=:d,RouteStatus=:status WHERE RouteID=:id',
  b => ({ s: b.startLocation, e: b.endLocation, d: +b.distanceKM, status: b.routeStatus }));

// ---------- Passengers (registration via PL/SQL RegisterPassenger) ----------
app.get('/api/passengers', wrap(async (req, res) => res.json(await q(
  `SELECT p.PassengerID, p.FirstName, p.LastName, p.Phone, p.Email,
          CountPassengerTrips(p.PassengerID) AS TripCount FROM PASSENGER p ORDER BY p.PassengerID`))));
app.post('/api/passengers', wrap(async (req, res) => {
  const b = req.body;
  await q('BEGIN RegisterPassenger(:fn,:ln,:ph,:em); END;', { fn: b.firstName, ln: b.lastName, ph: b.phone || null, em: b.email || null });
  res.status(201).json({ ok: true });
}));
app.put('/api/passengers/:id', wrap(async (req, res) => {
  const b = req.body;
  await q('UPDATE PASSENGER SET FirstName=:fn,LastName=:ln,Phone=:ph,Email=:em WHERE PassengerID=:id',
    { fn: b.firstName, ln: b.lastName, ph: b.phone || null, em: b.email || null, id: +req.params.id });
  res.json({ ok: true });
}));
app.delete('/api/passengers/:id', wrap(async (req, res) => {
  await q('DELETE FROM PASSENGER WHERE PassengerID=:id', { id: +req.params.id }); res.json({ ok: true });
}));
app.get('/api/passengers/:id/history', wrap(async (req, res) => res.json(await q(
  `SELECT b.BookingID, ${D('t.TripDate')} AS TripDate, r.StartLocation||' to '||r.EndLocation AS RouteName, b.SeatNumber, b.Fare, b.BookingStatus
   FROM BOOKING b JOIN TRIP t ON t.TripID=b.TripID JOIN ROUTE r ON r.RouteID=t.RouteID WHERE b.PassengerID=:id ORDER BY t.TripDate DESC`, { id: +req.params.id }))));

// ---------- Trips (PL/SQL ScheduleTrip, GetAvailableSeats) ----------
app.get('/api/trips', wrap(async (req, res) => res.json(await q(
  `SELECT t.TripID, t.VehicleID, v.RegistrationNo, t.DriverID, d.FirstName||' '||d.LastName AS DriverName,
          t.RouteID, r.StartLocation||' to '||r.EndLocation AS RouteName, ${D('t.TripDate')} AS TripDate,
          ${TS('t.DepartureTime')} AS DepartureTime, ${TS('t.ArrivalTime')} AS ArrivalTime, t.TripStatus,
          GetAvailableSeats(t.TripID) AS AvailableSeats
   FROM TRIP t JOIN VEHICLE v ON v.VehicleID=t.VehicleID JOIN DRIVER d ON d.DriverID=t.DriverID
   JOIN ROUTE r ON r.RouteID=t.RouteID ORDER BY t.TripDate DESC, t.TripID DESC`))));
app.post('/api/trips', wrap(async (req, res) => {
  const b = req.body, f = 'YYYY-MM-DD"T"HH24:MI';
  await q(`BEGIN ScheduleTrip(:v,:d,:r,TO_DATE(:td,'YYYY-MM-DD'),TO_TIMESTAMP(:dep,'${f}'),TO_TIMESTAMP(:arr,'${f}')); END;`,
    { v: +b.vehicleId, d: +b.driverId, r: +b.routeId, td: b.tripDate, dep: b.departureTime, arr: b.arrivalTime || null });
  res.status(201).json({ ok: true });
}));
app.put('/api/trips/:id/status', wrap(async (req, res) => {
  await q('UPDATE TRIP SET TripStatus=:s WHERE TripID=:id', { s: req.body.tripStatus, id: +req.params.id }); res.json({ ok: true });
}));
app.get('/api/trips/:id/seats', wrap(async (req, res) => {
  const id = +req.params.id;
  const info = await one('SELECT v.Capacity, GetAvailableSeats(t.TripID) AS Available FROM TRIP t JOIN VEHICLE v ON v.VehicleID=t.VehicleID WHERE t.TripID=:id', { id });
  const taken = (await q(`SELECT SeatNumber FROM BOOKING WHERE TripID=:id AND BookingStatus='Confirmed'`, { id })).map(r => r.seatnumber);
  res.json({ ...info, taken });
}));

// ---------- Bookings (PL/SQL CreateBooking / CancelBooking) ----------
app.get('/api/bookings', wrap(async (req, res) => res.json(await q(
  `SELECT b.BookingID, b.PassengerID, p.FirstName||' '||p.LastName AS PassengerName, b.TripID,
          r.StartLocation||' to '||r.EndLocation AS RouteName, ${D('t.TripDate')} AS TripDate,
          ${D('b.BookingDate')} AS BookingDate, b.SeatNumber, b.Fare, b.BookingStatus,
          (SELECT PaymentStatus FROM PAYMENT WHERE BookingID=b.BookingID) AS PaymentStatus
   FROM BOOKING b JOIN PASSENGER p ON p.PassengerID=b.PassengerID JOIN TRIP t ON t.TripID=b.TripID
   JOIN ROUTE r ON r.RouteID=t.RouteID ORDER BY b.BookingID DESC`))));
app.post('/api/bookings', wrap(async (req, res) => {
  const b = req.body;
  await q('BEGIN CreateBooking(:p,:t,:s,:f); END;', { p: +b.passengerId, t: +b.tripId, s: +b.seatNumber, f: +b.fare });
  res.status(201).json({ ok: true });
}));
app.post('/api/bookings/:id/cancel', wrap(async (req, res) => {
  await q('BEGIN CancelBooking(:id); END;', { id: +req.params.id }); res.json({ ok: true });
}));

// ---------- Payments (trigger trg_validate_payment checks amount = fare) ----------
app.get('/api/payments', wrap(async (req, res) => res.json(await q(
  `SELECT py.PaymentID, py.BookingID, p.FirstName||' '||p.LastName AS PassengerName, ${D('py.PaymentDate')} AS PaymentDate,
          py.Amount, py.PaymentMethod, py.PaymentStatus
   FROM PAYMENT py JOIN BOOKING b ON b.BookingID=py.BookingID JOIN PASSENGER p ON p.PassengerID=b.PassengerID
   ORDER BY py.PaymentID DESC`))));
app.post('/api/payments', wrap(async (req, res) => {
  const b = req.body;
  const bk = await one('SELECT Fare FROM BOOKING WHERE BookingID=:id', { id: +b.bookingId });
  if (!bk) throw new Error('Booking does not exist');
  await q('INSERT INTO PAYMENT (BookingID,Amount,PaymentMethod,PaymentStatus) VALUES (:b,:a,:m,:s)',
    { b: +b.bookingId, a: b.amount !== undefined && b.amount !== '' ? +b.amount : bk.fare, m: b.paymentMethod, s: b.paymentStatus || 'Paid' });
  res.status(201).json({ ok: true });
}));
app.put('/api/payments/:id', wrap(async (req, res) => {
  await q('UPDATE PAYMENT SET PaymentStatus=:s WHERE PaymentID=:id', { s: req.body.paymentStatus, id: +req.params.id }); res.json({ ok: true });
}));

// ---------- Maintenance ----------
app.get('/api/maintenance', wrap(async (req, res) => res.json(await q(
  `SELECT m.MaintenanceID, m.VehicleID, v.RegistrationNo, ${D('m.MaintenanceDate')} AS MaintenanceDate,
          ${D('m.NextMaintenanceDate')} AS NextMaintenanceDate, m.MaintenanceType, m.Description, m.Cost, m.MaintenanceStatus
   FROM MAINTENANCE m JOIN VEHICLE v ON v.VehicleID=m.VehicleID ORDER BY m.NextMaintenanceDate`))));
app.post('/api/maintenance', wrap(async (req, res) => {
  const b = req.body;
  await q(`INSERT INTO MAINTENANCE (VehicleID,MaintenanceDate,NextMaintenanceDate,MaintenanceType,Description,Cost,MaintenanceStatus)
           VALUES (:v,TO_DATE(:d,'YYYY-MM-DD'),TO_DATE(:n,'YYYY-MM-DD'),:t,:descr,:c,:s)`,
    { v: +b.vehicleId, d: b.maintenanceDate, n: b.nextMaintenanceDate, t: b.maintenanceType || null, descr: b.description || null, c: +b.cost || 0, s: b.maintenanceStatus || 'Scheduled' });
  res.status(201).json({ ok: true });
}));
app.put('/api/maintenance/:id', wrap(async (req, res) => {
  await q('UPDATE MAINTENANCE SET MaintenanceStatus=:s WHERE MaintenanceID=:id', { s: req.body.maintenanceStatus, id: +req.params.id }); res.json({ ok: true });
}));
app.delete('/api/maintenance/:id', wrap(async (req, res) => {
  await q('DELETE FROM MAINTENANCE WHERE MaintenanceID=:id', { id: +req.params.id }); res.json({ ok: true });
}));

// ---------- Feedback: Oracle FEEDBACK + MongoDB reviewsFeedback (dual write) ----------
app.get('/api/feedback', wrap(async (req, res) => res.json(await q(
  `SELECT f.FeedbackID, f.PassengerID, p.FirstName||' '||p.LastName AS PassengerName, f.TripID, f.Rating, f.CommentText,
          ${D('f.FeedbackDate')} AS FeedbackDate FROM FEEDBACK f JOIN PASSENGER p ON p.PassengerID=f.PassengerID ORDER BY f.FeedbackID DESC`))));
app.post('/api/feedback', wrap(async (req, res) => {
  const b = req.body;
  const t = await one('SELECT RouteID, VehicleID, DriverID FROM TRIP WHERE TripID=:id', { id: +b.tripId });
  if (!t) throw new Error('Trip does not exist');
  await q('INSERT INTO FEEDBACK (PassengerID,TripID,Rating,CommentText) VALUES (:p,:t,:r,:c)',
    { p: +b.passengerId, t: +b.tripId, r: +b.rating, c: b.comment || null });
  let mongoOk = true;
  try {
    const keywords = [...new Set(String(b.comment || '').toLowerCase().match(/[a-z]{4,}/g) || [])].slice(0, 6);
    await mdb.collection('reviewsFeedback').insertOne({
      passengerId: +b.passengerId, tripId: +b.tripId, routeId: t.routeid, vehicleId: t.vehicleid, driverId: t.driverid,
      rating: +b.rating, comment: b.comment || '', keywords, createdAt: new Date() });
  } catch (e) { mongoOk = false; }
  res.status(201).json({ ok: true, mongo: mongoOk });
}));

// ---------- Oracle business reports & PL/SQL functions ----------
const REPORTS = {
  revenue: `SELECT PaymentStatus, COUNT(*) AS PaymentCount, NVL(SUM(Amount),0) AS TotalAmount FROM PAYMENT GROUP BY PaymentStatus ORDER BY TotalAmount DESC`,
  routes: `SELECT r.RouteID, r.StartLocation, r.EndLocation, COUNT(b.BookingID) AS TotalBookings FROM ROUTE r
           LEFT JOIN TRIP t ON r.RouteID=t.RouteID LEFT JOIN BOOKING b ON t.TripID=b.TripID AND b.BookingStatus='Confirmed'
           GROUP BY r.RouteID, r.StartLocation, r.EndLocation ORDER BY TotalBookings DESC`,
  drivers: `SELECT d.DriverID, d.FirstName||' '||d.LastName AS DriverName, d.DriverStatus, COUNT(DISTINCT t.TripID) AS TotalTrips, COUNT(b.BookingID) AS TotalBookings
            FROM DRIVER d LEFT JOIN TRIP t ON d.DriverID=t.DriverID LEFT JOIN BOOKING b ON t.TripID=b.TripID AND b.BookingStatus='Confirmed'
            GROUP BY d.DriverID, d.FirstName, d.LastName, d.DriverStatus ORDER BY TotalTrips DESC`,
  maintenance: `SELECT v.VehicleID, v.RegistrationNo, v.VehicleType, ${D('m.MaintenanceDate')} AS MaintenanceDate,
                ${D('m.NextMaintenanceDate')} AS NextMaintenanceDate, m.MaintenanceStatus, m.Cost
                FROM VEHICLE v LEFT JOIN MAINTENANCE m ON v.VehicleID=m.VehicleID ORDER BY m.NextMaintenanceDate`,
  occupancy: `SELECT t.TripID, r.StartLocation||' to '||r.EndLocation AS RouteName, v.RegistrationNo, v.Capacity,
              COUNT(b.BookingID) AS ConfirmedBookings, v.Capacity-COUNT(b.BookingID) AS AvailableSeats
              FROM TRIP t JOIN ROUTE r ON t.RouteID=r.RouteID JOIN VEHICLE v ON t.VehicleID=v.VehicleID
              LEFT JOIN BOOKING b ON t.TripID=b.TripID AND b.BookingStatus='Confirmed'
              GROUP BY t.TripID, r.StartLocation, r.EndLocation, v.RegistrationNo, v.Capacity ORDER BY t.TripID`,
  due: `SELECT v.VehicleID, v.RegistrationNo, v.VehicleType, ${D('MAX(m.NextMaintenanceDate)')} AS NextMaintenanceDate
        FROM VEHICLE v JOIN MAINTENANCE m ON m.VehicleID=v.VehicleID
        WHERE m.MaintenanceStatus IN ('Scheduled','In Progress') AND m.NextMaintenanceDate <= SYSDATE+30
        GROUP BY v.VehicleID, v.RegistrationNo, v.VehicleType ORDER BY 4`
};
app.get('/api/reports/:name', wrap(async (req, res) => {
  const name = req.params.name;
  if (name === 'hybrid') { // Oracle + MongoDB combined analytics
    const rows = await q(REPORTS.routes);
    const revenue = await q(`SELECT t.RouteID, NVL(SUM(py.Amount),0) AS Revenue FROM TRIP t JOIN BOOKING b ON b.TripID=t.TripID
                             JOIN PAYMENT py ON py.BookingID=b.BookingID AND py.PaymentStatus='Paid' GROUP BY t.RouteID`);
    const rev = Object.fromEntries(revenue.map(r => [r.routeid, r.revenue]));
    const agg = await mdb.collection('reviewsFeedback').aggregate([{ $group: { _id: '$routeId', avg: { $avg: '$rating' }, n: { $sum: 1 } } }]).toArray();
    const rat = Object.fromEntries(agg.map(a => [a._id, a]));
    return res.json(rows.map(r => ({ routeid: r.routeid, route: `${r.startlocation} to ${r.endlocation}`, confirmed_bookings: r.totalbookings,
      paid_revenue: rev[r.routeid] || 0, avg_rating: rat[r.routeid] ? +rat[r.routeid].avg.toFixed(2) : null, review_count: rat[r.routeid] ? rat[r.routeid].n : 0 })));
  }
  if (!REPORTS[name]) return res.status(404).json({ error: 'Unknown report' });
  res.json(await q(REPORTS[name]));
}));
app.get('/api/functions/revenue', wrap(async (req, res) => res.json(await one(
  `SELECT CalculateRevenue(TO_DATE(:s,'YYYY-MM-DD'),TO_DATE(:e,'YYYY-MM-DD')) AS total FROM DUAL`, { s: req.query.start, e: req.query.end }))));
app.get('/api/functions/passenger-trips/:id', wrap(async (req, res) =>
  res.json(await one('SELECT CountPassengerTrips(:id) AS total FROM DUAL', { id: +req.params.id }))));
app.get('/api/functions/available-seats/:id', wrap(async (req, res) =>
  res.json(await one('SELECT GetAvailableSeats(:id) AS total FROM DUAL', { id: +req.params.id }))));

// ---------- MongoDB ----------
const names = async () => {
  const [v, d, r] = await Promise.all([
    q('SELECT VehicleID, RegistrationNo FROM VEHICLE'), q(`SELECT DriverID, FirstName||' '||LastName AS Name FROM DRIVER`),
    q(`SELECT RouteID, StartLocation||' to '||EndLocation AS Name FROM ROUTE`)]);
  return { v: Object.fromEntries(v.map(x => [x.vehicleid, x.registrationno])), d: Object.fromEntries(d.map(x => [x.driverid, x.name])), r: Object.fromEntries(r.map(x => [x.routeid, x.name])) };
};
const reviews = () => mdb.collection('reviewsFeedback');
const ranking = async (field, label) => {
  const n = await names();
  const rows = await reviews().aggregate([{ $group: { _id: '$' + field, averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }, { $sort: { averageRating: -1, reviewCount: -1 } }]).toArray();
  return rows.map(x => ({ id: x._id, name: n[label][x._id] || `#${x._id}`, averageRating: +x.averageRating.toFixed(2), reviewCount: x.reviewCount }));
};

app.get('/api/mongo/reviews', wrap(async (req, res) => {
  const filter = req.query.routeId ? { routeId: +req.query.routeId } : {};
  const n = await names();
  const rows = await reviews().find(filter).sort({ createdAt: -1 }).toArray();
  res.json(rows.map(x => ({ ...idStr(x), routeName: n.r[x.routeId], vehicleReg: n.v[x.vehicleId], driverName: n.d[x.driverId] })));
}));
app.get('/api/mongo/top-vehicles', wrap(async (req, res) => res.json(await ranking('vehicleId', 'v'))));
app.get('/api/mongo/top-drivers', wrap(async (req, res) => res.json(await ranking('driverId', 'd'))));
app.get('/api/mongo/search', wrap(async (req, res) => {
  if (!req.query.q) return res.json([]);
  const rows = await reviews().find({ $text: { $search: req.query.q } }, { projection: { score: { $meta: 'textScore' } } }).sort({ score: { $meta: 'textScore' } }).toArray();
  res.json(rows.map(idStr));
}));
app.get('/api/mongo/stats', wrap(async (req, res) => {
  const n = await names();
  const [byRoute, keywords, media] = await Promise.all([
    reviews().aggregate([{ $group: { _id: '$routeId', averageRating: { $avg: '$rating' }, totalReviews: { $sum: 1 } } }, { $sort: { averageRating: -1 } }]).toArray(),
    reviews().aggregate([{ $unwind: '$keywords' }, { $group: { _id: '$keywords', occurrences: { $sum: 1 } } }, { $sort: { occurrences: -1, _id: 1 } }]).toArray(),
    mdb.collection('tripMedia').aggregate([{ $group: { _id: '$tripId', mediaCount: { $sum: 1 }, mediaTypes: { $addToSet: '$mediaType' } } }, { $sort: { mediaCount: -1 } }]).toArray()]);
  res.json({
    byRoute: byRoute.map(x => ({ route: n.r[x._id] || `Route ${x._id}`, averageRating: +x.averageRating.toFixed(2), totalReviews: x.totalReviews })),
    keywords: keywords.map(x => ({ keyword: x._id, occurrences: x.occurrences })),
    media: media.map(x => ({ tripId: x._id, mediaCount: x.mediaCount, mediaTypes: x.mediaTypes.join(', ') })) });
}));

// Vehicle documents & images
const vdocs = () => mdb.collection('vehicleDocuments');
app.get('/api/mongo/vehicle-documents', wrap(async (req, res) => res.json((await vdocs().find().sort({ vehicleId: 1 }).toArray()).map(idStr))));
async function ensureVehicle(vid) {
  const v = await one('SELECT RegistrationNo FROM VEHICLE WHERE VehicleID=:id', { id: vid });
  if (!v) throw new Error('Vehicle does not exist in Oracle');
  return v.registrationno;
}
app.post('/api/mongo/vehicle-documents/:vid/documents', wrap(async (req, res) => {
  const vid = +req.params.vid, b = req.body, reg = await ensureVehicle(vid);
  await vdocs().updateOne({ vehicleId: vid }, {
    $setOnInsert: { vehicleId: vid, registrationNo: reg, images: [] }, $set: { updatedAt: new Date() },
    $push: { documents: { documentType: b.documentType, fileName: b.fileName, fileUrl: b.fileUrl, expiryDate: b.expiryDate ? new Date(b.expiryDate) : null } } }, { upsert: true });
  res.status(201).json({ ok: true });
}));
app.post('/api/mongo/vehicle-documents/:vid/images', wrap(async (req, res) => {
  const vid = +req.params.vid, reg = await ensureVehicle(vid);
  await vdocs().updateOne({ vehicleId: vid }, {
    $setOnInsert: { vehicleId: vid, registrationNo: reg, documents: [] }, $set: { updatedAt: new Date() }, $push: { images: req.body.image } }, { upsert: true });
  res.status(201).json({ ok: true });
}));
app.delete('/api/mongo/vehicle-documents/:vid/documents/:fileName', wrap(async (req, res) => {
  await vdocs().updateOne({ vehicleId: +req.params.vid }, { $pull: { documents: { fileName: req.params.fileName } }, $set: { updatedAt: new Date() } });
  res.json({ ok: true });
}));
app.delete('/api/mongo/vehicle-documents/:vid/images/:image', wrap(async (req, res) => {
  await vdocs().updateOne({ vehicleId: +req.params.vid }, { $pull: { images: req.params.image }, $set: { updatedAt: new Date() } });
  res.json({ ok: true });
}));

// Announcements
const ann = () => mdb.collection('announcements');
app.get('/api/mongo/announcements', wrap(async (req, res) => res.json((await ann().find().sort({ publishedAt: -1 }).toArray()).map(idStr))));
app.post('/api/mongo/announcements', wrap(async (req, res) => {
  const b = req.body;
  const doc = { title: b.title, message: b.message, type: b.type || 'General', publishedAt: new Date(), active: true };
  if (b.routeId) doc.routeId = +b.routeId;
  await ann().insertOne(doc); res.status(201).json({ ok: true });
}));
app.patch('/api/mongo/announcements/:id', wrap(async (req, res) => {
  await ann().updateOne({ _id: new ObjectId(req.params.id) }, { $set: { active: !!req.body.active } }); res.json({ ok: true });
}));
app.delete('/api/mongo/announcements/:id', wrap(async (req, res) => {
  await ann().deleteOne({ _id: new ObjectId(req.params.id) }); res.json({ ok: true });
}));

// Trip media
const media = () => mdb.collection('tripMedia');
app.get('/api/mongo/trip-media', wrap(async (req, res) => {
  const f = req.query.tripId ? { tripId: +req.query.tripId } : {};
  res.json((await media().find(f).sort({ uploadedAt: -1 }).toArray()).map(idStr));
}));
app.post('/api/mongo/trip-media', wrap(async (req, res) => {
  const b = req.body;
  await media().insertOne({ tripId: +b.tripId, mediaType: b.mediaType, url: b.url, caption: b.caption || '', uploadedAt: new Date() });
  res.status(201).json({ ok: true });
}));
app.delete('/api/mongo/trip-media/:id', wrap(async (req, res) => {
  await media().deleteOne({ _id: new ObjectId(req.params.id) }); res.json({ ok: true });
}));

// ---------- Errors ----------
app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  const msg = String(err.message || err).split('\n')[0].replace(/^ORA-\d+:\s*/, '');
  console.error('[error]', err.message);
  res.status(400).json({ error: msg });
});

// ---------- Boot ----------
(async () => {
  try {
    pool = await oracledb.createPool({
      user: process.env.ORACLE_USER, password: process.env.ORACLE_PASSWORD,
      connectString: process.env.ORACLE_CONNECT_STRING, poolMin: 1, poolMax: 8 });
    console.log('Oracle pool ready');
  } catch (e) { console.error('Oracle connection failed:', e.message); process.exit(1); }
  try {
    mongo = new MongoClient(process.env.MONGO_URI || 'mongodb://localhost:27017');
    await mongo.connect();
    mdb = mongo.db(process.env.MONGO_DB || 'smartmove_transport');
    console.log('MongoDB connected');
  } catch (e) { console.error('MongoDB connection failed:', e.message); process.exit(1); }
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`SmartMove running at http://localhost:${port}`));
})();
