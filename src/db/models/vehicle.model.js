const mongoose = require('mongoose');
const { Schema } = mongoose;
const { vehicleTypes } = require('../../config');

const VehicleSchema = new Schema({
  licensePlate: { type: String, required: true, unique: true, index: true },
  ownerName: String,
  vehicleType: { type: String, enum: vehicleTypes, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', VehicleSchema);
