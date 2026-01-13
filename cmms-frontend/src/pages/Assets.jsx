import React, { useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Filter, Search, Power, Wrench, CheckCircle, Upload, Paperclip, QrCode, ChevronDown, X } from 'lucide-react';
import { Card, CardHeader, CardBody, Button, Badge, Table, Modal } from '../components';
import useStore from '../store/useStore';

const Assets = () => {
  const { assets, locations, assetHealthEvents, updateAssetStatus, addAsset } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const pictureInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isDraggingPictures, setIsDraggingPictures] = useState(false);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [barcodeManual, setBarcodeManual] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: '',
    pictures: [],
    files: [],
    locationId: '',
    criticality: '',
    description: '',
    year: '',
    manufacturer: '',
    model: '',
    serialNumber: '',
    teamsInCharge: '',
    barcode: '',
    assetType: '',
    vendor: '',
    parts: '',
    parentAssetId: '',
  });
  const [filters, setFilters] = useState({
    criticality: '',
    status: '',
    downtimeReason: '',
    downtimeType: '',
    assetType: '',
    assetId: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  const latestDowntimeByAssetId = useMemo(() => {
    const byAsset = new Map();
    const list = Array.isArray(assetHealthEvents) ? assetHealthEvents : [];
    const sorted = [...list]
      .filter((e) => e && e.assetId && e.timestamp)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    for (const e of sorted) {
      if (e.status !== 'down') continue;
      byAsset.set(e.assetId, {
        downtimeType: e.downtimeType || '',
        downtimeReason: e.downtimeReason || '',
        timestamp: e.timestamp,
      });
    }
    return byAsset;
  }, [assetHealthEvents]);

  const criticalityOptions = useMemo(() => {
    const set = new Set();
    for (const a of (assets || [])) {
      if (a.criticality) set.add(a.criticality);
    }
    return [...set].sort();
  }, [assets]);

  const assetTypeOptions = useMemo(() => {
    const set = new Set();
    for (const a of (assets || [])) {
      if (a.assetType) set.add(a.assetType);
    }
    return [...set].sort();
  }, [assets]);

  const downtimeTypeOptions = useMemo(() => {
    const set = new Set();
    for (const e of (assetHealthEvents || [])) {
      if (e?.downtimeType) set.add(e.downtimeType);
    }
    return [...set].sort();
  }, [assetHealthEvents]);

  const downtimeReasonOptions = useMemo(() => {
    const set = new Set();
    for (const e of (assetHealthEvents || [])) {
      if (e?.downtimeReason) set.add(e.downtimeReason);
    }
    return [...set].sort();
  }, [assetHealthEvents]);

  const filteredAssets = (assets || []).filter((asset) => {
    const q = (searchTerm || '').trim().toLowerCase();
    const matchesSearch = !q
      || (asset.name || '').toLowerCase().includes(q)
      || (asset.description || '').toLowerCase().includes(q);

    const matchesCriticality = !filters.criticality || asset.criticality === filters.criticality;
    const matchesStatus = !filters.status || asset.status === filters.status;
    const matchesAssetType = !filters.assetType || asset.assetType === filters.assetType;
    const matchesAsset = !filters.assetId || asset.id === filters.assetId;

    const lastDown = latestDowntimeByAssetId.get(asset.id) || { downtimeType: '', downtimeReason: '' };
    const matchesDowntimeType = !filters.downtimeType || lastDown.downtimeType === filters.downtimeType;
    const matchesDowntimeReason = !filters.downtimeReason || lastDown.downtimeReason === filters.downtimeReason;

    return (
      matchesSearch
      && matchesCriticality
      && matchesStatus
      && matchesDowntimeType
      && matchesDowntimeReason
      && matchesAssetType
      && matchesAsset
    );
  });

  const getLocationName = (locationId) => {
    const location = locations.find(l => l.id === locationId);
    return location?.name || 'Unknown Location';
  };

  const getStatusBadge = (status) => {
    const variants = {
      running: { variant: 'success', label: 'Running', icon: CheckCircle },
      down: { variant: 'danger', label: 'Down', icon: Power },
      maintenance: { variant: 'warning', label: 'Under Maintenance', icon: Wrench }
    };
    
    const config = variants[status] || { variant: 'default', label: status };
    return (
      <div className="flex items-center space-x-1">
        {config.icon && <config.icon className="w-4 h-4" />}
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>
    );
  };

  const columns = [
    {
      key: 'name',
      title: 'Asset Name',
      sortable: true
    },
    {
      key: 'category',
      title: 'Category',
      sortable: true
    },
    {
      key: 'locationId',
      title: 'Location',
      render: (value) => getLocationName(value)
    },
    {
      key: 'status',
      title: 'Status',
      render: (value) => getStatusBadge(value)
    },
    {
      key: 'lastMaintenanceDate',
      title: 'Last Maintenance',
      format: 'date',
      sortable: true
    },
    {
      key: 'nextMaintenanceDate',
      title: 'Next Maintenance',
      format: 'date',
      sortable: true
    }
  ];

  const handleRowClick = (asset) => {
    setSelectedAsset(asset);
  };

  const handleStatusChange = (assetId, newStatus) => {
    updateAssetStatus(assetId, newStatus);
  };

  const generateBarcode = () => `BC-${Date.now()}-${Math.random().toString(16).slice(2, 8).toUpperCase()}`;

  const resetCreateForm = () => {
    setBarcodeManual(false);
    setCreateForm({
      name: '',
      pictures: [],
      files: [],
      locationId: '',
      criticality: '',
      description: '',
      year: '',
      manufacturer: '',
      model: '',
      serialNumber: '',
      teamsInCharge: '',
      barcode: generateBarcode(),
      assetType: '',
      vendor: '',
      parts: '',
      parentAssetId: '',
    });
  };

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const addPictures = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const mapped = await Promise.all(
      files.map(async (file) => {
        const dataUrl = await readFileAsDataUrl(file);
        return {
          id: `PIC-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
        };
      })
    );

    setCreateForm((prev) => ({
      ...prev,
      pictures: [...(prev.pictures || []), ...mapped],
    }));
  };

  const addFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const mapped = await Promise.all(
      files.map(async (file) => {
        const dataUrl = await readFileAsDataUrl(file);
        return {
          id: `FILE-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
        };
      })
    );

    setCreateForm((prev) => ({
      ...prev,
      files: [...(prev.files || []), ...mapped],
    }));
  };

  const removePicture = (id) => {
    setCreateForm((prev) => ({
      ...prev,
      pictures: (prev.pictures || []).filter((p) => p.id !== id),
    }));
  };

  const removeFile = (id) => {
    setCreateForm((prev) => ({
      ...prev,
      files: (prev.files || []).filter((f) => f.id !== id),
    }));
  };

  const handleCreateAsset = () => {
    const name = createForm.name.trim();
    if (!name) return;

    addAsset({
      name,
      description: createForm.description.trim() || undefined,
      locationId: createForm.locationId || undefined,
      criticality: createForm.criticality || undefined,
      year: createForm.year ? parseInt(createForm.year, 10) : undefined,
      manufacturer: createForm.manufacturer.trim() || undefined,
      model: createForm.model.trim() || undefined,
      serialNumber: createForm.serialNumber.trim() || undefined,
      teamsInCharge: createForm.teamsInCharge.trim() || undefined,
      barcode: createForm.barcode.trim() || undefined,
      assetType: createForm.assetType.trim() || undefined,
      vendor: createForm.vendor.trim() || undefined,
      parts: createForm.parts.trim() || undefined,
      parentAssetId: createForm.parentAssetId || undefined,
      pictures: createForm.pictures || [],
      files: createForm.files || [],
      status: 'running',
    });

    setShowCreateModal(false);
    resetCreateForm();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="text-gray-600 mt-1">Manage and monitor all physical assets</p>
        </div>
        <Button onClick={() => { resetCreateForm(); setShowCreateModal(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Asset
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card hover>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assets</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{assets.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Running</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {assets.filter(a => a.status === 'running').length}
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
                <p className="text-sm font-medium text-gray-600">Down</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {assets.filter(a => a.status === 'down').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-red-500">
                <Power className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card hover>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Maintenance</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {assets.filter(a => a.status === 'maintenance').length}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-500">
                <Wrench className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardBody>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700">
                <Filter className="h-4 w-4 text-gray-400" />
                Filters
              </div>

              <div className="relative">
                <select
                  value={filters.criticality}
                  onChange={(e) => setFilters((p) => ({ ...p, criticality: e.target.value }))}
                  className="appearance-none rounded-md border border-gray-200 bg-white px-3 py-1.5 pr-8 text-sm text-gray-700"
                >
                  <option value="">Criticality</option>
                  {criticalityOptions.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              <div className="relative">
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
                  className="appearance-none rounded-md border border-gray-200 bg-white px-3 py-1.5 pr-8 text-sm text-gray-700"
                >
                  <option value="">Status</option>
                  <option value="running">Running</option>
                  <option value="down">Down</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              <div className="relative">
                <select
                  value={filters.downtimeReason}
                  onChange={(e) => setFilters((p) => ({ ...p, downtimeReason: e.target.value }))}
                  className="appearance-none rounded-md border border-gray-200 bg-white px-3 py-1.5 pr-8 text-sm text-gray-700"
                >
                  <option value="">Downtime Reason</option>
                  {downtimeReasonOptions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              <div className="relative">
                <select
                  value={filters.downtimeType}
                  onChange={(e) => setFilters((p) => ({ ...p, downtimeType: e.target.value }))}
                  className="appearance-none rounded-md border border-gray-200 bg-white px-3 py-1.5 pr-8 text-sm text-gray-700"
                >
                  <option value="">Downtime Type</option>
                  {downtimeTypeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              <div className="relative">
                <select
                  value={filters.assetType}
                  onChange={(e) => setFilters((p) => ({ ...p, assetType: e.target.value }))}
                  className="appearance-none rounded-md border border-gray-200 bg-white px-3 py-1.5 pr-8 text-sm text-gray-700"
                >
                  <option value="">Asset Types</option>
                  {assetTypeOptions.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              <div className="relative">
                <select
                  value={filters.assetId}
                  onChange={(e) => setFilters((p) => ({ ...p, assetId: e.target.value }))}
                  className="appearance-none rounded-md border border-gray-200 bg-white px-3 py-1.5 pr-8 text-sm text-gray-700"
                >
                  <option value="">Asset</option>
                  {(assets || []).map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>

              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
                Add Filter
              </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search assets..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilters({ criticality: '', status: '', downtimeReason: '', downtimeType: '', assetType: '', assetId: '' })}
                  className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Assets Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">
            Assets ({filteredAssets.length})
          </h3>
        </CardHeader>
        <CardBody>
          <Table
            columns={columns}
            data={filteredAssets}
            onRowClick={handleRowClick}
            sortable
          />
        </CardBody>
      </Card>

      {/* Create Asset Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetCreateForm(); }}
        title="New Asset"
        size="xl"
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <input
              type="text"
              value={createForm.name}
              onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter Asset Name (Required)"
            />
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Pictures</div>
            <input
              ref={pictureInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addPictures(e.target.files);
                e.target.value = '';
              }}
            />
            <div
              className={`w-full rounded-md border-2 border-dashed p-6 transition-colors ${isDraggingPictures ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-gray-50'}`}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingPictures(true); }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingPictures(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingPictures(false); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingPictures(false);
                addPictures(e.dataTransfer.files);
              }}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-gray-500" />
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  onClick={() => pictureInputRef.current?.click()}
                >
                  Add or drag pictures
                </button>
                <div className="text-xs text-gray-500">PNG, JPG, GIF</div>
              </div>
            </div>

            {createForm.pictures && createForm.pictures.length > 0 && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                {createForm.pictures.map((p) => (
                  <div key={p.id} className="relative border border-gray-200 rounded-md overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => removePicture(p.id)}
                      className="absolute top-1 right-1 h-7 w-7 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center hover:bg-white"
                      aria-label="Remove"
                      title="Remove"
                    >
                      <X className="h-4 w-4 text-gray-600" />
                    </button>
                    <img src={p.dataUrl} alt={p.name} className="h-24 w-full object-cover" />
                    <div className="px-2 py-1 text-xs text-gray-700 truncate" title={p.name}>{p.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Files</div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = '';
              }}
            />
            <div
              className={`w-full rounded-md border-2 border-dashed p-6 transition-colors ${isDraggingFiles ? 'border-primary-500 bg-primary-50' : 'border-gray-300 bg-gray-50'}`}
              onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingFiles(true); }}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingFiles(true); }}
              onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingFiles(false); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingFiles(false);
                addFiles(e.dataTransfer.files);
              }}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                  <Paperclip className="h-5 w-5 text-gray-500" />
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Add or drag files
                </button>
                <div className="text-xs text-gray-500">Any file type</div>
              </div>
            </div>

            {createForm.files && createForm.files.length > 0 && (
              <div className="mt-3 space-y-2">
                {createForm.files.map((f) => (
                  <div key={f.id} className="flex items-center justify-between border border-gray-200 rounded-md px-3 py-2 bg-white">
                    <div className="min-w-0">
                      <div className="text-sm text-gray-900 truncate" title={f.name}>{f.name}</div>
                      <div className="text-xs text-gray-500">{Math.round((f.size || 0) / 1024)} KB</div>
                    </div>
                    <button type="button" onClick={() => removeFile(f.id)} className="h-8 w-8 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-50" title="Remove">
                      <X className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <div className="relative">
                <select
                  value={createForm.locationId}
                  onChange={(e) => setCreateForm((p) => ({ ...p, locationId: e.target.value }))}
                  className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Select Location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>{location.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Criticality</label>
              <div className="relative">
                <select
                  value={createForm.criticality}
                  onChange={(e) => setCreateForm((p) => ({ ...p, criticality: e.target.value }))}
                  className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Start typing...</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={createForm.description}
              onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Add a description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                type="number"
                value={createForm.year}
                onChange={(e) => setCreateForm((p) => ({ ...p, year: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Start typing..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <div className="relative">
                <input
                  type="text"
                  value={createForm.manufacturer}
                  onChange={(e) => {
                    const next = e.target.value;
                    setCreateForm((p) => ({ ...p, manufacturer: next, model: next.trim() ? p.model : '' }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Start typing to search or customize..."
                />
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                value={createForm.model}
                onChange={(e) => setCreateForm((p) => ({ ...p, model: e.target.value }))}
                disabled={!createForm.manufacturer.trim()}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 ${!createForm.manufacturer.trim() ? 'bg-gray-50 text-gray-500' : 'bg-white'}`}
                placeholder={createForm.manufacturer ? 'Enter model' : 'Enter manufacturer first'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
              <input
                type="text"
                value={createForm.serialNumber}
                onChange={(e) => setCreateForm((p) => ({ ...p, serialNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter serial number"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Teams in Charge</label>
              <input
                type="text"
                value={createForm.teamsInCharge}
                onChange={(e) => setCreateForm((p) => ({ ...p, teamsInCharge: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Start typing..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">QR Code/Barcode</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm text-gray-500">Barcode will be generated</div>
                <div className="mt-2 text-sm text-primary-600">or</div>
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeManual(true);
                    setCreateForm((p) => ({ ...p, barcode: p.barcode || generateBarcode() }));
                  }}
                  className="mt-1 text-sm text-primary-600 hover:text-primary-700"
                >
                  Input Manually
                </button>
                {barcodeManual && (
                  <button
                    type="button"
                    onClick={() => {
                      setBarcodeManual(false);
                      setCreateForm((p) => ({ ...p, barcode: generateBarcode() }));
                    }}
                    className="mt-1 ml-3 text-sm text-gray-600 hover:text-gray-700"
                  >
                    Use Generated
                  </button>
                )}
                <div className="mt-2">
                  <input
                    type="text"
                    value={createForm.barcode}
                    onChange={(e) => setCreateForm((p) => ({ ...p, barcode: e.target.value }))}
                    disabled={!barcodeManual}
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 ${barcodeManual ? 'bg-white' : 'bg-gray-50 text-gray-500'}`}
                    placeholder="Enter barcode"
                  />
                  {!barcodeManual && (
                    <div className="mt-1 text-xs text-gray-500">Generated: {createForm.barcode}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="h-40 w-40 bg-white border border-gray-200 rounded-md shadow-sm flex flex-col items-center justify-center gap-2">
                  <QrCode className="h-20 w-20 text-gray-300" />
                  <div className="text-[10px] text-gray-500 px-2 text-center break-words">{createForm.barcode || '—'}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asset Types</label>
              <div className="relative">
                <input
                  type="text"
                  value={createForm.assetType}
                  onChange={(e) => setCreateForm((p) => ({ ...p, assetType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Start typing..."
                />
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vendors</label>
              <input
                type="text"
                value={createForm.vendor}
                onChange={(e) => setCreateForm((p) => ({ ...p, vendor: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Start typing..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parts</label>
              <input
                type="text"
                value={createForm.parts}
                onChange={(e) => setCreateForm((p) => ({ ...p, parts: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Start typing..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Parent Asset</label>
              <div className="relative">
                <select
                  value={createForm.parentAssetId}
                  onChange={(e) => setCreateForm((p) => ({ ...p, parentAssetId: e.target.value }))}
                  className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Start typing...</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowCreateModal(false); resetCreateForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateAsset} disabled={!createForm.name.trim()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Asset Detail Modal */}
      <Modal
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAsset(null)}
        title={`Asset: ${selectedAsset?.name}`}
        size="xl"
      >
        {selectedAsset && (
          <div className="space-y-6">
            {/* Status and Actions */}
            <div className="flex items-center justify-between">
              {getStatusBadge(selectedAsset.status)}
              <div className="flex space-x-2">
                {selectedAsset.status === 'running' && (
                  <Button variant="warning" onClick={() => handleStatusChange(selectedAsset.id, 'maintenance')}>
                    Schedule Maintenance
                  </Button>
                )}
                {selectedAsset.status === 'down' && (
                  <Button onClick={() => handleStatusChange(selectedAsset.id, 'maintenance')}>
                    Start Repair
                  </Button>
                )}
                {selectedAsset.status === 'maintenance' && (
                  <Button onClick={() => handleStatusChange(selectedAsset.id, 'running')}>
                    Mark as Running
                  </Button>
                )}
              </div>
            </div>

            {/* Asset Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900">Category</h4>
                <p className="text-gray-600">{selectedAsset.category}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Location</h4>
                <p className="text-gray-600">{getLocationName(selectedAsset.locationId)}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Serial Number</h4>
                <p className="text-gray-600">{selectedAsset.serialNumber || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Model</h4>
                <p className="text-gray-600">{selectedAsset.model || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Manufacturer</h4>
                <p className="text-gray-600">{selectedAsset.manufacturer || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Install Date</h4>
                <p className="text-gray-600">
                  {selectedAsset.installDate ? new Date(selectedAsset.installDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Last Maintenance</h4>
                <p className="text-gray-600">
                  {selectedAsset.lastMaintenanceDate ? new Date(selectedAsset.lastMaintenanceDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Next Maintenance</h4>
                <p className="text-gray-600">
                  {selectedAsset.nextMaintenanceDate ? new Date(selectedAsset.nextMaintenanceDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            {/* Description */}
            {selectedAsset.description && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                <p className="text-gray-600">{selectedAsset.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Assets;
