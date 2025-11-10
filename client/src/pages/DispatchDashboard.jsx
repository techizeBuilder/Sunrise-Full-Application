import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Truck,
  Package,
  Clock,
  MapPin,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Navigation,
  Fuel,
  Users,
  Calendar,
  BarChart3
} from 'lucide-react';

// Dummy data for Dispatch Dashboard
const dispatchStats = {
  todayDispatches: 85,
  todayTarget: 100,
  activeVehicles: 24,
  totalVehicles: 30,
  onTimeDeliveries: 94.2,
  avgDeliveryTime: 2.8, // hours
  pendingPickups: 12,
  completedDeliveries: 73
};

const activeDeliveries = [
  { 
    id: 'DEL-001', 
    driver: 'John Smith', 
    vehicle: 'TRK-101', 
    destination: 'Mumbai Central', 
    status: 'In Transit', 
    eta: '2.5 hrs', 
    progress: 65,
    packages: 15,
    priority: 'High'
  },
  { 
    id: 'DEL-002', 
    driver: 'Mike Johnson', 
    vehicle: 'VAN-205', 
    destination: 'Pune Industrial Area', 
    status: 'Loading', 
    eta: '4.0 hrs', 
    progress: 15,
    packages: 8,
    priority: 'Medium'
  },
  { 
    id: 'DEL-003', 
    driver: 'Sarah Wilson', 
    vehicle: 'TRK-103', 
    destination: 'Nashik Distribution', 
    status: 'In Transit', 
    eta: '1.2 hrs', 
    progress: 85,
    packages: 22,
    priority: 'High'
  },
  { 
    id: 'DEL-004', 
    driver: 'David Brown', 
    vehicle: 'VAN-207', 
    destination: 'Aurangabad Warehouse', 
    status: 'Delivered', 
    eta: 'Completed', 
    progress: 100,
    packages: 12,
    priority: 'Medium'
  },
  { 
    id: 'DEL-005', 
    driver: 'Lisa Davis', 
    vehicle: 'TRK-105', 
    destination: 'Thane Industrial Zone', 
    status: 'Loading', 
    eta: '3.5 hrs', 
    progress: 25,
    packages: 18,
    priority: 'Low'
  }
];

const vehicleFleet = [
  { id: 'TRK-101', type: 'Heavy Truck', driver: 'John Smith', status: 'In Transit', fuel: 75, maintenance: 'Good', location: 'Highway-Mumbai' },
  { id: 'TRK-102', type: 'Heavy Truck', driver: 'Unassigned', status: 'Available', fuel: 90, maintenance: 'Good', location: 'Depot' },
  { id: 'TRK-103', type: 'Heavy Truck', driver: 'Sarah Wilson', status: 'In Transit', fuel: 45, maintenance: 'Due', location: 'Nashik Route' },
  { id: 'VAN-205', type: 'Delivery Van', driver: 'Mike Johnson', status: 'Loading', fuel: 80, maintenance: 'Good', location: 'Loading Bay 2' },
  { id: 'VAN-206', type: 'Delivery Van', driver: 'Unassigned', status: 'Maintenance', fuel: 0, maintenance: 'In Service', location: 'Workshop' },
  { id: 'VAN-207', type: 'Delivery Van', driver: 'David Brown', status: 'Available', fuel: 95, maintenance: 'Good', location: 'Depot' }
];

const dispatchRoutes = [
  { route: 'Mumbai Zone', deliveries: 15, avgTime: '2.5 hrs', status: 'On Track', efficiency: 92 },
  { route: 'Pune Corridor', deliveries: 12, avgTime: '3.2 hrs', status: 'Delayed', efficiency: 78 },
  { route: 'Nashik Circuit', deliveries: 8, avgTime: '2.8 hrs', status: 'On Track', efficiency: 88 },
  { route: 'Aurangabad Line', deliveries: 6, avgTime: '4.1 hrs', status: 'On Track', efficiency: 85 },
  { route: 'Thane Local', deliveries: 10, avgTime: '1.5 hrs', status: 'Ahead', efficiency: 95 }
];

const recentAlerts = [
  { id: 1, type: 'delay', message: 'VAN-205 delayed due to traffic congestion', time: '15 mins ago', priority: 'Medium' },
  { id: 2, type: 'maintenance', message: 'TRK-103 requires scheduled maintenance', time: '45 mins ago', priority: 'High' },
  { id: 3, type: 'fuel', message: 'TRK-101 fuel level below 30%', time: '1 hour ago', priority: 'Medium' },
  { id: 4, type: 'success', message: 'All morning deliveries completed successfully', time: '2 hours ago', priority: 'Low' },
  { id: 5, type: 'weather', message: 'Weather alert: Heavy rain expected on Pune route', time: '2.5 hours ago', priority: 'High' }
];

