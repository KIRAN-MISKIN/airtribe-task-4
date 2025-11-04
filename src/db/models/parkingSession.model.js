const mongoose = require('mongoose');
const { Schema } = mongoose;

const ParkingSessionSchema = new Schema({
  vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
  licensePlate: { type: String, required: true, index: true },
  parkingLotId: { type: Schema.Types.ObjectId, ref: 'ParkingLot', required: true },
  floorId: { type: Schema.Types.ObjectId, ref: 'Floor' },
  spotId: { type: Schema.Types.ObjectId, ref: 'Spot', required: true },
  entryAt: { type: Date, required: true, default: Date.now },
  exitAt: { type: Date },
  fee: { type: Number, default: 0 },
  status: { type: String, enum: ['active', 'completed'], default: 'active' },
  paymentStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('ParkingSession', ParkingSessionSchema);
