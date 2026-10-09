# SmartMove Transport Solutions

SmartMove is a coursework transport-management web app with a vanilla JavaScript frontend, a PHP JSON API, Oracle for operational records and PL/SQL, and MongoDB for users, community media, reviews, and announcements. It includes live CRUD pages and five searchable database-report groups (R1–R5).

## Quick start

1. Read [`docs/SETUP.md`](docs/SETUP.md) before deploying.
2. Create the Oracle schema and seed records using `database/oracle/seed.sql`, then install the PL/SQL objects from `database/oracle/plsql.sql` (or the clean rebuild script as documented).
3. Configure the `smartmove` MongoDB database with `database/mongodb/mongodb.js`.
4. In `backend/`, run `composer install`, copy `.env.example` to `.env`, and set the real Oracle and MongoDB connection values. Keep `.env` private and outside version control.
5. Serve `frontend/` as the web root and configure the absolute URL to `backend/backend.php` in **Settings → Backend**. Use **Ping** to verify both databases.
6. Register or log in. Add/edit/delete operations reload the live data before re-rendering the affected screen.

## Report search

Select **View report** on Routes, Payments, Passengers, Maintenance, or Drivers. The report opens without executing a query. Use the large **Smart Search** input, type a keyword, choose a matching operation, and then run it. The driver report supports minimum average-rating filters and explicit sort modes.

## Verification

From the project root:

```sh
node tests/regression.test.cjs
node --check frontend/js/app.js
node --check frontend/js/auth.js
node --check frontend/js/reports.js
php -l backend/backend.php
```

The dependency-free regression suite exercises logout/session races, driver CRUD refresh, and driver-report search/filter/sort using the actual frontend files. Syntax checks validate parsing only. A complete live integration check still requires a working PHP server with OCI8, Oracle objects and credentials, the MongoDB PHP library, and a reachable MongoDB server. The ZIP intentionally does not include a real `backend/.env`; create it locally from `backend/.env.example`.

## Project map

- `frontend/index.html`, `frontend/css/styles.css`, `frontend/js/` — user interface and client-side behavior.
- `backend/backend.php` — API actions and database access.
- `backend/composer.json`, `backend/composer.lock` — pinned PHP dependency definitions.
- `database/oracle/` — schema seed, PL/SQL setup, and Oracle scripts.
- `database/mongodb/mongodb.js` — MongoDB setup and example operations.
- `docs/` — setup, technical notes, viva flow, and change log.
