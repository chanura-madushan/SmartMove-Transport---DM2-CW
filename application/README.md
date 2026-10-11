# SmartMove Transport – Web Frontend

A standalone web application (vanilla JS frontend + small Node.js API gateway) that connects to the
**Oracle** database (tables, PL/SQL procedures, functions, triggers) and **MongoDB** collections from the
SmartMove coursework repo. It does not modify or include any of the repo's files.

## Requirements
- Node.js 18+
- Oracle DB with `oracle/create_tables.sql`, sample data, and all `plsql/*.sql` objects installed
- MongoDB with `mongodb/create_collections.js` and `insert_data.js` run (database `smartmove_transport`)

## Run
```bash
npm install
cp .env.example .env      # fill in Oracle + Mongo details
npm start                 # http://localhost:3000
```
The status pills in the top bar show live Oracle / MongoDB connectivity.

## What connects to what
| Screen | Oracle | MongoDB |
|---|---|---|
| Dashboard | counts, revenue, trips, due maintenance | active announcements |
| Vehicles / Drivers / Routes | CRUD on VEHICLE / DRIVER / ROUTE | – |
| Passengers | **RegisterPassenger**, **CountPassengerTrips**, travel history | – |
| Trips | **ScheduleTrip**, **GetAvailableSeats** | – |
| Bookings | **CreateBooking**, **CancelBooking** (+ triggers: overbooking, invalid trip) | – |
| Payments | PAYMENT insert (trigger `trg_validate_payment` enforces amount = fare) | – |
| Maintenance | MAINTENANCE CRUD, "due" flag | – |
| Feedback | FEEDBACK insert | mirrored into `reviewsFeedback` (route/vehicle/driver ids + keywords) |
| Oracle Reports | R1 Revenue, R2 Routes, R3 Drivers, R4 Maintenance, R5 Occupancy, Due maintenance, **CalculateRevenue** | – |
| Hybrid report | bookings + paid revenue per route | avg rating + review count per route |
| Reviews & Ratings | route/vehicle/driver names | reviews by route, top vehicles/drivers, keyword `$text` search, keyword/route stats |
| Documents & Media | vehicle validation | `vehicleDocuments`, `tripMedia` (add / remove / expiry warnings) |
| Announcements | – | `announcements` (create, activate/deactivate, delete) |

PL/SQL errors (e.g. "Seat already booked", "Vehicle is not available") are shown to the user as messages.

## Notes
- The five report screens run the same queries as the procedures in `plsql/reports.sql`, because those
  procedures print through `DBMS_OUTPUT`; running the queries directly gives structured tables.
- Oracle connects in thin mode (no Instant Client needed).

## Layout
```
server/index.js        API gateway (Express, oracledb, mongodb)
public/index.html      app shell
public/css/style.css   styles
public/js/app.js       all screens
```
