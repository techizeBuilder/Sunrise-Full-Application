import mongoose from 'mongoose';

const productDailySummarySchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Item',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  
  // Manual Input Fields
  qtyPerBatch: {
    type: Number,
    default: 0,
    min: 0
  },
  packing: {
    type: Number,
    default: 0,
    min: 0
  },
  physicalStock: {
    type: Number,
    default: 0,
    min: 0
  },
  batchAdjusted: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Auto-Calculated Fields
  totalIndent: {
    type: Number,
    default: 0,
    min: 0
  },
  productionFinalBatches: {
    type: Number,
    default: 0
  },
  toBeProducedDay: {
    type: Number,
    default: 0
  },
  toBeProducedBatches: {
    type: Number,
    default: 0
  },
  expiryShortage: {
    type: Number,
    default: 0
  },
  balanceFinalBatches: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
productDailySummarySchema.index({ date: 1, companyId: 1, productId: 1 }, { unique: true });
productDailySummarySchema.index({ companyId: 1, date: 1 });
productDailySummarySchema.index({ productId: 1, date: 1 });

// Helper method to calculate formulas
productDailySummarySchema.methods.calculateFormulas = function() {
  // productionFinalBatches = batchAdjusted * qtyPerBatch
  this.productionFinalBatches = Math.round((this.batchAdjusted * this.qtyPerBatch) * 100) / 100;
  
  // toBeProducedDay = totalIndent - physicalStock
  this.toBeProducedDay = Math.round((this.totalIndent - this.physicalStock) * 100) / 100;
  
  // toBeProducedBatches = qtyPerBatch > 0 ? toBeProducedDay / qtyPerBatch : 0
  this.toBeProducedBatches = this.qtyPerBatch > 0 
    ? Math.round((this.toBeProducedDay / this.qtyPerBatch) * 100) / 100 
    : 0;
  
  // expiryShortage = productionFinalBatches - toBeProducedDay
  this.expiryShortage = Math.round((this.productionFinalBatches - this.toBeProducedDay) * 100) / 100;
  
  // balanceFinalBatches = productionFinalBatches - packing
  this.balanceFinalBatches = Math.round((this.productionFinalBatches - this.packing) * 100) / 100;
  
  return this;
};

export default mongoose.model('ProductDailySummary', productDailySummarySchema);