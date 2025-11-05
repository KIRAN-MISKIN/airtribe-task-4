const mongoose = require('mongoose');
const { ParkingSpot, ParkingSession, Vehicle, RateConfig, ParkingLot } = require('../db');
const { vehicleTypes } = require('../config');

function calculateFee(entryAt, exitAt, vehicleType, rateConfig) {
	// default fallback if rateConfig missing
	const defaultRate = { unitMinutes: 60, pricePerUnit: 10 };
	let cfg = defaultRate;
	if (rateConfig && rateConfig.rates && rateConfig.rates[vehicleType]) {
		cfg = rateConfig.rates[vehicleType];
	}

	const grace = (rateConfig && rateConfig.graceMinutes) ? rateConfig.graceMinutes : 0;
	const rounding = (rateConfig && rateConfig.rounding) ? rateConfig.rounding : 'ceil';

	let minutes = Math.max(0, (exitAt - entryAt) / 60000);
	minutes = Math.max(0, minutes - grace);

	// rounding of the minutes
	if (rounding === 'ceil') minutes = Math.ceil(minutes);
	else if (rounding === 'floor') minutes = Math.floor(minutes);
	else minutes = Math.round(minutes);

	if (minutes <= 0) return 0;

	const units = Math.ceil(minutes / cfg.unitMinutes);
	const fee = units * cfg.pricePerUnit;
	return fee;
}

exports.parkVehicle = async (req, res) => {
	let sessionId;
	try {
		const { licensePlate, vehicleType, parkingLotId: providedLotId, ownerName } = req.body;
		if (!licensePlate || !vehicleType) {
			return res.status(400).json({ error: 'licensePlate and vehicleType are required.' });
		}
		if (!vehicleTypes.includes(vehicleType)) return res.status(400).json({ error: 'Invalid vehicleType.' });

		// Determine parking lot: if provided use it, otherwise auto-select the single parking lot
		let lot = null;
		if (providedLotId) {
			lot = await ParkingLot.findById(providedLotId);
			if (!lot) return res.status(404).json({ error: 'Parking lot not found.' });
		} else {
			lot = await ParkingLot.findOne();
			if (!lot) return res.status(404).json({ error: 'No parking lot configured. Please create a parking lot first.' });
		}

		sessionId = new mongoose.Types.ObjectId();

		// Reserve a spot atomically by marking isOccupied true and setting a temporary currentSessionId
		const spot = await ParkingSpot.findOneAndUpdate(
			{ parkingLotId: lot._id, supportedTypes: vehicleType, isOccupied: false },
			{ $set: { isOccupied: true, currentSessionId: sessionId } },
			{ new: true }
		);

		if (!spot) return res.status(404).json({ error: 'No available spot for this vehicle type.' });

		// upsert vehicle record
		const vehicle = await Vehicle.findOneAndUpdate(
			{ licensePlate },
			{ $setOnInsert: { licensePlate, vehicleType, ownerName } },
			{ upsert: true, new: true, setDefaultsOnInsert: true }
		);

		// create parking session with the pre-reserved id
		const session = await ParkingSession.create({
			_id: sessionId,
			vehicleId: vehicle._id,
			licensePlate,
			parkingLotId: lot._id,
			floorId: spot.floorId,
			spotId: spot._id,
			entryAt: new Date(),
			status: 'active',
			paymentStatus: 'pending'
		});

		res.status(201).json({
			ticketId: session._id,
			licensePlate: session.licensePlate,
			spotId: spot._id,
			spotNumber: spot.spotNumber,
			floorId: spot.floorId,
			entryAt: session.entryAt
		});
	} catch (error) {
		// if something goes wrong, try to rollback reservation (best-effort)
		try {
			if (sessionId) {
				await ParkingSpot.updateOne({ currentSessionId: sessionId }, { $set: { isOccupied: false }, $unset: { currentSessionId: '' } });
			}
		} catch (e) {
			// ignore rollback errors
		}
		res.status(500).json({ error: error.message });
	}
};

exports.unparkVehicle = async (req, res) => {
	try {
		const { ticketId } = req.params;
		if (!ticketId) return res.status(400).json({ error: 'ticketId is required in params.' });

		const session = await ParkingSession.findById(ticketId);
		if (!session) return res.status(404).json({ error: 'Parking session not found.' });
		if (session.status !== 'active') return res.status(400).json({ error: 'Parking session already completed.' });

		const exitAt = new Date();

		const rateConfig = await RateConfig.findOne({ parkingLotId: session.parkingLotId });

		const fee = calculateFee(session.entryAt, exitAt, session.vehicleType || (await Vehicle.findById(session.vehicleId)).vehicleType, rateConfig);

		session.exitAt = exitAt;
		session.fee = fee;
		session.status = 'completed';
		session.paymentStatus = 'pending';
		await session.save();

		// free spot only if it is still reserved by this session
		await ParkingSpot.updateOne({ _id: session.spotId, currentSessionId: session._id }, { $set: { isOccupied: false }, $unset: { currentSessionId: '' } });

		res.json({ ticketId: session._id, exitAt: session.exitAt, fee });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

exports.getParkingTicketDetails = async (req, res) => {
	try {
		const { ticketId } = req.params;
		if (!ticketId) return res.status(400).json({ error: 'ticketId is required in params.' });

		const session = await ParkingSession.findById(ticketId)
			.populate('vehicleId')
			.populate('spotId')
			.populate('floorId')
			.populate('parkingLotId');

		if (!session) return res.status(404).json({ error: 'Parking session not found.' });

		res.json(session);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};
