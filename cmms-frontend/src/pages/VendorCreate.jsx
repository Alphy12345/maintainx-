import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const { locations, assets, inventory } = useStore();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

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

  const addContact = () => {
    setContacts((prev) => [
      ...prev,
      { id: `c${Date.now()}`, name: '', email: '', phone: '' },
    ]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = String(formData.name || '').trim();
    if (!name) return;

    setSaving(true);
    setError('');
    try {
      await axios.post(
        `${API_BASE_URL}/vendors`,
        { name },
        {
          headers: {
            accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      );
      navigate('/vendors');
    } catch (e2) {
      setError(e2?.response?.data?.detail || e2?.message || 'Failed to create vendor');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">New Vendor</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <input
                    type="tel"
                    placeholder="Phone"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
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
          <Button type="submit" disabled={saving}>{saving ? 'Creating…' : 'Create'}</Button>
        </div>
      </form>
    </div>
  );
};

export default VendorCreate;
