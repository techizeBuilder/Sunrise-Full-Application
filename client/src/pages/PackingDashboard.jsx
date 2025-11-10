import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  Box,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  Target,
  Truck,
  Archive,
  Calendar,
  BarChart3
} from 'lucide-react';

// Dummy data for Packing Dashboard
const packingStats = {
  todayPacked: 950,
  todayTarget: 1100,
  pendingOrders: 245,
  completedOrders: 89,
  packingLines: 6,
  activePackers: 18,
  efficiency: 86.4,
  qualityScore: 98.1
};

const packingLines = [
  { id: 'Pack-01', product: 'Electronics Package', status: 'Running', packed: 145, target: 180, speed: 'Normal', operator: 'Alice Johnson' },
  { id: 'Pack-02', product: 'Auto Parts Kit', status: 'Running', packed: 120, target: 150, speed: 'Fast', operator: 'Bob Wilson' },
  { id: 'Pack-03', product: 'Hardware Set', status: 'Break', packed: 89, target: 140, speed: 'Slow', operator: 'Carol Davis' },
  { id: 'Pack-04', product: 'Medical Supplies', status: 'Running', packed: 200, target: 220, speed: 'Normal', operator: 'David Lee' },
  { id: 'Pack-05', product: 'Food Items', status: 'Setup', packed: 0, target: 160, speed: 'Idle', operator: 'Eva Martinez' },
  { id: 'Pack-06', product: 'Textile Products', status: 'Running', packed: 156, target: 170, speed: 'Normal', operator: 'Frank Brown' }
];

const orderQueue = [
  { orderId: 'ORD-2024-001', customer: 'Tech Solutions Inc', items: 25, priority: 'High', deadline: '2 hours', status: 'In Progress' },
  { orderId: 'ORD-2024-002', customer: 'AutoMax Corp', items: 40, priority: 'Medium', deadline: '4 hours', status: 'Queued' },
  { orderId: 'ORD-2024-003', customer: 'MedCare Supplies', items: 15, priority: 'High', deadline: '1 hour', status: 'In Progress' },
  { orderId: 'ORD-2024-004', customer: 'FoodMart Chain', items: 60, priority: 'Low', deadline: '6 hours', status: 'Queued' },
  { orderId: 'ORD-2024-005', customer: 'Fashion Hub', items: 35, priority: 'Medium', deadline: '3 hours', status: 'Queued' }
];

const packagingMaterials = [
  { material: 'Cardboard Boxes (Small)', current: 1250, minimum: 500, status: 'Good' },
  { material: 'Cardboard Boxes (Large)', current: 340, minimum: 300, status: 'Low' },
  { material: 'Bubble Wrap', current: 85, minimum: 100, status: 'Critical' },
  { material: 'Packing Tape', current: 200, minimum: 150, status: 'Good' },
  { material: 'Labels & Stickers', current: 2500, minimum: 1000, status: 'Good' },
  { material: 'Protective Padding', current: 180, minimum: 200, status: 'Low' }
];

const recentActivities = [
  { id: 1, activity: 'Large order completed for Tech Solutions Inc', time: '15 mins ago', type: 'completion', line: 'Pack-01' },
  { id: 2, activity: 'Quality check passed for medical supplies batch', time: '32 mins ago', type: 'quality', line: 'Pack-04' },
  { id: 3, activity: 'Material shortage alert: Bubble wrap running low', time: '45 mins ago', type: 'alert', line: 'All Lines' },
  { id: 4, activity: 'New batch started for automotive parts', time: '1 hour ago', type: 'start', line: 'Pack-02' },
  { id: 5, activity: 'Shift handover completed successfully', time: '2 hours ago', type: 'shift', line: 'All Lines' }
];

export default function PackingDashboard() {
  const [selectedView, setSelectedView] = useState('overview');

  const getStatusColor = (status) => {
    switch (status) {
      case 'Running': return 'bg-green-100 text-green-800 border-green-200';
      case 'Break': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Setup': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Maintenance': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMaterialStatus = (status) => {
    switch (status) {
      case 'Good': return 'bg-green-100 text-green-800';
      case 'Low': return 'bg-yellow-100 text-yellow-800';
      case 'Critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSpeedColor = (speed) => {
    switch (speed) {
      case 'Fast': return 'text-green-600';
      case 'Normal': return 'text-blue-600';
      case 'Slow': return 'text-orange-600';
      case 'Idle': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Package className="h-10 w-10" />
              Packing Dashboard
            </h1>
            <p className="text-teal-100 mt-2">
              Monitor packing operations, order queue, and material inventory
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Calendar className="h-4 w-4 mr-2" />
              Today
            </Button>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Button>
          </div>
        </div>
      </div>

      {/* Key Packing Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Packed</CardTitle>
            <Box className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packingStats.todayPacked}</div>
            <p className="text-xs text-muted-foreground">
              Target: {packingStats.todayTarget} packages
            </p>
            <Progress value={(packingStats.todayPacked / packingStats.todayTarget) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Packers</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packingStats.activePackers}</div>
            <p className="text-xs text-muted-foreground">
              {packingStats.packingLines} packing lines
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packingStats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              {packingStats.completedOrders} completed today
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{packingStats.efficiency}%</div>
            <p className="text-xs text-muted-foreground">
              Quality: {packingStats.qualityScore}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Packing Lines & Order Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Packing Lines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Packing Lines Status
            </CardTitle>
            <CardDescription>
              Real-time status of all packing stations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {packingLines.map((line) => (
                <div key={line.id} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{line.id}</h3>
                      <Badge className={getStatusColor(line.status)}>
                        {line.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {line.operator}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    {line.product}
                  </div>
                  {line.status === 'Running' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Packed: {line.packed} / {line.target}</span>
                        <span className={getSpeedColor(line.speed)}>Speed: {line.speed}</span>
                      </div>
                      <Progress value={(line.packed / line.target) * 100} className="h-2" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Queue */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Order Queue
            </CardTitle>
            <CardDescription>
              Pending orders and their priorities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {orderQueue.map((order) => (
                <div key={order.orderId} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-sm">{order.orderId}</h3>
                      <Badge className={getPriorityColor(order.priority)}>
                        {order.priority}
                      </Badge>
                    </div>
                    <Badge variant="outline">
                      {order.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {order.customer}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{order.items} items</span>
                    <span className="text-orange-600">Due in {order.deadline}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Material Inventory & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Material Inventory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Box className="h-5 w-5" />
              Packaging Materials
            </CardTitle>
            <CardDescription>
              Current inventory levels and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {packagingMaterials.map((material) => (
                <div key={material.material} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{material.material}</h3>
                    <Badge className={getMaterialStatus(material.status)}>
                      {material.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Current: {material.current}</span>
                      <span>Minimum: {material.minimum}</span>
                    </div>
                    <Progress 
                      value={Math.min((material.current / (material.minimum * 2)) * 100, 100)} 
                      className="h-2"
                    />
                    {material.status === 'Critical' && (
                      <p className="text-xs text-red-600">⚠️ Immediate restock required</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activities
            </CardTitle>
            <CardDescription>
              Latest packing operations and alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  {activity.type === 'completion' && <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />}
                  {activity.type === 'quality' && <Target className="h-4 w-4 text-blue-500 mt-0.5" />}
                  {activity.type === 'alert' && <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />}
                  {activity.type === 'start' && <Package className="h-4 w-4 text-purple-500 mt-0.5" />}
                  {activity.type === 'shift' && <Users className="h-4 w-4 text-gray-500 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.activity}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {activity.line}
                      </Badge>
                      <span className="text-xs text-gray-500">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}