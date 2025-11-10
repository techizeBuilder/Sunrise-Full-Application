import React, { useState } from 'react';
import { Bell, Volume2, VolumeX, Check, Trash2, AlertCircle, Package, ShoppingCart, UserPlus } from 'lucide-react';
import { testNotificationSound } from '../../utils/soundUtils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

// Icon mapping for notification types
const getNotificationIcon = (type, icon) => {
  const iconMap = {
    'order': ShoppingCart,
    'inventory': Package,
    'customer': UserPlus,
    'system': AlertCircle,
    'general': Bell
  };
  
  return iconMap[type] || Bell;
};

// Priority color mapping
const getPriorityColor = (priority) => {
  const colorMap = {
    'low': 'text-slate-500 dark:text-slate-400',
    'medium': 'text-blue-500 dark:text-blue-400',
    'high': 'text-orange-500 dark:text-orange-400',
    'urgent': 'text-red-500 dark:text-red-400'
  };
  
  return colorMap[priority] || colorMap.medium;
};

export const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    soundEnabled,
    toggleSound,
    isConnected 
  } = useNotifications({ limit: 10 });

  const handleNotificationClick = async (notification) => {
    if (!notification.isReadByUser) {
      await markAsRead(notification._id);
    }
    
    // Handle navigation based on notification type and data
    if (notification.data?.orderId) {
      window.location.href = `/sales/orders?highlight=${notification.data.orderId}`;
    } else if (notification.data?.customerId) {
      window.location.href = `/sales/my-customers?highlight=${notification.data.customerId}`;
    } else if (notification.data?.itemId) {
      window.location.href = `/inventory?highlight=${notification.data.itemId}`;
    }
    
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          {!isConnected && (
            <div className="absolute -bottom-1 -right-1 h-2 w-2 bg-red-500 rounded-full" 
                 title="Disconnected from real-time notifications" />
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSound}
              className="h-6 w-6 p-0"
              title={soundEnabled ? 'Disable sound' : 'Enable sound'}
            >
              {soundEnabled ? (
                <Volume2 className="h-3 w-3" />
              ) : (
                <VolumeX className="h-3 w-3" />
              )}
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="h-6 text-xs px-2"
                title="Mark all as read"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark all
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {isLoading ? (
          <div className="p-4 text-center text-sm text-slate-500">
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center text-sm text-slate-500">
            No notifications yet
          </div>
        ) : (
          <ScrollArea className="h-80">
            {notifications.map((notification, index) => {
              const IconComponent = getNotificationIcon(notification.type, notification.icon);
              const priorityColor = getPriorityColor(notification.priority);
              
              return (
                <div key={notification._id}>
                  <DropdownMenuItem
                    className={`flex items-start gap-3 p-3 cursor-pointer ${
                      !notification.isReadByUser 
                        ? 'bg-blue-50 dark:bg-blue-950/30 border-l-2 border-l-blue-500' 
                        : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className={`flex-shrink-0 mt-0.5 ${priorityColor}`}>
                      <IconComponent className="h-4 w-4" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium leading-tight ${
                            !notification.isReadByUser 
                              ? 'text-slate-900 dark:text-slate-100' 
                              : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {notification.title}
                          </p>
                          <p className={`text-xs mt-1 leading-tight ${
                            !notification.isReadByUser
                              ? 'text-slate-600 dark:text-slate-400'
                              : 'text-slate-500 dark:text-slate-500'
                          }`}>
                            {notification.message}
                          </p>
                        </div>
                        
                        {!notification.isReadByUser && (
                          <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1" />
                        )}
                      </div>
                      
                      <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </DropdownMenuItem>
                  
                  {index < notifications.length - 1 && <Separator />}
                </div>
              );
            })}
          </ScrollArea>
        )}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <a 
            href="/notifications" 
            className="flex items-center justify-center text-sm text-blue-600 dark:text-blue-400 cursor-pointer"
          >
            View all notifications
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};