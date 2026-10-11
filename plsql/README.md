# SmartMove Transport Solutions — PL/SQL

## 1. Overview

This directory contains the PL/SQL components developed for the **SmartMove Transport Solutions** database management coursework. These components implement database operations, business logic, data validation, exception handling, and reporting using Oracle PL/SQL.

The PL/SQL modules work with the Oracle database tables created for the transport management system.

## 2. Technologies Used

- **Oracle Database** — relational database management.
- **PL/SQL** — stored procedures, functions, cursors, triggers, and exception handling.
- **Oracle SQL Developer** — recommended tool for executing and testing SQL and PL/SQL scripts.

## 3. Directory Contents

| File | Description |
|---|---|
| `procedures.sql` | Defines stored procedures for booking creation, booking cancellation, trip scheduling, and passenger registration. |
| `functions.sql` | Defines functions for calculating revenue, counting passenger trips, and checking available seats. |
| `cursors.sql` | Contains cursor-based operations for passenger travel history, vehicles due for maintenance, and frequently used routes. |
| `triggers.sql` | Contains database triggers for automatically performing actions when specified database events occur. |
| `exceptions.sql` | Demonstrates exception handling for managing errors during PL/SQL execution. |
| `reports.sql` | Defines five reports covering revenue, route usage, driver performance, vehicle maintenance, and trip occupancy. |
| `README.md` | Documents the PL/SQL components and instructions for executing them. |

## 4. PL/SQL Components

### 4.1 Stored Procedures

Stored procedures implement reusable operations for the transport management system.

- `CreateBooking` — creates a booking.
- `CancelBooking` — cancels an existing booking.
- `ScheduleTrip` — schedules a trip.
- `RegisterPassenger` — registers a passenger.

### 4.2 Functions

Functions perform calculations and return values that can be reused by other database operations.

- `CalculateRevenue` — calculates revenue.
- `CountPassengerTrips` — counts trips associated with a passenger.
- `GetAvailableSeats` — determines the number of available seats.

### 4.3 Cursors

Cursors process query results and support operations involving multiple records.

- `PassengerTravelHistory` — retrieves passenger travel history.
- `VehiclesDueForMaintenance` — identifies vehicles due for maintenance.
- `MostUsedRoutes` — identifies frequently used routes.

### 4.4 Triggers

The triggers in `triggers.sql` automate database actions in response to specified database events. Refer to the SQL definitions for the exact triggering events and actions.

### 4.5 Exception Handling

The `exceptions.sql` file demonstrates how PL/SQL handles errors using exception-handling blocks. These blocks help manage runtime errors and provide meaningful feedback during execution.

### 4.6 Reports

The `reports.sql` file contains five reporting procedures:

1. `RevenueReport` — reports revenue information.
2. `MostUsedRoutesReport` — reports route usage.
3. `DriverPerformanceReport` — reports driver performance information.
4. `VehicleMaintenanceReport` — reports vehicle maintenance information.
5. `TripOccupancyReport` — reports trip occupancy information.

The exact output of each report depends on the SQL queries and data used in its implementation.

## 5. Prerequisites

Before running these scripts, ensure that:

- Oracle Database is available.
- Oracle SQL Developer or another compatible Oracle SQL client is installed.
- The SmartMove database schema has been created.
- Required tables, constraints, and related database objects exist.
- You are connected to the correct Oracle database schema.

## 6. Execution Instructions

### Step 1: Connect to Oracle

Open Oracle SQL Developer and connect using the database credentials provided for the coursework.

### Step 2: Create the database tables

Run the relevant schema creation script from the project's `oracle/` directory before executing PL/SQL modules.

Ensure that all required tables and relationships have been created successfully.

### Step 3: Execute the PL/SQL scripts

Run the files in the following order, checking for compilation errors after each file:

1. `procedures.sql`
2. `functions.sql`
3. `cursors.sql`
4. `triggers.sql`
5. `exceptions.sql`
6. `reports.sql`

**Note:** This is a suggested execution order. If any object depends on another object, adjust the order according to the actual definitions and dependencies in the scripts.

### Step 4: Check compilation errors

After executing the scripts, check whether the stored procedures, functions, and triggers were created successfully.

You can inspect compilation errors using:

```sql
SHOW ERRORS;
```

You can also query compilation errors for the current schema:

```sql
SELECT name, type, line, position, text
FROM user_errors
ORDER BY name, sequence;
```

### Step 5: Test the PL/SQL components

Execute appropriate test cases for each procedure, function, cursor, trigger, exception-handling block, and report.

Use test data that satisfies the database constraints, and verify both successful operations and expected error scenarios.

## 7. Testing and Validation

The PL/SQL components should be validated to confirm that:

- Booking creation and cancellation behave as expected.
- Passenger registration and trip scheduling use valid data.
- Revenue and available-seat calculations return appropriate results.
- Cursor-based operations retrieve the intended records.
- Triggers execute under the correct conditions.
- Exception handlers manage expected errors.
- All five reports return results consistent with the underlying database records.

Record actual test results and screenshots separately as coursework evidence. Do not mark a test as successful until it has been executed and verified.

## 8. Integration

The PL/SQL modules form part of the SmartMove Transport Solutions database layer. They are intended to support transport operations and reporting.

If the application frontend needs to execute these routines, the backend must call the appropriate Oracle procedures or functions using their actual names, parameters, and return types.

## 9. Troubleshooting

| Problem | Recommended action |
|---|---|
| Table or view does not exist | Confirm that the schema scripts ran successfully and that you are connected to the correct schema. |
| Compilation errors | Inspect `SHOW ERRORS` or query `USER_ERRORS`. |
| Constraint violations | Check primary keys, foreign keys, required fields, and other table constraints. |
| Procedure or function execution fails | Check its parameters, required records, dependencies, and exception handling. |
| A report returns no records | Confirm that relevant test data exists and that the report's query conditions match the data. |

## 10. Conclusion

The PL/SQL directory contains the stored database logic for SmartMove Transport Solutions. Its procedures, functions, cursors, triggers, exception handling, and reports support core transport-management operations and database reporting.

All components should be compiled, tested, and validated against the final database schema before the project is submitted.
