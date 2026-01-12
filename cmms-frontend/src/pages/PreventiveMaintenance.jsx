import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, Search, Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardBody, Button, Badge, Table, Modal } from '../components';
import useStore from '../store/useStore';

const PreventiveMaintenance = () => {
  const { pmSchedules, assets, users, addPMSchedule, updatePMSchedule } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPM, setSelectedPM] = useState(null);
  const [filters, setFilters] = useState({
    asset: '',
    frequency: '',
    status: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPMSchedules = pmSchedules.filter(pm => {
    const matchesSearch = pm.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAsset = !filters.asset || pm.assetId === filters.asset;
    const matchesFrequency = !filters.frequency || pm.frequency === filters.frequency;
    const matchesStatus = !filters.status || (filters.status === 'active' ? pm.isActive : !pm.isActive);
    
    return matchesSearch && matchesAsset && matchesFrequency && matchesStatus;
  });

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    return asset?.name || 'Unknown Asset';
  };

  const getAssigneeName = (assigneeId) => {
    const user = users.find(u => u.id === assigneeId);
    return user?.name || 'Unassigned';
  };

  const getFrequencyBadge = (frequency) => {
    const variants = {
      daily: { variant: 'info', label: 'Daily' },
      weekly: { variant: 'primary', label: 'Weekly' },
      monthly: { variant: 'success', label: 'Monthly' },
      quarterly: { variant: 'warning', label: 'Quarterly' },
      yearly: { variant: 'danger', label: 'Yearly' }
    };
    
    const config = variants[frequency] || { variant: 'default', label: frequency };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (isActive) => {
    return isActive ? 
      <Badge variant="success">Active</Badge> : 
      <Badge variant="default">Inactive</Badge>;
  };

  const getDueStatus = (nextDue) => {
    const now = new Date();
    const dueDate = new Date(nextDue);
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      return { variant: 'danger', label: 'Overdue', icon: AlertTriangle };
    } else if (daysUntilDue <= 7) {
      return { variant: 'warning', label: 'Due Soon', icon: Clock };
    } else {
      return { variant: 'success', label: 'On Schedule', icon: CheckCircle };
    }
  };

  const columns = [
    {
      key: 'title',
      title: 'Title',
      sortable: true
    },
    {
      key: 'assetId',
      title: 'Asset',
      render: (value) => getAssetName(value)
    },
    {
      key: 'frequency',
      title: 'Frequency',
      render: (value) => getFrequencyBadge(value)
    },
    {
      key: 'nextDue',
      title: 'Next Due',
      render: (value) => {
        const status = getDueStatus(value);
        return (
          <div className="flex items-center space-x-1">
            {status.icon && <status.icon className="w-4 h-4" />}
            <span>{new Date(value).toLocaleDateString()}</span>
            <Badge variant={status.variant} size="sm">{status.label}</Badge>
          </div>
        );
      },
      sortable: true
    },
    {
      key: 'assigneeId',
      title: 'Assignee',
      render: (value) => getAssigneeName(value)
    },
    {
      key: 'isActive',
      title: 'Status',
      render: (value) => getStatusBadge(value)
    }
  ];

  const handleRowClick = (pm) => {
    setSelectedPM(pm);
  };

  const handleToggleStatus = (pmId) => {
    const pm = pmSchedules.find(p => p.id === pmId);
    if (pm) {
      updatePMSchedule(pmId, { isActive: !pm.isActive });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preventive Maintenance</h1>
          <p className="text-gray-600 mt-1">Manage scheduled maintenance tasks</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create PM Schedule
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card hover>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total PM Schedules</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pmSchedules.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Schedules</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {pmSchedules.filter(pm => pm.isActive).length}
                </p>
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
                <p className="text-sm font-medium text-gray-600">Due This Week</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {pmSchedules.filter(pm => {
                    const now = new Date();
                    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                    return pm.isActive && new Date(pm.nextDue) <= weekFromNow;
                  }).length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-500">
                <Clock className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {pmSchedules.filter(pm => {
                    return pm.isActive && new Date(pm.nextDue) < new Date();
                  }).length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-500">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Calendar View */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Upcoming PM Schedule</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-medium text-gray-600 text-sm">
                {day}
              </div>
            ))}
            
            {Array.from({ length: 35 }, (_, i) => {
              const date = new Date();
              date.setDate(date.getDate() - date.getDay() + i);
              const dateStr = date.toISOString().split('T')[0];
              
              const pmForDay = pmSchedules.filter(pm => 
                pm.isActive && new Date(pm.nextDue).toDateString() === date.toDateString()
              );
              
              return (
                <div
                  key={i}
                  className={`
                    border rounded-lg p-2 min-h-[80px] 
                    ${date.getMonth() === new Date().getMonth() ? 'bg-white' : 'bg-gray-50'}
                    ${pmForDay.length > 0 ? 'border-primary-200' : 'border-gray-200'}
                  `}
                >
                  <div className="text-sm font-medium text-gray-900">
                    {date.getDate()}
                  </div>
                  {pmForDay.map(pm => (
                    <div
                      key={pm.id}
                      className="text-xs bg-primary-100 text-primary-800 rounded px-1 mt-1 truncate"
                      title={pm.title}
                    >
                      {pm.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Filters and Search */}
      <Card>
        <CardBody>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search PM schedules..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filters.asset}
                onChange={(e) => setFilters({ ...filters, asset: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Assets</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>

              <select
                value={filters.frequency}
                onChange={(e) => setFilters({ ...filters, frequency: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Frequencies</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>

              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* PM Schedules Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">
            PM Schedules ({filteredPMSchedules.length})
          </h3>
        </CardHeader>
        <CardBody>
          <Table
            columns={columns}
            data={filteredPMSchedules}
            onRowClick={handleRowClick}
            sortable
          />
        </CardBody>
      </Card>

      {/* Create PM Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create PM Schedule"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter PM schedule title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe the PM schedule"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                <option value="">Select Asset</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assignee
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                <option value="">Select Assignee</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Next Due Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Checklist Items
            </label>
            <div className="space-y-2">
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Add checklist item"
              />
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Add checklist item"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateModal(false)}>
              Create PM Schedule
            </Button>
          </div>
        </div>
      </Modal>

      {/* PM Detail Modal */}
      <Modal
        isOpen={!!selectedPM}
        onClose={() => setSelectedPM(null)}
        title={`PM Schedule: ${selectedPM?.title}`}
        size="xl"
      >
        {selectedPM && (
          <div className="space-y-6">
            {/* Status and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {getStatusBadge(selectedPM.isActive)}
                {getFrequencyBadge(selectedPM.frequency)}
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant={selectedPM.isActive ? 'warning' : 'success'}
                  onClick={() => handleToggleStatus(selectedPM.id)}
                >
                  {selectedPM.isActive ? 'Deactivate' : 'Activate'}
                </Button>
              </div>
            </div>

            {/* PM Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Asset</h4>
                <p className="text-gray-600">{getAssetName(selectedPM.assetId)}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Assignee</h4>
                <p className="text-gray-600">{getAssigneeName(selectedPM.assigneeId)}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Frequency</h4>
                <p className="text-gray-600">{selectedPM.frequency}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Next Due</h4>
                <p className="text-gray-600">{new Date(selectedPM.nextDue).toLocaleDateString()}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Last Completed</h4>
                <p className="text-gray-600">
                  {selectedPM.lastCompleted ? new Date(selectedPM.lastCompleted).toLocaleDateString() : 'Never'}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Created</h4>
                <p className="text-gray-600">{new Date(selectedPM.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Description */}
            {selectedPM.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{selectedPM.description}</p>
              </div>
            )}

            {/* Checklist */}
            {selectedPM.checklist && selectedPM.checklist.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Checklist</h4>
                <div className="space-y-2">
                  {selectedPM.checklist.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        readOnly
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className={item.completed ? 'line-through text-gray-500' : 'text-gray-900'}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PreventiveMaintenance;
