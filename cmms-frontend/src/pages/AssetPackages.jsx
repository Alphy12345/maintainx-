import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PackagePlus } from 'lucide-react';
import { Button } from '../components';

const AssetPackages = () => {
  const [tab, setTab] = useState('custom');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Asset Packages</h1>
        <p className="text-sm text-gray-600 mt-1">Discover, install, and manage packages for your Assets.</p>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex">
            <button
              type="button"
              onClick={() => setTab('custom')}
              className={`flex-1 text-sm py-3 border-b-2 ${
                tab === 'custom'
                  ? 'border-primary-600 text-primary-700 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Custom Packages
            </button>
            <button
              type="button"
              onClick={() => setTab('hub')}
              className={`flex-1 text-sm py-3 border-b-2 ${
                tab === 'hub'
                  ? 'border-primary-600 text-primary-700 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Asset Hub Packages
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-[55vh] flex items-center justify-center">
        {tab === 'custom' ? (
          <div className="flex flex-col items-center text-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary-50 flex items-center justify-center">
              <PackagePlus className="h-7 w-7 text-primary-600" />
            </div>
            <div>
              <div className="text-sm text-gray-900 font-medium">You don't have any packages created yet.</div>
              <div className="text-xs text-gray-500 mt-1">
                Packages created by your organization, available to reinstall anytime.
              </div>
            </div>
            <Button>
              Create Package from Asset
            </Button>
          </div>
        ) : (
          <div className="text-sm text-gray-500">Asset Hub Packages placeholder</div>
        )}
      </div>

      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-xs text-gray-500">
        Asset Packages UI is a placeholder layout.
      </motion.div>
    </div>
  );
};

export default AssetPackages;
