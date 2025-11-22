import Notification from '../models/Notification.js';
import pusher from '../config/pusher.js';
import User from '../models/User.js';

class NotificationService {
  
  // Create and broadcast notification
  async createNotification({
    title,
    message,
    type = 'general',
    icon = 'bell',
    targetRole = 'all',
    targetUserId = null,
    targetUnit = null,
    targetCompanyId = null,
    data = {},
    priority = 'medium'
  }) {
    try {
      // Create notification in database
      const notification = new Notification({
        title,
        message,
        type,
        icon,
        targetRole,
        targetUserId,
        targetUnit,
        targetCompanyId,
        data,
        priority
      });

      await notification.save();

      // Prepare notification payload
      const notificationPayload = {
        id: notification._id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        icon: notification.icon,
        priority: notification.priority,
        data: notification.data,
        createdAt: notification.createdAt
      };

      // Broadcast to appropriate channels
      if (targetUserId) {
        // Send to specific user
        await pusher.trigger(`user-${targetUserId}`, 'notification', notificationPayload);
      } else {
        // Send to role-based channels with unit/company specificity
        if (targetRole === 'all') {
          await pusher.trigger('notifications-all', 'notification', notificationPayload);
        } else {
          const baseChannel = `notifications-${targetRole.toLowerCase().replace(' ', '-')}`;
          
          // Send to role-specific channel
          await pusher.trigger(baseChannel, 'notification', notificationPayload);
          
          // Send to unit-specific channel if unit is specified
          if (targetUnit) {
            await pusher.trigger(`${baseChannel}-unit-${targetUnit}`, 'notification', notificationPayload);
          }
          
          // Send to company-specific channel if company is specified
          if (targetCompanyId) {
            await pusher.trigger(`${baseChannel}-company-${targetCompanyId}`, 'notification', notificationPayload);
          }
        }
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notifications for a user
  async getUserNotifications(userId, userRole, userUnit = null, userCompanyId = null, { page = 1, limit = 20, unreadOnly = false } = {}) {
    try {
      const skip = (page - 1) * limit;
      
      let query = {
        $and: [
          {
            $or: [
              { targetRole: 'all' },
              { targetRole: userRole },
              { targetUserId: userId }
            ]
          }
        ]
      };

      // Apply unit and company filtering based on role
      if (userRole === 'Super Admin') {
        // Super Admin sees all notifications - no additional filtering
      } else if (userRole === 'Unit Head' || userRole === 'Unit Manager' || userRole === 'Sales' || 
                 userRole === 'Production' || userRole === 'Manufacturing' || userRole === 'Packing' || 
                 userRole === 'Dispatch' || userRole === 'Accounts') {
        
        // Unit-based roles should only see notifications for their unit/company or global ones
        const unitCompanyFilters = [];
        
        // Add unit filtering if user has a unit
        if (userUnit) {
          unitCompanyFilters.push({ targetUnit: userUnit });
        }
        
        // Add company filtering if user has a company
        if (userCompanyId) {
          unitCompanyFilters.push({ targetCompanyId: userCompanyId });
        }
        
        // Add global notifications (no specific unit or company target)
        unitCompanyFilters.push({ targetUnit: null, targetCompanyId: null });
        
        if (unitCompanyFilters.length > 0) {
          query.$and.push({ $or: unitCompanyFilters });
        }
      }

      if (unreadOnly) {
        query.$and.push({ 'isRead.userId': { $ne: userId } });
      }

      const notifications = await Notification
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('targetUserId', 'username fullName')
        .populate('targetCompanyId', 'name unitName city state')
        .lean();

      // Add isRead status for each notification
      const notificationsWithReadStatus = notifications.map(notification => ({
        ...notification,
        isReadByUser: notification.isRead.some(read => read.userId.toString() === userId.toString())
      }));

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.getUnreadCount(userId, userRole, userUnit, userCompanyId);

      return {
        notifications: notificationsWithReadStatus,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        unreadCount
      };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findById(notificationId);
      
      if (!notification) {
        throw new Error('Notification not found');
      }

      // Check if already marked as read by this user
      const alreadyRead = notification.isRead.some(read => 
        read.userId.toString() === userId.toString()
      );

      if (!alreadyRead) {
        notification.isRead.push({
          userId,
          readAt: new Date()
        });
        await notification.save();
      }

      return notification;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId, userRole, userUnit = null, userCompanyId = null) {
    try {
      let query = {
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

      // Apply unit and company filtering based on role (same as getUserNotifications)
      if (userRole === 'Super Admin') {
        // Super Admin sees all notifications - no additional filtering
      } else if (userRole === 'Unit Head' || userRole === 'Unit Manager' || userRole === 'Sales' || 
                 userRole === 'Production' || userRole === 'Manufacturing' || userRole === 'Packing' || 
                 userRole === 'Dispatch' || userRole === 'Accounts') {
        
        const unitCompanyFilters = [];
        
        if (userUnit) {
          unitCompanyFilters.push({ targetUnit: userUnit });
        }
        
        if (userCompanyId) {
          unitCompanyFilters.push({ targetCompanyId: userCompanyId });
        }
        
        // Add global notifications
        unitCompanyFilters.push({ targetUnit: null, targetCompanyId: null });
        
        if (unitCompanyFilters.length > 0) {
          query.$and.push({ $or: unitCompanyFilters });
        }
      }

      const notifications = await Notification.find(query);

      const updatePromises = notifications.map(notification => {
        notification.isRead.push({
          userId,
          readAt: new Date()
        });
        return notification.save();
      });

      await Promise.all(updatePromises);
      
      return { markedCount: notifications.length };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Get unread count for user
  async getUnreadCount(userId, userRole, userUnit = null, userCompanyId = null) {
    try {
      return await Notification.getUnreadCount(userId, userRole, userUnit, userCompanyId);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Trigger specific notification types with optional unit/company targeting
  async triggerOrderNotification(orderData, targetUnit = null, targetCompanyId = null) {
    return this.createNotification({
      title: 'New Order Created',
      message: `Order ${orderData.orderCode} has been created by ${orderData.customerName}`,
      type: 'order',
      icon: 'shopping-cart',
      targetRole: 'all',
      targetUnit,
      targetCompanyId,
      data: { orderId: orderData._id, orderCode: orderData.orderCode },
      priority: 'high'
    });
  }

  async triggerInventoryNotification(itemData, action = 'updated', targetUnit = null, targetCompanyId = null) {
    const actionText = action === 'created' ? 'added' : action === 'updated' ? 'updated' : 'modified';
    return this.createNotification({
      title: `Inventory ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      message: `Item "${itemData.name}" has been ${actionText}`,
      type: 'inventory',
      icon: 'package',
      targetRole: 'all',
      targetUnit,
      targetCompanyId,
      data: { itemId: itemData._id, itemName: itemData.name, action },
      priority: 'medium'
    });
  }

  async triggerCustomerNotification(customerData, targetUnit = null, targetCompanyId = null) {
    return this.createNotification({
      title: 'New Customer Registered',
      message: `${customerData.name} has been registered as a new customer`,
      type: 'customer',
      icon: 'user-plus',
      targetRole: 'Sales',
      targetUnit,
      targetCompanyId,
      data: { customerId: customerData._id, customerName: customerData.name },
      priority: 'medium'
    });
  }

  // Helper method to create unit-specific notifications
  async createUnitNotification({
    title,
    message,
    type = 'general',
    icon = 'bell',
    targetRole = 'all',
    targetUnit,
    targetCompanyId,
    data = {},
    priority = 'medium'
  }) {
    return this.createNotification({
      title,
      message,
      type,
      icon,
      targetRole,
      targetUnit,
      targetCompanyId,
      data,
      priority
    });
  }

  async triggerLowStockNotification(itemData) {
    return this.createNotification({
      title: 'Low Stock Alert',
      message: `${itemData.name} is running low on stock (${itemData.currentStock} remaining)`,
      type: 'inventory',
      icon: 'alert-triangle',
      targetRole: 'all',
      data: { itemId: itemData._id, itemName: itemData.name, currentStock: itemData.currentStock },
      priority: 'urgent'
    });
  }
}

export default new NotificationService();