import mongoose from 'mongoose';
import { DISPATCH_STATUS } from '../../shared/schema.js';

const dispatchItemSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  batchNumber: {
    type: String
  }
});

const dispatchSchema = new mongoose.Schema({
  dispatchNumber: {
    type: String,
    required: true,
    unique: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  items: [dispatchItemSchema],
  status: {
    type: String,
    enum: Object.values(DISPATCH_STATUS),
    default: DISPATCH_STATUS.PENDING
  },
  dispatchDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date,
    required: true
  },
  actualDeliveryDate: {
    type: Date
  },
  transporterName: {
    type: String
  },
  vehicleNumber: {
    type: String
  },
  driverName: {
    type: String
  },
  driverContact: {
    type: String
  },
  trackingNumber: {
    type: String
  },
  unit: {
    type: String,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

dispatchSchema.pre('save', function(next) {
  if (!this.dispatchNumber) {
    this.dispatchNumber = `DISP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

export default mongoose.model('Dispatch', dispatchSchema);
