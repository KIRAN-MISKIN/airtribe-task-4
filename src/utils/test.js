const parkingSpot = require('../db/models/parkingSpot.model')

const createParkingSpot = async(payload)=>{
try{
    const spot = await parkingSpot.create(payload)
    return spot
} catch(err){
    console.error('Error creating parking spot:', err);
}
}

module.exports = {createParkingSpot}