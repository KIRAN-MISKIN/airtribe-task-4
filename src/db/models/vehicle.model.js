const mongoose = require('mongoose');
const { Schema } = mongoose;

// Vehicle types: motorcycle, small, medium, heavy
const vehicleTypes = ['motorcycle', 'small', 'medium', 'heavy'];

const VehicleSchema = new Schema({
  licensePlate: { type: String, required: true, unique: true, index: true },
  ownerName: String,
  vehicleType: { type: String, enum: vehicleTypes, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', VehicleSchema);
