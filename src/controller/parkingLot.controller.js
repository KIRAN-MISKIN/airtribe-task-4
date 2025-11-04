const {ParkingLot} = require('../db');

exports.createParkingLot = async (req, res) => {
  try {
    const {name, address, floors} = req.body;
    if (!name || !address || !floors) {
      return res.status(400).json({ error: 'Name, address, and floors are required.' });
    }
    const checkExisting = await ParkingLot.findOne({ name });
    if (checkExisting) {
      return res.status(400).json({ error: 'Parking lot with this name already exists.' });
    }
    const newParkingLot = await ParkingLot.create({ name, address, floors });
    res.status(201).json(newParkingLot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
