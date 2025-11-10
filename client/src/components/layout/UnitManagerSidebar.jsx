import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import {
  LayoutDashboard,
  Shield,
  Package,
  Truck,
  Package2,
  LogOut,
  Building2,
  ChevronDown,
  ChevronRight,
  User
} from 'lucide-react';

const unitManagerMenuItems = [
  {
    label: 'Dashboard',
    path: '/unit-manager-dashboard',
    icon: LayoutDashboard,
    module: 'dashboard'
  },
  {
    label: 'Sales Approval',
    path: '/sales-approval',
    icon: Shield,
    module: 'Sales Approval'
  },
//   {
//     label: 'Manufacturing',
//     path: '/manufacturing',
//     icon: Package,
//     module: 'Manufacturing'
//   },
//   {
//     label: 'Dispatches',
//     path: '/dispatches',
//     icon: Truck,
//     module: 'Dispatches'
//   },
//   {
//     label: 'Inventory',
//     path: '/inventory',
//     icon: Package2,
//     module: 'Inventory'
//   }
];

// Profile menu item (always available)
const profileMenuItem = {
  label: 'Profile',
  path: '/profile',
  icon: User,
};

const UnitManagerSidebar = () => {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const [expandedItems, setExpandedItems] = useState(new Set());

  const toggleExpanded = (label) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedItems(newExpanded);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Filter menu items - Unit Manager should see all their designated modules
  const filteredMenuItems = unitManagerMenuItems.filter(item => {
    // Always show dashboard
    if (item.module === 'dashboard') return true;
    
    // Check if module is enabled in settings
    if (settings?.modules && settings.modules[item.module] === false) {
      return false;
    }
    
    return true;
  });

  const isActive = (path, submodules) => {
    if (submodules) {
      return submodules.some(sub => location === sub.path) || location === path;
    }
    return location === path;
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <Link href="/" className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">
              {settings?.company?.name || 'ManuERP Industries'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Unit Manager Portal
            </span>
          </div>
        </Link>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.fullName || user?.username}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredMenuItems.map((item) => {
          const isActiveItem = isActive(item.path, item.submodules);
          const isExpanded = expandedItems.has(item.label);
          
          return (
            <div key={item.label}>
              <div className="flex items-center">
                <Link 
                  href={item.path}
                  className={cn(
                    "flex-1 flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActiveItem
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="flex-1">{item.label}</span>
                </Link>
                
                {item.submodules && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-1 h-8 w-8"
                    onClick={() => toggleExpanded(item.label)}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>

              {/* Submodules */}
              {item.submodules && isExpanded && (
                <div className="ml-8 mt-1 space-y-1">
                  {item.submodules.map((subitem) => (
                    <Link
                      key={subitem.path}
                      href={subitem.path}
                      className={cn(
                        "block px-3 py-2 text-sm rounded-lg transition-colors",
                        location === subitem.path
                          ? "bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      )}
                    >
                      {subitem.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Profile Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        <Link 
          href={profileMenuItem.path}
          className={cn(
            "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors w-full",
            location === profileMenuItem.path
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200"
              : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          )}
        >
          <profileMenuItem.icon className="w-5 h-5 mr-3" />
          {profileMenuItem.label}
        </Link>
        
        <Button
          variant="ghost"
          className="w-full flex items-center justify-start px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </Button>
        
        <div className="pt-2">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default UnitManagerSidebar;
