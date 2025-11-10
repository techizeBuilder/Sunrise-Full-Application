import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  unitName: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  locationPin: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true,
    default: 'India'
  },
  gst: {
    type: String,
    required: true,
    trim: true,
    uppercase: true
  },
  fssai: {
    type: String,
    trim: true
  },
  orderCutoffTime: {
    type: String,
    required: true,
    default: '18:00'
  }
}, {
  timestamps: true
});

// Create indexes for better search performance
companySchema.index({ unitName: 1 });
companySchema.index({ city: 1 });
companySchema.index({ name: 1 });
companySchema.index({ gst: 1 });

export const Company = mongoose.model('Company', companySchema);