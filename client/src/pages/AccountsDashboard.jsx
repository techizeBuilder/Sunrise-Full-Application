import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  PieChart,
  BarChart3,
  Calendar,
  Wallet
} from 'lucide-react';

// Dummy data for Accounts Dashboard
const financialStats = {
  totalRevenue: 28400000, // ₹2.84 Cr
  monthlyExpenses: 18600000, // ₹1.86 Cr
  netProfit: 9800000, // ₹98 Lakh
  profitMargin: 34.5,
  pendingInvoices: 156,
  overduePayments: 23,
  cashFlow: 5400000, // ₹54 Lakh
  budgetUtilization: 78.5
};

const revenueBreakdown = [
  { category: 'Product Sales', amount: 18500000, percentage: 65.1, growth: 12.3 },
  { category: 'Services', amount: 5200000, percentage: 18.3, growth: 8.7 },
  { category: 'Contracts', amount: 3100000, percentage: 10.9, growth: -2.1 },
  { category: 'Other Income', amount: 1600000, percentage: 5.6, growth: 15.4 }
];

const expenseCategories = [
  { category: 'Raw Materials', amount: 8900000, budget: 9500000, percentage: 47.8 },
  { category: 'Labor Costs', amount: 4200000, budget: 4500000, percentage: 22.6 },
  { category: 'Manufacturing', amount: 2800000, budget: 3000000, percentage: 15.1 },
  { category: 'Operations', amount: 1500000, budget: 1800000, percentage: 8.1 },
  { category: 'Administration', amount: 1200000, budget: 1400000, percentage: 6.5 }
];

const pendingTransactions = [
  { id: 'INV-2024-001', client: 'Tech Solutions Inc', amount: 350000, dueDate: '2024-01-15', status: 'Overdue', type: 'Invoice' },
  { id: 'PAY-2024-002', vendor: 'Steel Suppliers Ltd', amount: 280000, dueDate: '2024-01-20', status: 'Due Soon', type: 'Payment' },
  { id: 'INV-2024-003', client: 'AutoMax Corp', amount: 420000, dueDate: '2024-01-25', status: 'Pending', type: 'Invoice' },
  { id: 'PAY-2024-004', vendor: 'Equipment Lease Co', amount: 150000, dueDate: '2024-01-18', status: 'Due Soon', type: 'Payment' },
  { id: 'INV-2024-005', client: 'Industrial Solutions', amount: 680000, dueDate: '2024-01-30', status: 'Pending', type: 'Invoice' }
];

const quarterlyTargets = [
  { metric: 'Revenue Target', current: 28400000, target: 30000000, unit: '₹' },
  { metric: 'Cost Reduction', current: 12.5, target: 15.0, unit: '%' },
  { metric: 'Profit Margin', current: 34.5, target: 35.0, unit: '%' },
  { metric: 'Collection Efficiency', current: 92.3, target: 95.0, unit: '%' }
];

const recentTransactions = [
  { id: 1, description: 'Payment received from Tech Solutions Inc', amount: 350000, type: 'Credit', time: '2 hours ago' },
  { id: 2, description: 'Raw material payment to Steel Corp', amount: -180000, type: 'Debit', time: '4 hours ago' },
  { id: 3, description: 'Service contract invoice generated', amount: 420000, type: 'Invoice', time: '6 hours ago' },
  { id: 4, description: 'Utility bill payment processed', amount: -45000, type: 'Debit', time: '8 hours ago' },
  { id: 5, description: 'Export order payment received', amount: 680000, type: 'Credit', time: '1 day ago' }
];

const accountsAlerts = [
  { id: 1, type: 'overdue', message: '3 invoices are overdue for payment collection', priority: 'High', time: '1 hour ago' },
  { id: 2, type: 'budget', message: 'Raw materials expense approaching budget limit', priority: 'Medium', time: '3 hours ago' },
  { id: 3, type: 'approval', message: 'Large payment approval required for equipment purchase', priority: 'High', time: '5 hours ago' },
  { id: 4, type: 'reconciliation', message: 'Bank reconciliation completed successfully', priority: 'Low', time: '1 day ago' }
];

