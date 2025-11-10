import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
  supplierCode: {
    type: String,
    required: true,
    unique: true
  },
  supplierName: {
    type: String,
    required: true
  },
  contactPerson: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true
  },
  alternatePhone: {
    type: String
  },
  address: {
    street: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    zipCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      required: true,
      default: 'India'
    }
  },
  gstNumber: {
    type: String
  },
  panNumber: {
    type: String
  },
  bankDetails: {
    accountNumber: String,
    accountName: String,
    bankName: String,
    branchName: String,
    ifscCode: String
  },
  paymentTerms: {
    type: String,
    default: 'Net 30'
  },
  unit: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  supplierType: {
    type: String,
    enum: ['Raw Material', 'Services', 'Equipment', 'Consumables'],
    default: 'Raw Material'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

supplierSchema.pre('save', function(next) {
  if (!this.supplierCode) {
    this.supplierCode = `SUPP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
  next();
});

export default mongoose.model('Supplier', supplierSchema);
