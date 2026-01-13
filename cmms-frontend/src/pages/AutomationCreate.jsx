import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, Plus } from 'lucide-react';
import Button from '../components/Button';

const AutomationCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerAsset: '',
    triggerMeter: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/automations');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => navigate('/automations')}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ChevronLeft className="w-4 h-4" />
          New Automation
        </button>

        <Button type="submit" form="automation-create-form">
          Create
        </Button>
      </div>

      <form id="automation-create-form" onSubmit={handleSubmit} className="space-y-6">
        <div>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            placeholder="Automation name (Required)"
            className="w-full border-b border-gray-300 px-2 py-3 text-sm focus:outline-none focus:border-primary-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="What will this automation do?"
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">Trigger</h3>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between bg-blue-50 px-4 py-3">
              <div className="text-sm font-medium text-gray-900">When: Meter Reading</div>
              <button type="button" className="p-1 text-gray-500 hover:text-gray-700">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Asset</label>
                <select
                  name="triggerAsset"
                  value={formData.triggerAsset}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Start typing...</option>
                  <option value="asset1">Asset 1</option>
                  <option value="asset2">Asset 2</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Meter <span className="text-red-500">*</span>
                </label>
                <select
                  name="triggerMeter"
                  value={formData.triggerMeter}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Start typing...</option>
                  <option value="meter1">Meter 1</option>
                  <option value="meter2">Meter 2</option>
                </select>
              </div>
            </div>

            <div className="border-t border-gray-200 px-4 py-3">
              <button type="button" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <Plus className="w-4 h-4" />
                Add Trigger
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Conditions</h3>
          <div className="border border-gray-200 rounded-lg px-4 py-3">
            <button type="button" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
              <Plus className="w-4 h-4" />
              Add Condition
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">Actions</h3>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button type="button" className="w-full px-4 py-3 text-left text-sm text-primary-700 hover:bg-gray-50 border-b border-gray-200">
              Create a Work Order
            </button>
            <button type="button" className="w-full px-4 py-3 text-left text-sm text-primary-700 hover:bg-gray-50 border-b border-gray-200">
              Change Asset Status
            </button>
            <button type="button" className="w-full px-4 py-3 text-left text-sm text-primary-700 hover:bg-gray-50">
              Send a Notification
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AutomationCreate;
