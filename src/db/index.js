const DBCONNECTION = require('./db');
const ParkingFloor = require('./models/parkingFloor.model')
const ParkingLot = require('./models/parkingLot.model')
const ParkingSession = require('./models/parkingSession.model')
const ParkingSpot = require('./models/parkingSpot.model')
const RateConfig = require('./models/rateConfig.model')
const Vehicle = require('./models/vehicle.model')

module.exports = {
    DBCONNECTION,
    ParkingFloor,
    ParkingLot,
    ParkingSession,
    ParkingSpot,
    RateConfig,
    Vehicle
};