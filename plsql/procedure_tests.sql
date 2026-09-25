
SELECT VehicleID, RegistrationNo, VehicleStatus
FROM VEHICLE
ORDER BY VehicleID;

SELECT DriverID, FirstName, LastName, DriverStatus
FROM DRIVER
ORDER BY DriverID;

SELECT RouteID, StartLocation, EndLocation, RouteStatus
FROM ROUTE
ORDER BY RouteID;


SELECT VehicleID, RegistrationNo, VehicleStatus
FROM VEHICLE
ORDER BY VehicleID;

SELECT DriverID, FirstName, LastName, DriverStatus
FROM DRIVER
ORDER BY DriverID;



//Test 1 - CreateBooking: Successful
set serveroutput on;
BEGIN
    CreateBooking(
        p_PassengerID => 1,
        p_TripID      => 1,
        p_SeatNumber  => 11,
        p_Fare        => 250
    );
END;
/

SELECT *
FROM BOOKING
WHERE TripID = 1
  AND SeatNumber = 11;
  
  
//Test 2 - CreateBooking: Duplicate Seat Error
BEGIN
    CreateBooking(
        p_PassengerID => 2,
        p_TripID      => 1,
        p_SeatNumber  => 11,
        p_Fare        => 250
    );
END;
/


//Test 3 - CancelBooking: Successful
SELECT BookingID, PassengerID, TripID, SeatNumber, BookingStatus
FROM BOOKING
WHERE TripID = 1
  AND SeatNumber = 11;
  
BEGIN
    CancelBooking(
        p_BookingID => 23
    );
END;
/


//Test 4 - CancelBooking: Non-existent Booking
BEGIN
    CancelBooking(
        p_BookingID => 9999
    );
END;
/


//Test 5 - ScheduleTrip: Successful
BEGIN
    ScheduleTrip(
        p_VehicleID     => 1,
        p_DriverID      => 1,
        p_RouteID       => 1,
        p_TripDate      => DATE '2026-10-01',
        p_DepartureTime => TIMESTAMP '2026-10-01 08:00:00',
        p_ArrivalTime   => TIMESTAMP '2026-10-01 12:00:00'
    );
END;
/

SELECT TripID,
       VehicleID,
       DriverID,
       RouteID,
       TripDate,
       TripStatus
FROM TRIP
WHERE TripDate = DATE '2026-10-01';


//Test 6 - ScheduleTrip: Error Handling
BEGIN
    ScheduleTrip(
        p_VehicleID     => 3,
        p_DriverID      => 1,
        p_RouteID       => 1,
        p_TripDate      => DATE '2026-10-02',
        p_DepartureTime => TIMESTAMP '2026-10-02 08:00:00',
        p_ArrivalTime   => TIMESTAMP '2026-10-02 12:00:00'
    );
END;
/


//Test 7 - RegisterPassenger: Successful
BEGIN
    RegisterPassenger(
        p_FirstName => 'Test',
        p_LastName  => 'Passenger',
        p_Phone     => '0771234567',
        p_Email     => 'test.passenger01@example.com'
    );
END;
/

SELECT PassengerID,
       FirstName,
       LastName,
       Phone,
       Email
FROM PASSENGER
WHERE Email = 'test.passenger01@example.com';


//Test 8 - RegisterPassenger: Duplicate Email
BEGIN
    RegisterPassenger(
        p_FirstName => 'Another',
        p_LastName  => 'Passenger',
        p_Phone     => '0779999999',
        p_Email     => 'test.passenger01@example.com'
    );
END;
/