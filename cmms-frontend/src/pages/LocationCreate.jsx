import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Paperclip } from 'lucide-react';
import { Button } from '../components';
import useStore from '../store/useStore';

const LocationCreate = () => {
  const navigate = useNavigate();
  const { locations, addLocation } = useStore();

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    description: '',
    teamsInCharge: '',
    barcode: '',
    vendors: '',
    parentId: '',
  });

  const parentOptions = useMemo(() => locations || [], [locations]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    addLocation({
      name: formData.name,
      address: formData.address,
      parentId: formData.parentId || undefined,
      type: 'site',
    });
    navigate('/locations');
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">New Location</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Enter Location Name"
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

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter address"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
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
          <label className="block text-sm font-medium text-gray-700">Teams in Charge</label>
          <select
            name="teamsInCharge"
            value={formData.teamsInCharge}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Start typing...</option>
            <option value="team1">Team 1</option>
            <option value="team2">Team 2</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">QR Code/Barcode</label>
          <input
            type="text"
            name="barcode"
            value={formData.barcode}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <div className="text-sm text-gray-600">
            or{' '}
            <button type="button" className="text-primary-600 hover:text-primary-700 font-medium">
              Generate Code
            </button>
          </div>
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
          <label className="block text-sm font-medium text-gray-700">Vendors</label>
          <select
            name="vendors"
            value={formData.vendors}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Start typing...</option>
            <option value="vendor1">Vendor 1</option>
            <option value="vendor2">Vendor 2</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Parent Location</label>
          <select
            name="parentId"
            value={formData.parentId}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Start typing...</option>
            {parentOptions.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-4 pt-6">
          <button
            type="button"
            onClick={() => navigate('/locations')}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Cancel
          </button>
          <Button type="submit">Create</Button>
        </div>
      </form>
    </div>
  );
};

export default LocationCreate;
