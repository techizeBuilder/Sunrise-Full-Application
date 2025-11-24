import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  FileText,
  Calendar,
  Filter,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Package,
  Clock,
  DollarSign,
  Users,
  Activity
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ProductionReports() {
  const { toast } = useToast();
  const [reportType, setReportType] = useState('daily');
  const [dateFrom, setDateFrom] = useState('2024-11-01');
  const [dateTo, setDateTo] = useState('2024-11-24');
  const [selectedBatch, setSelectedBatch] = useState('all');
  const [selectedUnitManager, setSelectedUnitManager] = useState('all');
  const [selectedShift, setSelectedShift] = useState('all');

  // Mock data for reports
  const reportData = {
    daily: [
      {
        date: '2024-11-24',
        totalBatches: 5,
        completedBatches: 4,
        producedUnits: 3150,
        plannedUnits: 3300,
        efficiency: 95.5,
        damages: 85,
        damagesCost: 1200,
        shifts: {
          morning: { batches: 2, units: 1450, efficiency: 96 },
          afternoon: { batches: 2, units: 1200, efficiency: 94 },
          night: { batches: 1, units: 500, efficiency: 98 }
        }
      },
      {
        date: '2024-11-23',
        totalBatches: 4,
        completedBatches: 4,
        producedUnits: 2800,
        plannedUnits: 2900,
        efficiency: 96.5,
        damages: 45,
        damagesCost: 650,
        shifts: {
          morning: { batches: 2, units: 1300, efficiency: 97 },
          afternoon: { batches: 1, units: 800, efficiency: 95 },
          night: { batches: 1, units: 700, efficiency: 98 }
        }
      }
    ],
    batch: [
      {
        batchId: 'BATCH001',
        productName: 'Product A',
        plannedQty: 1000,
        producedQty: 950,
        efficiency: 95,
        startTime: '2024-11-24T08:15:00',
        endTime: '2024-11-24T15:45:00',
        duration: '7h 30m',
        productionHead: 'Alice Johnson',
        machine: 'Machine A1',
        shift: 'Morning',
        damages: 50,
        cost: 500
      },
      {
        batchId: 'BATCH002',
        productName: 'Product B',
        plannedQty: 500,
        producedQty: 480,
        efficiency: 96,
        startTime: '2024-11-24T14:00:00',
        endTime: '2024-11-24T21:30:00',
        duration: '7h 30m',
        productionHead: 'Bob Wilson',
        machine: 'Machine B2',
        shift: 'Afternoon',
        damages: 20,
        cost: 150
      }
    ],
    machine: [
      {
        machine: 'Machine A1',
        totalBatches: 8,
        totalHours: 64,
        producedUnits: 7500,
        plannedUnits: 8000,
        efficiency: 93.75,
        downtimeHours: 4,
        maintenanceCost: 2500,
        damages: 200
      },
      {
        machine: 'Machine B2',
        totalBatches: 6,
        totalHours: 48,
        producedUnits: 5800,
        plannedUnits: 6000,
        efficiency: 96.67,
        downtimeHours: 2,
        maintenanceCost: 1800,
        damages: 150
      }
    ],
    damage: [
      {
        date: '2024-11-24',
        batchId: 'BATCH001',
        productName: 'Product A',
        damageType: 'Quality Defects',
        quantity: 30,
        cost: 300,
        reason: 'Minor surface defects'
      },
      {
        date: '2024-11-24',
        batchId: 'BATCH001',
        productName: 'Product A',
        damageType: 'Machine Issues',
        quantity: 20,
        cost: 200,
        reason: 'Machine calibration issues'
      }
    ],
    rawMaterial: [
      {
        date: '2024-11-24',
        batchId: 'BATCH001',
        productName: 'Product A',
        rawMaterial: 'Raw Material A',
        planned: 100,
        actual: 98,
        variance: -2,
        cost: 980,
        efficiency: 102
      },
      {
        date: '2024-11-24',
        batchId: 'BATCH001',
        productName: 'Product A',
        rawMaterial: 'Raw Material B',
        planned: 50,
        actual: 52,
        variance: 2,
        cost: 520,
        efficiency: 96
      }
    ]
  };

  const unitManagers = [
    { id: 'all', name: 'All Unit Managers' },
    { id: 'UM001', name: 'John Doe' },
    { id: 'UM002', name: 'Jane Smith' },
    { id: 'UM003', name: 'Mike Johnson' }
  ];

  const downloadReport = (format) => {
    const formatText = format === 'pdf' ? 'PDF' : 'Excel';
    const reportText = reportType === 'daily' ? 'Daily Production' :
                      reportType === 'batch' ? 'Batch-wise Production' :
                      reportType === 'machine' ? 'Machine Efficiency' :
                      reportType === 'damage' ? 'Damage/Wastage' :
                      'Raw Material vs Output';

    toast({
      title: "Download Started",
      description: `${reportText} report in ${formatText} format is being generated`,
    });
  };

  const getEfficiencyColor = (efficiency) => {
    if (efficiency >= 95) return 'text-green-600';
    if (efficiency >= 90) return 'text-yellow-600';
    return 'text-red-600';
  };

  const renderReportContent = () => {
    switch (reportType) {
      case 'daily':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Daily Production Report</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Batches</TableHead>
                  <TableHead>Production</TableHead>
                  <TableHead>Efficiency</TableHead>
                  <TableHead>Damages</TableHead>
                  <TableHead>Shift Breakdown</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.daily.map((day, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{day.date}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{day.completedBatches}/{day.totalBatches} completed</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{day.producedUnits} units</div>
                        <div className="text-gray-500">Planned: {day.plannedUnits}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${getEfficiencyColor(day.efficiency)}`}>
                        {day.efficiency}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="text-red-600">{day.damages} units</div>
                        <div className="text-gray-500">₹{day.damagesCost}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs space-y-1">
                        <div>Morning: {day.shifts.morning.units} ({day.shifts.morning.efficiency}%)</div>
                        <div>Afternoon: {day.shifts.afternoon.units} ({day.shifts.afternoon.efficiency}%)</div>
                        <div>Night: {day.shifts.night.units} ({day.shifts.night.efficiency}%)</div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case 'batch':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Batch-wise Production Report</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Production</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Production Head</TableHead>
                  <TableHead>Machine</TableHead>
                  <TableHead>Efficiency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.batch.map((batch, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{batch.batchId}</TableCell>
                    <TableCell>{batch.productName}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{batch.producedQty} / {batch.plannedQty}</div>
                        {batch.damages > 0 && (
                          <div className="text-red-600">-{batch.damages} damaged</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{batch.duration}</div>
                        <div className="text-gray-500">{batch.shift} Shift</div>
                      </div>
                    </TableCell>
                    <TableCell>{batch.productionHead}</TableCell>
                    <TableCell>{batch.machine}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${getEfficiencyColor(batch.efficiency)}`}>
                        {batch.efficiency}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case 'machine':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Machine/Shift Production Efficiency Report</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Machine</TableHead>
                  <TableHead>Batches</TableHead>
                  <TableHead>Operating Hours</TableHead>
                  <TableHead>Production</TableHead>
                  <TableHead>Efficiency</TableHead>
                  <TableHead>Downtime</TableHead>
                  <TableHead>Maintenance Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.machine.map((machine, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{machine.machine}</TableCell>
                    <TableCell>{machine.totalBatches}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{machine.totalHours}h total</div>
                        <div className="text-gray-500">{machine.downtimeHours}h downtime</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{machine.producedUnits}</div>
                        <div className="text-gray-500">Planned: {machine.plannedUnits}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${getEfficiencyColor(machine.efficiency)}`}>
                        {machine.efficiency}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-red-600">
                        {machine.downtimeHours}h
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        ₹{machine.maintenanceCost}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case 'damage':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Damage/Wastage Report</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Damage Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.damage.map((damage, index) => (
                  <TableRow key={index}>
                    <TableCell>{damage.date}</TableCell>
                    <TableCell className="font-medium">{damage.batchId}</TableCell>
                    <TableCell>{damage.productName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-red-50 text-red-700">
                        {damage.damageType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-red-600 font-medium">{damage.quantity} units</TableCell>
                    <TableCell className="text-red-600">₹{damage.cost}</TableCell>
                    <TableCell className="text-sm">{damage.reason}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case 'rawmaterial':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Raw Material vs Output Report</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Batch ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Raw Material</TableHead>
                  <TableHead>Planned vs Actual</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Efficiency</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.rawMaterial.map((material, index) => (
                  <TableRow key={index}>
                    <TableCell>{material.date}</TableCell>
                    <TableCell className="font-medium">{material.batchId}</TableCell>
                    <TableCell>{material.productName}</TableCell>
                    <TableCell>{material.rawMaterial}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>Planned: {material.planned} kg</div>
                        <div className="font-medium">Actual: {material.actual} kg</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${material.variance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {material.variance > 0 ? '+' : ''}{material.variance} kg
                      </span>
                    </TableCell>
                    <TableCell>₹{material.cost}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${getEfficiencyColor(material.efficiency)}`}>
                        {material.efficiency}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      default:
        return <div>Select a report type to view data</div>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Production Reports</h1>
          <p className="text-gray-600 dark:text-gray-400">Generate and download production reports</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => downloadReport('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={() => downloadReport('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Download Excel
          </Button>
        </div>
      </div>

      {/* Report Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportType">Report Type</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily Production</SelectItem>
                  <SelectItem value="batch">Batch-wise Production</SelectItem>
                  <SelectItem value="machine">Machine Efficiency</SelectItem>
                  <SelectItem value="damage">Damage/Wastage</SelectItem>
                  <SelectItem value="rawmaterial">Raw Material vs Output</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">Date From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">Date To</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="batch">Batch</Label>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select batch..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Batches</SelectItem>
                  <SelectItem value="BATCH001">BATCH001</SelectItem>
                  <SelectItem value="BATCH002">BATCH002</SelectItem>
                  <SelectItem value="BATCH003">BATCH003</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitManager">Unit Manager</Label>
              <Select value={selectedUnitManager} onValueChange={setSelectedUnitManager}>
                <SelectTrigger>
                  <SelectValue placeholder="Select manager..." />
                </SelectTrigger>
                <SelectContent>
                  {unitManagers.map((manager) => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shift">Shift</Label>
              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger>
                  <SelectValue placeholder="Select shift..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shifts</SelectItem>
                  <SelectItem value="morning">Morning Shift</SelectItem>
                  <SelectItem value="afternoon">Afternoon Shift</SelectItem>
                  <SelectItem value="night">Night Shift</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">127</p>
                <p className="text-sm text-blue-600">Total Batches</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-900">95.8%</p>
                <p className="text-sm text-green-600">Avg Efficiency</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-900">₹12.5K</p>
                <p className="text-sm text-orange-600">Damage Cost</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">89.2%</p>
                <p className="text-sm text-purple-600">Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Report Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderReportContent()}
        </CardContent>
      </Card>
    </div>
  );
}