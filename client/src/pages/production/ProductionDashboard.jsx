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
  Factory
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function ProductionDashboard() {
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState('today');

  // Mock data - replace with actual API calls
  const productionStats = {
    totalBatches: 24,
    pendingTasks: 8,
    ongoingBatches: 3,
    completedBatches: 13,
    damages: 2,
    efficiency: 92
  };

  const ongoingBatches = [
    {
      id: 'BATCH001',
      product: 'Product A',
      progress: 65,
      startTime: '08:00 AM',
      estimatedCompletion: '02:00 PM',
      assignedManager: 'John Doe',
      status: 'In Progress'
    },
    {
      id: 'BATCH002', 
      product: 'Product B',
      progress: 30,
      startTime: '10:00 AM',
      estimatedCompletion: '04:00 PM',
      assignedManager: 'Jane Smith',
      status: 'In Progress'
    },
    {
      id: 'BATCH003',
      product: 'Product C',
      progress: 85,
      startTime: '06:00 AM',
      estimatedCompletion: '12:00 PM',
      assignedManager: 'Mike Johnson',
      status: 'Near Completion'
    }
  ];

  const alerts = [
    { type: 'warning', message: 'Low raw material stock for Product A', time: '10 mins ago' },
    { type: 'danger', message: 'Production delay in BATCH001', time: '25 mins ago' },
    { type: 'info', message: 'Quality check passed for BATCH003', time: '1 hour ago' }
  ];

  const recentCompletedBatches = [
    { id: 'BATCH020', product: 'Product D', quantity: '500 units', completedTime: '11:30 AM' },
    { id: 'BATCH021', product: 'Product E', quantity: '300 units', completedTime: '10:15 AM' },
    { id: 'BATCH019', product: 'Product A', quantity: '750 units', completedTime: '09:45 AM' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Production Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Monitor and manage production activities</p>
        </div>
        <div className="flex gap-3">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Batch Plan
          </Button>
          <Button variant="outline">
            <Play className="h-4 w-4 mr-2" />
            Start Production
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{productionStats.totalBatches}</p>
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
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{productionStats.pendingTasks}</p>
                <p className="text-sm text-orange-600 dark:text-orange-300">Pending Tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{productionStats.ongoingBatches}</p>
                <p className="text-sm text-green-600 dark:text-green-300">Ongoing Batches</p>
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
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{productionStats.completedBatches}</p>
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
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">{productionStats.damages}</p>
                <p className="text-sm text-red-600 dark:text-red-300">Damages/Wastage</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <TrendingUp className="h-6 w-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-teal-900 dark:text-teal-100">{productionStats.efficiency}%</p>
                <p className="text-sm text-teal-600 dark:text-teal-300">Efficiency</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Ongoing Batches */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                Live Production Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ongoingBatches.map((batch) => (
                  <div key={batch.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold text-lg">{batch.id}</h4>
                        <p className="text-sm text-gray-600">{batch.product}</p>
                      </div>
                      <Badge variant={batch.status === 'Near Completion' ? 'default' : 'secondary'}>
                        {batch.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{batch.progress}%</span>
                      </div>
                      <Progress value={batch.progress} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Started:</span>
                        <p className="font-medium">{batch.startTime}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Est. Completion:</span>
                        <p className="font-medium">{batch.estimatedCompletion}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="text-gray-500">Manager:</span>
                        <span className="font-medium ml-1">{batch.assignedManager}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">View Details</Button>
                        <Button size="sm">Manage</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts & Notifications */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                Alerts & Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert, index) => (
                  <div key={index} className={`border-l-4 p-3 rounded ${
                    alert.type === 'danger' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' :
                    alert.type === 'warning' ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20' :
                    'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  }`}>
                    <p className="text-sm font-medium">{alert.message}</p>
                    <p className="text-xs text-gray-500">{alert.time}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Recent Completions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentCompletedBatches.map((batch, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div>
                      <p className="font-semibold text-sm">{batch.id}</p>
                      <p className="text-xs text-gray-600">{batch.product}</p>
                      <p className="text-xs font-medium text-green-600">{batch.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Completed</p>
                      <p className="text-sm font-medium">{batch.completedTime}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}