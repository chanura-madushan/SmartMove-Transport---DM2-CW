

-- PL/SQL CURSORS
-- CURSOR 1: Passenger Travel History
CREATE OR REPLACE PROCEDURE PassengerTravelHistory (
    p_PassengerID IN NUMBER
)
AS
    CURSOR c_history IS
        SELECT b.BookingID,
               t.TripDate,
               r.StartLocation,
               r.EndLocation,
               b.SeatNumber,
               b.Fare
        FROM BOOKING b
        JOIN TRIP t
            ON b.TripID = t.TripID
        JOIN ROUTE r
            ON t.RouteID = r.RouteID
        WHERE b.PassengerID = p_PassengerID
          AND b.BookingStatus <> 'Cancelled'
        ORDER BY t.TripDate;

    v_row c_history%ROWTYPE;
BEGIN
    OPEN c_history;

    LOOP
        FETCH c_history INTO v_row;
        EXIT WHEN c_history%NOTFOUND;
        DBMS_OUTPUT.PUT_LINE('Booking: ' || v_row.BookingID ||' | Date: ' || TO_CHAR(v_row.TripDate, 'DD-MON-YYYY') ||' | Route: ' || v_row.StartLocation ||' -> ' || v_row.EndLocation || ' | Seat: ' || v_row.SeatNumber ||' | Fare: Rs.' || v_row.Fare);
    END LOOP;
    CLOSE c_history;
END PassengerTravelHistory;
/




-- CURSOR 2: Vehicles Due For Maintenance
CREATE OR REPLACE PROCEDURE VehiclesDueForMaintenance
AS
    CURSOR c_due IS
        SELECT m.MaintenanceID,
               v.RegistrationNo,
               m.NextMaintenanceDate,
               m.MaintenanceStatus
        FROM MAINTENANCE m
        JOIN VEHICLE v
            ON m.VehicleID = v.VehicleID
        WHERE m.NextMaintenanceDate <= SYSDATE
        ORDER BY m.NextMaintenanceDate;

    v_row c_due%ROWTYPE;
BEGIN
    OPEN c_due;

    LOOP
        FETCH c_due INTO v_row;
        EXIT WHEN c_due%NOTFOUND;
        DBMS_OUTPUT.PUT_LINE('Vehicle: ' || v_row.RegistrationNo ||' | Next Maintenance: ' || TO_CHAR(v_row.NextMaintenanceDate, 'DD-MON-YYYY') ||' | Status: ' || v_row.MaintenanceStatus);
    END LOOP;

    CLOSE c_due;
END VehiclesDueForMaintenance;
/



-- CURSOR 3: Most Used Routes
CREATE OR REPLACE PROCEDURE MostUsedRoutes
AS
    CURSOR c_routes IS
        SELECT r.RouteID,
               r.StartLocation,
               r.EndLocation,
               COUNT(b.BookingID) AS TotalBookings
        FROM ROUTE r
        JOIN TRIP t
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
    OPEN c_routes;
    LOOP
        FETCH c_routes INTO v_row;
        EXIT WHEN c_routes%NOTFOUND;
        DBMS_OUTPUT.PUT_LINE('Route ' || v_row.RouteID || ': ' ||v_row.StartLocation || ' -> ' || v_row.EndLocation ||' | Bookings: ' || v_row.TotalBookings);
    END LOOP;
    CLOSE c_routes;
END MostUsedRoutes;
/