const mongoose = require('mongoose');
const { Schema } = mongoose;
const { vehicleTypes } = require('../../config');

const SpotSchema = new Schema({
  parkingLotId: { type: Schema.Types.ObjectId, ref: 'ParkingLot', required: true },
  floorId: { type: Schema.Types.ObjectId, ref: 'Floor', required: true },
  spotNumber: { type: String, required: true }, // e.g., F1-001
  supportedTypes: [{ type: String, enum: vehicleTypes, required: true }],
  isOccupied: { type: Boolean, default: false },
  currentSessionId: { type: Schema.Types.ObjectId, ref: 'ParkingSession', default: null },
  metadata: Schema.Types.Mixed,
}, { timestamps: true });

SpotSchema.index({ parkingLotId: 1, spotNumber: 1 }, { unique: true });

module.exports = mongoose.model('ParkingSpot', SpotSchema);
