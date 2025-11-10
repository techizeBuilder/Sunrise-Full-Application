import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SalesGridManagement() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Sales Grid Management
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Grid Management</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-400">
            Manage sales data grids and configurations from this page.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}