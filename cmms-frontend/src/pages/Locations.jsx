import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, MapPin, Building, Home, Layers } from 'lucide-react';
import { Card, CardHeader, CardBody, Button, Badge, Table, Modal } from '../components';
import useStore from '../store/useStore';

const Locations = () => {
  const { locations, assets } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Build hierarchical tree structure
  const buildLocationTree = (locations) => {
    const locationMap = {};
    const rootLocations = [];

    // Create map of all locations
    locations.forEach(location => {
      locationMap[location.id] = { ...location, children: [] };
    });

    // Build tree structure
    locations.forEach(location => {
      if (location.parentId) {
        const parent = locationMap[location.parentId];
        if (parent) {
          parent.children.push(locationMap[location.id]);
        }
      } else {
        rootLocations.push(locationMap[location.id]);
      }
    });

    return rootLocations;
  };

  const locationTree = buildLocationTree(locations);

  const getAssetCount = (locationId) => {
    return assets.filter(asset => asset.locationId === locationId).length;
  };

  const getLocationIcon = (type) => {
    const icons = {
      site: MapPin,
      building: Building,
      floor: Layers,
      room: Home
    };
    return icons[type] || MapPin;
  };

  const getTypeBadge = (type) => {
    const variants = {
      site: { variant: 'primary', label: 'Site' },
      building: { variant: 'success', label: 'Building' },
      floor: { variant: 'info', label: 'Floor' },
      room: { variant: 'warning', label: 'Room' }
    };
    
    const config = variants[type] || { variant: 'default', label: type };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.address?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const LocationTreeNode = ({ location, level = 0 }) => {
    const Icon = getLocationIcon(location.type);
    const assetCount = getAssetCount(location.id);
    
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: level * 0.1 }}
        className="select-none"
      >
        <div
          className={`
            flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors
            ${level > 0 ? 'ml-' + (level * 6) : ''}
          `}
          onClick={() => setSelectedLocation(location)}
        >
          <div className="flex items-center space-x-3">
            <Icon className="w-5 h-5 text-gray-400" />
            <div>
              <h4 className="font-medium text-gray-900">{location.name}</h4>
              {location.address && (
                <p className="text-sm text-gray-500">{location.address}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getTypeBadge(location.type)}
            <Badge variant="info">{assetCount} assets</Badge>
          </div>
        </div>
        
        {location.children && location.children.length > 0 && (
          <div className="mt-2">
            {location.children.map(child => (
              <LocationTreeNode key={child.id} location={child} level={level + 1} />
            ))}
          </div>
        )}
      </motion.div>
    );
  };

  const columns = [
    {
      key: 'name',
      title: 'Location Name',
      sortable: true
    },
    {
      key: 'type',
      title: 'Type',
      render: (value) => getTypeBadge(value)
    },
    {
      key: 'address',
      title: 'Address',
      sortable: true
    },
    {
      key: 'assetCount',
      title: 'Assets',
      render: (value, row) => (
        <Badge variant="info">{getAssetCount(row.id)}</Badge>
      )
    }
  ];

  const handleRowClick = (location) => {
    setSelectedLocation(location);
  };

  const getAssetsAtLocation = (locationId) => {
    return assets.filter(asset => asset.locationId === locationId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-600 mt-1">Manage facility locations and hierarchy</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Location
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card hover>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Locations</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{locations.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <MapPin className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sites</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {locations.filter(l => l.type === 'site').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500">
                <MapPin className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Buildings</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {locations.filter(l => l.type === 'building').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500">
                <Building className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assets</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{assets.length}</p>
              </div>
              <div className="p-3 rounded-full bg-orange-500">
                <Home className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardBody>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tree View */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Location Hierarchy</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {locationTree.map(location => (
                <LocationTreeNode key={location.id} location={location} />
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Table View */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">
              All Locations ({filteredLocations.length})
            </h3>
          </CardHeader>
          <CardBody>
            <Table
              columns={columns}
              data={filteredLocations}
              onRowClick={handleRowClick}
              sortable
            />
          </CardBody>
        </Card>
      </div>

      {/* Create Location Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add Location"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter location name"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                <option value="">Select Type</option>
                <option value="site">Site</option>
                <option value="building">Building</option>
                <option value="floor">Floor</option>
                <option value="room">Room</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Parent Location
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500">
                <option value="">None (Root Level)</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>{location.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter address (optional)"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => setShowCreateModal(false)}>
              Add Location
            </Button>
          </div>
        </div>
      </Modal>

      {/* Location Detail Modal */}
      <Modal
        isOpen={!!selectedLocation}
        onClose={() => setSelectedLocation(null)}
        title={`Location: ${selectedLocation?.name}`}
        size="xl"
      >
        {selectedLocation && (
          <div className="space-y-6">
            {/* Location Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Type</h4>
                <p className="text-gray-600">{getTypeBadge(selectedLocation.type)}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Parent Location</h4>
                <p className="text-gray-600">
                  {selectedLocation.parentId 
                    ? locations.find(l => l.id === selectedLocation.parentId)?.name || 'Unknown'
                    : 'None (Root Level)'
                  }
                </p>
              </div>
            </div>

            {selectedLocation.address && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Address</h4>
                <p className="text-gray-600">{selectedLocation.address}</p>
              </div>
            )}

            {/* Assets at this Location */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">
                Assets at this Location ({getAssetsAtLocation(selectedLocation.id).length})
              </h4>
              <div className="space-y-2">
                {getAssetsAtLocation(selectedLocation.id).map(asset => (
                  <div key={asset.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h5 className="font-medium text-gray-900">{asset.name}</h5>
                      <p className="text-sm text-gray-600">{asset.category}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        asset.status === 'running' ? 'bg-green-100 text-green-800' :
                        asset.status === 'down' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {asset.status}
                      </span>
                    </div>
                  </div>
                ))}
                {getAssetsAtLocation(selectedLocation.id).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No assets found at this location
                  </div>
                )}
              </div>
            </div>

            {/* Child Locations */}
            {selectedLocation.children && selectedLocation.children.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-4">
                  Child Locations ({selectedLocation.children.length})
                </h4>
                <div className="space-y-2">
                  {selectedLocation.children.map(child => (
                    <div key={child.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {React.createElement(getLocationIcon(child.type), { className: "w-5 h-5 text-gray-400" })}
                        <div>
                          <h5 className="font-medium text-gray-900">{child.name}</h5>
                          <p className="text-sm text-gray-600">{child.type}</p>
                        </div>
                      </div>
                      <Badge variant="info">{getAssetCount(child.id)} assets</Badge>
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

export default Locations;
