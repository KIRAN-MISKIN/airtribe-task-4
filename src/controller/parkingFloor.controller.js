const { ParkingFloor, ParkingLot } = require('../db');

exports.createParkingFloor = async (req, res) => {
	try {
		const { parkingLotId, floorNumber, name, capacities } = req.body;
		if (!parkingLotId || floorNumber === undefined) {
			return res.status(400).json({ error: 'parkingLotId and floorNumber are required.' });
		}

		const lot = await ParkingLot.findById(parkingLotId);
		if (!lot) return res.status(404).json({ error: 'Parking lot not found.' });

		const exists = await ParkingFloor.findOne({ parkingLotId, floorNumber });
		if (exists) return res.status(400).json({ error: 'Floor with this number already exists for the parking lot.' });

		const floor = await ParkingFloor.create({ parkingLotId, floorNumber, name, capacities });
		res.status(201).json(floor);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
