SET SERVEROUTPUT ON;
//Test 1: Valid payment
BEGIn
    INSERT INTO PAYMENT (
        BookingID,
        PaymentDate,
        Amount,
        PaymentMethod,
        PaymentStatus
    )
    VALUES (
        1,
        SYSDATE,
        250,
        'Cash',
        'Paid'
    );
    DBMS_OUTPUT.PUT_LINE('Valid payment accepted');
    ROLLBACK;
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Payment test: ' || SQLERRM);
        ROLLBACK;
END;
/






-- Test 2: Invalid payment amount
BEGIN
    INSERT INTO PAYMENT (
        BookingID,
        PaymentDate,
        Amount,
        PaymentMethod,
        PaymentStatus
    )
    VALUES (
        1,
        SYSDATE,
        500,
        'Cash',
        'Paid'
    );
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Expected Error: ' || SQLERRM);
        ROLLBACK;
END;
/









-- Test 3: Invalid trip booking
BEGIN
    INSERT INTO BOOKING (
        PassengerID,
        TripID,
        BookingDate,
        SeatNumber,
        Fare,
        BookingStatus
    )
    VALUES (
        1,
        1,
        SYSDATE,
        99,
        250,
        'Confirmed'
    );
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Expected Error: ' || SQLERRM);
        ROLLBACK;
END;
/







-- Test 4: Check Trip 21 capacity
SELECT
    t.TripID,
    v.RegistrationNo,
    v.Capacity,
    COUNT(b.BookingID) AS ConfirmedBookings
FROM TRIP t
JOIN VEHICLE v
    ON t.VehicleID = v.VehicleID
LEFT JOIN BOOKING b
    ON t.TripID = b.TripID
   AND b.BookingStatus = 'Confirmed'
WHERE t.TripID = 21
GROUP BY
    t.TripID,
    v.RegistrationNo,
    v.Capacity;





-- Test 5: Fill Trip 21 temporarily
BEGIN
    FOR i IN 1..30 LOOP
        INSERT INTO BOOKING (
            PassengerID,
            TripID,
            BookingDate,
            SeatNumber,
            Fare,
            BookingStatus
        )
        VALUES (
            1,
            21,
            SYSDATE,
            i,
            250,
            'Confirmed'
        );
    END LOOP;
END;
/









-- Test 6: Attempt overbooking
BEGIN
    INSERT INTO BOOKING (
        PassengerID,
        TripID,
        BookingDate,
        SeatNumber,
        Fare,
        BookingStatus
    )
    VALUES (
        1,
        21,
        SYSDATE,
        31,
        250,
        'Confirmed'
    );
    DBMS_OUTPUT.PUT_LINE('ERROR: Overbooking was allowed');
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Expected Error: ' || SQLERRM);
END;
/





-- Test 7: Remove temporary bookings
ROLLBACK;




-- Test 8: Verify Trip 21
SELECT COUNT(*) AS ConfirmedBookings
FROM BOOKING
WHERE TripID = 21
  AND BookingStatus = 'Confirmed';
  
  
  
  
  
  
  
  
  
  
  
  
  
  
SELECT
    t.TripID,
    t.TripStatus,
    v.RegistrationNo,
    v.Capacity,
    COUNT(b.BookingID) AS ConfirmedBookings
FROM TRIP t
JOIN VEHICLE v
    ON t.VehicleID = v.VehicleID
LEFT JOIN BOOKING b
    ON t.TripID = b.TripID
   AND b.BookingStatus = 'Confirmed'
WHERE t.TripStatus = 'Scheduled'
GROUP BY
    t.TripID,
    t.TripStatus,
    v.RegistrationNo,
    v.Capacity
ORDER BY t.TripID;