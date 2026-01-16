import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, Filter, Plus, Search } from 'lucide-react';
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
      sections: Array.isArray(proc?.sections) ? proc.sections : [],
    });
    setShowModal(true);
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
    const payload = {
      name,
      description: String(form.description || ''),
      asset_id: form.asset_id ? Number(form.asset_id) : null,
      sections: Array.isArray(form.sections) ? form.sections : [],
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
            New Procedure Template
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
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${active ? 'bg-primary-50' : 'bg-white'}`}
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
        size="lg"
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

          {mode === 'create' ? (
            <div className="text-xs text-gray-500">Sections are currently sent as an empty array.</div>
          ) : null}

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
