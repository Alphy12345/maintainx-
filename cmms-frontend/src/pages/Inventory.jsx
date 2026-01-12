import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, Search, AlertTriangle, Package, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardHeader, CardBody, Button, Badge, Table, Modal } from '../components';
import useStore from '../store/useStore';

const Inventory = () => {
  const { inventory, updateInventoryStock } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    stockLevel: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.partNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filters.category || item.category === filters.category;
    const matchesStockLevel = !filters.stockLevel || 
      (filters.stockLevel === 'low' && item.currentStock <= item.minStockLevel) ||
      (filters.stockLevel === 'normal' && item.currentStock > item.minStockLevel);
    
    return matchesSearch && matchesCategory && matchesStockLevel;
  });

  const getStockBadge = (current, min) => {
    if (current <= min) {
      return <Badge variant="danger">Low Stock</Badge>;
    } else if (current <= min * 1.5) {
      return <Badge variant="warning">Reorder Soon</Badge>;
    } else {
      return <Badge variant="success">In Stock</Badge>;
    }
  };

  const getStockStatus = (current, min, max) => {
    const percentage = (current / max) * 100;
    if (percentage <= 25) return { color: 'bg-red-500', width: percentage };
    if (percentage <= 50) return { color: 'bg-yellow-500', width: percentage };
    if (percentage <= 75) return { color: 'bg-blue-500', width: percentage };
    return { color: 'bg-green-500', width: percentage };
  };

  const categories = [...new Set(inventory.map(item => item.category))];
  const lowStockItems = inventory.filter(item => item.currentStock <= item.minStockLevel);

  const columns = [
    {
      key: 'name',
      title: 'Item Name',
      sortable: true
    },
    {
      key: 'partNumber',
      title: 'Part Number',
      sortable: true
    },
    {
      key: 'category',
      title: 'Category',
      sortable: true
    },
    {
      key: 'currentStock',
      title: 'Current Stock',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <span className="font-medium">{value}</span>
          {getStockBadge(value, row.minStockLevel)}
        </div>
      ),
      sortable: true
    },
    {
      key: 'minStockLevel',
      title: 'Min Level',
      sortable: true
    },
    {
      key: 'unitCost',
      title: 'Unit Cost',
      format: 'currency',
      sortable: true
    },
    {
      key: 'location',
      title: 'Location',
      sortable: true
    }
  ];

  const handleRowClick = (item) => {
    setSelectedItem(item);
  };

  const handleStockUpdate = (itemId, newStock) => {
    updateInventoryStock(itemId, parseInt(newStock));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="text-gray-600 mt-1">Manage parts and supplies inventory</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card hover>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{inventory.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{lowStockItems.length}</p>
              </div>
              <div className="p-3 rounded-full bg-red-500">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  ${inventory.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{categories.length}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-500">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-semibold text-gray-900">Low Stock Alert</h3>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockItems.map(item => (
                <div key={item.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{item.name}</h4>
                    <Badge variant="danger">Low Stock</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      Current: <span className="font-medium">{item.currentStock}</span>
                    </span>
                    <span className="text-gray-600">
                      Min: <span className="font-medium">{item.minStockLevel}</span>
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${Math.min((item.currentStock / item.maxStockLevel) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardBody>
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search inventory items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <select
                value={filters.stockLevel}
                onChange={(e) => setFilters({ ...filters, stockLevel: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Stock Levels</option>
                <option value="low">Low Stock</option>
                <option value="normal">Normal Stock</option>
              </select>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">
            Inventory Items ({filteredInventory.length})
          </h3>
        </CardHeader>
        <CardBody>
          <Table
            columns={columns}
            data={filteredInventory}
            onRowClick={handleRowClick}
            sortable
          />
        </CardBody>
      </Card>

      {/* Add Item Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Inventory Item"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter item name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe the item"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Part Number
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter part number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., pieces, gallons, kg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Cost
              </label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Stock
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Stock Level
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Stock Level
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Storage location"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supplier
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Supplier name"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateModal(false)}>
              Add Item
            </Button>
          </div>
        </div>
      </Modal>

      {/* Item Detail Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={`Inventory Item: ${selectedItem?.name}`}
        size="xl"
      >
        {selectedItem && (
          <div className="space-y-6">
            {/* Stock Status */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">Stock Level</h4>
                {getStockBadge(selectedItem.currentStock, selectedItem.minStockLevel)}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4">
                <div 
                  className={getStockStatus(selectedItem.currentStock, selectedItem.minStockLevel, selectedItem.maxStockLevel).color + ' h-4 rounded-full transition-all duration-300'}
                  style={{ width: `${getStockStatus(selectedItem.currentStock, selectedItem.minStockLevel, selectedItem.maxStockLevel).width}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>Current: {selectedItem.currentStock}</span>
                <span>Min: {selectedItem.minStockLevel}</span>
                <span>Max: {selectedItem.maxStockLevel}</span>
              </div>
            </div>

            {/* Quick Stock Update */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Quick Stock Update</h4>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  defaultValue={selectedItem.currentStock}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
                <Button onClick={() => {
                  const input = document.querySelector('input[type="number"]');
                  if (input) {
                    handleStockUpdate(selectedItem.id, input.value);
                  }
                }}>
                  Update
                </Button>
              </div>
            </div>

            {/* Item Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Part Number</h4>
                <p className="text-gray-600">{selectedItem.partNumber || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Category</h4>
                <p className="text-gray-600">{selectedItem.category}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Unit</h4>
                <p className="text-gray-600">{selectedItem.unit}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Unit Cost</h4>
                <p className="text-gray-600">${selectedItem.unitCost.toFixed(2)}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Location</h4>
                <p className="text-gray-600">{selectedItem.location || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Supplier</h4>
                <p className="text-gray-600">{selectedItem.supplier || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Total Value</h4>
                <p className="text-gray-600">
                  ${(selectedItem.currentStock * selectedItem.unitCost).toFixed(2)}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Last Updated</h4>
                <p className="text-gray-600">
                  {new Date(selectedItem.lastUpdated).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Description */}
            {selectedItem.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{selectedItem.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Inventory;