export default function AccountsDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('current-month');

  const getStatusColor = (status) => {
    switch (status) {
      case 'Overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'Due Soon': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Pending': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Paid': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'Credit': return 'text-green-600';
      case 'Debit': return 'text-red-600';
      case 'Invoice': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'overdue': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'budget': return <DollarSign className="h-4 w-4 text-yellow-500" />;
      case 'approval': return <Clock className="h-4 w-4 text-orange-500" />;
      case 'reconciliation': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
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

  const formatCurrency = (amount) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)} L`;
    } else {
      return `₹${amount.toLocaleString()}`;
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700 rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Wallet className="h-10 w-10" />
              Accounts Dashboard
            </h1>
            <p className="text-emerald-100 mt-2">
              Financial overview, cash flow management, and accounting operations
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Calendar className="h-4 w-4 mr-2" />
              This Month
            </Button>
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Button>
          </div>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialStats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              +15.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialStats.netProfit)}</div>
            <p className="text-xs text-muted-foreground">
              Margin: {financialStats.profitMargin}%
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending Invoices</CardTitle>
            <FileText className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialStats.pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">
              {financialStats.overduePayments} overdue
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Cash Flow</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialStats.cashFlow)}</div>
            <p className="text-xs text-muted-foreground">
              Available balance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Revenue Breakdown
            </CardTitle>
            <CardDescription>
              Revenue sources and growth comparison
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueBreakdown.map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{item.category}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                      <Badge variant={item.growth >= 0 ? "default" : "destructive"}>
                        {item.growth >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                        {item.growth >= 0 ? '+' : ''}{item.growth}%
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{item.percentage}% of total</span>
                    </div>
                    <Progress value={item.percentage} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Expense Categories
            </CardTitle>
            <CardDescription>
              Budget utilization by category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {expenseCategories.map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{item.category}</h3>
                    <span className="text-sm font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{item.percentage}% of total</span>
                      <span>{((item.amount / item.budget) * 100).toFixed(1)}% of budget</span>
                    </div>
                    <Progress value={(item.amount / item.budget) * 100} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Transactions & Quarterly Targets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Transactions
            </CardTitle>
            <CardDescription>
              Outstanding invoices and payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingTransactions.map((transaction) => (
                <div key={transaction.id} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-sm">{transaction.id}</h3>
                      <Badge className={getStatusColor(transaction.status)}>
                        {transaction.status}
                      </Badge>
                    </div>
                    <Badge variant="outline">
                      {transaction.type}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    {transaction.client || transaction.vendor}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{formatCurrency(transaction.amount)}</span>
                    <span className="text-gray-500">Due: {transaction.dueDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quarterly Targets */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Quarterly Targets
            </CardTitle>
            <CardDescription>
              Progress against financial goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quarterlyTargets.map((target) => (
                <div key={target.metric} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">{target.metric}</h3>
                    <Badge variant={target.current >= target.target ? "default" : "secondary"}>
                      {target.current >= target.target ? "Achieved" : "In Progress"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Current: {target.unit === '₹' ? formatCurrency(target.current) : `${target.current}${target.unit}`}</span>
                      <span>Target: {target.unit === '₹' ? formatCurrency(target.target) : `${target.target}${target.unit}`}</span>
                    </div>
                    <Progress 
                      value={Math.min((target.current / target.target) * 100, 100)} 
                      className="h-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
            <CardDescription>
              Latest financial activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'Credit' ? 'bg-green-100' :
                    transaction.type === 'Debit' ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    {transaction.type === 'Credit' && <TrendingUp className="h-4 w-4 text-green-600" />}
                    {transaction.type === 'Debit' && <TrendingDown className="h-4 w-4 text-red-600" />}
                    {transaction.type === 'Invoice' && <FileText className="h-4 w-4 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.description}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className={`text-sm font-medium ${getTransactionColor(transaction.type)}`}>
                        {transaction.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(transaction.amount))}
                      </span>
                      <span className="text-xs text-gray-500">{transaction.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Accounts Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Accounts Alerts
            </CardTitle>
            <CardDescription>
              Important notifications and reminders
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {accountsAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border">
                  {getAlertIcon(alert.type)}
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