
-- SMARTMOVE TRANSPORT SOLUTIONS
-- PL/SQL BUSINESS REPORTS
SET SERVEROUTPUT ON;


-- REPORT 1: REVENUE REPORT
-- Shows total paid revenue for each payment status.
CREATE OR REPLACE PROCEDURE RevenueReport
AS
    CURSOR c_revenue IS
        SELECT PaymentStatus,
               COUNT(*) AS PaymentCount,
               NVL(SUM(Amount), 0) AS TotalAmount
        FROM PAYMENT
        GROUP BY PaymentStatus
        ORDER BY TotalAmount DESC;

    v_row c_revenue%ROWTYPE;

BEGIN
    DBMS_OUTPUT.PUT_LINE('        SMARTMOVE REVENUE REPORT');
    DBMS_OUTPUT.PUT_LINE('-------------------------------------------------');

    OPEN c_revenue;

    LOOP
        FETCH c_revenue INTO v_row;
        EXIT WHEN c_revenue%NOTFOUND;

        DBMS_OUTPUT.PUT_LINE(
            'Status: ' || v_row.PaymentStatus ||
            ' | Payments: ' || v_row.PaymentCount ||
            ' | Amount: Rs.' || v_row.TotalAmount
        );
    END LOOP;

    CLOSE c_revenue;
END RevenueReport;
/









-- REPORT 2: MOST USED ROUTES REPORT
-- Shows routes ranked by number of confirmed bookings.
CREATE OR REPLACE PROCEDURE MostUsedRoutesReport
AS
    CURSOR c_routes IS
        SELECT r.RouteID,
               r.StartLocation,
               r.EndLocation,
               COUNT(b.BookingID) AS TotalBookings
        FROM ROUTE r
        LEFT JOIN TRIP t
            ON r.RouteID = t.RouteID
        LEFT JOIN BOOKING b
            ON t.TripID = b.TripID
           AND b.BookingStatus = 'Confirmed'
        GROUP BY r.RouteID,
                 r.StartLocation,
                 r.EndLocation
        ORDER BY TotalBookings DESC;

    v_row c_routes%ROWTYPE;

BEGIN
    DBMS_OUTPUT.PUT_LINE('       MOST USED ROUTES REPORT');
    DBMS_OUTPUT.PUT_LINE('----------------------------------------');

    OPEN c_routes;

    LOOP
        FETCH c_routes INTO v_row;
        EXIT WHEN c_routes%NOTFOUND;

        DBMS_OUTPUT.PUT_LINE(
            'Route ' || v_row.RouteID ||
            ' | ' || v_row.StartLocation ||
            ' -> ' || v_row.EndLocation ||
            ' | Confirmed Bookings: ' || v_row.TotalBookings
        );
    END LOOP;

    CLOSE c_routes;
END MostUsedRoutesReport;
/








-- REPORT 3: DRIVER PERFORMANCE REPORT
-- Shows trips and confirmed bookings handled by each driver.
CREATE OR REPLACE PROCEDURE DriverPerformanceReport
AS
    CURSOR c_drivers IS
        SELECT d.DriverID,
               d.FirstName,
               d.LastName,
               d.DriverStatus,
               COUNT(DISTINCT t.TripID) AS TotalTrips,
               COUNT(b.BookingID) AS TotalBookings
        FROM DRIVER d
        LEFT JOIN TRIP t
            ON d.DriverID = t.DriverID
        LEFT JOIN BOOKING b
            ON t.TripID = b.TripID
           AND b.BookingStatus = 'Confirmed'
        GROUP BY d.DriverID,
                 d.FirstName,
                 d.LastName,
                 d.DriverStatus
        ORDER BY TotalTrips DESC;

    v_row c_drivers%ROWTYPE;

BEGIN
    DBMS_OUTPUT.PUT_LINE('       DRIVER PERFORMANCE REPORT');
    DBMS_OUTPUT.PUT_LINE('---------------------------------------------');

    OPEN c_drivers;

    LOOP
        FETCH c_drivers INTO v_row;
        EXIT WHEN c_drivers%NOTFOUND;

        DBMS_OUTPUT.PUT_LINE(
            'Driver: ' || v_row.FirstName || ' ' || v_row.LastName ||
            ' | Status: ' || v_row.DriverStatus ||
            ' | Trips: ' || v_row.TotalTrips ||
            ' | Bookings: ' || v_row.TotalBookings
        );
    END LOOP;

    CLOSE c_drivers;
