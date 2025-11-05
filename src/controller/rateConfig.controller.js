const { RateConfig, ParkingLot } = require('../db');

exports.createRateConfig = async (req, res) => {
  try {
    const { parkingLotId, rates, graceMinutes, rounding } = req.body;
    if (!parkingLotId) return res.status(400).json({ error: 'parkingLotId is required.' });

    const lot = await ParkingLot.findById(parkingLotId);
    if (!lot) return res.status(404).json({ error: 'Parking lot not found.' });

    // Ensure not already exists
    const existing = await RateConfig.findOne({ parkingLotId });
    if (existing) return res.status(400).json({ error: 'RateConfig already exists for this parking lot.' });

    const cfg = await RateConfig.create({ parkingLotId, rates, graceMinutes, rounding });
    res.status(201).json(cfg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getRateConfigByParkingLot = async (req, res) => {
  try {
    const { parkingLotId } = req.params;
    if (!parkingLotId) return res.status(400).json({ error: 'parkingLotId param is required.' });

    const cfg = await RateConfig.findOne({ parkingLotId });
    if (!cfg) return res.status(404).json({ error: 'RateConfig not found for this parking lot.' });
    res.json(cfg);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateRateConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    const updated = await RateConfig.findByIdAndUpdate(id, payload, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ error: 'RateConfig not found.' });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteRateConfig = async (req, res) => {
  try {
    const { id } = req.params;
    const removed = await RateConfig.findByIdAndDelete(id);
    if (!removed) return res.status(404).json({ error: 'RateConfig not found.' });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
