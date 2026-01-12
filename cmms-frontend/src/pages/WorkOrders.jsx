import React, { useRef, useState } from 'react';
import { Plus, Search, ChevronDown, SlidersHorizontal, Upload, X } from 'lucide-react';
import { Button, Badge, Modal } from '../components';
import useStore from '../store/useStore';

const WorkOrders = () => {
  const { workOrders, assets, locations, users, currentUser, addWorkOrder, addUser, addLocation, addAsset, updateWorkOrder } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState('todo');
  const [sortBy, setSortBy] = useState('priority_desc');
  const fileInputRef = useRef(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    asset: '',
    assignee: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    locationName: '',
    assetName: '',
    assignee: '',
    estimatedHours: '',
    estimatedMinutes: '',
    dueDate: '',
    startDate: '',
    recurrence: 'does_not_repeat',
    workType: 'reactive',
    priority: 'low',
    attachments: [],
  });

  const priorityRank = {
    critical: 4,
    high: 3,
    medium: 2,
    low: 1,
  };

  const getAssetName = (assetId) => {
    const asset = assets.find(a => a.id === assetId);
    return asset?.name || 'Unknown Asset';
  };

  const getLocationName = (locationId) => {
    const location = locations.find(l => l.id === locationId);
    return location?.name || 'Unknown Location';
  };

  const getAssigneeName = (assigneeId) => {
    const user = users.find(u => u.id === assigneeId);
    return user?.name || 'Unassigned';
  };

  const getStatusBadge = (status) => {
    const variants = {
      open: { variant: 'warning', label: 'Open' },
      in_progress: { variant: 'info', label: 'In Progress' },
      completed: { variant: 'success', label: 'Completed' },
      cancelled: { variant: 'danger', label: 'Cancelled' }
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

  const isDoneStatus = (status) => status === 'completed' || status === 'cancelled';

  const filteredWorkOrders = workOrders
    .filter((wo) => {
      const matchesSearch = wo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        wo.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTab = activeTab === 'done'
        ? isDoneStatus(wo.status)
        : !isDoneStatus(wo.status);

      const matchesStatus = !filters.status || wo.status === filters.status;
      const matchesPriority = !filters.priority || wo.priority === filters.priority;
      const matchesAsset = !filters.asset || wo.assetId === filters.asset;
      const matchesAssignee = !filters.assignee || wo.assigneeId === filters.assignee;

      return matchesSearch && matchesTab && matchesStatus && matchesPriority && matchesAsset && matchesAssignee;
    })
    .sort((a, b) => {
      if (sortBy === 'priority_desc') return (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
      if (sortBy === 'priority_asc') return (priorityRank[a.priority] || 0) - (priorityRank[b.priority] || 0);
      if (sortBy === 'due_asc') return new Date(a.dueDate || '2999-12-31').getTime() - new Date(b.dueDate || '2999-12-31').getTime();
      if (sortBy === 'due_desc') return new Date(b.dueDate || '0000-01-01').getTime() - new Date(a.dueDate || '0000-01-01').getTime();
      return 0;
    });

  const selectedWorkOrder = workOrders.find((wo) => wo.id === selectedWorkOrderId) || null;

  const handleStatusChange = (workOrderId, newStatus) => {
    updateWorkOrder(workOrderId, { status: newStatus });
  };

  const resetCreateForm = () => {
    setCreateForm({
      title: '',
      description: '',
      locationName: '',
      assetName: '',
      assignee: '',
      estimatedHours: '',
      estimatedMinutes: '',
      dueDate: '',
      startDate: '',
      recurrence: 'does_not_repeat',
      workType: 'reactive',
      priority: 'low',
      attachments: [],
    });
  };

  const normalize = (s) => (s || '').trim().toLowerCase();

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
    const assigneeText = createForm.assignee.trim();

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

    let assigneeUser = null;
    if (assigneeText) {
      assigneeUser = users.find((u) => normalize(u.email) === normalize(assigneeText) || normalize(u.name) === normalize(assigneeText)) || null;
      if (!assigneeUser) {
        const looksLikeEmail = assigneeText.includes('@');
        assigneeUser = addUser({
          name: looksLikeEmail ? assigneeText.split('@')[0] : assigneeText,
          email: looksLikeEmail ? assigneeText : '',
          role: 'technician',
        });
      }
    }

    const hours = parseInt(createForm.estimatedHours || '0', 10);
    const minutes = parseInt(createForm.estimatedMinutes || '0', 10);
    const estimatedDuration = (Number.isFinite(hours) ? hours : 0) * 60 + (Number.isFinite(minutes) ? minutes : 0);

    const created = addWorkOrder({
      title,
      description: createForm.description.trim(),
      assetId: asset?.id || '',
      locationId: location?.id || '',
      priority: createForm.priority,
      status: 'open',
      assigneeId: assigneeUser?.id || '',
      createdBy: currentUser?.id || assigneeUser?.id || 'system',
      createdAt: new Date().toISOString(),
      dueDate: createForm.dueDate ? new Date(createForm.dueDate).toISOString() : undefined,
      startDate: createForm.startDate ? new Date(createForm.startDate).toISOString() : undefined,
      estimatedDuration: estimatedDuration || undefined,
      recurrence: createForm.recurrence,
      workType: createForm.workType,
      attachments: createForm.attachments || [],
    });

    setShowCreateModal(false);
    resetCreateForm();
    setActiveTab('todo');
    setSelectedWorkOrderId(created.id);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Work Orders"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-72 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
            />
          </div>
          <Button onClick={() => { resetCreateForm(); setShowCreateModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            New Work Order
          </Button>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search Work Orders"
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
                value={filters.assignee}
                onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
                className="appearance-none pl-3 pr-8 py-1.5 border border-gray-200 rounded-md bg-white text-sm text-gray-700 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Assigned To</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
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
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>{asset.name}</option>
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
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            <button
              type="button"
              onClick={() => setFilters({ status: '', priority: '', asset: '', assignee: '' })}
              className="px-3 py-1.5 border border-gray-200 rounded-md bg-white text-sm text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => { setActiveTab('todo'); setSelectedWorkOrderId(null); }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${activeTab === 'todo' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                To Do
              </button>
              <button
                type="button"
                onClick={() => { setActiveTab('done'); setSelectedWorkOrderId(null); }}
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
                <option value="priority_desc">Sort: Priority (High - Low)</option>
                <option value="priority_asc">Sort: Priority (Low - High)</option>
                <option value="due_asc">Sort: Due Date (Soonest)</option>
                <option value="due_desc">Sort: Due Date (Latest)</option>
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
              {activeTab === 'done' ? 'Done' : 'To Do'} ({filteredWorkOrders.length})
            </div>
          </div>

          <div className="max-h-[65vh] overflow-y-auto">
            {filteredWorkOrders.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                  <Plus className="w-5 h-5" />
                </div>
                <p className="mt-3 text-sm font-medium text-gray-900">You don't have any work orders</p>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700"
                >
                  Create the first work order
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredWorkOrders.map((wo) => {
                  const isSelected = wo.id === selectedWorkOrderId;
                  return (
                    <button
                      key={wo.id}
                      type="button"
                      onClick={() => setSelectedWorkOrderId(wo.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${isSelected ? 'bg-primary-50' : 'bg-white'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {wo.title}
                          </div>
                          <div className="mt-1 text-xs text-gray-500 truncate">
                            {wo.id} - {getAssetName(wo.assetId)} - {getLocationName(wo.locationId)}
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-1">
                          {getPriorityBadge(wo.priority)}
                          <div className="text-xs text-gray-500">
                            {wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : 'No due date'}
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
          {!selectedWorkOrder ? (
            <div className="h-full min-h-[65vh] flex items-center justify-center p-8 text-center">
              <div>
                <p className="text-sm font-medium text-gray-900">Select a work order</p>
                <p className="mt-1 text-sm text-gray-500">Details will appear here.</p>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">{selectedWorkOrder.id}</div>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">{selectedWorkOrder.title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {getStatusBadge(selectedWorkOrder.status)}
                    {getPriorityBadge(selectedWorkOrder.priority)}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {selectedWorkOrder.status === 'open' && (
                    <Button onClick={() => handleStatusChange(selectedWorkOrder.id, 'in_progress')}>
                      Start Work
                    </Button>
                  )}
                  {selectedWorkOrder.status === 'in_progress' && (
                    <Button onClick={() => handleStatusChange(selectedWorkOrder.id, 'completed')}>
                      Complete
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs font-medium text-gray-500">Asset</div>
                  <div className="text-sm text-gray-900 mt-1">{getAssetName(selectedWorkOrder.assetId)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500">Location</div>
                  <div className="text-sm text-gray-900 mt-1">{getLocationName(selectedWorkOrder.locationId)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500">Assigned To</div>
                  <div className="text-sm text-gray-900 mt-1">{getAssigneeName(selectedWorkOrder.assigneeId)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium text-gray-500">Due Date</div>
                  <div className="text-sm text-gray-900 mt-1">
                    {selectedWorkOrder.dueDate ? new Date(selectedWorkOrder.dueDate).toLocaleDateString() : 'Not set'}
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs font-medium text-gray-500">Description</div>
                <div className="text-sm text-gray-900 mt-1">
                  {selectedWorkOrder.description || 'No description'}
                </div>
              </div>

              {selectedWorkOrder.attachments && selectedWorkOrder.attachments.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-500">Files</div>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedWorkOrder.attachments.map((a) => {
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

              {selectedWorkOrder.checklist && selectedWorkOrder.checklist.length > 0 && (
                <div>
                  <div className="text-xs font-medium text-gray-500">Checklist</div>
                  <div className="mt-2 space-y-2">
                    {selectedWorkOrder.checklist.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          readOnly
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className={item.completed ? 'line-through text-gray-500 text-sm' : 'text-gray-900 text-sm'}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Work Order Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetCreateForm(); }}
        title="New Work Order"
        size="xl"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              What needs to be done? (Required)
            </label>
            <textarea
              rows={2}
              value={createForm.title}
              onChange={(e) => setCreateForm((p) => ({ ...p, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Describe the work"
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assign to
            </label>
            <input
              type="text"
              value={createForm.assignee}
              onChange={(e) => setCreateForm((p) => ({ ...p, assignee: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Type name or email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Time
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Hours</label>
                <input
                  type="number"
                  min={0}
                  value={createForm.estimatedHours}
                  onChange={(e) => setCreateForm((p) => ({ ...p, estimatedHours: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Minutes</label>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={createForm.estimatedMinutes}
                  onChange={(e) => setCreateForm((p) => ({ ...p, estimatedMinutes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={createForm.dueDate}
                onChange={(e) => setCreateForm((p) => ({ ...p, dueDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={createForm.startDate}
                onChange={(e) => setCreateForm((p) => ({ ...p, startDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recurrence</label>
              <select
                value={createForm.recurrence}
                onChange={(e) => setCreateForm((p) => ({ ...p, recurrence: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="does_not_repeat">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Work Type</label>
              <select
                value={createForm.workType}
                onChange={(e) => setCreateForm((p) => ({ ...p, workType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
              >
                <option value="reactive">Reactive</option>
                <option value="preventive">Preventive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <div className="inline-flex rounded-md border border-gray-200 overflow-hidden">
              {[
                { key: 'low', label: 'Low' },
                { key: 'medium', label: 'Medium' },
                { key: 'high', label: 'High' },
                { key: 'critical', label: 'Critical' },
              ].map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setCreateForm((prev) => ({ ...prev, priority: p.key }))}
                  className={`px-3 py-2 text-sm ${createForm.priority === p.key ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowCreateModal(false); resetCreateForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!createForm.title.trim()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkOrders;
