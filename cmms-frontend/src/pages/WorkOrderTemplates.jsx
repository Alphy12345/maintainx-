import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Filter, Plus, Search } from 'lucide-react';
import { Button, Card } from '../components';

const chipBase =
  'inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50';

const WorkOrderTemplates = () => {
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Work Order Templates</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Work Order Templates"
              className="w-80 pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Work Order Template
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" className={chipBase}>
          <Filter className="h-4 w-4 text-gray-400" />
          Location
        </button>
        <button type="button" className={chipBase}>Asset</button>
        <button type="button" className={chipBase}>Asset Types</button>
        <button type="button" className={chipBase}>Category</button>
        <button type="button" className={chipBase}>Procedure</button>
      </div>

      <Card className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="h-24 w-24 rounded-2xl bg-primary-50 flex items-center justify-center">
            <div className="h-14 w-14 rounded-b-2xl bg-primary-600" />
          </div>
          <div>
            <div className="text-xl font-semibold text-gray-900">Create your first Work Order Template</div>
            <div className="text-sm text-gray-600 mt-2">
              Get Work Orders created in half the time by using a template instead of filling the same fields over and over again.
            </div>
          </div>
        </div>
      </Card>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-gray-500">
        Work Order Templates UI is a placeholder layout.
      </motion.div>
    </div>
  );
};

export default WorkOrderTemplates;
