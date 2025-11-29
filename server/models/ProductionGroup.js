import mongoose from 'mongoose';

const ProductionGroupSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item'
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  // Production shift timing fields
  mouldingTime: {
    type: Date,
    default: null
  },
  unloadingTime: {
    type: Date,
    default: null
  },
  productionLoss: {
    type: Number,
    default: 0,
    min: 0
  },
  metadata: {
    totalItems: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true
});

// Compound index for company and name uniqueness
ProductionGroupSchema.index({ company: 1, name: 1 }, { unique: true });

// Index for efficient querying
ProductionGroupSchema.index({ company: 1, isActive: 1 });
ProductionGroupSchema.index({ createdBy: 1 });

// Pre-save middleware to update metadata
ProductionGroupSchema.pre('save', function(next) {
  this.metadata.totalItems = this.items.length;
  this.metadata.lastUpdated = new Date();
  next();
});

// Virtual for populated items with images
ProductionGroupSchema.virtual('itemsWithDetails', {
  ref: 'Inventory',
  localField: 'items',
  foreignField: '_id'
});

export default mongoose.model('ProductionGroup', ProductionGroupSchema);