END DriverPerformanceReport;
/






-- REPORT 4: VEHICLE MAINTENANCE REPORT
-- Shows maintenance information for each vehicle.
CREATE OR REPLACE PROCEDURE VehicleMaintenanceReport
AS
    CURSOR c_maintenance IS
        SELECT v.VehicleID,
               v.RegistrationNo,
               v.VehicleType,
               m.MaintenanceDate,
               m.NextMaintenanceDate,
               m.MaintenanceStatus,
               m.Cost
        FROM VEHICLE v
        LEFT JOIN MAINTENANCE m
            ON v.VehicleID = m.VehicleID
        ORDER BY m.NextMaintenanceDate;

    v_row c_maintenance%ROWTYPE;

BEGIN
    DBMS_OUTPUT.PUT_LINE('       VEHICLE MAINTENANCE REPORT');
    DBMS_OUTPUT.PUT_LINE('-------------------------------------------');

    OPEN c_maintenance;

    LOOP
        FETCH c_maintenance INTO v_row;
        EXIT WHEN c_maintenance%NOTFOUND;

        DBMS_OUTPUT.PUT_LINE(
            'Vehicle: ' || v_row.RegistrationNo ||
            ' | Type: ' || v_row.VehicleType ||
            ' | Maintenance: ' ||
            TO_CHAR(v_row.MaintenanceDate, 'DD-MON-YYYY') ||
            ' | Next: ' ||
            TO_CHAR(v_row.NextMaintenanceDate, 'DD-MON-YYYY') ||
            ' | Status: ' || v_row.MaintenanceStatus ||
            ' | Cost: Rs.' || v_row.Cost
        );
    END LOOP;

    CLOSE c_maintenance;
END VehicleMaintenanceReport;
/







-- REPORT 5: TRIP OCCUPANCY REPORT
-- Shows vehicle capacity, confirmed bookings and available seats.

CREATE OR REPLACE PROCEDURE TripOccupancyReport
AS
    CURSOR c_trips IS
        SELECT t.TripID,
               r.StartLocation,
               r.EndLocation,
               v.RegistrationNo,
               v.Capacity,
               COUNT(b.BookingID) AS ConfirmedBookings,
               v.Capacity - COUNT(b.BookingID) AS AvailableSeats
        FROM TRIP t
        JOIN ROUTE r
            ON t.RouteID = r.RouteID
        JOIN VEHICLE v
            ON t.VehicleID = v.VehicleID
        LEFT JOIN BOOKING b
            ON t.TripID = b.TripID
           AND b.BookingStatus = 'Confirmed'
        GROUP BY t.TripID,
                 r.StartLocation,
                 r.EndLocation,
                 v.RegistrationNo,
                 v.Capacity
        ORDER BY t.TripID;

    v_row c_trips%ROWTYPE;

BEGIN
    DBMS_OUTPUT.PUT_LINE('          TRIP OCCUPANCY REPORT');
    DBMS_OUTPUT.PUT_LINE('---------------------------------------------');

    OPEN c_trips;

    LOOP
        FETCH c_trips INTO v_row;
        EXIT WHEN c_trips%NOTFOUND;

        DBMS_OUTPUT.PUT_LINE(
            'Trip: ' || v_row.TripID ||
            ' | Route: ' || v_row.StartLocation ||
            ' -> ' || v_row.EndLocation ||
            ' | Vehicle: ' || v_row.RegistrationNo ||
            ' | Capacity: ' || v_row.Capacity ||
            ' | Booked: ' || v_row.ConfirmedBookings ||
            ' | Available: ' || v_row.AvailableSeats
        );
    END LOOP;
    CLOSE c_trips;
END TripOccupancyReport;
/



-- RUN ALL 5 REPORTS
BEGIN
    RevenueReport;
END;
/

BEGIN
    MostUsedRoutesReport;
END;
/

BEGIN
    DriverPerformanceReport;
END;
/

BEGIN
    VehicleMaintenanceReport;
END;
/

BEGIN
    TripOccupancyReport;
END;
/
