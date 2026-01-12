import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Wrench, 
  AlertTriangle, 
  Power, 
  CheckCircle,
  Clock,
  Calendar,
  Activity
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../components';
import useStore from '../store/useStore';

const Dashboard = () => {
  const { 
    dashboardKPI, 
    chartData, 
    activities, 
    getOverdueWorkOrders, 
    getUpcomingPM,
    workOrders,
    assets
  } = useStore();

  const overdueWorkOrders = getOverdueWorkOrders();
  const upcomingPM = getUpcomingPM();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const KPICard = ({ title, value, icon: Icon, color, change }) => (
    <motion.div variants={itemVariants}>
      <Card hover>
        <CardBody className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              {change && (
                <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {change >= 0 ? '+' : ''}{change}% from last month
                </p>
              )}
            </div>
            <div className={`p-3 rounded-full ${color}`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening with your maintenance operations.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Open Work Orders"
          value={dashboardKPI.openWorkOrders}
          icon={Wrench}
          color="bg-blue-500"
          change={12}
        />
        <KPICard
          title="Overdue Work Orders"
          value={dashboardKPI.overdueWorkOrders}
          icon={AlertTriangle}
          color="bg-red-500"
          change={-5}
        />
        <KPICard
          title="Assets Down"
          value={dashboardKPI.assetsDown}
          icon={Power}
          color="bg-orange-500"
          change={0}
        />
        <KPICard
          title="PM Compliance"
          value={`${dashboardKPI.pmCompliance}%`}
          icon={CheckCircle}
          color="bg-green-500"
          change={3}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Orders by Status */}
        <motion.div variants={itemVariants}>
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
        </motion.div>

        {/* Downtime Trend */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Downtime Trend (Hours)</h3>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.downtimeTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="downtime" stroke="#ef4444" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                <Activity className="w-5 h-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-4">
                {activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-primary-600 rounded-full mt-2"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        </motion.div>

        {/* Upcoming PM */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Upcoming PM</h3>
                <Calendar className="w-5 h-5 text-gray-400" />
              </div>
            </CardHeader>
            <CardBody>
              <div className="space-y-3">
                {upcomingPM.slice(0, 4).map((pm) => {
                  const asset = assets.find(a => a.id === pm.assetId);
                  return (
                    <div key={pm.id} className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {asset?.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Due: {new Date(pm.nextDue).toLocaleDateString()}
                        </p>
                      </div>
                      <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
