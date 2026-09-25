
//PL/SQL FUNCTIONS
//FUNCTION 1: CalculateRevenue
//Calculates total paid revenue between dates
CREATE OR REPLACE FUNCTION CalculateRevenue (
    p_StartDate IN DATE,
    p_EndDate   IN DATE
)
RETURN NUMBER
AS
    v_TotalRevenue NUMBER;
BEGIN
    SELECT NVL(SUM(Amount), 0)
    INTO v_TotalRevenue
    FROM PAYMENT
    WHERE PaymentDate >= p_StartDate
      AND PaymentDate < p_EndDate + 1
      AND PaymentStatus = 'Paid';
    RETURN v_TotalRevenue;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END CalculateRevenue;
/



//FUNCTION 2: CountPassengerTrips
//Counts trips booked by a passenger
CREATE OR REPLACE FUNCTION CountPassengerTrips (
    p_PassengerID IN NUMBER
)
RETURN NUMBER
AS
    v_TripCount NUMBER;
BEGIN
    SELECT COUNT(*)
    INTO v_TripCount
    FROM BOOKING
    WHERE PassengerID = p_PassengerID
      AND BookingStatus <> 'Cancelled';
    RETURN v_TripCount;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END CountPassengerTrips;
/


//FUNCTION 3: GetAvailableSeats
//Calculates available seats for a trip
CREATE OR REPLACE FUNCTION GetAvailableSeats (
    p_TripID IN NUMBER
)
RETURN NUMBER
AS
    v_Capacity NUMBER;
    v_BookedSeats NUMBER;
BEGIN
    -- Get vehicle capacity for the trip
    SELECT v.Capacity
    INTO v_Capacity
    FROM VEHICLE v
    JOIN TRIP t
        ON v.VehicleID = t.VehicleID
    WHERE t.TripID = p_TripID;
    -- count confirmed bookings
    SELECT COUNT(*)
    INTO v_BookedSeats
    FROM BOOKING
    WHERE TripID = p_TripID
      AND BookingStatus = 'Confirmed';
    -- Return available seats
    RETURN v_Capacity - v_BookedSeats;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE_APPLICATION_ERROR(
            -20012,
            'Trip does not exist'
        );
    WHEN OTHERS THEN
        RAISE;
END GetAvailableSeats;
/