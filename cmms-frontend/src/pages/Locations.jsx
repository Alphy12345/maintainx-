import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, Pencil } from 'lucide-react';
import { Button } from '../components';
import useStore from '../store/useStore';

const Locations = () => {
  const { locations, assets } = useStore();
  const navigate = useNavigate();
  const [selectedLocationId, setSelectedLocationId] = useState(locations?.[0]?.id || '');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLocations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return locations;
    return (locations || []).filter((l) => {
      const name = (l.name || '').toLowerCase();
      const address = (l.address || '').toLowerCase();
      return name.includes(q) || address.includes(q);
    });
  }, [locations, searchTerm]);

  const selectedLocation = useMemo(() => {
    const found = (locations || []).find((l) => l.id === selectedLocationId);
    return found || (locations || [])[0] || null;
  }, [locations, selectedLocationId]);

  const childLocations = useMemo(() => {
    if (!selectedLocation) return [];
    return (locations || []).filter((l) => l.parentId === selectedLocation.id);
  }, [locations, selectedLocation]);

  const assetsAtLocation = useMemo(() => {
    if (!selectedLocation) return [];
    return (assets || []).filter((a) => a.locationId === selectedLocation.id);
  }, [assets, selectedLocation]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Locations"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>
          <Button onClick={() => navigate('/locations/create')} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Location
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50">
          Teams in Charge
        </button>
        <button type="button" className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50">
          Asset
        </button>
        <button type="button" className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50">
          Part
        </button>
        <button type="button" className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50">
          Procedure
        </button>
        <button type="button" className="px-3 py-1.5 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50">
          Add Filter
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="text-xs text-gray-500">Sort By: Name, Ascending Order</div>
          </div>
          <div className="divide-y divide-gray-200">
            {(filteredLocations || []).map((l) => {
              const active = l.id === (selectedLocation?.id || selectedLocationId);
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelectedLocationId(l.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 ${
                    active ? 'bg-blue-50 border-l-4 border-primary-600' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center border ${
                    active ? 'bg-white border-blue-200' : 'bg-gray-50 border-gray-200'
                  }`}>
                    <div className="w-2 h-2 rounded-full bg-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{l.name}</div>
                    {l.address ? (
                      <div className="text-xs text-gray-500 truncate">{l.address}</div>
                    ) : null}
                  </div>
                </button>
              );
            })}
            {(filteredLocations || []).length === 0 && (
              <div className="px-4 py-10 text-sm text-gray-500 text-center">No locations found</div>
            )}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-white rounded-lg border border-gray-200 min-h-[640px] flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <div className="text-sm font-semibold text-gray-900">{selectedLocation?.name || 'Location'}</div>
            <div className="flex items-center gap-2">
              <button type="button" className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50">
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button type="button" className="p-2 border border-gray-300 rounded-md hover:bg-gray-50">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="px-6 py-4 flex-1">
            <div className="text-sm font-semibold text-gray-900">General</div>
            <div className="mt-3">
              <div className="text-xs font-medium text-gray-500">Description</div>
              <div className="mt-1 text-sm text-gray-600">
                {selectedLocation?.description ||
                  'This is the default location. When you create assets or parts without assigning a location, they will be placed here.'}
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="text-xs font-medium text-gray-500">Sub-Locations ({childLocations.length})</div>
              <div className="mt-2 text-sm text-gray-600">Add sub elements inside this Location</div>
              <button type="button" className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium">
                Create Sub-Location
              </button>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="text-xs text-gray-500">
                Created By{' '}
                <span className="text-gray-700 font-medium">Account</span>
              </div>
            </div>

            <div className="mt-6 border-t border-gray-200 pt-4">
              <div className="text-xs font-medium text-gray-500">Assets ({assetsAtLocation.length})</div>
              {assetsAtLocation.length === 0 ? (
                <div className="mt-2 text-sm text-gray-600">No assets assigned to this location</div>
              ) : (
                <div className="mt-2 space-y-2">
                  {assetsAtLocation.slice(0, 5).map((a) => (
                    <div key={a.id} className="flex items-center justify-between px-3 py-2 border border-gray-200 rounded-md">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{a.name}</div>
                        <div className="text-xs text-gray-500 truncate">{a.category}</div>
                      </div>
                      <div className="text-xs text-gray-500">{a.status}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center">
            <button
              type="button"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50"
            >
              Use in New Work Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Locations;
