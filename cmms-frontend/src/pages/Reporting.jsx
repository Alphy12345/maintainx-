import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Calendar, ChevronDown, Download, Plus, Filter, Inbox, Package, MapPin, AlertTriangle, CircleDot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardBody, CardHeader, Modal, Table, Badge } from '../components';
import useStore from '../store/useStore';

const datePresets = [
  { id: 'today', label: 'Today', days: 0 },
  { id: 'last_7', label: 'Last 7 days', days: 6 },
  { id: 'last_30', label: 'Last 30 days', days: 29 },
];

const tabs = [
  { id: 'work_orders', label: 'Work Orders' },
  { id: 'asset_health', label: 'Asset Health' },
  { id: 'reporting_details', label: 'Reporting Details' },
  { id: 'recent_activity', label: 'Recent Activity' },
  { id: 'export_data', label: 'Export Data' },
  { id: 'custom_dashboards', label: 'Custom Dashboards' },
  { id: 'requests', label: 'Requests' },
];

const formatInputDate = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const Gauge = ({ label, valueText }) => (
  <div className="flex flex-col items-center justify-center">
    <div className="relative w-40 h-20 overflow-hidden">
      <div className="absolute inset-x-0 bottom-0 h-40 w-40 rounded-full border-[18px] border-primary-100" />
    </div>
    <div className="text-xs text-gray-500">{label}</div>
    <div className="text-xs font-semibold text-gray-900">{valueText}</div>
  </div>
);

