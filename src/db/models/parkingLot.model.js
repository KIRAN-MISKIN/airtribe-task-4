const mongoose = require('mongoose');

const { Schema } = mongoose;

const ParkingLotSchema = new Schema({
  name: { type: String, required: true },
  address: String,
  floors: { type: Number, default: 1 },
}, { timestamps: true });

module.exports = mongoose.model('ParkingLot', ParkingLotSchema);