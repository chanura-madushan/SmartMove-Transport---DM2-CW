//SMARTMOVE TRANSPORT SOLUTIONS
//PL/SQL FUNCTION TESTING
SET SERVEROUTPUT ON;

//TEST 1: CalculateRevenue
SELECT CalculateRevenue(
    DATE '2026-01-01',
    DATE '2026-01-31'
) AS TotalRevenue
FROM DUAL;


//TEST 2: CountPassengerTrips
SELECT CountPassengerTrips(
    1
) AS TripCount
FROM DUAL;



//TEST 3: GetAvailableSeats
SELECT GetAvailableSeats(
    1
) AS AvailableSeats
FROM DUAL;