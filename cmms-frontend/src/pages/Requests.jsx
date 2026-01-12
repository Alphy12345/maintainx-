import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronDown, SlidersHorizontal, Upload, X, ArrowRight } from 'lucide-react';
import { Button, Badge, Modal } from '../components';
import useStore from '../store/useStore';

const Requests = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    requests,
    assets,
    locations,
    users,
    currentUser,
    addRequest,
    updateRequest,
    deleteRequest,
    addUser,
    addLocation,
    addAsset,
    convertRequestToWorkOrder,
  } = useStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState(null);
  const [activeTab, setActiveTab] = useState('open');
  const [sortBy, setSortBy] = useState('created_desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    asset: '',
    location: ''
  });

  const fileInputRef = useRef(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    locationName: '',
    assetName: '',
    requester: '',
    priority: 'low',
    attachments: [],
  });

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const shouldOpen = params.get('new') === '1';
    if (shouldOpen) {
      setShowCreateModal(true);
      params.delete('new');
      const next = params.toString();
      navigate({ pathname: location.pathname, search: next ? `?${next}` : '' }, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  const normalize = (s) => (s || '').trim().toLowerCase();

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    return asset?.name || 'Unknown Asset';
  };

  const getLocationName = (locationId) => {
    const location = locations.find(l => l.id === locationId);
    return location?.name || 'Unknown Location';
  };

  const getRequesterName = (requesterId) => {
    const user = users.find(u => u.id === requesterId);
    return user?.name || 'Unknown';
  };

  const getStatusBadge = (status) => {
    const variants = {
      open: { variant: 'warning', label: 'Open' },
      in_review: { variant: 'info', label: 'In Review' },
      approved: { variant: 'primary', label: 'Approved' },
      rejected: { variant: 'danger', label: 'Rejected' },
      completed: { variant: 'success', label: 'Completed' },
      cancelled: { variant: 'danger', label: 'Cancelled' },
      converted: { variant: 'info', label: 'Converted' },
    };

    const config = variants[status] || { variant: 'default', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      low: { variant: 'default', label: 'Low' },
      medium: { variant: 'info', label: 'Medium' },
      high: { variant: 'warning', label: 'High' },
      critical: { variant: 'danger', label: 'Critical' }
    };

    const config = variants[priority] || { variant: 'default', label: priority };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isDoneStatus = (status) => status === 'completed' || status === 'cancelled' || status === 'rejected' || status === 'converted';

  const filteredRequests = requests
    .filter((r) => {
      const matchesSearch = (r.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.id || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTab = activeTab === 'done' ? isDoneStatus(r.status) : !isDoneStatus(r.status);

      const matchesStatus = !filters.status || r.status === filters.status;
      const matchesPriority = !filters.priority || r.priority === filters.priority;
      const matchesAsset = !filters.asset || r.assetId === filters.asset;
      const matchesLocation = !filters.location || r.locationId === filters.location;

      return matchesSearch && matchesTab && matchesStatus && matchesPriority && matchesAsset && matchesLocation;
    })
    .sort((a, b) => {
      if (sortBy === 'created_desc') return new Date(b.createdAt || '1970-01-01').getTime() - new Date(a.createdAt || '1970-01-01').getTime();
      if (sortBy === 'created_asc') return new Date(a.createdAt || '2999-12-31').getTime() - new Date(b.createdAt || '2999-12-31').getTime();
      if (sortBy === 'priority_desc') {
        const rank = { critical: 4, high: 3, medium: 2, low: 1 };
        return (rank[b.priority] || 0) - (rank[a.priority] || 0);
      }
      if (sortBy === 'priority_asc') {
        const rank = { critical: 4, high: 3, medium: 2, low: 1 };
        return (rank[a.priority] || 0) - (rank[b.priority] || 0);
      }
      return 0;
    });

  const selectedRequest = requests.find((r) => r.id === selectedRequestId) || null;

  const resetCreateForm = () => {
    setCreateForm({
      title: '',
      description: '',
      locationName: '',
      assetName: '',
      requester: '',
      priority: 'low',
      attachments: [],
    });
  };

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const addAttachments = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    const mapped = await Promise.all(
      files.map(async (file) => {
        const dataUrl = await readFileAsDataUrl(file);
        return {
          id: `ATT-${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl,
        };
      })
    );

    setCreateForm((prev) => ({
      ...prev,
      attachments: [...(prev.attachments || []), ...mapped],
    }));
  };

  const removeAttachment = (id) => {
    setCreateForm((prev) => ({
      ...prev,
      attachments: (prev.attachments || []).filter((a) => a.id !== id),
    }));
  };

  const handleCreate = () => {
    const title = createForm.title.trim();
    if (!title) return;

    const locationName = createForm.locationName.trim();
    const assetName = createForm.assetName.trim();
    const requesterText = createForm.requester.trim();

    let location = null;
    if (locationName) {
      location = locations.find((l) => normalize(l.name) === normalize(locationName)) || null;
      if (!location) {
        location = addLocation({ name: locationName, type: 'site' });
      }
    }

    let asset = null;
    if (assetName) {
      asset = assets.find((a) => normalize(a.name) === normalize(assetName)) || null;
      if (!asset) {
        asset = addAsset({
          name: assetName,
          category: 'Uncategorized',
          locationId: location?.id || '',
          status: 'running',
        });
      }
    }

    let requesterUser = null;
    if (requesterText) {
      requesterUser = users.find((u) => normalize(u.email) === normalize(requesterText) || normalize(u.name) === normalize(requesterText)) || null;
      if (!requesterUser) {
        const looksLikeEmail = requesterText.includes('@');
        requesterUser = addUser({
          name: looksLikeEmail ? requesterText.split('@')[0] : requesterText,
          email: looksLikeEmail ? requesterText : '',
          role: 'viewer',
        });
      }
    }

    const created = addRequest({
      title,
      description: createForm.description.trim(),
      locationId: location?.id || '',
      assetId: asset?.id || '',
      priority: createForm.priority,
      status: 'open',
      requesterId: requesterUser?.id || currentUser?.id || 'system',
      createdBy: requesterUser?.id || currentUser?.id || 'system',
      createdAt: new Date().toISOString(),
      attachments: createForm.attachments || [],
    });

    setShowCreateModal(false);
    resetCreateForm();
    setActiveTab('open');
    setSelectedRequestId(created.id);
  };

  const handleConvert = (requestId) => {
    const created = convertRequestToWorkOrder(requestId);
    if (!created) return;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Requests</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Requests"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
            />
          </div>
          <Button onClick={() => { resetCreateForm(); setShowCreateModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </Button>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search Requests"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
          />
        </div>
      </div>

      {/* Filter chips + Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-4 py-3 flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 px-2 py-1 border border-gray-200 rounded-md text-sm text-gray-700 bg-white">
              <SlidersHorizontal className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-medium">Filters</span>
            </div>

            <div className="relative">
              <select
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                className="appearance-none pl-3 pr-8 py-1.5 border border-gray-200 rounded-md bg-white text-sm text-gray-700 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            <div className="relative">
              <select
                value={filters.asset}
                onChange={(e) => setFilters({ ...filters, asset: e.target.value })}
                className="appearance-none pl-3 pr-8 py-1.5 border border-gray-200 rounded-md bg-white text-sm text-gray-700 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Asset</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            <div className="relative">
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="appearance-none pl-3 pr-8 py-1.5 border border-gray-200 rounded-md bg-white text-sm text-gray-700 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            <div className="relative">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="appearance-none pl-3 pr-8 py-1.5 border border-gray-200 rounded-md bg-white text-sm text-gray-700 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Status</option>
                <option value="open">Open</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="converted">Converted</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            <button
              type="button"
              onClick={() => setFilters({ status: '', priority: '', asset: '', location: '' })}
              className="px-3 py-1.5 border border-gray-200 rounded-md bg-white text-sm text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => { setActiveTab('open'); setSelectedRequestId(null); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${activeTab === 'open' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Open
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('done'); setSelectedRequestId(null); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${activeTab === 'done' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                Done
              </button>
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 border border-gray-200 rounded-md bg-white text-sm text-gray-700 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="created_desc">Sort: Newest</option>
                <option value="created_asc">Sort: Oldest</option>
                <option value="priority_desc">Sort: Priority (High - Low)</option>
                <option value="priority_asc">Sort: Priority (Low - High)</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Split view */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left list */}
        <div className="lg:col-span-4 bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">
              {activeTab === 'done' ? 'Done' : 'Open'} ({filteredRequests.length})
            </div>
          </div>

          <div className="max-h-[65vh] overflow-y-auto">
            {filteredRequests.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                  <Plus className="w-5 h-5" />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-900">You don't have any requests</p>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  Create the first request
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredRequests.map((r) => {
                  const isSelected = r.id === selectedRequestId;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setSelectedRequestId(r.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${isSelected ? 'bg-primary-50' : 'bg-white'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {r.title || 'Request'}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 truncate">
                            {r.id} - {r.assetId ? getAssetName(r.assetId) : 'No asset'} - {r.locationId ? getLocationName(r.locationId) : 'No location'}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 truncate">
                            Requested by {r.requesterId ? getRequesterName(r.requesterId) : 'Unknown'}
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {getPriorityBadge(r.priority)}
                          <div className="text-xs text-gray-500">
                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right detail */}
        <div className="lg:col-span-8 bg-white border border-gray-200 rounded-lg overflow-hidden">
          {!selectedRequest ? (
            <div className="h-full min-h-[65vh] flex items-center justify-center p-8 text-center">
              <div>
                <p className="text-sm font-medium text-gray-900">Select a request</p>
                <p className="mt-1 text-sm text-gray-500">Details will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">{selectedRequest.id}</div>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">{selectedRequest.title || 'Request'}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {getStatusBadge(selectedRequest.status)}
                    {getPriorityBadge(selectedRequest.priority)}
                  </div>
                </div>

                <div className="shrink-0 flex flex-wrap items-center gap-2 justify-end">
                  {selectedRequest.status !== 'converted' && !isDoneStatus(selectedRequest.status) && (
                    <Button
                      variant="secondary"
                      onClick={() => updateRequest(selectedRequest.id, { status: 'in_review' })}
                    >
                      In Review
                    </Button>
                  )}

                  {selectedRequest.status !== 'converted' && !isDoneStatus(selectedRequest.status) && (
                    <Button
                      onClick={() => updateRequest(selectedRequest.id, { status: 'approved' })}
                    >
                      Approve
                    </Button>
                  )}

                  {selectedRequest.status === 'approved' && (
                    <Button
                      variant="success"
                      onClick={() => handleConvert(selectedRequest.id)}
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Convert to Work Order
                    </Button>
                  )}

                  {selectedRequest.status !== 'converted' && selectedRequest.status !== 'completed' && (
                    <Button
                      variant="ghost"
                      onClick={() => updateRequest(selectedRequest.id, { status: 'completed' })}
                    >
                      Mark Completed
                    </Button>
                  )}

                  <Button
                    variant="danger"
                    onClick={() => {
                      deleteRequest(selectedRequest.id);
                      setSelectedRequestId(null);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-gray-500">Asset</div>
                  <div className="text-sm text-gray-900 mt-1">
                    {selectedRequest.assetId ? getAssetName(selectedRequest.assetId) : 'Not set'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500">Location</div>
                  <div className="text-sm text-gray-900 mt-1">
                    {selectedRequest.locationId ? getLocationName(selectedRequest.locationId) : 'Not set'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500">Requester</div>
                  <div className="text-sm text-gray-900 mt-1">
                    {selectedRequest.requesterId ? getRequesterName(selectedRequest.requesterId) : 'Unknown'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500">Created</div>
                  <div className="text-sm text-gray-900 mt-1">
                    {selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleString() : 'Unknown'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-500">Description</div>
                <div className="text-sm text-gray-900 mt-1">
                  {selectedRequest.description || 'No description'}
                </div>
              </div>

              {selectedRequest.convertedWorkOrderId && (
                <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                  <div className="text-xs font-medium text-gray-500">Converted Work Order</div>
                  <div className="text-sm text-gray-900 mt-1">{selectedRequest.convertedWorkOrderId}</div>
                </div>
              )}

              {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-500">Files</div>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedRequest.attachments.map((a) => {
                      const isImage = typeof a?.type === 'string' && a.type.startsWith('image/');
                      return (
                        <div key={a.id} className="border border-gray-200 rounded-md overflow-hidden bg-white">
                          {isImage ? (
                            <img src={a.dataUrl} alt={a.name} className="h-24 w-full object-cover" />
                          ) : (
                            <div className="h-24 w-full flex items-center justify-center text-xs text-gray-600 px-2 text-center">
                              {a.name}
                            </div>
                          )}
                          <div className="px-2 py-1 text-xs text-gray-700 truncate" title={a.name}>{a.name}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Request Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetCreateForm(); }}
        title="New Request"
        size="xl"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What do you need? (Required)
            </label>
            <textarea
              rows={2}
              value={createForm.title}
              onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe the request"
            />
          </div>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addAttachments(e.target.files);
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
                addAttachments(e.dataTransfer.files);
              }}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-gray-500" />
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-primary-600 hover:text-primary-700"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Add or drag pictures
                </button>
                <div className="text-xs text-gray-500">PNG, JPG, GIF</div>
              </div>
            </div>

            {createForm.attachments && createForm.attachments.length > 0 && (
              <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                {createForm.attachments.map((a) => (
                  <div key={a.id} className="relative border border-gray-200 rounded-md overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => removeAttachment(a.id)}
                      className="absolute top-1 right-1 h-7 w-7 rounded-full bg-white/90 border border-gray-200 flex items-center justify-center hover:bg-white"
                      aria-label="Remove"
                      title="Remove"
                    >
                      <X className="h-4 w-4 text-gray-600" />
                    </button>
                    <img src={a.dataUrl} alt={a.name} className="h-24 w-full object-cover" />
                    <div className="px-2 py-1 text-xs text-gray-700 truncate" title={a.name}>{a.name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={4}
              value={createForm.description}
              onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Add a description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                type="text"
                value={createForm.locationName}
                onChange={(e) => setCreateForm((p) => ({ ...p, locationName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Start typing..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Asset
              </label>
              <input
                type="text"
                value={createForm.assetName}
                onChange={(e) => setCreateForm((p) => ({ ...p, assetName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Start typing..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Requested by
              </label>
              <input
                type="text"
                value={createForm.requester}
                onChange={(e) => setCreateForm((p) => ({ ...p, requester: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="Type name or email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={createForm.priority}
                onChange={(e) => setCreateForm((p) => ({ ...p, priority: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowCreateModal(false); resetCreateForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Request</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Requests;
