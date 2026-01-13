import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, BookUser } from 'lucide-react';
import { Button } from '../components';

const Vendors = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Vendors</h1>
          <div className="text-xs text-gray-500">Panel View</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Vendors"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>

          <Button onClick={() => navigate('/vendors/create')} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Vendor
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50">
          Asset
        </button>
        <button type="button" className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50">
          Location
        </button>
        <button type="button" className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50">
          Part
        </button>
        <button type="button" className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50">
          Vendor Types
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 min-h-[640px] flex items-center justify-center">
        <div className="text-center px-6">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <BookUser className="w-10 h-10 text-primary-700" />
          </div>
          <h2 className="mt-6 text-lg font-semibold text-gray-900">Start adding Vendors to your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Click the "+ New Vendor" button in the top right to get started
          </p>
        </div>
      </div>
    </div>
  );
};

export default Vendors;
