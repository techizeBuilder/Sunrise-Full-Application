import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['order', 'inventory', 'customer', 'general', 'system'],
    default: 'general'
  },
  icon: {
    type: String,
    default: 'bell'
  },
  targetRole: {
    type: String,
    enum: ['Super User', 'Sales', 'all'],
    default: 'all'
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  isRead: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Index for efficient querying
notificationSchema.index({ targetRole: 1, createdAt: -1 });
notificationSchema.index({ targetUserId: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for checking if notification is read by specific user
notificationSchema.methods.isReadByUser = function(userId) {
  return this.isRead.some(read => read.userId.toString() === userId.toString());
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = async function(userId, userRole) {
  const query = {
    $and: [
      {
        $or: [
          { targetRole: 'all' },
          { targetRole: userRole },
          { targetUserId: userId }
        ]
      },
      {
        'isRead.userId': { $ne: userId }
      }
    ]
  };
  
  return await this.countDocuments(query);
};

export default mongoose.model('Notification', notificationSchema);