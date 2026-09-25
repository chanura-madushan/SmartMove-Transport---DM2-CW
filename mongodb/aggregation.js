const dbs = db.getSiblingDB("smartmove_transport");
print("Average rating by route");
dbs.reviewsFeedback.aggregate([{$group:{_id:"$routeId",averageRating:{$avg:"$rating"},totalReviews:{$sum:1}}},{$sort:{averageRating:-1}}]).forEach(printjson);

print("Feedback keyword frequency");
dbs.reviewsFeedback.aggregate([{$unwind:"$keywords"},{$group:{_id:"$keywords",occurrences:{$sum:1}}},{$sort:{occurrences:-1,_id:1}}]).forEach(printjson);

print("Media count by trip");
dbs.tripMedia.aggregate([{$group:{_id:"$tripId",mediaCount:{$sum:1},mediaTypes:{$addToSet:"$mediaType"}}},{$sort:{mediaCount:-1}}]).forEach(printjson);