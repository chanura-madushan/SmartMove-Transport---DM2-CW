--------------------------------------------------------------------------------
-- VEHICLE TABLE--

CREATE TABLE VEHICLE(
    VehicleID NUMBER GENERATED ALWAYS AS IDENTITY CONSTRAINT PK_VEHICLE PRIMARY KEY,
    RegistrationNo VARCHAR2(20) NOT NULL CONSTRAINT UQ_VEHICLE_REGISTRATION UNIQUE,
    VehicleType VARCHAR2(30) NOT NULL,
    Capacity NUMBER NOT NULL CONSTRAINT CK_VEHICLE_CAPACITY CHECK(Capacity>0),
    VehicleStatus VARCHAR2(20) DEFAULT 'Available' NOT NULL CONSTRAINT CK_VEHICLE_STATUS CHECK(VehicleStatus IN('Available','In Service','Inactive'))
);

--------------------------------------------------------------------------------
-- DRIVER TABLE--

CREATE TABLE DRIVER(
    DriverID NUMBER GENERATED ALWAYS AS IDENTITY CONSTRAINT PK_DRIVER PRIMARY KEY,
    FirstName VARCHAR2(50) NOT NULL,
    LastName VARCHAR2(50) NOT NULL,
    LicenseNo VARCHAR2(30) NOT NULL CONSTRAINT UQ_DRIVER_LICENSE UNIQUE,
    Phone VARCHAR2(20),
    DriverStatus VARCHAR2(20) DEFAULT 'Available' NOT NULL CONSTRAINT CK_DRIVER_STATUS CHECK(DriverStatus IN('Available','On Trip','Inactive'))
);

--------------------------------------------------------------------------------
-- ROUTE TABLE--

CREATE TABLE ROUTE(
    RouteID NUMBER GENERATED ALWAYS AS IDENTITY CONSTRAINT PK_ROUTE PRIMARY KEY,
    StartLocation VARCHAR2(100) NOT NULL,
    EndLocation VARCHAR2(100) NOT NULL,
    DistanceKM NUMBER(8,2) CONSTRAINT CK_ROUTE_DISTANCE CHECK(DistanceKM>0),
    RouteStatus VARCHAR2(20) DEFAULT 'Active' NOT NULL CONSTRAINT CK_ROUTE_STATUS CHECK(RouteStatus IN('Active','Inactive'))
);

--------------------------------------------------------------------------------
-- PASSENGER TABLE--

CREATE TABLE PASSENGER(
    PassengerID NUMBER GENERATED ALWAYS AS IDENTITY CONSTRAINT PK_PASSENGER PRIMARY KEY,
    FirstName VARCHAR2(50) NOT NULL,
    LastName VARCHAR2(50) NOT NULL,
    Phone VARCHAR2(20),
    Email VARCHAR2(100) CONSTRAINT UQ_PASSENGER_EMAIL UNIQUE
);

--------------------------------------------------------------------------------
-- TRIP TABLE--

CREATE TABLE TRIP(
    TripID NUMBER GENERATED ALWAYS AS IDENTITY CONSTRAINT PK_TRIP PRIMARY KEY,
    VehicleID NUMBER NOT NULL,
    DriverID NUMBER NOT NULL,
    RouteID NUMBER NOT NULL,
    TripDate DATE NOT NULL,
    DepartureTime TIMESTAMP NOT NULL,
    ArrivalTime TIMESTAMP,
    TripStatus VARCHAR2(20) DEFAULT 'Scheduled' NOT NULL CONSTRAINT CK_TRIP_STATUS CHECK(TripStatus IN('Scheduled','Departed','Completed','Cancelled')),
    CONSTRAINT FK_TRIP_VEHICLE FOREIGN KEY(VehicleID) REFERENCES VEHICLE(VehicleID),
    CONSTRAINT FK_TRIP_DRIVER FOREIGN KEY(DriverID) REFERENCES DRIVER(DriverID),
    CONSTRAINT FK_TRIP_ROUTE FOREIGN KEY(RouteID) REFERENCES ROUTE(RouteID),
    CONSTRAINT CK_TRIP_TIME CHECK(ArrivalTime IS NULL OR ArrivalTime>=DepartureTime)
);

--------------------------------------------------------------------------------
-- BOOKING TABLE--

