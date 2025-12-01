// Test script for Role-Based Notification Settings
// This script tests the functionality where disabled role toggles prevent notifications

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:5000/api';

// Test role-based notification settings functionality
const testRoleNotificationSettings = async () => {
  console.log('🧪 Testing Role-Based Notification Settings...\n');

  try {
    // Step 1: Login as Super Admin to configure settings
    console.log('Step 1: Logging in as Super Admin...');
    const superAdminLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const superAdminResult = await superAdminLogin.json();
    if (!superAdminResult.success) {
      console.log('❌ Super Admin login failed');
      return;
    }

    const superAdminToken = superAdminResult.token;
    console.log('✅ Super Admin logged in successfully');

    // Step 2: Disable notifications for Sales role
    console.log('\nStep 2: Disabling notifications for Sales role...');
    const disableSettings = await fetch(`${API_BASE}/settings/notifications`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        roleNotifications: {
          salesPerson: { enabled: false }
        }
      })
    });

    const disableResult = await disableSettings.json();
    if (!disableSettings.ok) {
      console.log('❌ Failed to disable Sales notifications:', disableResult.message);
      return;
    }

    console.log('✅ Sales notifications disabled successfully');

    // Step 3: Login as Sales user
    console.log('\nStep 3: Logging in as Sales user...');
    const salesLogin = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'sales',
        password: 'sales123'
      })
    });

    const salesResult = await salesLogin.json();
    if (!salesResult.success) {
      console.log('❌ Sales user login failed');
      return;
    }

    const salesToken = salesResult.token;
    console.log('✅ Sales user logged in successfully');

    // Step 4: Create a test notification targeting Sales
    console.log('\nStep 4: Creating test notification for Sales...');
    const createNotification = await fetch(`${API_BASE}/notifications/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        title: 'Test Sales Notification',
        message: 'This notification should not be visible to Sales users',
        targetRole: 'Sales',
        type: 'general'
      })
    });

    const notificationResult = await createNotification.json();
    if (!notificationResult.success) {
      console.log('❌ Failed to create test notification');
      return;
    }

    console.log('✅ Test notification created');

    // Step 5: Check if Sales user can see the notification (should be empty)
    console.log('\nStep 5: Checking Sales user notifications...');
    const salesNotifications = await fetch(`${API_BASE}/notifications?limit=50`, {
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });

    const salesNotificationsResult = await salesNotifications.json();
    if (salesNotificationsResult.success) {
      const visibleNotifications = salesNotificationsResult.notifications.length;
      console.log(`📊 Sales user visible notifications: ${visibleNotifications}`);
      
      if (visibleNotifications === 0) {
        console.log('✅ SUCCESS: Sales user cannot see notifications (role disabled)');
      } else {
        console.log('❌ FAILURE: Sales user can still see notifications');
        salesNotificationsResult.notifications.forEach(notification => {
          console.log(`   - ${notification.title}`);
        });
      }
    }

    // Step 6: Check unread count for Sales user (should be 0)
    console.log('\nStep 6: Checking Sales user unread count...');
    const unreadCount = await fetch(`${API_BASE}/notifications/unread-count`, {
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });

    const unreadResult = await unreadCount.json();
    if (unreadResult.success) {
      console.log(`📊 Sales user unread count: ${unreadResult.unreadCount}`);
      
      if (unreadResult.unreadCount === 0) {
        console.log('✅ SUCCESS: Sales user unread count is 0 (role disabled)');
      } else {
        console.log('❌ FAILURE: Sales user still has unread notifications');
      }
    }

    // Step 7: Enable notifications for Sales role again
    console.log('\nStep 7: Re-enabling notifications for Sales role...');
    const enableSettings = await fetch(`${API_BASE}/settings/notifications`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        roleNotifications: {
          salesPerson: { enabled: true }
        }
      })
    });

    const enableResult = await enableSettings.json();
    if (!enableSettings.ok) {
      console.log('❌ Failed to re-enable Sales notifications');
      return;
    }

    console.log('✅ Sales notifications re-enabled');

    // Step 8: Check if Sales user can now see notifications
    console.log('\nStep 8: Checking Sales user notifications after re-enabling...');
    const salesNotifications2 = await fetch(`${API_BASE}/notifications?limit=50`, {
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });

    const salesNotificationsResult2 = await salesNotifications2.json();
    if (salesNotificationsResult2.success) {
      const visibleNotifications2 = salesNotificationsResult2.notifications.length;
      console.log(`📊 Sales user visible notifications: ${visibleNotifications2}`);
      
      if (visibleNotifications2 > 0) {
        console.log('✅ SUCCESS: Sales user can now see notifications (role enabled)');
        console.log('   Recent notifications:');
        salesNotificationsResult2.notifications.slice(0, 3).forEach(notification => {
          console.log(`   - ${notification.title}`);
        });
      } else {
        console.log('⚠️  Sales user still cannot see notifications - this might be expected if no notifications target Sales role');
      }
    }

    console.log('\n🎉 Role-based notification settings test completed!');
    console.log('\n📊 Expected Behavior:');
    console.log('✅ When role notifications are disabled: Users see 0 notifications and have 0 unread count');
    console.log('✅ When role notifications are enabled: Users can see notifications targeted to their role');
    console.log('✅ Super Admin settings toggle controls notification visibility for each role');
    console.log('✅ Changes take effect immediately without requiring user to log out/in');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
};

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testRoleNotificationSettings().catch(console.error);
}

export { testRoleNotificationSettings };