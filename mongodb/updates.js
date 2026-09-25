const dbs = db.getSiblingDB("smartmove_transport");
dbs.vehicleDocuments.updateOne({vehicleId:1},{$set:{"documents.0.expiryDate":ISODate("2027-07-31"),updatedAt:new Date()},$push:{images:"vehicle-1234-interior.jpg"}});
dbs.announcements.updateMany({active:true,publishedAt:{$lt:new Date("2026-09-01")}},{$set:{active:false}});
const media=dbs.tripMedia.findOne({tripId:3});
if(media) dbs.tripMedia.deleteOne({_id:media._id});
print("MongoDB update and delete operations completed.");