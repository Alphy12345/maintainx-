import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, Filter, Plus, Search, Trash2, Type, Rows3, SquarePen, Hash, DollarSign, List, ListChecks, ScanSearch, CheckSquare, X } from 'lucide-react';
import axios from 'axios';
import { Button, Card, Modal } from '../components';

const API_BASE_URL = 'http://172.18.100.33:8000';

const chipBase =
  'inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50';

const Procedures = () => {
  const [search, setSearch] = useState('');

  const [procedures, setProcedures] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [mode, setMode] = useState('create');
  const [form, setForm] = useState({ name: '', description: '', asset_id: '', sections: [] });

  const [typeMenuOpenForId, setTypeMenuOpenForId] = useState(null);
  const [typeSearch, setTypeSearch] = useState('');

  const newItemId = () => `it-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const fieldTypeOptions = [
    { key: 'checkbox', label: 'Checkbox', Icon: CheckSquare },
    { key: 'text', label: 'Text Field', Icon: Rows3 },
    { key: 'number', label: 'Number Field', Icon: Hash },
    { key: 'amount', label: 'Amount ($)', Icon: DollarSign },
    { key: 'multiple_choice', label: 'Multiple Choice', Icon: List },
    { key: 'checklist', label: 'Checklist', Icon: ListChecks },
    { key: 'inspection_check', label: 'Inspection Check', Icon: ScanSearch },
  ];

  const ensureOptionsIfNeeded = (it) => {
    const ft = String(it?.field_type || 'text');
    if (ft === 'multiple_choice' || ft === 'checklist') {
      const options = Array.isArray(it?.options) ? it.options : [];
      return { ...it, options: options.length ? options : ['Option 1'] };
    }
    if (ft === 'inspection_check') {
      return { ...it, options: [] };
    }
    return { ...it, options: Array.isArray(it?.options) ? it.options : [] };
  };

  const normalizeItems = (items) => {
    const list = Array.isArray(items) ? items : [];
    return list.map((it) => {
      const type = String(it?.type || it?.kind || 'field');
      if (type === 'heading') {
        return {
          id: it?.id || newItemId(),
          type: 'heading',
          text: it?.text ?? it?.title ?? '',
        };
      }
      if (type === 'section') {
        return {
          id: it?.id || newItemId(),
          type: 'section',
          title: it?.title ?? it?.text ?? '',
        };
      }
      return {
        id: it?.id || newItemId(),
        type: 'field',
        label: it?.label ?? it?.name ?? it?.field_name ?? '',
        field_type: it?.field_type ?? it?.input_type ?? 'text',
        required: Boolean(it?.required),
        value: it?.value ?? '',
        options: Array.isArray(it?.options)
          ? it.options
          : (Array.isArray(it?.choices) ? it.choices : (Array.isArray(it?.items) ? it.items : [])),
      };
    });
  };

  const assetsById = useMemo(() => {
    const map = new Map();
    for (const a of assets) map.set(a.id, a);
    return map;
  }, [assets]);

  const fetchAssets = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/assets`, {
        headers: { accept: 'application/json' },
      });
      setAssets(Array.isArray(res.data) ? res.data : []);
    } catch {
      setAssets([]);
    }
  };

  const fetchProcedures = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/procedures`, {
        headers: { accept: 'application/json' },
      });
      const rows = Array.isArray(res.data) ? res.data : [];
      setProcedures(rows);
      setSelectedProcedure((prev) => {
        if (!prev) return null;
        return rows.find((p) => p.id === prev.id) || null;
      });
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to load procedures');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchProcedures();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = procedures || [];
    if (!q) return list;
    return list.filter((p) => {
      const assetName = assetsById.get(p.asset_id)?.asset_name || '';
      const hay = `${p.name || ''} ${p.description || ''} ${assetName}`.toLowerCase();
      return hay.includes(q);
    });
  }, [procedures, search, assetsById]);

  const openCreate = () => {
    setMode('create');
    setForm({ name: '', description: '', asset_id: '', sections: [] });
    setShowModal(true);
  };

  const openEdit = (proc) => {
    setMode('edit');
    setSelectedProcedure(proc);
    setForm({
      name: proc?.name ?? '',
      description: proc?.description ?? '',
      asset_id: proc?.asset_id ? String(proc.asset_id) : '',
      sections: normalizeItems(proc?.sections),
    });
    setShowModal(true);
  };

  useEffect(() => {
    if (!showModal) return;
    if ((Array.isArray(form.sections) ? form.sections : []).length > 0) return;

    setForm((p) => {
      const current = Array.isArray(p.sections) ? p.sections : [];
      if (current.length > 0) return p;
      return {
        ...p,
        sections: [
          {
            id: newItemId(),
            type: 'field',
            label: '',
            field_type: 'text',
            required: false,
            options: [],
          },
        ],
      };
    });
  }, [showModal]);

  const addBuilderItem = (type) => {
    setForm((p) => {
      const next = Array.isArray(p.sections) ? [...p.sections] : [];
      if (type === 'heading') {
        next.push({ id: newItemId(), type: 'heading', text: '' });
      } else if (type === 'section') {
        next.push({ id: newItemId(), type: 'section', title: '' });
      } else {
        next.push({ id: newItemId(), type: 'field', label: '', field_type: 'text', required: false, value: '', options: [] });
      }
      return { ...p, sections: next };
    });
  };

  const addCheckboxItem = () => {
    setForm((p) => {
      const next = Array.isArray(p.sections) ? [...p.sections] : [];
      next.push({ id: newItemId(), type: 'field', label: '', field_type: 'checkbox', required: false, value: '', options: [] });
      return { ...p, sections: next };
    });
  };

  const updateBuilderItem = (id, patch) => {
    setForm((p) => ({
      ...p,
      sections: (Array.isArray(p.sections) ? p.sections : []).map((it) => {
        if (it?.id !== id) return it;
        const next = { ...it, ...patch };
        return it?.type === 'field' ? ensureOptionsIfNeeded(next) : next;
      }),
    }));
  };

  const addOption = (id) => {
    setForm((p) => ({
      ...p,
      sections: (Array.isArray(p.sections) ? p.sections : []).map((it) => {
        if (it?.id !== id) return it;
        const existing = Array.isArray(it?.options) ? it.options : [];
        const next = [...existing, `Option ${existing.length + 1}`];
        return { ...it, options: next };
      }),
    }));
  };

  const updateOption = (id, idx, value) => {
    setForm((p) => ({
      ...p,
      sections: (Array.isArray(p.sections) ? p.sections : []).map((it) => {
        if (it?.id !== id) return it;
        const existing = Array.isArray(it?.options) ? it.options : [];
        const next = existing.map((o, i) => (i === idx ? value : o));
        return { ...it, options: next };
      }),
    }));
  };

  const removeOption = (id, idx) => {
    setForm((p) => ({
      ...p,
      sections: (Array.isArray(p.sections) ? p.sections : []).map((it) => {
        if (it?.id !== id) return it;
        const existing = Array.isArray(it?.options) ? it.options : [];
        const next = existing.filter((_o, i) => i !== idx);
        return { ...it, options: next.length ? next : ['Option 1'] };
      }),
    }));
  };

  const removeBuilderItem = (id) => {
    setForm((p) => ({
      ...p,
      sections: (Array.isArray(p.sections) ? p.sections : []).filter((it) => it?.id !== id),
    }));
  };

  const handleDelete = async (id) => {
    const ok = window.confirm('Delete this procedure?');
    if (!ok) return;
    setError('');
    try {
      await axios.delete(`${API_BASE_URL}/procedures/${id}`, {
        headers: { accept: '*/*' },
      });
      if (selectedProcedure?.id === id) setSelectedProcedure(null);
      await fetchProcedures();
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to delete procedure');
    }
  };

  const handleSave = async () => {
    const name = String(form.name || '').trim();
    if (!name) return;
    const cleanSections = (Array.isArray(form.sections) ? form.sections : []).map((it) => {
      if (it?.type === 'heading') {
        return { id: it.id, type: 'heading', text: it.text ?? '' };
      }
      if (it?.type === 'section') {
        return { id: it.id, type: 'section', title: it.title ?? '' };
      }
      return {
        id: it.id,
        type: 'field',
        label: it.label ?? '',
        field_type: it.field_type ?? 'text',
        required: Boolean(it.required),
        options: Array.isArray(it.options) ? it.options : [],
      };
    });
    const payload = {
      name,
      description: String(form.description || ''),
      asset_id: form.asset_id ? Number(form.asset_id) : null,
      sections: cleanSections,
    };

    setSaving(true);
    setError('');
    try {
      if (mode === 'create') {
        const created = await axios.post(`${API_BASE_URL}/procedures`, payload, {
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
        });
        setShowModal(false);
        await fetchProcedures();
        const next = created?.data;
        if (next?.id) setSelectedProcedure(next);
      } else {
        await axios.patch(`${API_BASE_URL}/procedures/${selectedProcedure.id}`,
          {
            name: payload.name,
            description: payload.description,
            asset_id: payload.asset_id,
            sections: payload.sections,
          },
          {
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
            },
          },
        );
        setShowModal(false);
        await fetchProcedures();
      }
    } catch (e) {
      setError(e?.response?.data?.detail || e?.message || 'Failed to save procedure');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Procedure Library</h1>
          <div className="text-sm text-gray-600">00</div>
          <button type="button" className="text-sm text-gray-700 hover:text-gray-900 inline-flex items-center gap-1">
            Panel View <ChevronDown className="h-4 w-4 text-gray-400" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Procedure templates"
              className="w-80 pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <Button onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" />
            Add Procedure
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      {error ? (
        <div className="p-4 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm flex items-center justify-between">
          <div>{error}</div>
          <button
            type="button"
            onClick={() => fetchProcedures()}
            className="text-sm font-medium text-red-700 hover:text-red-800"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" className={chipBase}>
          <Filter className="h-4 w-4 text-gray-400" />
          Category
        </button>
        <button type="button" className={chipBase}>Teams in Charge</button>
        <button type="button" className={chipBase}>Location</button>
        <button type="button" className={chipBase}>Asset</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">Procedures ({filtered.length})</div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-sm text-gray-600">Loading procedures…</div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-16">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-primary-50 flex items-center justify-center">
                    <CheckCircle2 className="h-10 w-10 text-primary-600" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">Start adding Procedures</div>
                    <div className="text-sm text-gray-600">Click the New Procedure Template button to get started</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filtered.map((p) => {
                  const active = selectedProcedure?.id === p.id;
                  const assetName = assetsById.get(p.asset_id)?.asset_name || '—';
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedProcedure(p)}
                      className={`w-full text-left px-4 py-3 ${active ? 'bg-slate-800' : 'bg-transparent'} hover:bg-slate-900`}
                    >
                      <div className="text-sm font-semibold text-gray-900 truncate">{p.name}</div>
                      <div className="mt-1 text-xs text-gray-500 truncate">{assetName}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-8">
          <div className="p-6 min-h-[60vh]">
            {!selectedProcedure ? (
              <div className="h-full flex items-center justify-center text-sm text-gray-500">Select a procedure to view details</div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{selectedProcedure.name}</div>
                    <div className="mt-1 text-sm text-gray-600">
                      Asset: {assetsById.get(selectedProcedure.asset_id)?.asset_name || '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" onClick={() => openEdit(selectedProcedure)}>Edit</Button>
                    <Button variant="secondary" onClick={() => handleDelete(selectedProcedure.id)}>Delete</Button>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Description</div>
                  <div className="text-sm text-gray-900">{selectedProcedure.description || '—'}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Sections</div>
                  <div className="text-sm text-gray-900">{Array.isArray(selectedProcedure.sections) ? selectedProcedure.sections.length : 0}</div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={mode === 'create' ? 'New Procedure' : 'Edit Procedure'}
        size="xl"
      >
        <div className="space-y-4">
          {error ? (
            <div className="p-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
          ) : null}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Asset</label>
            <div className="relative">
              <select
                value={form.asset_id}
                onChange={(e) => setForm((p) => ({ ...p, asset_id: e.target.value }))}
                className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md bg-white focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select Asset</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>{a.asset_name || a.name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-9">
              <div className="rounded-md border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">Procedure Builder</div>
                <div className="mt-3 space-y-3">
                  {(Array.isArray(form.sections) ? form.sections : []).length === 0 ? (
                    <div className="text-sm text-gray-500">Add items from the right panel.</div>
                  ) : null}

                  {(Array.isArray(form.sections) ? form.sections : []).map((it) => (
                    <div key={it.id} className="rounded-md border border-gray-200 p-3">
                      {it.type === 'field' ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                              value={it.label}
                              onChange={(e) => updateBuilderItem(it.id, { label: e.target.value })}
                              placeholder="Field Name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() => {
                                  setTypeMenuOpenForId((prev) => (prev === it.id ? null : it.id));
                                  setTypeSearch('');
                                }}
                                className="w-full inline-flex items-center justify-between gap-2 px-3 py-2 border border-gray-700 rounded-md bg-transparent text-gray-100 focus:outline-none focus:ring-0"
                              >
                                <span className="inline-flex items-center gap-2 text-sm text-gray-700">
                                  {(() => {
                                    const cfg = fieldTypeOptions.find((x) => x.key === it.field_type) || fieldTypeOptions[1];
                                    const Icon = cfg.Icon;
                                    return (
                                      <>
                                        <Icon className="h-4 w-4 text-gray-500" />
                                        {cfg.label}
                                      </>
                                    );
                                  })()}
                                </span>
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              </button>

                              {typeMenuOpenForId === it.id && (
                                <div className="absolute z-20 mt-2 w-full rounded-md border border-gray-700 bg-gray-900 shadow-lg overflow-hidden">
                                  <div className="px-2 py-2 border-b border-gray-700">
                                    <div className="relative">
                                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                      <input
                                        value={typeSearch}
                                        onChange={(e) => setTypeSearch(e.target.value)}
                                        placeholder="Search"
                                        className="w-full pl-8 pr-2 py-2 text-sm border border-gray-700 rounded-md bg-gray-900 text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                                      />
                                    </div>
                                  </div>
                                  <div className="max-h-60 overflow-y-auto">
                                    {fieldTypeOptions
                                      .filter((x) => x.label.toLowerCase().includes(typeSearch.trim().toLowerCase()))
                                      .map((x) => {
                                        const Icon = x.Icon;
                                        const active = x.key === it.field_type;
                                        return (
                                          <button
                                            key={x.key}
                                            type="button"
                                            onClick={() => {
                                              updateBuilderItem(it.id, { field_type: x.key });
                                              setTypeMenuOpenForId(null);
                                            }}
                                            className={`w-full px-3 py-2 text-left text-sm inline-flex items-center gap-2 text-gray-100 focus:outline-none ${active ? 'bg-gray-800' : 'bg-transparent'} hover:bg-gray-800`}
                                          >
                                            <Icon className="h-4 w-4 text-gray-500" />
                                            {x.label}
                                          </button>
                                        );
                                      })}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {it.field_type === 'text' && (
                            <div>
                              <textarea
                                rows={3}
                                placeholder="Text will be entered here"
                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                              />
                            </div>
                          )}

                          {it.field_type === 'number' && (
                            <div>
                              <input
                                type="number"
                                placeholder="Number will be entered here"
                                className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm"
                              />
                            </div>
                          )}

                          {it.field_type === 'amount' && (
                            <div className="flex items-center gap-2">
                              <div className="text-sm text-gray-700">$</div>
                              <input
                                type="number"
                                placeholder="Amount will be entered here"
                                className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-sm"
                              />
                            </div>
                          )}

                          {it.field_type === 'checkbox' && (
                            <div className="space-y-2">
                              <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" className="rounded border-gray-300" />
                                {it.label?.trim() ? it.label : 'Checkbox'}
                              </label>
                              <button
                                type="button"
                                onClick={addCheckboxItem}
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                              >
                                + Add Checkbox
                              </button>
                            </div>
                          )}

                          {(it.field_type === 'multiple_choice' || it.field_type === 'checklist') && (
                            <div className="space-y-2">
                              {(Array.isArray(it.options) ? it.options : []).map((opt, idx) => (
                                <div key={`${it.id}-opt-${idx}`} className="flex items-center gap-2">
                                  <input
                                    value={opt}
                                    onChange={(e) => updateOption(it.id, idx, e.target.value)}
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
                                    placeholder={`Option ${idx + 1}`}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeOption(it.id, idx)}
                                    className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-gray-200 hover:bg-gray-50"
                                    aria-label="Remove option"
                                  >
                                    <X className="h-4 w-4 text-gray-600" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addOption(it.id)}
                                className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                              >
                                + Add Option
                              </button>
                            </div>
                          )}

                          {it.field_type === 'inspection_check' && (
                            <div className="grid grid-cols-3 gap-3">
                              <button
                                type="button"
                                onClick={() => updateBuilderItem(it.id, { value: 'pass' })}
                                className={`px-3 py-2 rounded-md border text-sm ${it.value === 'pass' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-green-600 hover:bg-gray-50'}`}
                              >
                                Pass
                              </button>
                              <button
                                type="button"
                                onClick={() => updateBuilderItem(it.id, { value: 'flag' })}
                                className={`px-3 py-2 rounded-md border text-sm ${it.value === 'flag' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 bg-white text-orange-600 hover:bg-gray-50'}`}
                              >
                                Flag
                              </button>
                              <button
                                type="button"
                                onClick={() => updateBuilderItem(it.id, { value: 'fail' })}
                                className={`px-3 py-2 rounded-md border text-sm ${it.value === 'fail' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-red-600 hover:bg-gray-50'}`}
                              >
                                Fail
                              </button>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                checked={Boolean(it.required)}
                                onChange={(e) => updateBuilderItem(it.id, { required: e.target.checked })}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              Required
                            </label>

                            <button
                              type="button"
                              onClick={() => removeBuilderItem(it.id)}
                              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remove
                            </button>
                          </div>
                        </div>
                      ) : null}

                      {it.type === 'heading' ? (
                        <div className="flex items-center gap-3">
                          <input
                            value={it.text}
                            onChange={(e) => updateBuilderItem(it.id, { text: e.target.value })}
                            placeholder="Heading"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeBuilderItem(it.id)}
                            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      ) : null}

                      {it.type === 'section' ? (
                        <div className="flex items-center gap-3">
                          <input
                            value={it.title}
                            onChange={(e) => updateBuilderItem(it.id, { title: e.target.value })}
                            placeholder="Section Title"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                          />
                          <button
                            type="button"
                            onClick={() => removeBuilderItem(it.id)}
                            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="rounded-md border border-gray-200 bg-white p-4">
                <div className="text-sm font-semibold text-gray-900">New Item</div>
                <div className="mt-3 space-y-2">
                  <button
                    type="button"
                    onClick={() => addBuilderItem('field')}
                    className="w-full inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <SquarePen className="h-4 w-4 text-gray-500" />
                    Field
                  </button>
                  <button
                    type="button"
                    onClick={() => addBuilderItem('heading')}
                    className="w-full inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Type className="h-4 w-4 text-gray-500" />
                    Heading
                  </button>
                  <button
                    type="button"
                    onClick={() => addBuilderItem('section')}
                    className="w-full inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Rows3 className="h-4 w-4 text-gray-500" />
                    Section
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !String(form.name || '').trim()}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Procedures;
