import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Paperclip, Plus } from 'lucide-react';
import axios from 'axios';
import { Button } from '../components';
import useStore from '../store/useStore';

const API_BASE_URL = 'http://172.18.100.33:8000';

const COLORS = [
  { id: 'blue', className: 'bg-blue-500' },
  { id: 'green', className: 'bg-green-500' },
  { id: 'yellow', className: 'bg-yellow-500' },
  { id: 'red', className: 'bg-red-500' },
  { id: 'teal', className: 'bg-teal-500' },
  { id: 'pink', className: 'bg-pink-500' },
  { id: 'purple', className: 'bg-purple-500' },
  { id: 'orange', className: 'bg-orange-500' },
];

const VendorCreate = () => {
  const navigate = useNavigate();
  const params = useParams();
  const vendorId = params?.id;
  const isEdit = Boolean(vendorId);
  const { locations, assets, inventory } = useStore();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    color: 'blue',
    description: '',
    locations: '',
    assets: '',
    parts: '',
    vendorTypes: '',
  });

  const [contacts, setContacts] = useState([]);

  const locationOptions = useMemo(() => locations || [], [locations]);
  const assetOptions = useMemo(() => assets || [], [assets]);
  const partOptions = useMemo(() => inventory || [], [inventory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const updateContact = (id, patch) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const removeContact = (id) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const addContact = () => {
    setContacts((prev) => [
      ...prev,
      { id: `c${Date.now()}`, name: '', email: '', phone: '' },
    ]);
  };

  useEffect(() => {
    if (!isEdit) return;
    const run = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get(`${API_BASE_URL}/vendors/${vendorId}`, {
          headers: { accept: 'application/json' },
        });
        const v = res?.data || {};
        setFormData((p) => ({
          ...p,
          name: v?.name ?? '',
          color: v?.color ?? p.color,
          description: v?.description ?? '',
          locations: v?.locations ?? v?.location_id ?? '',
          assets: v?.assets ?? v?.asset_id ?? '',
          parts: v?.parts ?? v?.part_id ?? '',
          vendorTypes: v?.vendorTypes ?? v?.vendor_types ?? '',
        }));

        const apiContacts = v?.contacts;
        if (Array.isArray(apiContacts)) {
          setContacts(apiContacts.map((c) => ({
            id: c?.id ? String(c.id) : `c${Date.now()}-${Math.random().toString(16).slice(2)}`,
            name: c?.name ?? '',
            email: c?.email ?? '',
            phone: c?.phone ?? '',
          })));
        }
      } catch (e) {
        setError(e?.response?.data?.detail || e?.message || 'Failed to load vendor');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [isEdit, vendorId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = String(formData.name || '').trim();
    if (!name) return;

    setSaving(true);
    setError('');
    try {
      const payload = {
        name,
        color: formData.color,
        description: formData.description,
        locations: formData.locations,
        location_id: formData.locations || null,
        assets: formData.assets,
        asset_id: formData.assets || null,
        parts: formData.parts,
        part_id: formData.parts || null,
        vendorTypes: formData.vendorTypes,
        vendor_types: formData.vendorTypes,
        contacts,
      };

      if (isEdit) {
        try {
          await axios.patch(
            `${API_BASE_URL}/vendors/${vendorId}`,
            payload,
            {
              headers: {
                accept: 'application/json',
                'Content-Type': 'application/json',
              },
            },
          );
        } catch (ePatch) {
          const status = ePatch?.response?.status;
          if (status === 422 || status === 400) {
            await axios.patch(
              `${API_BASE_URL}/vendors/${vendorId}`,
              { name },
              {
                headers: {
                  accept: 'application/json',
                  'Content-Type': 'application/json',
                },
              },
            );
          } else {
            throw ePatch;
          }
        }
      } else {
        await axios.post(
          `${API_BASE_URL}/vendors`,
          payload,
          {
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
            },
          },
        );
      }
      navigate('/vendors');
    } catch (e2) {
      setError(e2?.response?.data?.detail || e2?.message || (isEdit ? 'Failed to update vendor' : 'Failed to create vendor'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">{isEdit ? 'Edit Vendor' : 'New Vendor'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {loading ? (
          <div className="p-3 rounded-md border border-gray-200 bg-gray-50 text-gray-700 text-sm">Loading…</div>
        ) : null}
        {error ? (
          <div className="p-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        ) : null}

        <div>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter Vendor Name (Required)"
            className="w-full border-b border-gray-300 px-1 py-3 text-sm focus:outline-none focus:border-primary-500"
          />
        </div>

        <div className="border-2 border-dashed border-blue-200 bg-blue-50 rounded-lg p-10 text-center">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-white border border-blue-100 flex items-center justify-center">
              <Camera className="w-5 h-5 text-primary-700" />
            </div>
            <div className="mt-2 text-sm text-primary-700">Add or drag pictures</div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Vendor Color</label>
          <div className="flex items-center gap-4">
            {COLORS.map((c) => {
              const selected = formData.color === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, color: c.id }))}
                  className={`w-8 h-8 rounded-full ${c.className} ${
                    selected ? 'ring-2 ring-offset-2 ring-primary-500' : ''
                  }`}
                  aria-label={c.id}
                />
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            placeholder="Add a description"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Contact List</label>
          <button
            type="button"
            onClick={addContact}
            className="inline-flex items-center gap-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            <Plus className="w-4 h-4" />
            New Contact
          </button>

          {contacts.length > 0 && (
            <div className="mt-4 space-y-3">
              {contacts.map((c) => (
                <div key={c.id} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="text"
                    placeholder="Name"
                    value={c.name}
                    onChange={(e) => updateContact(c.id, { name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={c.email}
                    onChange={(e) => updateContact(c.id, { email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    value={c.phone}
                    onChange={(e) => updateContact(c.id, { phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <div className="md:col-span-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeContact(c.id)}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Remove contact
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Files</label>
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 border border-primary-500 text-primary-700 rounded-md text-sm hover:bg-primary-50"
          >
            <Paperclip className="w-4 h-4" />
            Attach files
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Locations</label>
          <select
            name="locations"
            value={formData.locations}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Start typing...</option>
            {locationOptions.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Assets</label>
          <select
            name="assets"
            value={formData.assets}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Start typing...</option>
            {assetOptions.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Parts</label>
          <select
            name="parts"
            value={formData.parts}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Start typing...</option>
            {partOptions.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Vendor Types</label>
          <select
            name="vendorTypes"
            value={formData.vendorTypes}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Start typing...</option>
            <option value="supplier">Supplier</option>
            <option value="contractor">Contractor</option>
            <option value="manufacturer">Manufacturer</option>
          </select>
        </div>

        <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={() => navigate('/vendors')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Cancel
          </button>
          <Button type="submit" disabled={saving || loading}>{saving ? (isEdit ? 'Saving…' : 'Creating…') : (isEdit ? 'Save' : 'Create')}</Button>
        </div>
      </form>
    </div>
  );
};

export default VendorCreate;
