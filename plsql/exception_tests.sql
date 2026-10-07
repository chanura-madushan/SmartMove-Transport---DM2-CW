
SET SERVEROUTPUT ON;



--TEST 1 - Successful passenger search
BEGIN
    FindPassenger(1);
END;
/


--TEST 2 - 
BEGIN
    FindPassenger(99999);
END;
/


--TEST 3 - Successful passenger registration
BEGIN
    RegisterPassengerSafe(
        'Exception',
        'Test',
        '0771234567',
        'exception_test@smartmove.com'
    );
END;
/


--TEST 4 - DUP_VAL_ON_INDEX
BEGIN
    RegisterPassengerSafe(
        'Exception',
        'Duplicate',
        '0777654321',
        'exception_test@smartmove.com'
    );
END;
/


--TEST 5 - TOO_MANY_ROWS
BEGIN
    FindSingleBookingByStatus('Confirmed');
END;
/


--TEST 6 - NO_DATA_FOUND inside booking search
BEGIN
    FindSingleBookingByStatus('InvalidStatus');
END;
/




--TEST 7 - OTHERS
BEGIN
    TestGeneralException;
END;
/


--TEST 8 - CUSTOM APPLICATION 
BEGIN
    ValidatePassengerID(0);
END;
/



--TEST 9 - Valid custom validation
BEGIN
    ValidatePassengerID(1);
END;
/
