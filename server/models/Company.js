import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  unitName: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  mobile: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty values
        return /^[\+]?[1-9][\d]{0,15}$/.test(v.replace(/[\s\-\(\)]/g, ''));
      },
      message: 'Invalid mobile number format'
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow empty values
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
  },
  address: {
    type: String,
    trim: true
  },
  locationPin: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[1-9][0-9]{5}$/.test(v);
      },
      message: 'Invalid PIN code format'
    }
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
  fssai: {
    type: String,
    trim: true
  },
  gst: {
    type: String,
    trim: true
  },
  orderCutoffTime: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  companyType: {
    type: String,
    enum: ['Main Branch', 'Branch', 'Manufacturing Unit', 'Distribution Center'],
    default: 'Main Branch'
  },
  // Location specific data for better organization
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    },
    address: String,
    landmark: String
  },
  businessHours: {
    opening: {
      type: String,
      default: '09:00'
    },
    closing: {
      type: String,
      default: '18:00'
    }
  }
}, {
  timestamps: true
});

// Create indexes for better search performance
companySchema.index({ unitName: 1 });
companySchema.index({ city: 1 });
companySchema.index({ name: 1 });
companySchema.index({ gst: 1 });
companySchema.index({ isActive: 1 });
companySchema.index({ companyType: 1 });
companySchema.index({ 'location': '2dsphere' });

// Compound indexes for common queries
companySchema.index({ city: 1, isActive: 1 });
companySchema.index({ unitName: 1, city: 1 });

// Virtual for full address
companySchema.virtual('fullAddress').get(function() {
  return `${this.address}, ${this.city}, ${this.state} - ${this.locationPin}`;
});

// Virtual for display name with location
companySchema.virtual('displayName').get(function() {
  return `${this.name} - ${this.city}`;
});

// Ensure virtuals are included when converting to JSON
companySchema.set('toJSON', { virtuals: true });
companySchema.set('toObject', { virtuals: true });

export const Company = mongoose.model('Company', companySchema);