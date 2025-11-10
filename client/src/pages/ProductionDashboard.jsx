import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Factory,
  Package,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Settings,
  Users,
  Target,
  Zap,
  Calendar,
  BarChart3
} from 'lucide-react';

// Dummy data for Production Dashboard
const productionStats = {
  todayProduced: 1250,
  todayTarget: 1400,
  currentShiftOutput: 420,
  activeLines: 8,
  totalLines: 10,
  efficiency: 89.3,
  qualityRate: 96.8,
  downtime: 45 // minutes
};

const productionLines = [
  { id: 'Line-A1', product: 'Steel Rods 12mm', status: 'Running', output: 145, target: 160, efficiency: 90.6, operator: 'John Smith' },
  { id: 'Line-A2', product: 'Aluminum Sheets', status: 'Running', output: 98, target: 100, efficiency: 98.0, operator: 'Mike Johnson' },
  { id: 'Line-B1', product: 'Copper Pipes', status: 'Maintenance', output: 0, target: 120, efficiency: 0, operator: 'David Wilson' },
  { id: 'Line-B2', product: 'Steel Beams', status: 'Running', output: 67, target: 80, efficiency: 83.8, operator: 'Sarah Davis' },
  { id: 'Line-C1', product: 'Wire Mesh', status: 'Running', output: 234, target: 250, efficiency: 93.6, operator: 'Tom Brown' },
  { id: 'Line-C2', product: 'Metal Brackets', status: 'Setup', output: 0, target: 200, efficiency: 0, operator: 'Lisa Anderson' }
];

const qualityMetrics = [
  { parameter: 'Dimensional Accuracy', value: 98.5, target: 97.0, status: 'Excellent' },
  { parameter: 'Surface Finish', value: 96.2, target: 95.0, status: 'Good' },
  { parameter: 'Material Strength', value: 99.1, target: 98.0, status: 'Excellent' },
  { parameter: 'Weight Tolerance', value: 94.8, target: 95.0, status: 'Fair' }
];

const shiftData = [
  { shift: 'Morning (6AM-2PM)', produced: 1150, target: 1200, efficiency: 95.8, quality: 97.2 },
  { shift: 'Afternoon (2PM-10PM)', produced: 1080, target: 1200, efficiency: 90.0, quality: 96.5 },
  { shift: 'Night (10PM-6AM)', produced: 980, target: 1000, efficiency: 98.0, quality: 98.1 }
];

const recentIssues = [
  { id: 1, line: 'Line-B1', issue: 'Hydraulic pressure low', priority: 'High', time: '30 mins ago', status: 'In Progress' },
  { id: 2, line: 'Line-A1', issue: 'Material feeder jam cleared', priority: 'Medium', time: '1 hour ago', status: 'Resolved' },
  { id: 3, line: 'Line-C2', issue: 'Tool calibration required', priority: 'Low', time: '2 hours ago', status: 'Scheduled' },
  { id: 4, line: 'Line-B2', issue: 'Cooling system check', priority: 'Medium', time: '3 hours ago', status: 'Completed' }
];

export default function ProductionDashboard() {
  const [selectedShift, setSelectedShift] = useState('current');

  const getStatusColor = (status) => {
    switch (status) {
      case 'Running': return 'bg-green-100 text-green-800 border-green-200';
      case 'Maintenance': return 'bg-red-100 text-red-800 border-red-200';
      case 'Setup': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Idle': return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const getQualityStatus = (status) => {
    switch (status) {
      case 'Excellent': return 'bg-green-100 text-green-800';
      case 'Good': return 'bg-blue-100 text-blue-800';
      case 'Fair': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-700 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Factory className="h-10 w-10" />
              Production Dashboard
            </h1>
            <p className="text-orange-100 mt-2">
              Real-time production monitoring and performance tracking
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Calendar className="h-4 w-4 mr-2" />
              Today
            </Button>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </Button>
          </div>
        </div>
      </div>

      {/* Key Production Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Today's Production</CardTitle>
            <Package className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productionStats.todayProduced}</div>
            <p className="text-xs text-muted-foreground">
              Target: {productionStats.todayTarget} units
            </p>
            <Progress value={(productionStats.todayProduced / productionStats.todayTarget) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Lines</CardTitle>
            <Settings className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productionStats.activeLines}/{productionStats.totalLines}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((productionStats.activeLines / productionStats.totalLines) * 100)}% operational
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Efficiency</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productionStats.efficiency}%</div>
            <p className="text-xs text-muted-foreground">
              +2.3% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Quality Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productionStats.qualityRate}%</div>
            <p className="text-xs text-muted-foreground">
              Above 95% target
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Production Lines & Quality Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Production Lines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Factory className="h-5 w-5" />
              Production Lines Status
            </CardTitle>
            <CardDescription>
              Real-time status of all production lines
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productionLines.map((line) => (
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
                        <span>Output: {line.output} / {line.target}</span>
                        <span>Efficiency: {line.efficiency}%</span>
                      </div>
                      <Progress value={(line.output / line.target) * 100} className="h-2" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quality Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Quality Metrics
            </CardTitle>
            <CardDescription>
              Current quality parameters and standards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {qualityMetrics.map((metric) => (
                <div key={metric.parameter} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{metric.parameter}</h3>
                    <Badge className={getQualityStatus(metric.status)}>
                      {metric.status}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Current: {metric.value}%</span>
                      <span>Target: {metric.target}%</span>
                    </div>
                    <Progress 
                      value={Math.min((metric.value / metric.target) * 100, 100)} 
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shift Performance & Recent Issues */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Shift Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Shift Performance
            </CardTitle>
            <CardDescription>
              Performance comparison across shifts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {shiftData.map((shift) => (
                <div key={shift.shift} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{shift.shift}</h3>
                    <Badge variant="outline">
                      {shift.efficiency}% efficiency
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Produced:</span>
                      <div className="font-medium">{shift.produced} / {shift.target}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Quality:</span>
                      <div className="font-medium">{shift.quality}%</div>
                    </div>
                  </div>
                  <Progress value={(shift.produced / shift.target) * 100} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Issues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Issues
            </CardTitle>
            <CardDescription>
              Production line issues and maintenance alerts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentIssues.map((issue) => (
                <div key={issue.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-gray-900">
                        {issue.line}
                      </p>
                      <Badge className={getPriorityColor(issue.priority)}>
                        {issue.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {issue.issue}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {issue.status}
                      </Badge>
                      <span className="text-xs text-gray-500">{issue.time}</span>
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