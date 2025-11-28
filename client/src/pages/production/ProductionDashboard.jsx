import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  Plus,
  Package,
  Activity,
  Target,
  AlertCircle,
  Calendar,
  Users,
  TrendingUp,
  Factory,
  RefreshCw,
  Eye
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

  const stats = dashboardData?.data?.stats || {
    totalBatches: 0,
    pendingTasks: 0,
    completedToday: 0,
    damages: 0
  };

  const recentGroups = dashboardData?.data?.recentGroups || [];
  const summary = dashboardData?.data?.summary || {
    totalGroups: 0,
    activeGroups: 0,
    inactiveGroups: 0
  };

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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                  {isLoading ? '...' : stats.totalBatches}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-300">Total Batches Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                  {isLoading ? '...' : stats.pendingTasks}
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-300">Pending Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {isLoading ? '...' : stats.completedToday}
                </p>
                <p className="text-sm text-purple-600 dark:text-purple-300">Completed Today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                  {isLoading ? '...' : stats.damages}
                </p>
                <p className="text-sm text-red-600 dark:text-red-300">Damages/Wastage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Production Groups Table */}
      <div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Recent Production Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-500" />
                <span className="ml-2 text-gray-500">Loading production groups...</span>
              </div>
            ) : recentGroups.length === 0 ? (
              <div className="text-center py-8">
                <Factory className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No production groups found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group Name</TableHead>
                    <TableHead>Batches</TableHead>
                    <TableHead>Total Items</TableHead>
                    <TableHead>Total Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentGroups.map((group) => (
                    <TableRow key={group._id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>{group.batches}</TableCell>
                      <TableCell>{group.items}</TableCell>
                      <TableCell>{group.totalQuantity}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={group.status === 'Active' ? 'default' : 'secondary'}
                          className={group.status === 'Active' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {group.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{group.createdBy}</TableCell>
                      <TableCell>
                        {new Date(group.createdAt).toLocaleDateString()}
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