export default function DispatchDashboard() {
  const [selectedView, setSelectedView] = useState('overview');

  const getStatusColor = (status) => {
    switch (status) {
      case 'In Transit': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Loading': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'Available': return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getRouteStatus = (status) => {
    switch (status) {
      case 'On Track': return 'bg-green-100 text-green-800';
      case 'Delayed': return 'bg-red-100 text-red-800';
      case 'Ahead': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFuelColor = (fuel) => {
    if (fuel > 60) return 'text-green-600';
    if (fuel > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMaintenanceColor = (maintenance) => {
    switch (maintenance) {
      case 'Good': return 'text-green-600';
      case 'Due': return 'text-yellow-600';
      case 'In Service': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-700 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Truck className="h-10 w-10" />
              Dispatch Dashboard
            </h1>
            <p className="text-indigo-100 mt-2">
              Monitor delivery operations, vehicle fleet, and route efficiency
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Calendar className="h-4 w-4 mr-2" />
              Today
            </Button>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <BarChart3 className="h-4 w-4 mr-2" />
              Routes
            </Button>
          </div>
        </div>
      </div>

      {/* Key Dispatch Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Dispatches</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dispatchStats.todayDispatches}</div>
            <p className="text-xs text-muted-foreground">
              Target: {dispatchStats.todayTarget} dispatches
            </p>
            <Progress value={(dispatchStats.todayDispatches / dispatchStats.todayTarget) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Vehicles</CardTitle>
            <Truck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dispatchStats.activeVehicles}/{dispatchStats.totalVehicles}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((dispatchStats.activeVehicles / dispatchStats.totalVehicles) * 100)}% fleet utilization
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">On-Time Delivery</CardTitle>
            <Clock className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dispatchStats.onTimeDeliveries}%</div>
            <p className="text-xs text-muted-foreground">
              Avg time: {dispatchStats.avgDeliveryTime} hours
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Pickups</CardTitle>
            <Navigation className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dispatchStats.pendingPickups}</div>
            <p className="text-xs text-muted-foreground">
              {dispatchStats.completedDeliveries} completed today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Deliveries & Vehicle Fleet */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Active Deliveries
            </CardTitle>
            <CardDescription>
              Real-time tracking of ongoing deliveries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeDeliveries.map((delivery) => (
                <div key={delivery.id} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{delivery.id}</h3>
                      <Badge className={getStatusColor(delivery.status)}>
                        {delivery.status}
                      </Badge>
                      <Badge className={getPriorityColor(delivery.priority)}>
                        {delivery.priority}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {delivery.packages} packages
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Driver: {delivery.driver} • Vehicle: {delivery.vehicle}</div>
                    <div>Destination: {delivery.destination}</div>
                  </div>
                  {delivery.status !== 'Delivered' && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>ETA: {delivery.eta}</span>
                      </div>
                      <Progress value={delivery.progress} className="h-2" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Fleet */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Vehicle Fleet Status
            </CardTitle>
            <CardDescription>
              Fleet overview with fuel and maintenance status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {vehicleFleet.map((vehicle) => (
                <div key={vehicle.id} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{vehicle.id}</h3>
                      <Badge className={getStatusColor(vehicle.status)}>
                        {vehicle.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      {vehicle.type}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Driver: {vehicle.driver}</div>
                    <div>Location: {vehicle.location}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4" />
                      <span className={getFuelColor(vehicle.fuel)}>
                        Fuel: {vehicle.fuel}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <span className={getMaintenanceColor(vehicle.maintenance)}>
                        {vehicle.maintenance}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Route Performance & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Route Performance
            </CardTitle>
            <CardDescription>
              Delivery routes efficiency and status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dispatchRoutes.map((route) => (
                <div key={route.route} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{route.route}</h3>
                    <Badge className={getRouteStatus(route.status)}>
                      {route.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>Deliveries: {route.deliveries}</div>
                    <div>Avg Time: {route.avgTime}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Efficiency</span>
                      <span>{route.efficiency}%</span>
                    </div>
                    <Progress value={route.efficiency} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
            <CardDescription>
              Important notifications and updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  {alert.type === 'delay' && <Clock className="h-4 w-4 text-yellow-500 mt-0.5" />}
                  {alert.type === 'maintenance' && <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />}
                  {alert.type === 'fuel' && <Fuel className="h-4 w-4 text-orange-500 mt-0.5" />}
                  {alert.type === 'success' && <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />}
                  {alert.type === 'weather' && <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {alert.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={getPriorityColor(alert.priority)}>
                        {alert.priority}
                      </Badge>
                      <span className="text-xs text-gray-500">{alert.time}</span>
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