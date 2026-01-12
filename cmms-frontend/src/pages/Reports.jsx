import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Calendar, Download, Filter, TrendingUp, Clock, Wrench, CheckCircle } from 'lucide-react';
import { Card, CardHeader, CardBody, Button } from '../components';
import useStore from '../store/useStore';

const Reports = () => {
  const { chartData, workOrders, assets, pmSchedules } = useStore();
  const [dateRange, setDateRange] = useState({
    start: '2024-01-01',
    end: '2024-12-31'
  });

  const [reportingForm, setReportingForm] = useState({
    reportTitle: '',
    fromDate: '',
    toDate: '',
    preparedBy: '',
    notes: ''
  });
  const [submittedReporting, setSubmittedReporting] = useState(null);

  // Calculate additional metrics
  const calculateMTTR = () => {
    const completedOrders = workOrders.filter(wo => wo.status === 'completed' && wo.actualDuration);
    if (completedOrders.length === 0) return 0;
    
    const totalDuration = completedOrders.reduce((sum, wo) => sum + wo.actualDuration, 0);
    return (totalDuration / completedOrders.length / 60).toFixed(1); // Convert to hours
  };

  const calculatePMCompletionRate = () => {
    const activePMs = pmSchedules.filter(pm => pm.isActive);
    if (activePMs.length === 0) return 0;
    
    const completedThisMonth = activePMs.filter(pm => {
      const lastCompleted = new Date(pm.lastCompleted);
      const now = new Date();
      return lastCompleted.getMonth() === now.getMonth() && 
             lastCompleted.getFullYear() === now.getFullYear();
    });
    
    return ((completedThisMonth.length / activePMs.length) * 100).toFixed(1);
  };

  const assetStatusData = [
    { name: 'Running', value: assets.filter(a => a.status === 'running').length, color: '#10b981' },
    { name: 'Down', value: assets.filter(a => a.status === 'down').length, color: '#ef4444' },
    { name: 'Maintenance', value: assets.filter(a => a.status === 'maintenance').length, color: '#f59e0b' }
  ];

  const priorityData = [
    { priority: 'Critical', count: workOrders.filter(wo => wo.priority === 'critical').length },
    { priority: 'High', count: workOrders.filter(wo => wo.priority === 'high').length },
    { priority: 'Medium', count: workOrders.filter(wo => wo.priority === 'medium').length },
    { priority: 'Low', count: workOrders.filter(wo => wo.priority === 'low').length }
  ];

  const monthlyTrendData = [
    { month: 'Jul', workOrders: 45, completed: 42, pmCompliance: 92 },
    { month: 'Aug', workOrders: 52, completed: 48, pmCompliance: 88 },
    { month: 'Sep', workOrders: 38, completed: 36, pmCompliance: 95 },
    { month: 'Oct', workOrders: 61, completed: 58, pmCompliance: 91 },
    { month: 'Nov', workOrders: 47, completed: 45, pmCompliance: 89 },
    { month: 'Dec', workOrders: 55, completed: 52, pmCompliance: 87.5 }
  ];

  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'];

  const exportReport = () => {
    // Mock export functionality
    alert('Report export functionality would be implemented here');
  };

  const handleReportingChange = (field) => (e) => {
    setReportingForm((prev) => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleSubmitReporting = (e) => {
    e.preventDefault();
    setSubmittedReporting({
      ...reportingForm,
      submittedAt: new Date().toISOString()
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive maintenance analytics and insights</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="secondary">
            <Calendar className="w-4 h-4 mr-2" />
            {dateRange.start} to {dateRange.end}
          </Button>
          <Button onClick={exportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card hover>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mean Time to Repair</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{calculateMTTR()} hrs</p>
                <p className="text-xs text-green-600 mt-1">↓ 12% from last month</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">PM Completion Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{calculatePMCompletionRate()}%</p>
                <p className="text-xs text-red-600 mt-1">↓ 2.5% from last month</p>
              </div>
              <div className="p-3 rounded-full bg-green-500">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Work Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{workOrders.length}</p>
                <p className="text-xs text-green-600 mt-1">↑ 8% from last month</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500">
                <Wrench className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Asset Uptime</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">94.2%</p>
                <p className="text-xs text-green-600 mt-1">↑ 1.2% from last month</p>
              </div>
              <div className="p-3 rounded-full bg-orange-500">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Orders by Status */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Work Orders by Status</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.workOrdersByStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Asset Status Distribution */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Asset Status Distribution</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {assetStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Reporting</h3>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmitReporting} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Title</label>
                <input
                  type="text"
                  value={reportingForm.reportTitle}
                  onChange={handleReportingChange('reportTitle')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prepared By</label>
                <input
                  type="text"
                  value={reportingForm.preparedBy}
                  onChange={handleReportingChange('preparedBy')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                <input
                  type="date"
                  value={reportingForm.fromDate}
                  onChange={handleReportingChange('fromDate')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                <input
                  type="date"
                  value={reportingForm.toDate}
                  onChange={handleReportingChange('toDate')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={reportingForm.notes}
                onChange={handleReportingChange('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
              />
            </div>

            <div className="flex items-center justify-end">
              <Button type="submit">Save Reporting</Button>
            </div>
          </form>

          {submittedReporting && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Submitted Reporting</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="text-gray-700"><span className="font-medium">Report Title:</span> {submittedReporting.reportTitle || '-'}</div>
                <div className="text-gray-700"><span className="font-medium">Prepared By:</span> {submittedReporting.preparedBy || '-'}</div>
                <div className="text-gray-700"><span className="font-medium">From Date:</span> {submittedReporting.fromDate || '-'}</div>
                <div className="text-gray-700"><span className="font-medium">To Date:</span> {submittedReporting.toDate || '-'}</div>
                <div className="text-gray-700 md:col-span-2"><span className="font-medium">Notes:</span> {submittedReporting.notes || '-'}</div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Monthly Performance Trend</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="workOrders" stroke="#3b82f6" name="Work Orders" strokeWidth={2} />
                <Line type="monotone" dataKey="completed" stroke="#10b981" name="Completed" strokeWidth={2} />
                <Line type="monotone" dataKey="pmCompliance" stroke="#f59e0b" name="PM Compliance %" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        {/* Work Orders by Priority */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Work Orders by Priority</h3>
          </CardHeader>
          <CardBody>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={priorityData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="priority" type="category" />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      {/* Downtime Trend */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Downtime Trend (Last 7 Weeks)</h3>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.downtimeTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="downtime" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Downtime (Hours)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* Work Orders per Asset */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Work Orders per Asset</h3>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData.workOrdersPerAsset}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="assetName" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      {/* PM Completion Rate */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">PM Completion Rate Trend</h3>
        </CardHeader>
        <CardBody>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.pmCompletionRate}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="rate" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Completion Rate (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
};

export default Reports;
