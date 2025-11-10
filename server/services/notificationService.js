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
        // Send to role-based channels
        if (targetRole === 'all') {
          await pusher.trigger('notifications-all', 'notification', notificationPayload);
        } else {
          await pusher.trigger(`notifications-${targetRole.toLowerCase().replace(' ', '-')}`, 'notification', notificationPayload);
        }
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notifications for a user
  async getUserNotifications(userId, userRole, { page = 1, limit = 20, unreadOnly = false } = {}) {
    try {
      const skip = (page - 1) * limit;
      
      let query = {
        $or: [
          { targetRole: 'all' },
          { targetRole: userRole },
          { targetUserId: userId }
        ]
      };

      if (unreadOnly) {
        query['isRead.userId'] = { $ne: userId };
      }

      const notifications = await Notification
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('targetUserId', 'username fullName')
        .lean();

      // Add isRead status for each notification
      const notificationsWithReadStatus = notifications.map(notification => ({
        ...notification,
        isReadByUser: notification.isRead.some(read => read.userId.toString() === userId.toString())
      }));

      const total = await Notification.countDocuments(query);
      const unreadCount = await Notification.getUnreadCount(userId, userRole);

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
  async markAllAsRead(userId, userRole) {
    try {
      const notifications = await Notification.find({
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
      });

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
  async getUnreadCount(userId, userRole) {
    try {
      return await Notification.getUnreadCount(userId, userRole);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  // Trigger specific notification types
  async triggerOrderNotification(orderData) {
    return this.createNotification({
      title: 'New Order Created',
      message: `Order ${orderData.orderCode} has been created by ${orderData.customerName}`,
      type: 'order',
      icon: 'shopping-cart',
      targetRole: 'all',
      data: { orderId: orderData._id, orderCode: orderData.orderCode },
      priority: 'high'
    });
  }

  async triggerInventoryNotification(itemData, action = 'updated') {
    const actionText = action === 'created' ? 'added' : action === 'updated' ? 'updated' : 'modified';
    return this.createNotification({
      title: `Inventory ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      message: `Item "${itemData.name}" has been ${actionText}`,
      type: 'inventory',
      icon: 'package',
      targetRole: 'all',
      data: { itemId: itemData._id, itemName: itemData.name, action },
      priority: 'medium'
    });
  }

  async triggerCustomerNotification(customerData) {
    return this.createNotification({
      title: 'New Customer Registered',
      message: `${customerData.name} has been registered as a new customer`,
      type: 'customer',
      icon: 'user-plus',
      targetRole: 'Sales',
      data: { customerId: customerData._id, customerName: customerData.name },
      priority: 'medium'
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