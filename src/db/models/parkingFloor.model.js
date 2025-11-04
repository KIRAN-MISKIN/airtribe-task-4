const mongoose = require('mongoose');
const { Schema } = mongoose;

const FloorSchema = new Schema({
  parkingLotId: { type: Schema.Types.ObjectId, ref: 'ParkingLot', required: true },
  floorNumber: { type: Number, required: true },
  name: String,
  capacities: { // optional capacity hints per type
    motorcycle: { type: Number, default: 0 },
    small: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    heavy: { type: Number, default: 0 },
  }
}, { timestamps: true });

module.exports = mongoose.model('ParkingFloor', FloorSchema);