--Creating tables--

CREATE TABLE VEHICLE (
    VehicleID       NUMBER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    RegistrationNo  VARCHAR2(20)    UNIQUE NOT NULL,
    VehicleType     VARCHAR2(30)    NOT NULL,
    Capacity        NUMBER          NOT NULL,
    VehicleStatus   VARCHAR2(20)    DEFAULT 'Available'
);
---------------------------------------------------------------------------------------

CREATE TABLE DRIVER (
    DriverID        NUMBER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    FirstName       VARCHAR2(50)    NOT NULL,
    LastName        VARCHAR2(50)    NOT NULL,
    LicenseNo       VARCHAR2(30)    UNIQUE NOT NULL,
    Phone           VARCHAR2(20),
    DriverStatus    VARCHAR2(20)    DEFAULT 'Available'
);
-------------------------------------------------------------------------------------------
CREATE TABLE ROUTE (
    RouteID         NUMBER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    StartLocation   VARCHAR2(100)   NOT NULL,
    EndLocation     VARCHAR2(100)   NOT NULL,
    DistanceKM      NUMBER(8,2),
    RouteStatus     VARCHAR2(20)    DEFAULT 'Active'
);


-------------------------------------------------------------------------------------------------------------------------


CREATE TABLE PASSENGER (
    PassengerID     NUMBER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    FirstName       VARCHAR2(50)    NOT NULL,
    LastName        VARCHAR2(50)    NOT NULL,
    Phone           VARCHAR2(20),
    Email           VARCHAR2(100)   UNIQUE
);


--------------------------------------------------------------------------------------------------------------------------------------

CREATE TABLE TRIP (
    TripID          NUMBER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    VehicleID       NUMBER          NOT NULL,
    DriverID        NUMBER          NOT NULL,
    RouteID         NUMBER          NOT NULL,
    TripDate        DATE            NOT NULL,
    DepartureTime   TIMESTAMP       NOT NULL,
    ArrivalTime     TIMESTAMP,
    TripStatus      VARCHAR2(20)    DEFAULT 'Scheduled',
    CONSTRAINT fk_trip_vehicle FOREIGN KEY (VehicleID) REFERENCES VEHICLE(VehicleID),
    CONSTRAINT fk_trip_driver  FOREIGN KEY (DriverID)  REFERENCES DRIVER(DriverID),
    CONSTRAINT fk_trip_route   FOREIGN KEY (RouteID)   REFERENCES ROUTE(RouteID)
);

------------------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE BOOKING (
    BookingID       NUMBER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    PassengerID     NUMBER          NOT NULL,
    TripID          NUMBER          NOT NULL,
    BookingDate     DATE            DEFAULT SYSDATE,
    SeatNumber      NUMBER          NOT NULL,
    Fare            NUMBER(10,2)    NOT NULL,
    BookingStatus   VARCHAR2(20)    DEFAULT 'Confirmed',
    CONSTRAINT fk_booking_passenger FOREIGN KEY (PassengerID) REFERENCES PASSENGER(PassengerID),
    CONSTRAINT fk_booking_trip      FOREIGN KEY (TripID)      REFERENCES TRIP(TripID),
    CONSTRAINT uq_booking_seat      UNIQUE (TripID, SeatNumber)
);
-------------------------------------------------------------------------------------------------------------------------------------------------

CREATE TABLE PAYMENT (
    PaymentID       NUMBER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    BookingID       NUMBER          NOT NULL,
    PaymentDate     DATE            DEFAULT SYSDATE,
    Amount          NUMBER(10,2)    NOT NULL,
    PaymentMethod   VARCHAR2(30)    NOT NULL,
    PaymentStatus   VARCHAR2(20)    DEFAULT 'Paid',
    CONSTRAINT fk_payment_booking FOREIGN KEY (BookingID) REFERENCES BOOKING(BookingID),
    CONSTRAINT uq_payment_booking UNIQUE (BookingID)
);

---------------------------------------------------------------------------------------------------------------------------------------------------


CREATE TABLE FEEDBACK (
    FeedbackID      NUMBER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    PassengerID     NUMBER          NOT NULL,
    TripID          NUMBER          NOT NULL,
    Rating          NUMBER(1)       NOT NULL,
    CommentText     VARCHAR2(1000),
    FeedbackDate    DATE            DEFAULT SYSDATE,
    CONSTRAINT fk_feedback_passenger FOREIGN KEY (PassengerID) REFERENCES PASSENGER(PassengerID),
    CONSTRAINT fk_feedback_trip      FOREIGN KEY (TripID)      REFERENCES TRIP(TripID),
    CONSTRAINT ck_feedback_rating    CHECK (Rating BETWEEN 1 AND 5)
);

------------------------------------------------------------------------------------------------------------------
CREATE TABLE MAINTENANCE (
    MaintenanceID         NUMBER          GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    VehicleID             NUMBER          NOT NULL,
    MaintenanceDate       DATE            NOT NULL,
    NextMaintenanceDate   DATE            NOT NULL,
    MaintenanceType       VARCHAR2(50),
    Description           VARCHAR2(500),
    Cost                  NUMBER(10,2),
    MaintenanceStatus     VARCHAR2(20)    DEFAULT 'Scheduled',
    CONSTRAINT fk_maintenance_vehicle FOREIGN KEY (VehicleID) REFERENCES VEHICLE(VehicleID)
);

------------------------------------------------------------------------------------------------------------------------



