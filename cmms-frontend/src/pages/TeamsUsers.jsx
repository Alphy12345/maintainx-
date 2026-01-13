import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Plus } from 'lucide-react';
import { Button } from '../components';
import useStore from '../store/useStore';

const TeamsUsers = () => {
  const navigate = useNavigate();
  const { users } = useStore();
  const [tab, setTab] = useState('users');
  const [search, setSearch] = useState('');

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users || [];
    return (users || []).filter((u) => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teams / Users</h1>

        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search Users"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>

          <Button onClick={() => navigate('/teams-users/invite')} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Invite Users
          </Button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            type="button"
            onClick={() => setTab('users')}
            className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
              tab === 'users'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Users
          </button>
          <button
            type="button"
            onClick={() => setTab('teams')}
            className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
              tab === 'teams'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Teams
          </button>
        </nav>
      </div>

      {tab === 'users' ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teams</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Visit</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td className="px-6 py-10 text-sm text-gray-500" colSpan={5}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="bg-white">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center text-xs font-semibold text-primary-700">
                            {(u.name || 'U').trim().slice(0, 1).toUpperCase()}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{u.name || 'User'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.roleLabel || 'Administrator'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.teamsLabel || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{u.lastVisit || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button type="button" className="p-2 rounded-md hover:bg-gray-50 border border-transparent hover:border-gray-200">
                          <MoreVertical className="w-4 h-4 text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-end px-4 py-3 text-xs text-gray-500 border-t border-gray-200">
            1 – 1 of 1
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-sm text-gray-500">
          No teams yet.
        </div>
      )}
    </div>
  );
};

export default TeamsUsers;
