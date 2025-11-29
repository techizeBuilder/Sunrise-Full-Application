import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart3,
  RefreshCw,
  Package,
  Factory
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ProductionDashboard() {
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState('today');

  // Fetch production dashboard data
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['production-dashboard'],
    queryFn: () => apiRequest('GET', '/api/production/dashboard'),
    staleTime: 30000, // Refetch every 30 seconds
    refetchInterval: 30000 // Auto-refresh
  });

  const productGroups = dashboardData?.data || [];
  const stats = dashboardData?.stats || {
    totalGroups: 0,
    totalItems: 0
  };

  // Debug logging
  console.log('Dashboard Data:', dashboardData);
  console.log('Product Groups:', productGroups);
  console.log('Stats:', stats);

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error Loading Dashboard</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <Button onClick={() => refetch()} className="mt-3 bg-red-600 hover:bg-red-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Production Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor and manage production activities</p>
        </div>
        <Button onClick={() => refetch()} variant="outline" disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Simple Stats Cards - Only Total Groups and Total Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Factory className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {isLoading ? '...' : stats.totalGroups}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-300">Total Production Groups</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Package className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                  {isLoading ? '...' : stats.totalItems}
                </p>
                <p className="text-sm text-green-600 dark:text-green-300">Total Items in Production</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Groups with Batch Counts */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Product Sales Management - Production with Final Batches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Loading production data...</span>
              </div>
            ) : productGroups.length === 0 ? (
              <div className="text-center py-8">
                <Factory className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No production groups found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Group</TableHead>
                    <TableHead className="text-center">No. Of Batches for Production</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productGroups.map((group, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{group.productGroup}</TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant="outline" 
                          className="bg-green-50 text-green-700 border-green-200"
                        >
                          {group.noOfBatchesForProduction}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}