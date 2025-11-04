const mongoose = require('mongoose');
const { Schema } = mongoose;

const RateConfigSchema = new Schema({
  parkingLotId: { type: Schema.Types.ObjectId, ref: 'ParkingLot', required: true, unique: true },
  rates: {
    motorcycle: { unitMinutes: { type: Number, default: 60 }, pricePerUnit: { type: Number, default: 5 } },
    small: { unitMinutes: { type: Number, default: 60 }, pricePerUnit: { type: Number, default: 10 } },
    medium: { unitMinutes: { type: Number, default: 60 }, pricePerUnit: { type: Number, default: 20 } },
    heavy: { unitMinutes: { type: Number, default: 60 }, pricePerUnit: { type: Number, default: 30 } },
  },
  graceMinutes: { type: Number, default: 0 },
  rounding: { type: String, enum: ['ceil', 'floor', 'minute'], default: 'ceil' },
}, { timestamps: true });

module.exports = mongoose.model('RateConfig', RateConfigSchema);
