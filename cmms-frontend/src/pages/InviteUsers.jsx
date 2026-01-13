import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ChevronLeft, Link2, Plus } from 'lucide-react';
import { Button } from '../components';

const InviteUsers = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([
    { id: 'r1', fullName: '', contact: '', accountType: 'full' },
  ]);

  const updateRow = (id, patch) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: `r${Date.now()}`, fullName: '', contact: '', accountType: 'full' },
    ]);
  };

  const removeRow = (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/teams-users');
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate('/teams-users')}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ChevronLeft className="w-4 h-4" />
        Invite Users
      </button>

      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 max-w-3xl">
        <div className="space-y-4">
          {rows.map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-3 items-end">
              <div className="col-span-12 md:col-span-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={r.fullName}
                  onChange={(e) => updateRow(r.id, { fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="col-span-12 md:col-span-4">
                <label className="block text-xs font-medium text-gray-600 mb-1">Mobile Phone Number or Email</label>
                <input
                  type="text"
                  value={r.contact}
                  onChange={(e) => updateRow(r.id, { contact: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="col-span-10 md:col-span-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Account Type</label>
                <select
                  value={r.accountType}
                  onChange={(e) => updateRow(r.id, { accountType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="full">Full User</option>
                  <option value="limited">Limited User</option>
                </select>
              </div>

              <div className="col-span-2 md:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeRow(r.id)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          <div>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-2 px-4 py-2 border border-primary-500 text-primary-700 rounded-md text-sm hover:bg-primary-50"
            >
              <Plus className="w-4 h-4" />
              Add another
            </button>
          </div>

          <div className="pt-6 space-y-3 max-w-md">
            <button
              type="submit"
              className="w-full px-4 py-2 rounded-md text-sm bg-gray-200 text-gray-500 cursor-not-allowed"
              disabled
            >
              Send Invites
            </button>

            <button
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-primary-500 text-primary-700 rounded-md text-sm hover:bg-primary-50"
            >
              <Link2 className="w-4 h-4" />
              Get an invite link to share
            </button>
          </div>
        </div>
      </form>

      <div className="hidden">
        <Button />
      </div>
    </div>
  );
};

export default InviteUsers;
