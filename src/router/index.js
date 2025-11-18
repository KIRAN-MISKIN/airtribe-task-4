const express = require('express');
const router = express.Router();

router.post('/parkinglots', require('../controller/parkingLot.controller').createParkingLot);
router.post('/parkingfloors', require('../controller/parkingFloor.controller').createParkingFloor);
router.post('/parkingspots', require('../controller/parkingSpot.controller').createParkingSpot);
router.post('/vechiles', require('../controller/vehicle.controller').parkVehicle);
router.put('/vechiles/:ticketId', require('../controller/vehicle.controller').unparkVehicle);
router.get('/vechiles/:ticketId', require('../controller/vehicle.controller').getParkingTicketDetails);
router.get('/vechiles', require('../controller/vehicle.controller').getParkedDetails)
// Rate configuration for parking lots
router.post('/rateconfigs', require('../controller/rateConfig.controller').createRateConfig);
router.get('/rateconfigs/:parkingLotId', require('../controller/rateConfig.controller').getRateConfigByParkingLot);
router.put('/rateconfigs/:id', require('../controller/rateConfig.controller').updateRateConfig);
router.delete('/rateconfigs/:id', require('../controller/rateConfig.controller').deleteRateConfig);

module.exports = router;