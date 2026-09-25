//Trigger 1: Prevent booking beyond vehicle capacity
CREATE OR REPLACE TRIGGER trg_prevent_overbooking
BEFORE INSERT ON BOOKING
FOR EACH ROW
DECLARE
    v_capacity NUMBER;
    v_booked   NUMBER;
BEGIN
    SELECT v.Capacity
    INTO v_capacity
    FROM VEHICLE v
    JOIN TRIP t ON v.VehicleID = t.VehicleID
    WHERE t.TripID = :NEW.TripID;

    SELECT COUNT(*)
    INTO v_booked
    FROM BOOKING
    WHERE TripID = :NEW.TripID
      AND BookingStatus = 'Confirmed';

    IF :NEW.BookingStatus = 'Confirmed'
       AND v_booked >= v_capacity THEN
        RAISE_APPLICATION_ERROR(-20013,'Booking cannot be created. Vehicle capacity is full');
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR( -20014,'Trip does not exist' );
END;
/




//Trigger 2: Validate payment amount against booking fare
CREATE OR REPLACE TRIGGER trg_validate_payment
BEFORE INSERT OR UPDATE ON PAYMENT
FOR EACH ROW
DECLARE
    v_fare NUMBER;
BEGIN
    SELECT Fare
    INTO v_fare
    FROM BOOKING
    WHERE BookingID = :NEW.BookingID;

    IF :NEW.Amount <> v_fare THEN
        RAISE_APPLICATION_ERROR( -20015, 'Payment amount must match booking fare' );
    END IF;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20016,'Booking does not exist');
END;
/




//Trigger 3: Prevent booking for completed or cancelled trip
CREATE OR REPLACE TRIGGER trg_prevent_invalid_trip_booking
BEFORE INSERT ON BOOKING
FOR EACH ROW
DECLARE
    v_trip_status TRIP.TripStatus%TYPE;
BEGIN
    SELECT TripStatus
    INTO v_trip_status
    FROM TRIP
    WHERE TripID = :NEW.TripID;

    IF v_trip_status IN ('Cancelled', 'Completed') THEN
        RAISE_APPLICATION_ERROR( -20017, 'Cannot book a cancelled or completed trip' );
    END IF;

EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(-20018,'Trip does not exist');
END;
/