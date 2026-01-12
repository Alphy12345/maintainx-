import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronDown, Filter, Plus, Search } from 'lucide-react';
import { Button, Card } from '../components';

const chipBase =
  'inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 bg-white text-sm text-gray-700 hover:bg-gray-50';

const Procedures = () => {
  const [search, setSearch] = useState('');

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
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Procedure Template
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button type="button" className={chipBase}>
          <Filter className="h-4 w-4 text-gray-400" />
          Category
        </button>
        <button type="button" className={chipBase}>Teams in Charge</button>
        <button type="button" className={chipBase}>Location</button>
        <button type="button" className={chipBase}>Asset</button>
      </div>

      <Card className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center text-center gap-5">
          <div className="h-24 w-24 rounded-2xl bg-primary-50 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-primary-600" />
          </div>
          <div>
            <div className="text-xl font-semibold text-gray-900">Start adding Procedures</div>
            <div className="text-sm text-gray-600 mt-2">
              Press <span className="font-medium">+ New Procedure Template</span> button above to add your first Procedure and share it with your organization!
            </div>
          </div>
        </div>
      </Card>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-gray-500">
        Procedure Library UI is a placeholder layout.
      </motion.div>
    </div>
  );
};

export default Procedures;
