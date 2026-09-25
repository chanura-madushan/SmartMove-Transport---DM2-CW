                                                                                //CREATE BOOKING
CREATE OR REPLACE PROCEDURE CreateBooking (
    p_PassengerID IN NUMBER,
    p_TripID      IN NUMBER,
    p_SeatNumber  IN NUMBER,
    p_Fare        IN NUMBER
)
AS
    v_count NUMBER;
BEGIN

    -- Check passenger
    SELECT COUNT(*)
    INTO v_count
    FROM PASSENGER
    WHERE PassengerID = p_PassengerID;
    IF v_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Passenger does not exist');
    END IF;


    -- Check trip
    SELECT COUNT(*)
    INTO v_count
    FROM TRIP
    WHERE TripID = p_TripID;
    IF v_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20002, 'Trip does not exist');
    END IF;


    -- Check seat
    SELECT COUNT(*)
    INTO v_count
    FROM BOOKING
    WHERE TripID = p_TripID
    AND SeatNumber = p_SeatNumber
    AND BookingStatus = 'Confirmed';
    IF v_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20003, 'Seat already booked');
    END IF;


    -- Create booking
    INSERT INTO BOOKING (PassengerID,TripID,BookingDate,SeatNumber,Fare,BookingStatus)
    VALUES (p_PassengerID,p_TripID,SYSDATE,p_SeatNumber,p_Fare,'Confirmed');
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Booking created successfully');

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END CreateBooking;
/



                                                                                //CANCEL BOOKING PROCEDURE
CREATE OR REPLACE PROCEDURE CancelBooking (
    p_BookingID IN NUMBER
)
AS
    v_status BOOKING.BookingStatus%TYPE;
BEGIN

    -- Get current booking status
    SELECT BookingStatus
    INTO v_status
    FROM BOOKING
    WHERE BookingID = p_BookingID;


    -- Check if already cancelled
    IF v_status = 'Cancelled' THEN
        RAISE_APPLICATION_ERROR(-20004,'Booking is already cancelled');
    END IF;

    -- Cancel the booking
    UPDATE BOOKING
    SET BookingStatus = 'Cancelled'
    WHERE BookingID = p_BookingID;
    COMMIT;
    DBMS_OUTPUT.PUT_LINE('Booking cancelled successfully'
    );


EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(
            -20005,
            'Booking does not exist'
        );
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END CancelBooking;
/



                                                                                //SCHEDULE TRIP
CREATE OR REPLACE PROCEDURE ScheduleTrip (
    p_VehicleID      IN NUMBER,
    p_DriverID       IN NUMBER,
    p_RouteID        IN NUMBER,
    p_TripDate       IN DATE,
    p_DepartureTime  IN TIMESTAMP,
    p_ArrivalTime    IN TIMESTAMP
)
AS
    v_count NUMBER;
    v_vehicle_status VEHICLE.VehicleStatus%TYPE;
    v_driver_status DRIVER.DriverStatus%TYPE;
BEGIN

    -- Check vehicle exists
    SELECT COUNT(*)
    INTO v_count
    FROM VEHICLE
    WHERE VehicleID = p_VehicleID;
    IF v_count = 0 THEN
        RAISE_APPLICATION_ERROR(
            -20006,
            'Vehicle does not exist'
        );
    END IF;


    -- Check vehicle status
    SELECT VehicleStatus
    INTO v_vehicle_status
    FROM VEHICLE
    WHERE VehicleID = p_VehicleID;
    IF v_vehicle_status <> 'Available' THEN
        RAISE_APPLICATION_ERROR(
            -20007,
            'Vehicle is not available'
        );
    END IF;


    -- Check driver exists
    SELECT COUNT(*)
    INTO v_count
    FROM DRIVER
    WHERE DriverID = p_DriverID;
    IF v_count = 0 THEN
        RAISE_APPLICATION_ERROR(
            -20008,
            'Driver does not exist'
        );
    END IF;


    -- Check driver status
    SELECT DriverStatus
    INTO v_driver_status
    FROM DRIVER
    WHERE DriverID = p_DriverID;
    IF v_driver_status <> 'Available' THEN
        RAISE_APPLICATION_ERROR(
            -20009,
            'Driver is not available'
        );
    END IF;


    -- Check route exists
    SELECT COUNT(*)
    INTO v_count
    FROM ROUTE
    WHERE RouteID = p_RouteID;
    IF v_count = 0 THEN
        RAISE_APPLICATION_ERROR(
            -20010,
            'Route does not exist'
        );
    END IF;


    -- Create trip
    INSERT INTO TRIP (VehicleID,DriverID,RouteID,TripDate,DepartureTime,ArrivalTime,TripStatus)
    VALUES (p_VehicleID, p_DriverID, p_RouteID,p_TripDate,p_DepartureTime,p_ArrivalTime,'Scheduled');

    COMMIT;
    DBMS_OUTPUT.PUT_LINE(
        'Trip scheduled successfully'
    );


EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END ScheduleTrip;
/


                                                                                //REGISTER PASSENGER
CREATE OR REPLACE PROCEDURE RegisterPassenger (
    p_FirstName IN VARCHAR2,
    p_LastName  IN VARCHAR2,
    p_Phone     IN VARCHAR2,
    p_Email     IN VARCHAR2
)
AS
BEGIN

    -- Register passenger
    INSERT INTO PASSENGER (FirstName, LastName,Phone,Email)
    VALUES (p_FirstName,p_LastName,p_Phone,p_Email
    );
    COMMIT;
    DBMS_OUTPUT.PUT_LINE(
        'Passenger registered successfully'
    );


EXCEPTION
    -- Duplicate email
    WHEN DUP_VAL_ON_INDEX THEN
        RAISE_APPLICATION_ERROR(
            -20011,
            'A passenger with this email already exists'
        );
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END RegisterPassenger;
/