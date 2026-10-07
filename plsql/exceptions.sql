
/*
1. NO_DATA_FOUND
Find a passenger by ID.

*/

CREATE OR REPLACE PROCEDURE FindPassenger (
    p_PassengerID IN NUMBER
)
AS
    v_FirstName PASSENGER.FirstName%TYPE;
    v_LastName  PASSENGER.LastName%TYPE;
    v_Email     PASSENGER.Email%TYPE;
BEGIN
    SELECT FirstName, LastName, Email
    INTO v_FirstName, v_LastName, v_Email
    FROM PASSENGER
    WHERE PassengerID = p_PassengerID;

    DBMS_OUTPUT.PUT_LINE(
        'Passenger: ' || v_FirstName || ' ' || v_LastName
    );
    DBMS_OUTPUT.PUT_LINE(
        'Email: ' || v_Email
    );
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(
            -20020,
            'Passenger does not exist'
        );
    WHEN OTHERS THEN
        RAISE;
END FindPassenger;
/
SHOW ERRORS;


/*
2. DUP_VAL_ON_INDEX
Purpose:
Register a passenger
*/

CREATE OR REPLACE PROCEDURE RegisterPassengerSafe (
    p_FirstName IN VARCHAR2,
    p_LastName  IN VARCHAR2,
    p_Phone     IN VARCHAR2,
    p_Email     IN VARCHAR2
)
AS
BEGIN
    INSERT INTO PASSENGER (
        FirstName,
        LastName,
        Phone,
        Email
    )
    VALUES (
        p_FirstName,
        p_LastName,
        p_Phone,
        p_Email
    );
    COMMIT;
    DBMS_OUTPUT.PUT_LINE(
        'Passenger registered successfully'
    );
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        ROLLBACK;
        RAISE_APPLICATION_ERROR(
            -20021,
            'A passenger with this email already exists'
        );
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END RegisterPassengerSafe;
/
SHOW ERRORS;


/*
3. TOO_MANY_ROWS
Purpose:
Demonstrates handling when SELECT INTO returns more
than one row.

*/

CREATE OR REPLACE PROCEDURE FindSingleBookingByStatus (
    p_Status IN VARCHAR2
)
AS
    v_BookingID BOOKING.BookingID%TYPE;
BEGIN
    SELECT BookingID
    INTO v_BookingID
    FROM BOOKING
    WHERE BookingStatus = p_Status;

    DBMS_OUTPUT.PUT_LINE(
        'Booking ID: ' || v_BookingID
    );
EXCEPTION
    WHEN TOO_MANY_ROWS THEN
        RAISE_APPLICATION_ERROR(
            -20022,
            'More than one booking was found'
        );
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(
            -20023,
            'No booking was found with this status'
        );
    WHEN OTHERS THEN
        RAISE;
END FindSingleBookingByStatus;
/
SHOW ERRORS;


/*
4. OTHERS EXCEPTION
Purpose:
Demonstrates general exception handling.

*/

CREATE OR REPLACE PROCEDURE TestGeneralException
AS
    v_Result NUMBER;
BEGIN
    v_Result := 10 / 0;
    DBMS_OUTPUT.PU_LINE(
        'Result: ' || v_Result
    );
EXCEPTION
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE(
            'An unexpected error occurred.'
        );
        DBMS_OUTPUT.PUT_LINE(
            'Oracle Error: ' || SQLERRM
        );
END TestGeneralException;
/
SHOW ERRORS;



--5. CUSTOM APPLICATION ERROR
-- passenger ID must be a positive value.

CREATE OR REPLACE PROCEDURE ValidatePassengerID (
    p_PassengerID IN NUMBER
)
AS
BEGIN
    IF p_PassengerID IS NULL OR p_PassengerID <= 0 THEN
        RAISE_APPLICATION_ERROR(
            -20024,
            'Passenger ID must be greater than zero'
        );
    END IF;
    DBMS_OUTPUT.PUT_LINE(
        'Passenger ID is valid'
    );
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END ValidatePassengerID;
/
SHOW ERRORS;
