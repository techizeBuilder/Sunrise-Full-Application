import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Package2 } from 'lucide-react';

export default function PackingSheet() {
  const { hasFeatureAccess } = usePermissions();

  // Check if user has access to packing sheet feature
  const hasAccess = hasFeatureAccess('packing', 'packingSheet', 'view');

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <Package2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Access Denied</h3>
            <p className="text-gray-500">You don't have permission to access the Packing Sheet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                Packing Sheet
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage and track packing operations
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Packing Operations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package2 className="h-5 w-5" />
                Packing Operations
              </CardTitle>
              <CardDescription>
                Current packing tasks and operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  Packing Sheet Management
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  Your packing sheet functionality is ready to be implemented.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Packing Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Packing Statistics</CardTitle>
              <CardDescription>
                Overview of packing performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-blue-700 dark:text-blue-300 font-medium">Today's Packed Items</span>
                  <span className="text-blue-900 dark:text-blue-100 font-bold text-xl">0</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-green-700 dark:text-green-300 font-medium">Completed Orders</span>
                  <span className="text-green-900 dark:text-green-100 font-bold text-xl">0</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <span className="text-orange-700 dark:text-orange-300 font-medium">Pending Orders</span>
                  <span className="text-orange-900 dark:text-orange-100 font-bold text-xl">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}