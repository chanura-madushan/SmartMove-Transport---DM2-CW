const dbs = db.getSiblingDB("smartmove_transport");
print("1. Reviews for Route 1");
dbs.reviewsFeedback.find({routeId:1},{_id:0}).sort({createdAt:-1}).forEach(printjson);

print("2. Highest-rated vehicles");
dbs.reviewsFeedback.aggregate([{$group:{_id:"$vehicleId",averageRating:{$avg:"$rating"},reviewCount:{$sum:1}}},{$sort:{averageRating:-1,reviewCount:-1}}]).forEach(printjson);

print("3. Highest-rated drivers");
dbs.reviewsFeedback.aggregate([{$group:{_id:"$driverId",averageRating:{$avg:"$rating"},reviewCount:{$sum:1}}},{$sort:{averageRating:-1,reviewCount:-1}}]).forEach(printjson);

print("4. Search feedback using keyword: clean");
dbs.reviewsFeedback.find({$text:{$search:"clean"}},{_id:0,passengerId:1,routeId:1,rating:1,comment:1}).forEach(printjson);

print("5. Vehicle documents and multimedia");
dbs.vehicleDocuments.find({},{_id:0}).forEach(printjson);
dbs.tripMedia.find({},{_id:0}).sort({uploadedAt:-1}).forEach(printjson);