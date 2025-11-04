const express = require('express');
const router = express.Router();

router.post('/parkinglots', require('../controller/parkingLot.controller').createParkingLot);

module.exports = router;