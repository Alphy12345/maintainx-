import React, { useRef, useState } from 'react';
import { Plus, Search, ChevronDown, SlidersHorizontal, Upload, X, ListChecks, Calendar, MapPin, User } from 'lucide-react';
import { Button, Badge, Modal } from '../components';
import useStore from '../store/useStore';

const WorkOrders = () => {
  const { workOrders, assets, locations, users, categories, inventory, procedures, currentUser, addWorkOrder, addUser, addLocation, addAsset, addProcedure, updateWorkOrder } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssetsModal, setShowAssetsModal] = useState(false);
  const [showAddAssetModal, setShowAddAssetModal] = useState(false);
  const [assetSearch, setAssetSearch] = useState('');
  const [newAssetForm, setNewAssetForm] = useState({
    name: '',
    locationId: '',
    status: 'running',
    category: 'Uncategorized',
    description: '',
  });
  const [showProcedureModal, setShowProcedureModal] = useState(false);
  const [showCreateProcedureModal, setShowCreateProcedureModal] = useState(false);
  const [procedureSearch, setProcedureSearch] = useState('');
  const [selectedProcedureId, setSelectedProcedureId] = useState('');
  const [newProcedureForm, setNewProcedureForm] = useState({
    name: '',
    description: '',
    fields: [],
  });
  const [selectedWorkOrderId, setSelectedWorkOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState('todo');
  const [sortBy, setSortBy] = useState('priority_desc');
  const fileInputRef = useRef(null);
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);
  const [openFilter, setOpenFilter] = useState('');
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [locationSearch, setLocationSearch] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    asset: '',
    assignee: '',
    location: '',
    dueDatePreset: '',
    dueDateCustom: '',
    categoryId: '',
    part: '',
  });
  const [extraFilterKeys, setExtraFilterKeys] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    locationName: '',
    assetName: '',
    procedure: '',
    assignee: '',
    estimatedHours: '',
    estimatedMinutes: '',
    dueDate: '',
    startDate: '',
    recurrence: 'does_not_repeat',
    workType: 'reactive',
    priority: 'low',
    parts: '',
    categoryId: '',
    vendorId: '',
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

  const getProcedureName = (procedureId) => {
    const p = (procedures || []).find((x) => x.id === procedureId);
    return p?.name || '';
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

  const isSameDay = (a, b) => (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );

  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const endOfDay = (d) => {
    const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    x.setHours(23, 59, 59, 999);
    return x;
  };

  const matchesDueDateFilter = (wo) => {
    if (!filters.dueDatePreset) return true;
    if (!wo.dueDate) return false;

    const due = new Date(wo.dueDate);
    if (Number.isNaN(due.getTime())) return false;

    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const tomorrow = new Date(todayStart);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = startOfDay(tomorrow);
    const tomorrowEnd = endOfDay(tomorrow);
    const in7 = new Date(todayStart);
    in7.setDate(in7.getDate() + 7);
    const in30 = new Date(todayStart);
    in30.setDate(in30.getDate() + 30);

    if (filters.dueDatePreset === 'today') return due >= todayStart && due <= todayEnd;
    if (filters.dueDatePreset === 'tomorrow') return due >= tomorrowStart && due <= tomorrowEnd;
    if (filters.dueDatePreset === 'next_7') return due >= todayStart && due < endOfDay(in7);
    if (filters.dueDatePreset === 'next_30') return due >= todayStart && due < endOfDay(in30);
    if (filters.dueDatePreset === 'this_month') {
      return due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth();
    }
    if (filters.dueDatePreset === 'overdue') return due < todayStart;
    if (filters.dueDatePreset === 'custom') {
      if (!filters.dueDateCustom) return true;
      const custom = new Date(filters.dueDateCustom);
      if (Number.isNaN(custom.getTime())) return true;
      return isSameDay(due, custom);
    }
    return true;
  };

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
      const matchesLocation = !filters.location || wo.locationId === filters.location;
      const matchesDueDate = matchesDueDateFilter(wo);

      const matchesCategory = !filters.categoryId || wo.categoryId === filters.categoryId;
      const matchesPart = !filters.part || wo.partId === filters.part;

      return matchesSearch && matchesTab && matchesStatus && matchesPriority && matchesAsset && matchesAssignee && matchesLocation && matchesDueDate && matchesCategory && matchesPart;
    })
    .sort((a, b) => {
      if (sortBy === 'priority_desc') return (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
      if (sortBy === 'priority_asc') return (priorityRank[a.priority] || 0) - (priorityRank[b.priority] || 0);
      if (sortBy === 'due_asc') return new Date(a.dueDate || '2999-12-31').getTime() - new Date(b.dueDate || '2999-12-31').getTime();
      if (sortBy === 'due_desc') return new Date(b.dueDate || '0000-01-01').getTime() - new Date(a.dueDate || '0000-01-01').getTime();
      return 0;
    });

  const selectedWorkOrder = workOrders.find((wo) => wo.id === selectedWorkOrderId) || null;

  const clearAllFilters = () => {
    setFilters({ status: '', priority: '', asset: '', assignee: '', location: '', dueDatePreset: '', dueDateCustom: '', categoryId: '', part: '' });
    setExtraFilterKeys([]);
    setAssigneeSearch('');
    setLocationSearch('');
    setOpenFilter('');
  };

  const handleStatusChange = (workOrderId, newStatus) => {
    updateWorkOrder(workOrderId, { status: newStatus });
  };

  const resetCreateForm = () => {
    setCreateForm({
      title: '',
      description: '',
      locationName: '',
      assetName: '',
      procedure: '',
      assignee: '',
      estimatedHours: '',
      estimatedMinutes: '',
      dueDate: '',
      startDate: '',
      recurrence: 'does_not_repeat',
      workType: 'reactive',
      priority: 'low',
      parts: '',
      categoryId: '',
      vendorId: '',
      attachments: [],
    });
  };

  const resetNewAssetForm = () => {
    setNewAssetForm({
      name: '',
      locationId: '',
      status: 'running',
      category: 'Uncategorized',
      description: '',
    });
  };

  const resetNewProcedureForm = () => {
    setNewProcedureForm({
      name: '',
      description: '',
      fields: [
        { id: `PF-${Date.now()}-${Math.random().toString(16).slice(2)}`, name: 'Field Name', type: 'text', required: false },
      ],
    });
  };

  const procedureFieldTypes = [
    { key: 'checkbox', label: 'Checkbox' },
    { key: 'text', label: 'Text Field' },
    { key: 'number', label: 'Number Field' },
    { key: 'amount', label: 'Amount ($)' },
    { key: 'multiple_choice', label: 'Multiple Choice' },
    { key: 'checklist', label: 'Checklist' },
    { key: 'inspection_check', label: 'Inspection Check' },
  ];

  const addProcedureField = () => {
    setNewProcedureForm((p) => ({
      ...p,
      fields: [
        ...(p.fields || []),
        { id: `PF-${Date.now()}-${Math.random().toString(16).slice(2)}`, name: '', type: 'text', required: false },
      ],
    }));
  };

  const ensureFieldTypeDefaults = (field) => {
    if (!field) return field;
    if (field.type === 'multiple_choice' || field.type === 'checklist') {
      const existing = Array.isArray(field.options) ? field.options : [];
      if (existing.length > 0) return { ...field, options: existing };
      return {
        ...field,
        options: [
          { id: `OPT-${Date.now()}-1`, label: 'Option 1' },
          { id: `OPT-${Date.now()}-2`, label: 'Option 2' },
        ],
      };
    }
    if (field.type === 'inspection_check') {
      return {
        ...field,
        options: [
          { id: 'pass', label: 'Pass' },
          { id: 'flag', label: 'Flag' },
          { id: 'fail', label: 'Fail' },
        ],
      };
    }

    if ('options' in field) {
      const { options, ...rest } = field;
      return rest;
    }
    return field;
  };

  const updateProcedureField = (fieldId, updates) => {
    setNewProcedureForm((p) => ({
      ...p,
      fields: (p.fields || []).map((f) => {
        if (f.id !== fieldId) return f;
        const next = ensureFieldTypeDefaults({ ...f, ...updates });
        return next;
      }),
    }));
  };

  const removeProcedureField = (fieldId) => {
    setNewProcedureForm((p) => ({
      ...p,
      fields: (p.fields || []).filter((f) => f.id !== fieldId),
    }));
  };

  const addFieldOption = (fieldId) => {
    setNewProcedureForm((p) => ({
      ...p,
      fields: (p.fields || []).map((f) => {
        if (f.id !== fieldId) return f;
        const existing = Array.isArray(f.options) ? f.options : [];
        const nextIndex = existing.length + 1;
        return {
          ...f,
          options: [...existing, { id: `OPT-${Date.now()}-${Math.random().toString(16).slice(2)}`, label: `Option ${nextIndex}` }],
        };
      }),
    }));
  };

  const updateFieldOption = (fieldId, optionId, label) => {
    setNewProcedureForm((p) => ({
      ...p,
      fields: (p.fields || []).map((f) => {
        if (f.id !== fieldId) return f;
        return {
          ...f,
          options: (f.options || []).map((o) => (o.id === optionId ? { ...o, label } : o)),
        };
      }),
    }));
  };

  const removeFieldOption = (fieldId, optionId) => {
    setNewProcedureForm((p) => ({
      ...p,
      fields: (p.fields || []).map((f) => {
        if (f.id !== fieldId) return f;
        return {
          ...f,
          options: (f.options || []).filter((o) => o.id !== optionId),
        };
      }),
    }));
  };

  const handleCreateProcedureFromModal = () => {
    const name = (newProcedureForm.name || '').trim();
    if (!name) return;

    const created = addProcedure({
      name,
      description: (newProcedureForm.description || '').trim(),
      fields: (newProcedureForm.fields || []).map((f) => ({
        id: f.id,
        name: (f.name || '').trim(),
        type: f.type,
        required: !!f.required,
        options: Array.isArray(f.options) ? f.options.map((o) => ({ id: o.id, label: (o.label || '').trim() })).filter((o) => o.label) : undefined,
      })).filter((f) => f.name),
      createdBy: currentUser?.id || 'system',
      createdAt: new Date().toISOString(),
    });

    setCreateForm((p) => ({ ...p, procedure: created.id }));
    setSelectedProcedureId(created.id);
    setShowCreateProcedureModal(false);
    setShowProcedureModal(false);
    resetNewProcedureForm();
  };

  const handleCreateAssetFromModal = () => {
    const name = (newAssetForm.name || '').trim();
    if (!name) return;

    const created = addAsset({
      name,
      category: newAssetForm.category || 'Uncategorized',
      locationId: newAssetForm.locationId || '',
      status: newAssetForm.status || 'running',
      description: (newAssetForm.description || '').trim() || undefined,
    });

    setCreateForm((p) => ({
      ...p,
      assetName: created.name,
      locationName: p.locationName || (created.locationId ? (locations.find((l) => l.id === created.locationId)?.name || '') : ''),
    }));

    setShowAddAssetModal(false);
    resetNewAssetForm();
    setShowAssetsModal(false);
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
              <button
                type="button"
                onClick={() => setOpenFilter(openFilter === 'assignee' ? '' : 'assignee')}
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
              >
                <User className="h-4 w-4 text-gray-500" />
                Assigned To
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {openFilter === 'assignee' && (
                <div className="absolute z-50 mt-2 w-72 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <input
                      value={assigneeSearch}
                      onChange={(e) => setAssigneeSearch(e.target.value)}
                      placeholder="Search"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => { setFilters((p) => ({ ...p, assignee: '' })); setOpenFilter(''); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Unassigned / Any
                    </button>
                    {users
                      .filter((u) => (u?.name || '').toLowerCase().includes(assigneeSearch.toLowerCase()) || (u?.email || '').toLowerCase().includes(assigneeSearch.toLowerCase()))
                      .map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => { setFilters((p) => ({ ...p, assignee: u.id })); setOpenFilter(''); }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {u.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenFilter(openFilter === 'dueDate' ? '' : 'dueDate')}
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
              >
                <Calendar className="h-4 w-4 text-gray-500" />
                Due Date
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {openFilter === 'dueDate' && (
                <div className="absolute z-50 mt-2 w-72 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden">
                  <div className="p-2">
                    {[ 
                      { key: '', label: 'Any' },
                      { key: 'today', label: 'Today' },
                      { key: 'tomorrow', label: 'Tomorrow' },
                      { key: 'next_7', label: 'Next 7 Days' },
                      { key: 'next_30', label: 'Next 30 Days' },
                      { key: 'this_month', label: 'This Month' },
                      { key: 'overdue', label: 'Overdue' },
                      { key: 'custom', label: 'Custom Date' },
                    ].map((opt) => (
                      <button
                        key={opt.key || 'any'}
                        type="button"
                        onClick={() => {
                          setFilters((p) => ({ ...p, dueDatePreset: opt.key, dueDateCustom: opt.key === 'custom' ? p.dueDateCustom : '' }));
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                      >
                        {opt.label}
                      </button>
                    ))}

                    {filters.dueDatePreset === 'custom' && (
                      <div className="pt-2">
                        <input
                          type="date"
                          value={filters.dueDateCustom}
                          onChange={(e) => setFilters((p) => ({ ...p, dueDateCustom: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
                        />
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setOpenFilter('')}
                            className="px-3 py-1.5 border border-gray-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
                          >
                            Done
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenFilter(openFilter === 'location' ? '' : 'location')}
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
              >
                <MapPin className="h-4 w-4 text-gray-500" />
                Location
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {openFilter === 'location' && (
                <div className="absolute z-50 mt-2 w-72 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <input
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      placeholder="Search"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => { setFilters((p) => ({ ...p, location: '' })); setOpenFilter(''); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Any
                    </button>
                    {locations
                      .filter((l) => (l?.name || '').toLowerCase().includes(locationSearch.toLowerCase()))
                      .map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => { setFilters((p) => ({ ...p, location: l.id })); setOpenFilter(''); }}
                          className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          {l.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenFilter(openFilter === 'priority' ? '' : 'priority')}
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
              >
                Priority
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {openFilter === 'priority' && (
                <div className="absolute z-50 mt-2 w-56 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden">
                  {[
                    { key: '', label: 'Any' },
                    { key: 'low', label: 'Low' },
                    { key: 'medium', label: 'Medium' },
                    { key: 'high', label: 'High' },
                    { key: 'critical', label: 'Critical' },
                  ].map((opt) => (
                    <button
                      key={opt.key || 'any'}
                      type="button"
                      onClick={() => { setFilters((p) => ({ ...p, priority: opt.key })); setOpenFilter(''); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenFilter(openFilter === 'addFilter' ? '' : 'addFilter')}
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
              >
                <span className="text-lg leading-none">+</span>
                Add Filter
              </button>

              {openFilter === 'addFilter' && (
                <div className="absolute z-50 mt-2 w-72 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden">
                  <div className="max-h-72 overflow-y-auto p-2">
                    {[
                      { key: 'asset', label: 'Asset' },
                      { key: 'status', label: 'Status' },
                      { key: 'categoryId', label: 'Category' },
                      { key: 'part', label: 'Part' },
                    ].filter((f) => !extraFilterKeys.includes(f.key)).map((f) => (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => { setExtraFilterKeys((p) => [...p, f.key]); setOpenFilter(''); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                      >
                        {f.label}
                      </button>
                    ))}
                    {extraFilterKeys.length === 4 && (
                      <div className="px-3 py-2 text-sm text-gray-500">No more filters</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {extraFilterKeys.includes('asset') && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenFilter(openFilter === 'asset' ? '' : 'asset')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
                >
                  Asset
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                {openFilter === 'asset' && (
                  <div className="absolute z-50 mt-2 w-72 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => { setFilters((p) => ({ ...p, asset: '' })); setOpenFilter(''); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Any
                    </button>
                    {assets.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => { setFilters((p) => ({ ...p, asset: a.id })); setOpenFilter(''); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {a.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {extraFilterKeys.includes('status') && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenFilter(openFilter === 'status' ? '' : 'status')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
                >
                  Status
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                {openFilter === 'status' && (
                  <div className="absolute z-50 mt-2 w-56 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden">
                    {[
                      { key: '', label: 'Any' },
                      { key: 'open', label: 'Open' },
                      { key: 'in_progress', label: 'In Progress' },
                      { key: 'completed', label: 'Completed' },
                      { key: 'cancelled', label: 'Cancelled' },
                    ].map((opt) => (
                      <button
                        key={opt.key || 'any'}
                        type="button"
                        onClick={() => { setFilters((p) => ({ ...p, status: opt.key })); setOpenFilter(''); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {extraFilterKeys.includes('categoryId') && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenFilter(openFilter === 'categoryId' ? '' : 'categoryId')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
                >
                  Category
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                {openFilter === 'categoryId' && (
                  <div className="absolute z-50 mt-2 w-72 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => { setFilters((p) => ({ ...p, categoryId: '' })); setOpenFilter(''); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Any
                    </button>
                    {(categories || []).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setFilters((p) => ({ ...p, categoryId: c.id })); setOpenFilter(''); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {extraFilterKeys.includes('part') && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenFilter(openFilter === 'part' ? '' : 'part')}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
                >
                  Part
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>
                {openFilter === 'part' && (
                  <div className="absolute z-50 mt-2 w-72 rounded-md border border-gray-200 bg-white shadow-lg overflow-hidden">
                    <button
                      type="button"
                      onClick={() => { setFilters((p) => ({ ...p, part: '' })); setOpenFilter(''); }}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Any
                    </button>
                    {(inventory || []).map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setFilters((prev) => ({ ...prev, part: p.id })); setOpenFilter(''); }}
                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={clearAllFilters}
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
              <button
                type="button"
                onClick={() => { setShowAssetsModal(true); setAssetSearch(''); }}
                className="mt-2 inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700"
              >
                <span className="text-lg leading-none">+</span>
                Add multiple assets
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Procedure</label>
            <div className="border border-gray-200 rounded-md p-4 bg-white">
              {createForm.procedure ? (
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <ListChecks className="h-4 w-4 text-gray-500" />
                      <span className="font-medium truncate">{getProcedureName(createForm.procedure)}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-500 truncate">Procedure attached</div>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setCreateForm((p) => ({ ...p, procedure: '' })); setSelectedProcedureId(''); }}
                      className="px-3 py-1.5 border border-gray-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowProcedureModal(true); setProcedureSearch(''); setSelectedProcedureId(createForm.procedure || ''); }}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-primary-500 text-primary-700 rounded-md text-sm hover:bg-primary-50"
                    >
                      Change
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <ListChecks className="h-4 w-4 text-gray-500" />
                    Create or attach new Form, Procedure or Checklist
                  </div>
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => { setShowProcedureModal(true); setProcedureSearch(''); setSelectedProcedureId(''); }}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-primary-500 text-primary-700 rounded-md text-sm hover:bg-primary-50"
                    >
                      <span className="text-lg leading-none">+</span>
                      Add Procedure
                    </button>
                  </div>
                </div>
              )}
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

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Files</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-2 px-4 py-2 border border-primary-500 text-primary-700 rounded-md text-sm hover:bg-primary-50"
              >
                <Upload className="h-4 w-4" />
                Attach files
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Parts</label>
              <div className="relative">
                <select
                  value={createForm.parts}
                  onChange={(e) => setCreateForm((p) => ({ ...p, parts: e.target.value }))}
                  className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="">Start typing...</option>
                  {(inventory || []).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Categories</label>
              <div className="relative">
                <select
                  value={createForm.categoryId}
                  onChange={(e) => setCreateForm((p) => ({ ...p, categoryId: e.target.value }))}
                  className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="">Start typing...</option>
                  {(categories || []).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vendors</label>
              <div className="relative">
                <select
                  value={createForm.vendorId}
                  onChange={(e) => setCreateForm((p) => ({ ...p, vendorId: e.target.value }))}
                  className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="">Start typing...</option>
                  <option value="vendor-1">Vendor 1</option>
                  <option value="vendor-2">Vendor 2</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
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

      <Modal
        isOpen={showAssetsModal}
        onClose={() => setShowAssetsModal(false)}
        title="Assets"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                placeholder="Search"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
              />
            </div>
            <Button
              onClick={() => { setShowAddAssetModal(true); resetNewAssetForm(); }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Asset
            </Button>
          </div>

          <div className="border border-gray-200 rounded-md overflow-hidden">
            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100">
              {assets
                .filter((a) => (a?.name || '').toLowerCase().includes(assetSearch.toLowerCase()))
                .map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => { setCreateForm((p) => ({ ...p, assetName: a.name })); setShowAssetsModal(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-gray-500">{a.id}</div>
                  </button>
                ))}

              {assets.filter((a) => (a?.name || '').toLowerCase().includes(assetSearch.toLowerCase())).length === 0 && (
                <div className="px-3 py-6 text-sm text-gray-500 text-center">No assets found.</div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showAddAssetModal}
        onClose={() => { setShowAddAssetModal(false); resetNewAssetForm(); }}
        title="Add New Asset"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset Name (Required)</label>
            <input
              value={newAssetForm.name}
              onChange={(e) => setNewAssetForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
              placeholder="Start typing..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <div className="relative">
                <select
                  value={newAssetForm.locationId}
                  onChange={(e) => setNewAssetForm((p) => ({ ...p, locationId: e.target.value }))}
                  className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="">None</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <div className="relative">
                <select
                  value={newAssetForm.status}
                  onChange={(e) => setNewAssetForm((p) => ({ ...p, status: e.target.value }))}
                  className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
                >
                  <option value="running">Running</option>
                  <option value="down">Down</option>
                  <option value="idle">Idle</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              value={newAssetForm.category}
              onChange={(e) => setNewAssetForm((p) => ({ ...p, category: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
              placeholder="Uncategorized"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={newAssetForm.description}
              onChange={(e) => setNewAssetForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
              placeholder="Add a description"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowAddAssetModal(false); resetNewAssetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateAssetFromModal} disabled={!newAssetForm.name.trim()}>
              Save Asset
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showProcedureModal}
        onClose={() => { setShowProcedureModal(false); setProcedureSearch(''); setSelectedProcedureId(''); }}
        title="Add Procedure"
        size="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={procedureSearch}
                onChange={(e) => setProcedureSearch(e.target.value)}
                placeholder="Search Procedure Templates"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm bg-white"
              />
            </div>
            <button
              type="button"
              onClick={() => { setShowCreateProcedureModal(true); resetNewProcedureForm(); }}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              + Create a New Procedure
            </button>
          </div>

          {(procedures || []).length === 0 ? (
            <div className="border border-gray-200 rounded-md p-10 bg-white text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-primary-50 flex items-center justify-center">
                <ListChecks className="h-7 w-7 text-primary-600" />
              </div>
              <div className="mt-6 text-2xl font-bold text-gray-900">Start adding Procedures</div>
              <div className="mt-2 text-sm text-gray-600">
                Press <span className="font-medium text-primary-600">+ Create a New Procedure</span> button above to add your first Procedure.
              </div>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-md overflow-hidden">
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                {(procedures || [])
                  .filter((p) => (p?.name || '').toLowerCase().includes(procedureSearch.toLowerCase()))
                  .map((p) => {
                    const selected = selectedProcedureId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedProcedureId(p.id)}
                        className={`w-full text-left px-3 py-3 text-sm hover:bg-gray-50 ${selected ? 'bg-primary-50' : 'bg-white'}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate">{p.name}</div>
                            <div className="text-xs text-gray-500 truncate">{(p.fields || []).length} fields</div>
                          </div>
                          <div className={`h-4 w-4 rounded border ${selected ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-300'}`} />
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowProcedureModal(false); setProcedureSearch(''); setSelectedProcedureId(''); }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!selectedProcedureId) return;
                setCreateForm((p) => ({ ...p, procedure: selectedProcedureId }));
                setShowProcedureModal(false);
                setProcedureSearch('');
              }}
              disabled={!selectedProcedureId || (procedures || []).length === 0}
            >
              Add Procedure
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showCreateProcedureModal}
        onClose={() => { setShowCreateProcedureModal(false); resetNewProcedureForm(); }}
        title="Create a New Procedure"
        size="xl"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Enter Procedure Name</label>
            <input
              value={newProcedureForm.name}
              onChange={(e) => setNewProcedureForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
              placeholder="Procedure name"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => setNewProcedureForm((p) => ({ ...p, description: p.description || '' }))}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              + Add Description
            </button>
            {newProcedureForm.description !== '' && (
              <textarea
                rows={3}
                value={newProcedureForm.description}
                onChange={(e) => setNewProcedureForm((p) => ({ ...p, description: e.target.value }))}
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
                placeholder="Description"
              />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-12 space-y-4">
              {(newProcedureForm.fields || []).map((f) => (
                <div key={f.id} className="border border-gray-200 rounded-md p-4 bg-white">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-5">
                      <input
                        value={f.name}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
                        placeholder="Field Name"
                      />
                    </div>
                    <div className="md:col-span-5">
                      <div className="relative">
                        <select
                          value={f.type}
                          onChange={(e) => updateProcedureField(f.id, { type: e.target.value })}
                          className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
                        >
                          {procedureFieldTypes.map((t) => (
                            <option key={t.key} value={t.key}>{t.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    <div className="md:col-span-2 flex items-center justify-end gap-3">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={!!f.required}
                          onChange={(e) => updateProcedureField(f.id, { required: e.target.checked })}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        Required
                      </label>
                    </div>
                  </div>

                  {f.type === 'text' && (
                    <div className="mt-3">
                      <textarea
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
                        placeholder="Text will be entered here"
                        readOnly
                      />
                    </div>
                  )}

                  {f.type === 'checkbox' && (
                    <div className="mt-3">
                      <div className="h-10" />
                    </div>
                  )}

                  {f.type === 'number' && (
                    <div className="mt-3">
                      <input
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
                        placeholder="Number will be entered here"
                        readOnly
                      />
                    </div>
                  )}

                  {f.type === 'amount' && (
                    <div className="mt-3">
                      <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                        <div className="px-3 py-2 text-gray-600 bg-gray-50">$</div>
                        <input
                          className="flex-1 px-3 py-2 focus:ring-primary-500 focus:border-primary-500 bg-white"
                          placeholder="Amount will be entered here"
                          readOnly
                        />
                      </div>
                    </div>
                  )}

                  {(f.type === 'multiple_choice' || f.type === 'checklist') && (
                    <div className="mt-3 space-y-2">
                      {(Array.isArray(f.options) ? f.options : []).map((o) => (
                        <div key={o.id} className="flex items-center gap-2">
                          <div className="text-gray-400 select-none">⋮⋮</div>
                          <input
                            value={o.label}
                            onChange={(e) => updateFieldOption(f.id, o.id, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 bg-white"
                            placeholder="Option"
                          />
                          <button
                            type="button"
                            onClick={() => removeFieldOption(f.id, o.id)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Remove"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addFieldOption(f.id)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        + Add Option
                      </button>
                    </div>
                  )}

                  {f.type === 'inspection_check' && (
                    <div className="mt-3 grid grid-cols-3 gap-3">
                      {[
                        { key: 'Pass', color: 'text-green-600' },
                        { key: 'Flag', color: 'text-orange-600' },
                        { key: 'Fail', color: 'text-red-600' },
                      ].map((x) => (
                        <div
                          key={x.key}
                          className={`px-3 py-2 border border-gray-300 rounded-md text-sm text-center bg-white ${x.color}`}
                        >
                          {x.key}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => { setShowCreateProcedureModal(false); resetNewProcedureForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreateProcedureFromModal} disabled={!newProcedureForm.name.trim()}>
              Add Procedure
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkOrders;