const Reporting = () => {
  const navigate = useNavigate();
  const { workOrders, assets, locations, users, requests } = useStore();

  const [activeTab, setActiveTab] = useState('work_orders');
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    return { start: formatInputDate(start), end: formatInputDate(end) };
  });

  const [filters, setFilters] = useState({ assignedTo: '', dueDate: '', locationId: '', priority: '' });
  const [requestFilters, setRequestFilters] = useState({ assetId: '', locationId: '', priority: '', status: '' });
  const [showAddFilter, setShowAddFilter] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showPresets, setShowPresets] = useState(false);

  const startDate = useMemo(() => new Date(`${dateRange.start}T00:00:00`), [dateRange.start]);
  const endDate = useMemo(() => new Date(`${dateRange.end}T23:59:59`), [dateRange.end]);

  const inRange = (iso) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d >= startDate && d <= endDate;
  };

  const filteredWorkOrders = useMemo(() => {
    return (workOrders || []).filter((wo) => {
      if (!inRange(wo.createdAt)) return false;
      if (filters.assignedTo && wo.assigneeId !== filters.assignedTo) return false;
      if (filters.locationId && wo.locationId !== filters.locationId) return false;
      if (filters.priority && wo.priority !== filters.priority) return false;
      if (filters.dueDate) {
        const due = wo.dueDate ? formatInputDate(new Date(wo.dueDate)) : '';
        if (due !== filters.dueDate) return false;
      }
      return true;
    });
  }, [workOrders, filters, startDate, endDate]);

  const derived = useMemo(() => {
    const createdCount = filteredWorkOrders.length;
    const completedCount = filteredWorkOrders.filter((wo) => wo.status === 'completed').length;
    const percentCompleted = createdCount === 0 ? 0 : Math.round((completedCount / createdCount) * 100);

    const byType = {
      preventive: filteredWorkOrders.filter((wo) => wo.workType === 'preventive').length,
      reactive: filteredWorkOrders.filter((wo) => wo.workType === 'reactive').length,
      other: filteredWorkOrders.filter((wo) => wo.workType && wo.workType !== 'preventive' && wo.workType !== 'reactive').length,
    };

    const statusCounts = {
      open: filteredWorkOrders.filter((wo) => wo.status === 'open').length,
      on_hold: filteredWorkOrders.filter((wo) => wo.status === 'cancelled').length,
      in_progress: filteredWorkOrders.filter((wo) => wo.status === 'in_progress').length,
      done: filteredWorkOrders.filter((wo) => wo.status === 'completed').length,
    };

    const repeatingCount = filteredWorkOrders.filter((wo) => wo.recurrence && wo.recurrence !== 'does_not_repeat').length;
    const nonRepeatingCount = createdCount - repeatingCount;

    const now = new Date();
    const overdueCount = filteredWorkOrders.filter((wo) => wo.dueDate && new Date(wo.dueDate) < now && wo.status !== 'completed').length;

    return { createdCount, completedCount, percentCompleted, byType, statusCounts, repeatingCount, nonRepeatingCount, overdueCount };
  }, [filteredWorkOrders]);

  const chartData = useMemo(() => {
    const days = [];
    const d = new Date(startDate);
    d.setHours(0, 0, 0, 0);
    while (d <= endDate) {
      days.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }

    return days.map((day) => {
      const dayStart = new Date(day);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const created = filteredWorkOrders.filter((wo) => {
        const c = wo.createdAt ? new Date(wo.createdAt) : null;
        return c && c >= dayStart && c <= dayEnd;
      }).length;

      const completed = filteredWorkOrders.filter((wo) => {
        const c = wo.completedAt ? new Date(wo.completedAt) : null;
        return c && c >= dayStart && c <= dayEnd;
      }).length;

      const preventive = filteredWorkOrders.filter((wo) => {
        const c = wo.createdAt ? new Date(wo.createdAt) : null;
        return c && c >= dayStart && c <= dayEnd && wo.workType === 'preventive';
      }).length;

      const reactive = filteredWorkOrders.filter((wo) => {
        const c = wo.createdAt ? new Date(wo.createdAt) : null;
        return c && c >= dayStart && c <= dayEnd && wo.workType === 'reactive';
      }).length;

      const other = filteredWorkOrders.filter((wo) => {
        const c = wo.createdAt ? new Date(wo.createdAt) : null;
        return c && c >= dayStart && c <= dayEnd && wo.workType && wo.workType !== 'preventive' && wo.workType !== 'reactive';
      }).length;

      const repeating = filteredWorkOrders.filter((wo) => {
        const c = wo.createdAt ? new Date(wo.createdAt) : null;
        return c && c >= dayStart && c <= dayEnd && wo.recurrence && wo.recurrence !== 'does_not_repeat';
      }).length;

      const nonRepeating = created - repeating;

      return {
        date: `${day.getMonth() + 1}/${day.getDate()}`,
        created,
        completed,
        preventive,
        reactive,
        other,
        repeating,
        nonRepeating,
      };
    });
  }, [filteredWorkOrders, startDate, endDate]);

  const donutData = useMemo(() => ([
    { name: 'Open', value: derived.statusCounts.open, color: '#3b82f6' },
    { name: 'On Hold', value: derived.statusCounts.on_hold, color: '#f59e0b' },
    { name: 'In Progress', value: derived.statusCounts.in_progress, color: '#10b981' },
    { name: 'Done', value: derived.statusCounts.done, color: '#6366f1' },
  ]), [derived.statusCounts]);

  const repeatingWorkOrders = useMemo(
    () => (filteredWorkOrders || []).filter((wo) => wo.recurrence && wo.recurrence !== 'does_not_repeat'),
    [filteredWorkOrders]
  );

  const repeatingColumns = useMemo(() => ([
    { key: 'title', title: 'Title', sortable: true },
    { key: 'id', title: 'ID', sortable: true },
    { key: 'status', title: 'Status', sortable: true, render: (v) => <Badge variant={v === 'completed' ? 'success' : v === 'in_progress' ? 'info' : v === 'cancelled' ? 'danger' : 'warning'}>{v}</Badge> },
    { key: 'priority', title: 'Priority', sortable: true },
    { key: 'workType', title: 'Work Type', sortable: true },
    { key: 'assigneeId', title: 'Assigned To', sortable: true, render: (v) => users.find((u) => u.id === v)?.name || '-' },
    { key: 'assetId', title: 'Asset', sortable: true, render: (v) => assets.find((a) => a.id === v)?.name || '-' },
    { key: 'locationId', title: 'Location', sortable: true, render: (v) => locations.find((l) => l.id === v)?.name || '-' },
    { key: 'dueDate', title: 'Due Date', sortable: true, render: (v) => (v ? new Date(v).toLocaleDateString() : '-') },
    { key: 'recurrence', title: 'Recurrence', sortable: true },
  ]), [users, assets, locations]);

  const requestCountInRange = useMemo(() => (requests || []).filter((r) => inRange(r.createdAt)).length, [requests, startDate, endDate]);

  const applyPreset = (preset) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - preset.days);
    setDateRange({ start: formatInputDate(start), end: formatInputDate(end) });
    setShowPresets(false);
  };

  const clearFilters = () => setFilters({ assignedTo: '', dueDate: '', locationId: '', priority: '' });

  const exportAction = (type) => {
    setShowExport(false);
    alert(`Export (${type}) would be implemented here.`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Reporting</h1>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
              <Calendar className="h-4 w-4 text-gray-400" />
              <input type="date" value={dateRange.start} onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))} className="bg-transparent outline-none" />
              <span className="text-gray-300">-</span>
              <input type="date" value={dateRange.end} onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))} className="bg-transparent outline-none" />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPresets((v) => !v)}
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Date Presets
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>
              {showPresets && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border border-gray-200 bg-white shadow-lg z-10">
                  {datePresets.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <Button variant="secondary" onClick={() => setShowExport((v) => !v)}>
                <Download className="w-4 h-4 mr-2" />
                Export
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
              {showExport && (
                <div className="absolute right-0 mt-2 w-44 rounded-md border border-gray-200 bg-white shadow-lg z-20 overflow-hidden">
                  <button type="button" className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50" onClick={() => exportAction('CSV')}>Export CSV</button>
                  <button type="button" className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50" onClick={() => exportAction('XLSX')}>Export XLSX</button>
                  <button type="button" className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50" onClick={() => exportAction('PDF')}>Export PDF</button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200">
          <nav className="-mb-px flex flex-wrap gap-6">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`py-2 px-1 border-b-2 text-sm font-medium ${activeTab === t.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700">
            <Filter className="h-4 w-4 text-gray-400" />
            Filters
          </div>

          <div className="relative">
            <select value={filters.assignedTo} onChange={(e) => setFilters((p) => ({ ...p, assignedTo: e.target.value }))} className="appearance-none rounded-md border border-gray-200 bg-white px-3 py-1.5 pr-8 text-sm text-gray-700">
              <option value="">Assigned To</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          <input type="date" value={filters.dueDate} onChange={(e) => setFilters((p) => ({ ...p, dueDate: e.target.value }))} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700" />

          <div className="relative">
            <select value={filters.locationId} onChange={(e) => setFilters((p) => ({ ...p, locationId: e.target.value }))} className="appearance-none rounded-md border border-gray-200 bg-white px-3 py-1.5 pr-8 text-sm text-gray-700">
              <option value="">Location</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          <div className="relative">
            <select value={filters.priority} onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))} className="appearance-none rounded-md border border-gray-200 bg-white px-3 py-1.5 pr-8 text-sm text-gray-700">
              <option value="">Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          <button type="button" onClick={() => setShowAddFilter(true)} className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            <Plus className="h-4 w-4" />
            Add Filter
          </button>

          <button type="button" className="ml-auto inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
            My Filters
          </button>

          <button type="button" onClick={clearFilters} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50">
            Clear
          </button>
        </div>
      </div>

      {activeTab !== 'work_orders' ? (
        activeTab === 'requests' ? (
          <div className="space-y-4">
            <div className="text-2xl font-bold text-gray-900">Requests</div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">
                <Package className="h-4 w-4 text-gray-400" />
                <select
                  value={requestFilters.assetId}
                  onChange={(e) => setRequestFilters((p) => ({ ...p, assetId: e.target.value }))}
                  className="bg-transparent outline-none"
                >
                  <option value="">Asset</option>
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">
                <MapPin className="h-4 w-4 text-gray-400" />
                <select
                  value={requestFilters.locationId}
                  onChange={(e) => setRequestFilters((p) => ({ ...p, locationId: e.target.value }))}
                  className="bg-transparent outline-none"
                >
                  <option value="">Location</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">
                <AlertTriangle className="h-4 w-4 text-gray-400" />
                <select
                  value={requestFilters.priority}
                  onChange={(e) => setRequestFilters((p) => ({ ...p, priority: e.target.value }))}
                  className="bg-transparent outline-none"
                >
                  <option value="">Priority</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">
                <CircleDot className="h-4 w-4 text-gray-400" />
                <select
                  value={requestFilters.status}
                  onChange={(e) => setRequestFilters((p) => ({ ...p, status: e.target.value }))}
                  className="bg-transparent outline-none"
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
              </div>

              <button
                type="button"
                onClick={() => setShowAddFilter(true)}
                className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
                Add Filter
              </button>

              <Button
                className="ml-auto"
                onClick={() => navigate('/requests?new=1')}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </div>

            <Card>
              <CardBody>
                <div className="min-h-[520px] flex items-center justify-center">
                  <div className="max-w-md text-center">
                    <div className="mx-auto h-24 w-24 rounded-2xl bg-primary-50 flex items-center justify-center">
                      <Inbox className="h-12 w-12 text-primary-600" />
                    </div>
                    <div className="mt-6 text-2xl font-bold text-gray-900">Start adding Requests</div>
                    <div className="mt-2 text-sm text-gray-600">Create a request and track it from submission to completion.</div>
                    <div className="mt-6">
                      <Button onClick={() => navigate('/requests?new=1')}>Create Request</Button>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">{tabs.find((t) => t.id === activeTab)?.label}</h3>
            </CardHeader>
            <CardBody>
              <div className="text-sm text-gray-600">This tab is included to match the Reporting navigation. Work Orders contains the main dashboard layout.</div>
            </CardBody>
          </Card>
        )
      ) : (
        <div className="space-y-6">
          <div className="text-sm font-semibold text-gray-900">Work Orders</div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-primary-700">Created vs. Completed</div>
                  <button type="button" className="h-7 w-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50">+</button>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{derived.createdCount || '-'}</div>
                    <div className="mt-1 inline-flex items-center justify-center rounded-md border border-primary-200 px-2 py-1 text-xs text-primary-700">Created</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{derived.completedCount || '-'}</div>
                    <div className="mt-1 inline-flex items-center justify-center rounded-md border border-green-200 px-2 py-1 text-xs text-green-700">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{Number.isFinite(derived.percentCompleted) ? derived.percentCompleted : '-'}%</div>
                    <div className="text-xs text-gray-500">Percent Completed</div>
                  </div>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="created" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-primary-700">Work Orders by Type</div>
                  <button type="button" className="h-7 w-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50">+</button>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{derived.byType.preventive || '-'}</div>
                    <div className="mt-1 inline-flex items-center justify-center rounded-md border border-green-200 px-2 py-1 text-xs text-green-700">Preventive</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{derived.byType.reactive || '-'}</div>
                    <div className="mt-1 inline-flex items-center justify-center rounded-md border border-primary-200 px-2 py-1 text-xs text-primary-700">Reactive</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{derived.byType.other || '-'}</div>
                    <div className="mt-1 inline-flex items-center justify-center rounded-md border border-gray-200 px-2 py-1 text-xs text-gray-700">Other</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{derived.createdCount ? Math.round((derived.byType.preventive / Math.max(derived.createdCount, 1)) * 100) : '-'}%</div>
                    <div className="text-xs text-gray-500">Total Preventive Ratio</div>
                  </div>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="preventive" stackId="a" fill="#10b981" />
                      <Bar dataKey="reactive" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="other" stackId="a" fill="#94a3b8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-primary-700">Non-Repeating vs. Repeating</div>
                  <Button variant="secondary" size="sm">Add to Dashboard</Button>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{derived.nonRepeatingCount || '-'}</div>
                    <div className="mt-1 inline-flex items-center justify-center rounded-md border border-primary-200 px-2 py-1 text-xs text-primary-700">Non-Repeating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{derived.repeatingCount || '-'}</div>
                    <div className="mt-1 inline-flex items-center justify-center rounded-md border border-primary-200 px-2 py-1 text-xs text-primary-700">Repeating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{derived.createdCount ? Math.round((derived.repeatingCount / Math.max(derived.createdCount, 1)) * 100) : '-'}%</div>
                    <div className="text-xs text-gray-500">Repeating Ratio</div>
                  </div>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="nonRepeating" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="repeating" stroke="#6366f1" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-primary-700">Status</div>
                  <button type="button" className="h-7 w-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50">+</button>
                </div>
              </CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-center"><div className="text-lg font-bold text-gray-900">{derived.statusCounts.open || '-'}</div><div className="mt-1 inline-flex rounded-md border border-primary-200 px-2 py-1 text-xs text-primary-700">Open</div></div>
                    <div className="text-center"><div className="text-lg font-bold text-gray-900">{derived.statusCounts.on_hold || '-'}</div><div className="mt-1 inline-flex rounded-md border border-orange-200 px-2 py-1 text-xs text-orange-700">On Hold</div></div>
                    <div className="text-center"><div className="text-lg font-bold text-gray-900">{derived.statusCounts.in_progress || '-'}</div><div className="mt-1 inline-flex rounded-md border border-green-200 px-2 py-1 text-xs text-green-700">In Progress</div></div>
                    <div className="text-center"><div className="text-lg font-bold text-gray-900">{derived.statusCounts.done || '-'}</div><div className="mt-1 inline-flex rounded-md border border-indigo-200 px-2 py-1 text-xs text-indigo-700">Done</div></div>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={75} paddingAngle={2}>
                          {donutData.map((entry) => (
                            <Cell key={entry.name} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="text-sm font-semibold text-gray-900">All Repeating Work Orders</div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">All Repeating Work Orders</div>
                <Button variant="secondary" size="sm">Add to Dashboard</Button>
              </div>
            </CardHeader>
            <CardBody>
              <Table columns={repeatingColumns} data={repeatingWorkOrders} />
            </CardBody>
          </Card>

          <div className="text-sm font-semibold text-gray-900">Labor Utilization</div>
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Labor Utilization</div>
                <button type="button" className="h-7 w-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50">+</button>
              </div>
              <div className="text-center py-10 text-sm text-gray-500">No labor utilization report. Try changing the date range or reporting period.</div>
            </CardBody>
          </Card>

          <div className="text-sm font-semibold text-gray-900">Requests</div>
          <Card>
            <CardBody>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-gray-900">Requests</div>
                <Button variant="secondary" size="sm">Add to Dashboard</Button>
              </div>
              <div className="mt-2 text-center py-10 text-sm text-gray-500">
                {requestCountInRange === 0 ? 'No data available. Try changing the date range or reporting period.' : `${requestCountInRange} requests in this period.`}
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-primary-700">On Time vs. Overdue</div>
                <button type="button" className="h-7 w-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50">+</button>
              </div>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
                <div className="flex items-center justify-center gap-2">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{Math.max(derived.createdCount - derived.overdueCount, 0) || '-'}</div>
                    <div className="mt-1 inline-flex items-center justify-center rounded-md border border-green-200 px-2 py-1 text-xs text-green-700">On Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{derived.overdueCount || '-'}</div>
                    <div className="mt-1 inline-flex items-center justify-center rounded-md border border-red-200 px-2 py-1 text-xs text-red-700">Overdue</div>
                  </div>
                </div>

                <Gauge label="Total % On Time" valueText={derived.createdCount ? `${Math.round(((derived.createdCount - derived.overdueCount) / Math.max(derived.createdCount, 1)) * 100)}%` : '-'} />
                <Gauge label="On Time" valueText={derived.createdCount ? `${Math.round(((derived.createdCount - derived.overdueCount) / Math.max(derived.createdCount, 1)) * 100)}%` : '-'} />
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      <Modal isOpen={showAddFilter} onClose={() => setShowAddFilter(false)} title="Add Filter" size="md">
        <div className="space-y-4">
          <div className="text-sm text-gray-700">This is a placeholder for the MaintainX-style “Add Filter” builder.</div>
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowAddFilter(false)}>Close</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Reporting;
