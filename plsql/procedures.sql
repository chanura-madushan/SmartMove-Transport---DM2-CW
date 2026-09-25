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