CREATE TABLE BOOKING(
    BookingID NUMBER GENERATED ALWAYS AS IDENTITY CONSTRAINT PK_BOOKING PRIMARY KEY,
    PassengerID NUMBER NOT NULL,
    TripID NUMBER NOT NULL,
    BookingDate DATE DEFAULT SYSDATE NOT NULL,
    SeatNumber NUMBER NOT NULL CONSTRAINT CK_BOOKING_SEAT CHECK(SeatNumber>0),
    Fare NUMBER(10,2) NOT NULL CONSTRAINT CK_BOOKING_FARE CHECK(Fare>=0),
    BookingStatus VARCHAR2(20) DEFAULT 'Confirmed' NOT NULL CONSTRAINT CK_BOOKING_STATUS CHECK(BookingStatus IN('Confirmed','Cancelled','Completed')),
    CONSTRAINT FK_BOOKING_PASSENGER FOREIGN KEY(PassengerID) REFERENCES PASSENGER(PassengerID),
    CONSTRAINT FK_BOOKING_TRIP FOREIGN KEY(TripID) REFERENCES TRIP(TripID),
    CONSTRAINT UQ_BOOKING_SEAT UNIQUE(TripID,SeatNumber)
);

--------------------------------------------------------------------------------
-- PAYMENT TABLE--

CREATE TABLE PAYMENT(
    PaymentID NUMBER GENERATED ALWAYS AS IDENTITY CONSTRAINT PK_PAYMENT PRIMARY KEY,
    BookingID NUMBER NOT NULL,
    PaymentDate DATE DEFAULT SYSDATE NOT NULL,
    Amount NUMBER(10,2) NOT NULL CONSTRAINT CK_PAYMENT_AMOUNT CHECK(Amount>=0),
    PaymentMethod VARCHAR2(30) NOT NULL,
    PaymentStatus VARCHAR2(20) DEFAULT 'Paid' NOT NULL CONSTRAINT CK_PAYMENT_STATUS CHECK(PaymentStatus IN('Paid','Pending','Failed','Refunded')),
    CONSTRAINT FK_PAYMENT_BOOKING FOREIGN KEY(BookingID) REFERENCES BOOKING(BookingID),
    CONSTRAINT UQ_PAYMENT_BOOKING UNIQUE(BookingID)
);

--------------------------------------------------------------------------------
-- FEEDBACK TABLE--

CREATE TABLE FEEDBACK(
    FeedbackID NUMBER GENERATED ALWAYS AS IDENTITY CONSTRAINT PK_FEEDBACK PRIMARY KEY,
    PassengerID NUMBER NOT NULL,
    TripID NUMBER NOT NULL,
    Rating NUMBER(1) NOT NULL CONSTRAINT CK_FEEDBACK_RATING CHECK(Rating BETWEEN 1 AND 5),
    CommentText VARCHAR2(1000),
    FeedbackDate DATE DEFAULT SYSDATE NOT NULL,
    CONSTRAINT FK_FEEDBACK_PASSENGER FOREIGN KEY(PassengerID) REFERENCES PASSENGER(PassengerID),
    CONSTRAINT FK_FEEDBACK_TRIP FOREIGN KEY(TripID) REFERENCES TRIP(TripID),
    CONSTRAINT UQ_FEEDBACK_PASSENGER_TRIP UNIQUE(PassengerID,TripID)
);

--------------------------------------------------------------------------------
-- MAINTENANCE TABLE--

CREATE TABLE MAINTENANCE(
    MaintenanceID NUMBER GENERATED ALWAYS AS IDENTITY CONSTRAINT PK_MAINTENANCE PRIMARY KEY,
    VehicleID NUMBER NOT NULL,
    MaintenanceDate DATE NOT NULL,
    NextMaintenanceDate DATE NOT NULL,
    MaintenanceType VARCHAR2(50),
    Description VARCHAR2(500),
    Cost NUMBER(10,2) CONSTRAINT CK_MAINTENANCE_COST CHECK(Cost>=0),
    MaintenanceStatus VARCHAR2(20) DEFAULT 'Scheduled' NOT NULL CONSTRAINT CK_MAINTENANCE_STATUS CHECK(MaintenanceStatus IN('Scheduled','In Progress','Completed','Cancelled')),
    CONSTRAINT FK_MAINTENANCE_VEHICLE FOREIGN KEY(VehicleID) REFERENCES VEHICLE(VehicleID),
    CONSTRAINT CK_MAINTENANCE_DATES CHECK(NextMaintenanceDate>=MaintenanceDate)
);
