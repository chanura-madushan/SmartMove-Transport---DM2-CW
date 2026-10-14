# SmartMove Transport Solutions — Oracle Database

## 1. Overview

The `oracle/` directory contains the SQL scripts for creating and populating the Oracle relational database used by the SmartMove Transport Solutions coursework.

Oracle stores the structured operational data required for managing vehicles, drivers, routes, passengers, trips, bookings, payments, feedback, and maintenance.

## 2. Technologies

- Oracle Database
- Oracle SQL
- Oracle SQL Developer

## 3. Files in This Directory

| File | Purpose |
|---|---|
| `create_tables.sql` | Creates the relational database tables, primary keys, foreign keys, and constraints. |
| `sample_data.sql` | Inserts sample records for development and testing. |
| `View.sql` | Contains `SELECT` statements for inspecting the contents of the tables. |

**Important:** `View.sql` currently contains table inspection queries. It does not create database views using `CREATE VIEW`.

## 4. Database Tables

The schema creation script defines the following nine tables:

| Table | Purpose |
|---|---|
| `VEHICLE` | Stores vehicle registration, type, capacity, and status. |
| `DRIVER` | Stores driver details, licence information, and status. |
| `ROUTE` | Stores route start locations, end locations, distance, and status. |
| `PASSENGER` | Stores passenger names and contact details. |
| `TRIP` | Stores trip dates, times, status, and related vehicle, driver, and route IDs. |
| `BOOKING` | Stores passenger bookings, seat numbers, fares, and booking status. |
| `PAYMENT` | Stores payment information associated with bookings. |
| `FEEDBACK` | Stores passenger feedback and ratings associated with trips. |
| `MAINTENANCE` | Stores vehicle maintenance records. |

The database uses primary keys to identify records and foreign keys to define relationships between related tables. It also uses constraints to enforce rules such as valid statuses, positive capacities, and unique seat assignments for a trip.

## 5. Prerequisites

Before running the scripts, ensure that:

- Oracle Database is installed and running, or an accessible coursework database is available.
- Oracle SQL Developer or another compatible Oracle SQL client is installed.
- You have credentials for the correct database schema.
- You are connected to the intended schema before creating the tables.

## 6. Execution Order

Run the scripts in this order.

### Step 1 — Create the tables

Open `create_tables.sql` in Oracle SQL Developer and execute the script.

This creates the database tables and their defined constraints.

Check the script output and resolve any errors before continuing.

### Step 2 — Insert sample data

Open `sample_data.sql` and execute the script.

This inserts sample records into the database for development and testing.

If the script is run more than once, unique constraints or existing records may cause insertion errors. Use a clean test schema or reset the data appropriately before repeating the setup.

### Step 3 — Inspect the data

Open `View.sql` and execute the queries.

These queries retrieve records from the tables so that you can inspect the inserted data.

## 7. Verify the Database

Use the following query to check the tables visible to your current Oracle user:

```sql
SELECT table_name
FROM user_tables
ORDER BY table_name;
```

To check the number of records in an individual table, run a query such as:

```sql
SELECT COUNT(*) AS total_vehicles
FROM VEHICLE;
```

To inspect database constraints, use:

```sql
SELECT constraint_name,
       constraint_type,
       table_name,
       status
FROM user_constraints
ORDER BY table_name, constraint_type;
```

Confirm that the required tables exist, sample records were inserted, and constraints are enabled.

## 8. Relationship Overview

The main relationships include:

- A vehicle can be associated with multiple trips.
- A driver can be assigned to multiple trips.
- A route can be used by multiple trips.
- A passenger can have multiple bookings.
- A trip can have multiple bookings, subject to seat constraints.
- A booking can be associated with a payment.
- A vehicle can have multiple maintenance records.
- A passenger can submit feedback associated with a trip.

The actual foreign keys and cardinality constraints should be checked against `create_tables.sql` and the project's database diagram.

## 9. Relationship with PL/SQL

The Oracle schema is required by the stored procedures, functions, cursors, triggers, exception-handling blocks, and reports in the `plsql/` directory.

**Recommended workflow:**

1. Create the Oracle tables.
2. Insert sample data.
3. Compile the PL/SQL scripts.
4. Run PL/SQL test scripts.
5. Verify report outputs and database changes.
6. Configure and test the application backend.

Refer to [the PL/SQL README](../plsql/README.md) for the PL/SQL execution and testing instructions.

## 10. Troubleshooting

| Problem | Possible cause and action |
|---|---|
| Table already exists | The schema was previously created. Use a clean test schema or carefully reset the existing objects. |
| Table or view does not exist | Check the current schema and confirm that the creation script executed successfully. |
| Unique constraint violation | A duplicate value may already exist in a column with a uniqueness constraint. |
| Foreign key violation | The referenced parent record may not exist, or records may be inserted in the wrong order. |
| Sample data fails to insert | Review existing records, constraints, and the order of the insert statements. |
| Cannot connect to Oracle | Check the database service, username, password, host, port, and service name. |

## 11. Testing and Evidence

For coursework evidence, record:

- Successful table creation
- The tables and relationships
- Sample data insertion
- Constraint verification
- Example queries and results
- Any errors found and how they were resolved

Include genuine screenshots from Oracle SQL Developer or the database tool used for testing.

Do not report a test as successful until it has been executed and its result has been checked.

## 12. Summary

The `oracle/` directory provides the relational database foundation for SmartMove Transport Solutions. Its tables store structured transport data and provide the schema required by the PL/SQL components and application backend.
