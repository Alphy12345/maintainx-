import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Plus, Play, GitBranch, Bolt } from 'lucide-react';
import Button from '../components/Button';

const Automations = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState('enabled');

  const automations = useMemo(
    () => [
      { id: 'a1', name: 'Automation 1', status: 'enabled' },
      { id: 'a2', name: 'Automation 2', status: 'enabled' },
      { id: 'a3', name: 'Automation 3', status: 'disabled' },
    ],
    []
  );

  const filtered = useMemo(
    () => automations.filter((a) => a.status === tab),
    [automations, tab]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Automations</h1>
        <Button
          onClick={() => navigate('/automations/create')}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Automation
        </Button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 lg:col-span-4 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-4 pt-4">
            <div className="inline-flex rounded-md bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setTab('enabled')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  tab === 'enabled'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Enabled
              </button>
              <button
                type="button"
                onClick={() => setTab('disabled')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  tab === 'disabled'
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Disabled
              </button>
            </div>
          </div>

          <div className="p-3 space-y-2">
            {filtered.map((a) => (
              <button
                key={a.id}
                type="button"
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-left"
              >
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary-700" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{a.name}</div>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-2 w-16 rounded bg-blue-100" />
                    <div className="h-2 w-12 rounded bg-blue-50" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 bg-white rounded-lg border border-gray-200 min-h-[540px] flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
                <Play className="w-4 h-4 text-gray-500" />
              </div>
              <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                <GitBranch className="w-6 h-6 text-primary-700" />
              </div>
              <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
                <Bolt className="w-4 h-4 text-gray-500" />
              </div>
            </div>

            <h2 className="mt-6 text-lg font-semibold text-gray-900">Start building automated workflows</h2>
            <p className="mt-2 text-sm text-gray-600">
              Use conditions to trigger tasks and optimize your maintenance operations.
            </p>

            <div className="mt-6">
              <Button
                onClick={() => navigate('/automations/create')}
                className="flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                New Automation
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Automations;
