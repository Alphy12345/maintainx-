import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronDown,
  Filter,
  Plus,
  Search,
  Settings2,
  SlidersHorizontal,
} from 'lucide-react';
import { Button, Card } from '../components';
import useStore from '../store/useStore';

const chipBase =
  'inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50';

const PartsInventory = () => {
  const { inventory } = useStore();
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = inventory || [];
    if (!q) return list;
    return list.filter((p) => {
      const hay = `${p.name || ''} ${p.sku || ''} ${p.vendor || ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [inventory, search]);

  const isEmpty = filtered.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">Parts</h1>
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
              placeholder="Search Parts"
              className="w-64 pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Part
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <button type="button" className={chipBase}>
              <Filter className="h-4 w-4 text-gray-400" />
              Needs Restock
            </button>
            <button type="button" className={chipBase}>Part Types</button>
            <button type="button" className={chipBase}>Location</button>
            <button type="button" className={chipBase}>Asset</button>
            <button type="button" className={chipBase}>Vendor</button>
            <button type="button" className={chipBase}>Area</button>
            <button type="button" className={chipBase}>
              <Plus className="h-4 w-4 text-gray-400" />
              Add Filter
            </button>
          </div>

          <button type="button" className={chipBase}>
            <Settings2 className="h-4 w-4 text-gray-400" />
            My Filters
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4">
          <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-600">Sort by: <span className="text-gray-900">Name</span> · <span className="text-gray-900">Ascending Order</span></div>
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
          </div>

          <div className="px-6 py-16">
            {isEmpty ? (
              <div className="flex flex-col items-center text-center gap-4">
                <div className="h-20 w-20 rounded-full bg-primary-50 flex items-center justify-center">
                  <div className="h-10 w-10 rounded-xl bg-primary-600" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">Start adding Parts</div>
                  <div className="text-sm text-gray-600">Click the New Part button in the top right to get started</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-600">Parts list placeholder</div>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-8">
          <div className="px-6 py-16">
            <div className="text-sm text-gray-500">Select a part to view details</div>
          </div>
        </Card>
      </div>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-gray-500">
        Parts Inventory UI is mock/local (no backend persistence yet).
      </motion.div>
    </div>
  );
};

export default PartsInventory;
