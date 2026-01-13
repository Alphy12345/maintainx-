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
import { Calendar, ChevronDown, Download, Plus, Filter, Inbox, Package, MapPin, AlertTriangle, CircleDot, Zap, MessageSquare } from 'lucide-react';
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
  const { workOrders, assets, locations, users, requests, assetHealthEvents, activities, inventory } = useStore();

  const [activeTab, setActiveTab] = useState('work_orders');
  const [reportingGroupBy, setReportingGroupBy] = useState('user');
  const [exportSection, setExportSection] = useState('work_orders');
  const [exportForm, setExportForm] = useState({
    start: '',
    end: '',
    format: 'csv',
    includePlannedOrCreated: true,
    includeDue: true,
    includeCompleted: true,
    procedureFormat: 'summary',
    includeOnlyRestock: false,
    includeDeletedUsers: false,
    exportType: 'grouped_by_user',
    columnsOpen: false,
  });
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
  const [showComments, setShowComments] = useState(true);
  const [showAllUpdates, setShowAllUpdates] = useState(true);

  const startDate = useMemo(() => new Date(`${dateRange.start}T00:00:00`), [dateRange.start]);
  const endDate = useMemo(() => new Date(`${dateRange.end}T23:59:59`), [dateRange.end]);

  const exportDateRangeText = useMemo(() => {
    const s = exportForm.start || dateRange.start;
    const e = exportForm.end || dateRange.end;
    if (!s || !e) return '';
    return `${new Date(`${s}T00:00:00`).toLocaleDateString()} - ${new Date(`${e}T00:00:00`).toLocaleDateString()}`;
  }, [exportForm.start, exportForm.end, dateRange.start, dateRange.end]);

  const exportStartDate = useMemo(() => {
    const s = exportForm.start || dateRange.start;
    return new Date(`${s}T00:00:00`);
  }, [exportForm.start, dateRange.start]);

  const exportEndDate = useMemo(() => {
    const e = exportForm.end || dateRange.end;
    return new Date(`${e}T23:59:59`);
  }, [exportForm.end, dateRange.end]);

  const exportInRange = (iso) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d >= exportStartDate && d <= exportEndDate;
  };

  const escapeCsv = (value) => {
    if (value === null || value === undefined) return '';
    const s = String(value);
    if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const downloadCsv = (filenameBase, rows) => {
    const safeRows = Array.isArray(rows) ? rows : [];
    const headers = safeRows.length ? Object.keys(safeRows[0]) : [];
    const csv = [headers.join(',')]
      .concat(
        safeRows.map((r) => headers.map((h) => escapeCsv(r[h])).join(','))
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenameBase}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const openPrintView = (title, rows) => {
    const safeRows = Array.isArray(rows) ? rows : [];
    const headers = safeRows.length ? Object.keys(safeRows[0]) : [];
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (!win) return;

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
    h1 { font-size: 18px; margin: 0 0 8px; }
    .meta { font-size: 12px; color: #555; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: left; vertical-align: top; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">${exportDateRangeText ? `Date Range: ${exportDateRangeText}` : ''}</div>
  <table>
    <thead>
      <tr>
        ${headers.map((h) => `<th>${h}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${safeRows.map((r) => `<tr>${headers.map((h) => `<td>${(r[h] ?? '').toString().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`).join('')}</tr>`).join('')}
    </tbody>
  </table>
</body>
</html>`;

    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  };

  const buildExportRows = () => {
    const assetName = (id) => assets.find((a) => a.id === id)?.name || '';
    const locationName = (id) => locations.find((l) => l.id === id)?.name || '';
    const userName = (id) => users.find((u) => u.id === id)?.name || '';

    if (exportSection === 'work_orders') {
      const list = (workOrders || []).filter((wo) => exportInRange(wo.createdAt));
      const filtered = list.filter((wo) => {
        if (wo.status === 'completed') return exportForm.includeCompleted;
        if (wo.dueDate && exportInRange(wo.dueDate)) return exportForm.includeDue;
        return exportForm.includePlannedOrCreated;
      });
      return filtered.map((wo) => ({
        ID: wo.id,
        Title: wo.title,
        Status: wo.status,
        Priority: wo.priority,
        Asset: assetName(wo.assetId),
        Location: locationName(wo.locationId),
        AssignedTo: userName(wo.assigneeId),
        DueDate: wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : '',
        CreatedAt: wo.createdAt ? new Date(wo.createdAt).toLocaleString() : '',
      }));
    }

    if (exportSection === 'assets') {
      return (assets || []).map((a) => ({
        ID: a.id,
        Name: a.name,
        Status: a.status,
        Location: locationName(a.locationId),
        Category: a.category,
        SerialNumber: a.serialNumber || '',
        Model: a.model || '',
      }));
    }

    if (exportSection === 'asset_status') {
      const list = (assetHealthEvents || []).filter((e) => exportInRange(e.timestamp));
      return list.map((e) => ({
        Asset: assetName(e.assetId),
        Status: e.status || '',
        DowntimeType: e.downtimeType || '',
        DowntimeReason: e.downtimeReason || '',
        Timestamp: e.timestamp ? new Date(e.timestamp).toLocaleString() : '',
      }));
    }

    if (exportSection === 'locations') {
      return (locations || []).map((l) => ({
        ID: l.id,
        Name: l.name,
        Address: l.address || '',
      }));
    }

    if (exportSection === 'parts') {
      const list = (inventory || []);
      const filtered = exportForm.includeOnlyRestock
        ? list.filter((p) => Number(p.currentStock) < Number(p.minStock))
        : list;
      return filtered.map((p) => ({
        ID: p.id,
        Name: p.name,
        CurrentStock: p.currentStock,
        MinStock: p.minStock,
        Location: p.locationId ? locationName(p.locationId) : '',
      }));
    }

    if (exportSection === 'part_transactions') {
      return [];
    }

    if (exportSection === 'meters') {
      return [];
    }

    if (exportSection === 'meter_reading') {
      return [];
    }

    if (exportSection === 'vendors') {
      const vendorNames = new Set();
      for (const a of (assets || [])) {
        if (a.vendor) vendorNames.add(a.vendor);
      }
      const list = [...vendorNames].sort();
      return list.map((name, idx) => ({
        ID: `V-${idx + 1}`,
        Name: name,
      }));
    }

    if (exportSection === 'requests') {
      const list = (requests || []).filter((r) => exportInRange(r.createdAt));
      return list.map((r) => ({
        ID: r.id,
        Title: r.title,
        Status: r.status,
        Priority: r.priority,
        Asset: assetName(r.assetId),
        Location: locationName(r.locationId),
        CreatedAt: r.createdAt ? new Date(r.createdAt).toLocaleString() : '',
      }));
    }

    if (exportSection === 'time_cost') {
      return [];
    }

    if (exportSection === 'labor_utilization') {
      return [];
    }

    return [];
  };

  const handleExport = () => {
    const rows = buildExportRows();
    const titleMap = {
      work_orders: 'Work Orders',
      assets: 'Assets',
      asset_status: 'Asset Status',
      locations: 'Locations',
      parts: 'Parts',
      part_transactions: 'Part Transactions',
      meters: 'Meters',
      meter_reading: 'Meter Reading',
      vendors: 'Vendors',
      requests: 'Requests',
      time_cost: 'Time & Cost Tracking',
      labor_utilization: 'Labor Utilization',
    };
    const title = titleMap[exportSection] || 'Export';

    if (exportForm.format === 'pdf' || exportForm.format === 'qr_pdf') {
      openPrintView(`Export: ${title}`, rows);
      return;
    }

    downloadCsv(`export-${exportSection}-${(exportForm.start || dateRange.start)}_${(exportForm.end || dateRange.end)}`, rows);
  };

  const assetHealthDerived = useMemo(() => {
    const windowStart = startDate;
    const windowEnd = endDate;
    const totalWindowMs = Math.max(windowEnd.getTime() - windowStart.getTime(), 0);

    const toMs = (iso) => {
      const d = new Date(iso);
      const t = d.getTime();
      return Number.isNaN(t) ? null : t;
    };

    const statusIsDown = (status) => status === 'down';

    const safeEvents = (assetHealthEvents || [])
      .map((e) => ({ ...e, _t: toMs(e.timestamp) }))
      .filter((e) => e.assetId && e._t !== null)
      .sort((a, b) => a._t - b._t);

    const byAsset = new Map();
    for (const e of safeEvents) {
      if (!byAsset.has(e.assetId)) byAsset.set(e.assetId, []);
      byAsset.get(e.assetId).push(e);
    }

    const perAsset = (assets || []).map((asset) => {
      const list = byAsset.get(asset.id) || [];

      const before = list.filter((e) => e._t < windowStart.getTime());
      const within = list.filter((e) => e._t >= windowStart.getTime() && e._t <= windowEnd.getTime());
      const currentAtStart = before.length ? (before[before.length - 1].status || asset.status) : asset.status;
      let cursorStatus = currentAtStart || 'running';
      let cursorDowntimeType = (before.length ? (before[before.length - 1].downtimeType) : undefined) || undefined;
      let cursorTime = windowStart.getTime();

      let downMs = 0;
      let plannedDownMs = 0;
      let unplannedDownMs = 0;
      const downIntervals = [];
      let activeDownStart = statusIsDown(cursorStatus) ? cursorTime : null;
      let activeDownType = statusIsDown(cursorStatus) ? cursorDowntimeType : null;

      const closeDown = (endTime) => {
        if (activeDownStart === null) return;
        const dur = Math.max(endTime - activeDownStart, 0);
        downMs += dur;
        if (activeDownType === 'planned') plannedDownMs += dur;
        if (activeDownType === 'unplanned') unplannedDownMs += dur;
        downIntervals.push({ start: activeDownStart, end: endTime, ms: dur, downtimeType: activeDownType || '' });
        activeDownStart = null;
        activeDownType = null;
      };

      for (const ev of within) {
        const t = ev._t;
        if (t < cursorTime) continue;

        if (statusIsDown(cursorStatus) && activeDownStart === null) {
          activeDownStart = cursorTime;
          activeDownType = cursorDowntimeType || ev.downtimeType || null;
        }

        if (ev.status && ev.status !== cursorStatus) {
          if (statusIsDown(cursorStatus) && !statusIsDown(ev.status)) {
            closeDown(t);
          }
          if (!statusIsDown(cursorStatus) && statusIsDown(ev.status)) {
            activeDownStart = t;
            activeDownType = ev.downtimeType || null;
          }
          cursorStatus = ev.status;
        }
        if (ev.downtimeType) cursorDowntimeType = ev.downtimeType;
        cursorTime = t;
      }

      if (statusIsDown(cursorStatus)) {
        if (activeDownStart === null) {
          activeDownStart = cursorTime;
          activeDownType = cursorDowntimeType;
        }
        closeDown(windowEnd.getTime());
      }

      const availability = totalWindowMs === 0 ? 0 : Math.max(0, Math.min(1, (totalWindowMs - downMs) / totalWindowMs));

      const mttrMs = downIntervals.length ? Math.round(downIntervals.reduce((s, x) => s + x.ms, 0) / downIntervals.length) : 0;

      const failures = downIntervals.length;
      const mtbfMs = failures > 0
        ? Math.round((totalWindowMs - downMs) / failures)
        : 0;

      return {
        assetId: asset.id,
        assetName: asset.name,
        locationId: asset.locationId,
        availability,
        downMs,
        plannedDownMs,
        unplannedDownMs,
        failures,
        mttrMs,
        mtbfMs,
      };
    });

    const overallAvailability = perAsset.length
      ? perAsset.reduce((s, a) => s + a.availability, 0) / perAsset.length
      : 0;

    const onlineCount = (assets || []).filter((a) => a.status && a.status !== 'down').length;
    const offlineCount = (assets || []).filter((a) => a.status === 'down').length;

    const offlinePlannedCount = (assets || []).filter((a) => {
      if (a.status !== 'down') return false;
      const events = (byAsset.get(a.id) || []).filter((e) => e._t <= windowEnd.getTime());
      const last = events.length ? events[events.length - 1] : null;
      return last?.downtimeType === 'planned';
    }).length;
    const offlineUnplannedCount = (assets || []).filter((a) => {
      if (a.status !== 'down') return false;
      const events = (byAsset.get(a.id) || []).filter((e) => e._t <= windowEnd.getTime());
      const last = events.length ? events[events.length - 1] : null;
      return last?.downtimeType === 'unplanned';
    }).length;

    const mostProblematic = [...perAsset]
      .sort((a, b) => (b.unplannedDownMs - a.unplannedDownMs) || (b.failures - a.failures))
      .slice(0, 10)
      .map((row) => ({
        ...row,
        locationName: locations.find((l) => l.id === row.locationId)?.name || '-',
      }));

    return {
      overallAvailability,
      onlineCount,
      offlineCount,
      offlinePlannedCount,
      offlineUnplannedCount,
      mostProblematic,
      hasAnyEvents: (assetHealthEvents || []).length > 0,
    };
  }, [assets, assetHealthEvents, startDate, endDate, locations]);

  const inRange = (iso) => {
    if (!iso) return false;
    const d = new Date(iso);
    return d >= startDate && d <= endDate;
  };

  const recentActivities = useMemo(() => {
    const list = (activities || [])
      .map((a) => ({
        ...a,
        _t: a?.timestamp ? new Date(a.timestamp).getTime() : 0,
      }))
      .filter((a) => a._t && !Number.isNaN(a._t))
      .filter((a) => inRange(a.timestamp))
      .filter((a) => (showAllUpdates ? true : a.kind === 'status_change' || a.kind === 'created'))
      .filter((a) => (showComments ? true : a.kind !== 'comment'))
      .sort((a, b) => b._t - a._t);

    return list;
  }, [activities, startDate, endDate, showAllUpdates, showComments]);

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

  const reportingDetailsRows = useMemo(() => {
    const getKey = (wo) => {
      if (reportingGroupBy === 'user') return wo.assigneeId || '';
      if (reportingGroupBy === 'asset') return wo.assetId || '';
      if (reportingGroupBy === 'location') return wo.locationId || '';
      if (reportingGroupBy === 'category') return wo.categoryId || '';
      if (reportingGroupBy === 'vendor') return wo.vendorId || '';
      if (reportingGroupBy === 'asset_type') {
        const a = assets.find((x) => x.id === wo.assetId);
        return a?.assetType || '';
      }
      if (reportingGroupBy === 'team') return wo.teamId || '';
      return '';
    };

    const getLabel = (key) => {
      if (!key) return '-';
      if (reportingGroupBy === 'user') return users.find((u) => u.id === key)?.name || '-';
      if (reportingGroupBy === 'asset') return assets.find((a) => a.id === key)?.name || '-';
      if (reportingGroupBy === 'location') return locations.find((l) => l.id === key)?.name || '-';
      if (reportingGroupBy === 'category') return key;
      if (reportingGroupBy === 'vendor') return key;
      if (reportingGroupBy === 'asset_type') return key;
      if (reportingGroupBy === 'team') return key;
      return key;
    };

    const buckets = new Map();
    for (const wo of (filteredWorkOrders || [])) {
      const key = getKey(wo);
      const b = buckets.get(key) || { key, created: 0, completed: 0 };
      b.created += 1;
      if (wo.status === 'completed') b.completed += 1;
      buckets.set(key, b);
    }

    const rows = [...buckets.values()].map((b) => {
      const ratio = b.created === 0 ? 0 : Math.round((b.completed / b.created) * 100);
      return {
        key: b.key,
        label: getLabel(b.key),
        created: b.created,
        completed: b.completed,
        ratio,
      };
    });

    rows.sort((a, b) => (b.created - a.created) || (b.completed - a.completed));
    return rows;
  }, [filteredWorkOrders, reportingGroupBy, users, assets, locations]);

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

  const headerExportSection = useMemo(() => {
    if (activeTab === 'requests') return 'requests';
    if (activeTab === 'asset_health') return 'asset_status';
    return 'work_orders';
  }, [activeTab]);

  const exportAction = (type) => {
    setShowExport(false);
    const resolvedFormat = type === 'PDF' ? 'pdf' : 'csv';
    const section = headerExportSection;

    const s = dateRange.start;
    const e = dateRange.end;
    const start = new Date(`${s}T00:00:00`);
    const end = new Date(`${e}T23:59:59`);
    const inHeaderRange = (iso) => {
      if (!iso) return false;
      const d = new Date(iso);
      return d >= start && d <= end;
    };

    const assetName = (id) => (assets || []).find((a) => a.id === id)?.name || '';
    const locationName = (id) => (locations || []).find((l) => l.id === id)?.name || '';
    const userName = (id) => (users || []).find((u) => u.id === id)?.name || '';

    const rows = (() => {
      if (section === 'requests') {
        const list = (requests || []).filter((r) => inHeaderRange(r.createdAt));
        return list.map((r) => ({
          ID: r.id,
          Title: r.title,
          Status: r.status,
          Priority: r.priority,
          Asset: assetName(r.assetId),
          Location: locationName(r.locationId),
          CreatedAt: r.createdAt ? new Date(r.createdAt).toLocaleString() : '',
        }));
      }

      if (section === 'asset_status') {
        const list = (assetHealthEvents || []).filter((ev) => inHeaderRange(ev.timestamp));
        return list.map((ev) => ({
          Asset: assetName(ev.assetId),
          Status: ev.status,
          DowntimeType: ev.downtimeType || '',
          DowntimeReason: ev.downtimeReason || '',
          Timestamp: ev.timestamp ? new Date(ev.timestamp).toLocaleString() : '',
        }));
      }

      const list = (workOrders || []).filter((wo) => {
        const createdOk = inHeaderRange(wo.createdAt);
        const completedOk = inHeaderRange(wo.completedAt);
        const dueOk = inHeaderRange(wo.dueDate);
        return createdOk || completedOk || dueOk;
      });
      return list.map((wo) => ({
        ID: wo.id,
        Title: wo.title,
        Status: wo.status,
        Priority: wo.priority,
        WorkType: wo.workType,
        Asset: assetName(wo.assetId),
        Location: locationName(wo.locationId),
        AssignedTo: userName(wo.assigneeId),
        DueDate: wo.dueDate ? new Date(wo.dueDate).toLocaleDateString() : '',
        CreatedAt: wo.createdAt ? new Date(wo.createdAt).toLocaleString() : '',
        CompletedAt: wo.completedAt ? new Date(wo.completedAt).toLocaleString() : '',
      }));
    })();

    const baseName = `report-${section}-${s}_${e}`;
    if (resolvedFormat === 'pdf') {
      openPrintView(`Report: ${section.replace(/_/g, ' ')}`, rows);
      return;
    }

    downloadCsv(baseName, rows);
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
        activeTab === 'asset_health' ? (
          <div className="space-y-4">
            <div className="text-2xl font-bold text-gray-900">Asset Health</div>

            <Card>
              <CardBody>
                {(assets || []).length === 0 ? (
                  <div className="text-center py-10 text-sm text-gray-500">No assets available. Add an asset to start tracking health.</div>
                ) : !assetHealthDerived.hasAnyEvents ? (
                  <div className="text-center py-10 text-sm text-gray-500">No data available. Change an asset status to start tracking health.</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                    <div className="rounded-md border border-gray-200 bg-white p-4">
                      <div className="text-xs text-gray-500">Asset Availability (Last 30 Days)</div>
                      <div className="mt-2 text-2xl font-bold text-gray-900">{Math.round(assetHealthDerived.overallAvailability * 100)}%</div>
                      <div className="mt-1 text-xs text-gray-500">Average across assets</div>
                    </div>
                    <div className="rounded-md border border-gray-200 bg-white p-4">
                      <div className="text-xs text-gray-500">Online</div>
                      <div className="mt-2 text-2xl font-bold text-gray-900">{assetHealthDerived.onlineCount}</div>
                      <div className="mt-1 text-xs text-gray-500">Current status</div>
                    </div>
                    <div className="rounded-md border border-gray-200 bg-white p-4">
                      <div className="text-xs text-gray-500">Offline (Unplanned)</div>
                      <div className="mt-2 text-2xl font-bold text-gray-900">{assetHealthDerived.offlineUnplannedCount}</div>
                      <div className="mt-1 text-xs text-gray-500">Current status</div>
                    </div>
                    <div className="rounded-md border border-gray-200 bg-white p-4">
                      <div className="text-xs text-gray-500">Offline (Planned)</div>
                      <div className="mt-2 text-2xl font-bold text-gray-900">{assetHealthDerived.offlinePlannedCount}</div>
                      <div className="mt-1 text-xs text-gray-500">Current status</div>
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">Most Problematic Assets</div>
                  <button type="button" className="h-7 w-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50">+</button>
                </div>
              </CardHeader>
              <CardBody>
                {assetHealthDerived.mostProblematic.length === 0 ? (
                  <div className="text-center py-10 text-sm text-gray-500">No data available. Try changing asset statuses to generate health metrics.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                          <th className="py-2 pr-4">Asset Name</th>
                          <th className="py-2 pr-4">Location</th>
                          <th className="py-2 pr-4">Unplanned Downtime</th>
                          <th className="py-2 pr-4">Failures</th>
                          <th className="py-2 pr-4">MTTR</th>
                          <th className="py-2 pr-4">MTBF</th>
                          <th className="py-2 pr-4">Availability</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assetHealthDerived.mostProblematic.map((r) => (
                          <tr key={r.assetId} className="border-b border-gray-50">
                            <td className="py-2 pr-4 text-gray-900">{r.assetName}</td>
                            <td className="py-2 pr-4 text-gray-700">{r.locationName}</td>
                            <td className="py-2 pr-4 text-gray-700">{Math.round(r.unplannedDownMs / 36e5)} hrs</td>
                            <td className="py-2 pr-4 text-gray-700">{r.failures}</td>
                            <td className="py-2 pr-4 text-gray-700">{r.mttrMs ? `${Math.round(r.mttrMs / 60000)} min` : '-'}</td>
                            <td className="py-2 pr-4 text-gray-700">{r.mtbfMs ? `${Math.round(r.mtbfMs / 36e5)} hrs` : '-'}</td>
                            <td className="py-2 pr-4 text-gray-700">{Math.round(r.availability * 100)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        ) : activeTab === 'reporting_details' ? (
          <div className="space-y-4">
            <div className="text-2xl font-bold text-gray-900">Reporting Details</div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-gray-900">Created vs. Completed</div>
                  <button type="button" className="h-7 w-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50">+</button>
                </div>
              </CardHeader>
              <CardBody>
                {filteredWorkOrders.length === 0 ? (
                  <div className="text-center py-10 text-sm text-gray-500">No data available. Try changing the date range or filters.</div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                    <div className="lg:col-span-3 grid grid-cols-2 gap-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{derived.createdCount || '-'}</div>
                        <div className="mt-1 inline-flex items-center justify-center rounded-md border border-primary-200 px-2 py-1 text-xs text-primary-700">Created</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-900">{derived.completedCount || '-'}</div>
                        <div className="mt-1 inline-flex items-center justify-center rounded-md border border-green-200 px-2 py-1 text-xs text-green-700">Completed</div>
                      </div>
                    </div>
                    <div className="lg:col-span-9 h-56">
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
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">Created vs. Completed</div>
                    <button type="button" className="h-7 w-7 rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50">+</button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <div className="text-xs text-gray-500">Grouped by:</div>
                    {[
                      { key: 'team', label: 'Team' },
                      { key: 'user', label: 'User' },
                      { key: 'asset', label: 'Asset' },
                      { key: 'location', label: 'Location' },
                      { key: 'category', label: 'Category' },
                      { key: 'asset_type', label: 'Asset Type' },
                      { key: 'vendor', label: 'Vendor' },
                    ].map((g) => (
                      <button
                        key={g.key}
                        type="button"
                        onClick={() => setReportingGroupBy(g.key)}
                        className={`px-3 py-1.5 rounded-md border ${reportingGroupBy === g.key ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardBody>
                {reportingDetailsRows.length === 0 ? (
                  <div className="text-center py-10 text-sm text-gray-500">No data available. Try changing the date range or reporting period.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                          <th className="py-2 pr-4">{reportingGroupBy === 'user' ? 'User' : reportingGroupBy === 'asset' ? 'Asset' : reportingGroupBy === 'location' ? 'Location' : reportingGroupBy === 'category' ? 'Category' : reportingGroupBy === 'asset_type' ? 'Asset Type' : reportingGroupBy === 'vendor' ? 'Vendor' : 'Team'}</th>
                          <th className="py-2 pr-4">Created</th>
                          <th className="py-2 pr-4">Completed</th>
                          <th className="py-2 pr-4">Completed Ratio</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportingDetailsRows.map((r) => (
                          <tr key={r.key || r.label} className="border-b border-gray-50">
                            <td className="py-2 pr-4 text-gray-900">{r.label}</td>
                            <td className="py-2 pr-4 text-gray-700">{r.created}</td>
                            <td className="py-2 pr-4 text-gray-700">{r.completed}</td>
                            <td className="py-2 pr-4 text-gray-700">{r.ratio}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        ) : activeTab === 'recent_activity' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-gray-900">Recent Activity</div>
              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <span>Show Comments</span>
                  <input
                    type="checkbox"
                    checked={showComments}
                    onChange={(e) => setShowComments(e.target.checked)}
                    className="h-4 w-4"
                  />
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <span>Show All Updates</span>
                  <input
                    type="checkbox"
                    checked={showAllUpdates}
                    onChange={(e) => setShowAllUpdates(e.target.checked)}
                    className="h-4 w-4"
                  />
                </label>
              </div>
            </div>

            <Card>
              <CardBody>
                {recentActivities.length === 0 ? (
                  <div className="min-h-[280px] flex items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto h-16 w-16 rounded-2xl bg-primary-50 flex items-center justify-center">
                        <Zap className="h-8 w-8 text-primary-600" />
                      </div>
                      <div className="mt-4 text-sm text-gray-600">Actions performed all around the platform will show up here.</div>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentActivities.map((a) => (
                      <div key={a.id || `${a.kind}-${a.timestamp}`} className="py-4 flex items-start gap-3">
                        <div className="mt-0.5 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                          {a.kind === 'comment' ? <MessageSquare className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm text-gray-900">{a.message || a.title || 'Update'}</div>
                          <div className="mt-1 text-xs text-gray-500">
                            {a.timestamp ? new Date(a.timestamp).toLocaleString() : ''}
                          </div>
                        </div>
                        {a.entityType && a.entityId && (
                          <div className="text-xs text-gray-500">{a.entityType}: {a.entityId}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>
        ) : activeTab === 'export_data' ? (
          <div className="space-y-4">
            <div className="text-2xl font-bold text-gray-900">Export Data</div>

            <div className="border-b border-gray-200">
              <nav className="-mb-px flex flex-wrap gap-6">
                {[
                  { id: 'work_orders', label: 'Work Orders' },
                  { id: 'assets', label: 'Assets' },
                  { id: 'asset_status', label: 'Asset Status' },
                  { id: 'locations', label: 'Locations' },
                  { id: 'parts', label: 'Parts' },
                  { id: 'part_transactions', label: 'Part Transactions' },
                  { id: 'meters', label: 'Meters' },
                  { id: 'meter_reading', label: 'Meter Reading' },
                  { id: 'vendors', label: 'Vendors' },
                  { id: 'requests', label: 'Requests' },
                  { id: 'time_cost', label: 'Time & Cost Tracking' },
                  { id: 'labor_utilization', label: 'Labor Utilization' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setExportSection(t.id)}
                    className={`py-2 px-1 border-b-2 text-sm font-medium ${exportSection === t.id ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                  >
                    {t.label}
                  </button>
                ))}
              </nav>
            </div>

            {exportSection === 'work_orders' ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">Export Work Order List</div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Filter className="h-4 w-4 text-gray-400" />
                      Filters
                    </button>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-6 max-w-xl">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Date Range</div>
                      <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <input
                          type="date"
                          value={exportForm.start || dateRange.start}
                          onChange={(e) => setExportForm((p) => ({ ...p, start: e.target.value }))}
                          className="bg-transparent outline-none"
                        />
                        <span className="text-gray-300">-</span>
                        <input
                          type="date"
                          value={exportForm.end || dateRange.end}
                          onChange={(e) => setExportForm((p) => ({ ...p, end: e.target.value }))}
                          className="bg-transparent outline-none"
                        />
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{exportDateRangeText}</div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-900">Export Format</div>
                      <div className="mt-2 space-y-2 text-sm text-gray-700">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="exportFormat"
                            checked={exportForm.format === 'csv'}
                            onChange={() => setExportForm((p) => ({ ...p, format: 'csv' }))}
                          />
                          CSV (Excel)
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="exportFormat"
                            checked={exportForm.format === 'pdf'}
                            onChange={() => setExportForm((p) => ({ ...p, format: 'pdf' }))}
                          />
                          PDF
                        </label>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-900">Work Orders to include in this date range</div>
                      <div className="mt-2 space-y-2 text-sm text-gray-700">
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={exportForm.includePlannedOrCreated}
                            onChange={(e) => setExportForm((p) => ({ ...p, includePlannedOrCreated: e.target.checked }))}
                          />
                          Planned or Created
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={exportForm.includeDue}
                            onChange={(e) => setExportForm((p) => ({ ...p, includeDue: e.target.checked }))}
                          />
                          Due
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={exportForm.includeCompleted}
                            onChange={(e) => setExportForm((p) => ({ ...p, includeCompleted: e.target.checked }))}
                          />
                          Completed
                        </label>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-900">Procedure Format</div>
                      <div className="mt-2 relative">
                        <select
                          value={exportForm.procedureFormat}
                          onChange={(e) => setExportForm((p) => ({ ...p, procedureFormat: e.target.value }))}
                          className="w-full appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-700"
                        >
                          <option value="summary">Summary</option>
                          <option value="full">Full</option>
                          <option value="none">None</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setExportForm((p) => ({ ...p, columnsOpen: !p.columnsOpen }))}
                        className="w-full flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Columns
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${exportForm.columnsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {exportForm.columnsOpen && (
                        <div className="mt-2 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 space-y-2">
                          {[
                            { key: 'id', label: 'ID' },
                            { key: 'title', label: 'Title' },
                            { key: 'status', label: 'Status' },
                            { key: 'priority', label: 'Priority' },
                            { key: 'asset', label: 'Asset' },
                            { key: 'location', label: 'Location' },
                            { key: 'assignee', label: 'Assigned To' },
                            { key: 'dueDate', label: 'Due Date' },
                          ].map((c) => (
                            <label key={c.key} className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked />
                              {c.label}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => alert('Preview would be implemented here.')}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => alert('Schedule would be implemented here.')}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Schedule
                      </button>
                      <Button onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : exportSection === 'assets' ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">Export Asset List</div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Filter className="h-4 w-4 text-gray-400" />
                      Filters
                    </button>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-6 max-w-xl">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Export Format</div>
                      <div className="mt-2 space-y-2 text-sm text-gray-700">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="exportAssetFormat"
                            checked={exportForm.format === 'csv'}
                            onChange={() => setExportForm((p) => ({ ...p, format: 'csv' }))}
                          />
                          CSV (Excel)
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="exportAssetFormat"
                            checked={exportForm.format === 'qr_pdf'}
                            onChange={() => setExportForm((p) => ({ ...p, format: 'qr_pdf' }))}
                          />
                          QR Codes (PDF)
                        </label>
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setExportForm((p) => ({ ...p, columnsOpen: !p.columnsOpen }))}
                        className="w-full flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Columns
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${exportForm.columnsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {exportForm.columnsOpen && (
                        <div className="mt-2 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 space-y-2">
                          {[
                            { key: 'id', label: 'ID' },
                            { key: 'name', label: 'Name' },
                            { key: 'status', label: 'Status' },
                            { key: 'location', label: 'Location' },
                            { key: 'category', label: 'Category' },
                            { key: 'serialNumber', label: 'Serial Number' },
                            { key: 'model', label: 'Model' },
                          ].map((c) => (
                            <label key={c.key} className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked />
                              {c.label}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => alert('Schedule would be implemented here.')}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Schedule
                      </button>
                      <Button onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : exportSection === 'asset_status' ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">Export Asset Status List</div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Filter className="h-4 w-4 text-gray-400" />
                      Filters
                    </button>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-6 max-w-xl">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Date Range</div>
                      <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <input
                          type="date"
                          value={exportForm.start || dateRange.start}
                          onChange={(e) => setExportForm((p) => ({ ...p, start: e.target.value }))}
                          className="bg-transparent outline-none"
                        />
                        <span className="text-gray-300">-</span>
                        <input
                          type="date"
                          value={exportForm.end || dateRange.end}
                          onChange={(e) => setExportForm((p) => ({ ...p, end: e.target.value }))}
                          className="bg-transparent outline-none"
                        />
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{exportDateRangeText}</div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-900">Export Format</div>
                      <div className="mt-2 space-y-2 text-sm text-gray-700">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="exportAssetStatusFormat" checked={exportForm.format === 'csv'} onChange={() => setExportForm((p) => ({ ...p, format: 'csv' }))} />
                          CSV (Excel)
                        </label>
                      </div>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => setExportForm((p) => ({ ...p, columnsOpen: !p.columnsOpen }))}
                        className="w-full flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        Columns
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${exportForm.columnsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {exportForm.columnsOpen && (
                        <div className="mt-2 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 space-y-2">
                          {[
                            { key: 'asset', label: 'Asset' },
                            { key: 'status', label: 'Status' },
                            { key: 'downtimeType', label: 'Downtime Type' },
                            { key: 'downtimeReason', label: 'Downtime Reason' },
                            { key: 'timestamp', label: 'Timestamp' },
                          ].map((c) => (
                            <label key={c.key} className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked />
                              {c.label}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button type="button" onClick={() => alert('Schedule would be implemented here.')} className="text-sm text-primary-600 hover:text-primary-700">Schedule</button>
                      <Button onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : exportSection === 'locations' ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">Export Location List</div>
                    <button type="button" className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Filter className="h-4 w-4 text-gray-400" />
                      Filters
                    </button>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-6 max-w-xl">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Export Format</div>
                      <div className="mt-2 space-y-2 text-sm text-gray-700">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="exportLocationsFormat" checked={exportForm.format === 'csv'} onChange={() => setExportForm((p) => ({ ...p, format: 'csv' }))} />
                          CSV (Excel)
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name="exportLocationsFormat" checked={exportForm.format === 'qr_pdf'} onChange={() => setExportForm((p) => ({ ...p, format: 'qr_pdf' }))} />
                          QR Codes (PDF)
                        </label>
                      </div>
                    </div>

                    <div>
                      <button type="button" onClick={() => setExportForm((p) => ({ ...p, columnsOpen: !p.columnsOpen }))} className="w-full flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Columns
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${exportForm.columnsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {exportForm.columnsOpen && (
                        <div className="mt-2 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 space-y-2">
                          {[
                            { key: 'id', label: 'ID' },
                            { key: 'name', label: 'Name' },
                            { key: 'address', label: 'Address' },
                          ].map((c) => (
                            <label key={c.key} className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked />
                              {c.label}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button type="button" onClick={() => alert('Schedule would be implemented here.')} className="text-sm text-primary-600 hover:text-primary-700">Schedule</button>
                      <Button onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : exportSection === 'parts' ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">Export Part List</div>
                    <button type="button" className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Filter className="h-4 w-4 text-gray-400" />
                      Filters
                    </button>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-6 max-w-xl">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Export Format</div>
                      <div className="mt-2 space-y-2 text-sm text-gray-700">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="exportPartsFormat" checked={exportForm.format === 'csv'} onChange={() => setExportForm((p) => ({ ...p, format: 'csv' }))} />
                          CSV (Excel)
                        </label>
                        <label className="flex items-center gap-2">
                          <input type="radio" name="exportPartsFormat" checked={exportForm.format === 'qr_pdf'} onChange={() => setExportForm((p) => ({ ...p, format: 'qr_pdf' }))} />
                          QR Codes (PDF)
                        </label>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={exportForm.includeOnlyRestock} onChange={(e) => setExportForm((p) => ({ ...p, includeOnlyRestock: e.target.checked }))} />
                      Include only Parts that need restock
                    </label>

                    <div>
                      <button type="button" onClick={() => setExportForm((p) => ({ ...p, columnsOpen: !p.columnsOpen }))} className="w-full flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Columns
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${exportForm.columnsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {exportForm.columnsOpen && (
                        <div className="mt-2 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 space-y-2">
                          {[
                            { key: 'id', label: 'ID' },
                            { key: 'name', label: 'Name' },
                            { key: 'stock', label: 'Current Stock' },
                            { key: 'minStock', label: 'Min Stock' },
                            { key: 'location', label: 'Location' },
                          ].map((c) => (
                            <label key={c.key} className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked />
                              {c.label}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button type="button" onClick={() => alert('Schedule would be implemented here.')} className="text-sm text-primary-600 hover:text-primary-700">Schedule</button>
                      <Button onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : exportSection === 'part_transactions' ? (
              <Card>
                <CardHeader>
                  <div className="text-sm font-semibold text-gray-900">Part Transactions</div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-6 max-w-xl">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Date Range</div>
                      <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <input type="date" value={exportForm.start || dateRange.start} onChange={(e) => setExportForm((p) => ({ ...p, start: e.target.value }))} className="bg-transparent outline-none" />
                        <span className="text-gray-300">-</span>
                        <input type="date" value={exportForm.end || dateRange.end} onChange={(e) => setExportForm((p) => ({ ...p, end: e.target.value }))} className="bg-transparent outline-none" />
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{exportDateRangeText}</div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-900">Export Format</div>
                      <div className="mt-2 space-y-2 text-sm text-gray-700">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="exportPartTransactionsFormat" checked={exportForm.format === 'csv'} onChange={() => setExportForm((p) => ({ ...p, format: 'csv' }))} />
                          CSV (Excel)
                        </label>
                      </div>
                    </div>

                    <div>
                      <button type="button" onClick={() => setExportForm((p) => ({ ...p, columnsOpen: !p.columnsOpen }))} className="w-full flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Columns
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${exportForm.columnsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {exportForm.columnsOpen && (
                        <div className="mt-2 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 space-y-2">
                          {[
                            { key: 'part', label: 'Part' },
                            { key: 'type', label: 'Transaction Type' },
                            { key: 'qty', label: 'Quantity' },
                            { key: 'date', label: 'Date' },
                          ].map((c) => (
                            <label key={c.key} className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked />
                              {c.label}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button type="button" onClick={() => alert('Schedule would be implemented here.')} className="text-sm text-primary-600 hover:text-primary-700">Schedule</button>
                      <Button onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : exportSection === 'meters' ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-gray-900">Export Meter List</div>
                    <button type="button" className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50">
                      <Filter className="h-4 w-4 text-gray-400" />
                      Filters
                    </button>
                  </div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-6 max-w-xl">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Export Format</div>
                      <div className="mt-2 space-y-2 text-sm text-gray-700">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="exportMetersFormat" checked={exportForm.format === 'csv'} onChange={() => setExportForm((p) => ({ ...p, format: 'csv' }))} />
                          CSV (Excel)
                        </label>
                      </div>
                    </div>

                    <div>
                      <button type="button" onClick={() => setExportForm((p) => ({ ...p, columnsOpen: !p.columnsOpen }))} className="w-full flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Columns
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${exportForm.columnsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {exportForm.columnsOpen && (
                        <div className="mt-2 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 space-y-2">
                          {[
                            { key: 'id', label: 'ID' },
                            { key: 'name', label: 'Name' },
                            { key: 'asset', label: 'Asset' },
                            { key: 'unit', label: 'Unit' },
                          ].map((c) => (
                            <label key={c.key} className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked />
                              {c.label}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button type="button" onClick={() => alert('Schedule would be implemented here.')} className="text-sm text-primary-600 hover:text-primary-700">Schedule</button>
                      <Button onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : exportSection === 'meter_reading' ? (
              <Card>
                <CardHeader>
                  <div className="text-sm font-semibold text-gray-900">Export Readings List</div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-6 max-w-xl">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Date Range</div>
                      <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <input type="date" value={exportForm.start || dateRange.start} onChange={(e) => setExportForm((p) => ({ ...p, start: e.target.value }))} className="bg-transparent outline-none" />
                        <span className="text-gray-300">-</span>
                        <input type="date" value={exportForm.end || dateRange.end} onChange={(e) => setExportForm((p) => ({ ...p, end: e.target.value }))} className="bg-transparent outline-none" />
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{exportDateRangeText}</div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-900">Export Format</div>
                      <div className="mt-2 space-y-2 text-sm text-gray-700">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="exportMeterReadingsFormat" checked={exportForm.format === 'csv'} onChange={() => setExportForm((p) => ({ ...p, format: 'csv' }))} />
                          CSV (Excel)
                        </label>
                      </div>
                    </div>

                    <div>
                      <button type="button" onClick={() => setExportForm((p) => ({ ...p, columnsOpen: !p.columnsOpen }))} className="w-full flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Columns
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${exportForm.columnsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {exportForm.columnsOpen && (
                        <div className="mt-2 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 space-y-2">
                          {[
                            { key: 'meter', label: 'Meter' },
                            { key: 'reading', label: 'Reading' },
                            { key: 'date', label: 'Date' },
                            { key: 'user', label: 'User' },
                          ].map((c) => (
                            <label key={c.key} className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked />
                              {c.label}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button type="button" onClick={() => alert('Schedule would be implemented here.')} className="text-sm text-primary-600 hover:text-primary-700">Schedule</button>
                      <Button onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : exportSection === 'vendors' ? (
              <Card>
                <CardHeader>
                  <div className="text-sm font-semibold text-gray-900">Export Vendor List</div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-6 max-w-xl">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Export Format</div>
                      <div className="mt-2 space-y-2 text-sm text-gray-700">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="exportVendorsFormat" checked={exportForm.format === 'csv'} onChange={() => setExportForm((p) => ({ ...p, format: 'csv' }))} />
                          CSV (Excel)
                        </label>
                      </div>
                    </div>

                    <div>
                      <button type="button" onClick={() => setExportForm((p) => ({ ...p, columnsOpen: !p.columnsOpen }))} className="w-full flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Columns
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${exportForm.columnsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {exportForm.columnsOpen && (
                        <div className="mt-2 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 space-y-2">
                          {[
                            { key: 'id', label: 'ID' },
                            { key: 'name', label: 'Name' },
                            { key: 'email', label: 'Email' },
                            { key: 'phone', label: 'Phone' },
                          ].map((c) => (
                            <label key={c.key} className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked />
                              {c.label}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button type="button" onClick={() => alert('Schedule would be implemented here.')} className="text-sm text-primary-600 hover:text-primary-700">Schedule</button>
                      <Button onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : exportSection === 'requests' ? (
              <Card>
                <CardHeader>
                  <div className="text-sm font-semibold text-gray-900">Export Request List</div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-6 max-w-xl">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Date Range</div>
                      <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <input type="date" value={exportForm.start || dateRange.start} onChange={(e) => setExportForm((p) => ({ ...p, start: e.target.value }))} className="bg-transparent outline-none" />
                        <span className="text-gray-300">-</span>
                        <input type="date" value={exportForm.end || dateRange.end} onChange={(e) => setExportForm((p) => ({ ...p, end: e.target.value }))} className="bg-transparent outline-none" />
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{exportDateRangeText}</div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-900">Export Format</div>
                      <div className="mt-2 space-y-2 text-sm text-gray-700">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="exportRequestsFormat" checked={exportForm.format === 'csv'} onChange={() => setExportForm((p) => ({ ...p, format: 'csv' }))} />
                          CSV (Excel)
                        </label>
                      </div>
                    </div>

                    <div>
                      <button type="button" onClick={() => setExportForm((p) => ({ ...p, columnsOpen: !p.columnsOpen }))} className="w-full flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Columns
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${exportForm.columnsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {exportForm.columnsOpen && (
                        <div className="mt-2 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 space-y-2">
                          {[
                            { key: 'id', label: 'ID' },
                            { key: 'title', label: 'Title' },
                            { key: 'status', label: 'Status' },
                            { key: 'priority', label: 'Priority' },
                            { key: 'createdAt', label: 'Created At' },
                          ].map((c) => (
                            <label key={c.key} className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked />
                              {c.label}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button type="button" onClick={() => alert('Schedule would be implemented here.')} className="text-sm text-primary-600 hover:text-primary-700">Schedule</button>
                      <Button onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : exportSection === 'time_cost' ? (
              <Card>
                <CardHeader>
                  <div className="text-sm font-semibold text-gray-900">Time &amp; Cost Tracking</div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-6 max-w-xl">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Date Range</div>
                      <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <input type="date" value={exportForm.start || dateRange.start} onChange={(e) => setExportForm((p) => ({ ...p, start: e.target.value }))} className="bg-transparent outline-none" />
                        <span className="text-gray-300">-</span>
                        <input type="date" value={exportForm.end || dateRange.end} onChange={(e) => setExportForm((p) => ({ ...p, end: e.target.value }))} className="bg-transparent outline-none" />
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{exportDateRangeText}</div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-900">Export Format</div>
                      <div className="mt-2 space-y-2 text-sm text-gray-700">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="exportTimeCostFormat" checked={exportForm.format === 'csv'} onChange={() => setExportForm((p) => ({ ...p, format: 'csv' }))} />
                          CSV (Excel)
                        </label>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-900">Export Type</div>
                      <div className="mt-2 relative">
                        <select
                          value={exportForm.exportType}
                          onChange={(e) => setExportForm((p) => ({ ...p, exportType: e.target.value }))}
                          className="w-full appearance-none rounded-md border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-700"
                        >
                          <option value="grouped_by_user">Grouped by User</option>
                          <option value="grouped_by_work_order">Grouped by Work Order</option>
                          <option value="detailed">Detailed</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-900">Additional Options</div>
                      <label className="mt-2 flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={exportForm.includeDeletedUsers} onChange={(e) => setExportForm((p) => ({ ...p, includeDeletedUsers: e.target.checked }))} />
                        Include Deleted Users
                      </label>
                    </div>

                    <div>
                      <button type="button" onClick={() => setExportForm((p) => ({ ...p, columnsOpen: !p.columnsOpen }))} className="w-full flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Columns
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${exportForm.columnsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {exportForm.columnsOpen && (
                        <div className="mt-2 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 space-y-2">
                          {[
                            { key: 'user', label: 'User' },
                            { key: 'workOrder', label: 'Work Order' },
                            { key: 'hours', label: 'Hours' },
                            { key: 'cost', label: 'Cost' },
                            { key: 'date', label: 'Date' },
                          ].map((c) => (
                            <label key={c.key} className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked />
                              {c.label}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button type="button" onClick={() => alert('Schedule would be implemented here.')} className="text-sm text-primary-600 hover:text-primary-700">Schedule</button>
                      <Button onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : exportSection === 'labor_utilization' ? (
              <Card>
                <CardHeader>
                  <div className="text-sm font-semibold text-gray-900">Labor Utilization</div>
                </CardHeader>
                <CardBody>
                  <div className="space-y-6 max-w-xl">
                    <div>
                      <div className="text-sm font-medium text-gray-900">Date Range</div>
                      <div className="mt-2 inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <input type="date" value={exportForm.start || dateRange.start} onChange={(e) => setExportForm((p) => ({ ...p, start: e.target.value }))} className="bg-transparent outline-none" />
                        <span className="text-gray-300">-</span>
                        <input type="date" value={exportForm.end || dateRange.end} onChange={(e) => setExportForm((p) => ({ ...p, end: e.target.value }))} className="bg-transparent outline-none" />
                      </div>
                      <div className="mt-1 text-xs text-gray-500">{exportDateRangeText}</div>
                    </div>

                    <div>
                      <div className="text-sm font-medium text-gray-900">Export Format</div>
                      <div className="mt-2 space-y-2 text-sm text-gray-700">
                        <label className="flex items-center gap-2">
                          <input type="radio" name="exportLaborFormat" checked={exportForm.format === 'csv'} onChange={() => setExportForm((p) => ({ ...p, format: 'csv' }))} />
                          CSV (Excel)
                        </label>
                      </div>
                    </div>

                    <div>
                      <button type="button" onClick={() => setExportForm((p) => ({ ...p, columnsOpen: !p.columnsOpen }))} className="w-full flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        Columns
                        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${exportForm.columnsOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {exportForm.columnsOpen && (
                        <div className="mt-2 rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 space-y-2">
                          {[
                            { key: 'user', label: 'User' },
                            { key: 'utilization', label: 'Utilization' },
                            { key: 'hours', label: 'Hours' },
                          ].map((c) => (
                            <label key={c.key} className="flex items-center gap-2">
                              <input type="checkbox" defaultChecked />
                              {c.label}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button type="button" onClick={() => alert('Schedule would be implemented here.')} className="text-sm text-primary-600 hover:text-primary-700">Schedule</button>
                      <Button onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">{[
                    { id: 'assets', label: 'Assets' },
                    { id: 'asset_status', label: 'Asset Status' },
                    { id: 'locations', label: 'Locations' },
                    { id: 'parts', label: 'Parts' },
                    { id: 'part_transactions', label: 'Part Transactions' },
                    { id: 'meters', label: 'Meters' },
                    { id: 'meter_reading', label: 'Meter Reading' },
                    { id: 'vendors', label: 'Vendors' },
                    { id: 'requests', label: 'Requests' },
                    { id: 'time_cost', label: 'Time & Cost Tracking' },
                    { id: 'labor_utilization', label: 'Labor Utilization' },
                  ].find((x) => x.id === exportSection)?.label}</h3>
                </CardHeader>
                <CardBody>
                  <div className="text-sm text-gray-600">Send the screenshots for this export section and I’ll match it exactly like Work Orders.</div>
                </CardBody>
              </Card>
            )}
          </div>
        ) : activeTab === 'requests' ? (
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
