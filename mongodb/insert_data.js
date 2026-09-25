const dbs = db.getSiblingDB("smartmove_transport");
dbs.vehicleDocuments.deleteMany({});
dbs.reviewsFeedback.deleteMany({});
dbs.announcements.deleteMany({});
dbs.tripMedia.deleteMany({});

dbs.vehicleDocuments.insertMany([
{vehicleId:1,registrationNo:"SP-CA-1234",documents:[{documentType:"Revenue License",fileName:"revenue-license-1234.pdf",fileUrl:"https://example.com/revenue-license-1234.pdf",expiryDate:ISODate("2027-06-30")},{documentType:"Insurance",fileName:"insurance-1234.pdf",fileUrl:"https://example.com/insurance-1234.pdf",expiryDate:ISODate("2027-03-31")}],images:["vehicle-1234-front.jpg","vehicle-1234-side.jpg"],updatedAt:ISODate("2026-09-20")},
{vehicleId:2,registrationNo:"SP-CB-5678",documents:[{documentType:"Revenue License",fileName:"revenue-license-5678.pdf",fileUrl:"https://example.com/revenue-license-5678.pdf",expiryDate:ISODate("2027-08-31")}],images:["vehicle-5678-front.jpg"],updatedAt:ISODate("2026-09-20")},
{vehicleId:3,registrationNo:"SP-CC-9012",documents:[{documentType:"Insurance",fileName:"insurance-9012.pdf",fileUrl:"https://example.com/insurance-9012.pdf",expiryDate:ISODate("2026-12-31")}],images:["vehicle-9012-front.jpg"],updatedAt:ISODate("2026-09-20")}
]);

dbs.reviewsFeedback.insertMany([
{passengerId:1,tripId:1,routeId:1,vehicleId:1,driverId:1,rating:5,comment:"Clean vehicle and smooth trip.",keywords:["clean","smooth"],createdAt:ISODate("2026-09-10")},
{passengerId:2,tripId:2,routeId:1,vehicleId:2,driverId:2,rating:4,comment:"Good service and comfortable seats.",keywords:["good","comfortable"],createdAt:ISODate("2026-09-11")},
{passengerId:3,tripId:3,routeId:2,vehicleId:3,driverId:1,rating:3,comment:"Trip was on time but vehicle needs cleaning.",keywords:["on time","cleaning"],createdAt:ISODate("2026-09-12")},
{passengerId:4,tripId:4,routeId:2,vehicleId:1,driverId:1,rating:5,comment:"Excellent driver and clean vehicle.",keywords:["excellent","clean"],createdAt:ISODate("2026-09-13")},
{passengerId:5,tripId:5,routeId:3,vehicleId:2,driverId:2,rating:2,comment:"Vehicle was late and uncomfortable.",keywords:["late","uncomfortable"],createdAt:ISODate("2026-09-14")}
]);

dbs.announcements.insertMany([
{title:"Route 1 Service Update",message:"Morning services operate according to the normal timetable.",type:"Service Update",routeId:1,publishedAt:ISODate("2026-09-20T07:00:00Z"),active:true},
{title:"Weekend Schedule",message:"Weekend trip schedules are available for booking.",type:"Schedule",publishedAt:ISODate("2026-09-21T08:00:00Z"),active:true},
{title:"Maintenance Notice",message:"Some vehicles have scheduled maintenance this week.",type:"Maintenance",publishedAt:ISODate("2026-09-22T09:00:00Z"),active:true}
]);

dbs.tripMedia.insertMany([
{tripId:1,mediaType:"image",url:"trip-1.jpg",caption:"Vehicle before departure",uploadedAt:ISODate("2026-09-10T06:30:00Z")},
{tripId:2,mediaType:"video",url:"trip-2.mp4",caption:"Route information video",uploadedAt:ISODate("2026-09-11T07:00:00Z")},
{tripId:3,mediaType:"image",url:"trip-3.jpg",caption:"Passenger information board",uploadedAt:ISODate("2026-09-12T07:15:00Z")}
]);
print("Sample MongoDB data inserted.");