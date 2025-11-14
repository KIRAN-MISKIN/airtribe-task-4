const { ParkingSpot, ParkingFloor, ParkingLot } = require('../db');
const { vehicleTypes } = require('../config');

exports.createParkingSpot = async (req, res) => {
	try {
		const { parkingLotId, floorId, spotNumber, supportedTypes, metadata } = req.body;
		if (!parkingLotId || !floorId || !spotNumber || !supportedTypes) {
			return res.status(400).json({ error: 'parkingLotId, floorId, spotNumber and supportedTypes are required.' });
		}

		// validate supported types
		const invalid = supportedTypes.find(t => !vehicleTypes.includes(t));
		if (invalid) return res.status(400).json({ error: `Invalid vehicle type in supportedTypes: ${invalid}` });

		const floor = await ParkingFloor.findById(floorId);
		if (!floor) return res.status(404).json({ error: 'Floor not found.' });

		const lot = await ParkingLot.findById(parkingLotId);
		if (!lot) return res.status(404).json({ error: 'Parking lot not found.' });

		// unique index on parkingLotId + spotNumber will protect duplicates
		const spot = await ParkingSpot.create({ parkingLotId, floorId, spotNumber, supportedTypes, metadata });
		res.status(201).json(spot);
	} catch (error) {
		if (error.code === 11000) return res.status(400).json({ error: 'Spot number already exists for this parking lot.' });
		res.status(500).json({ error: error.message });
	}
};
