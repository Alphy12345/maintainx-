import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MoreVertical, Plus } from 'lucide-react';
import axios from 'axios';
import { Button, Modal } from '../components';
import useStore from '../store/useStore';

const API_BASE_URL = 'http://172.18.100.33:8000';

const TeamsUsers = () => {
  const navigate = useNavigate();
  const { users } = useStore();
  const [tab, setTab] = useState('users');
  const [search, setSearch] = useState('');

  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [teamsError, setTeamsError] = useState('');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [teamMode, setTeamMode] = useState('create');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamForm, setTeamForm] = useState({ team_name: '', description: '' });
  const [savingTeam, setSavingTeam] = useState(false);

  const fetchTeams = async () => {
    setLoadingTeams(true);
    setTeamsError('');
    try {
      const res = await axios.get(`${API_BASE_URL}/teams`, {
        headers: { accept: 'application/json' },
      });
      setTeams(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      setTeamsError(e?.response?.data?.detail || e?.message || 'Failed to load teams');
    } finally {
      setLoadingTeams(false);
    }
  };

  useEffect(() => {
    if (tab !== 'teams') return;
    fetchTeams();
  }, [tab]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users || [];
    return (users || []).filter((u) => {
      const name = (u.name || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, search]);

  const filteredTeams = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teams || [];
    return (teams || []).filter((t) => {
      const name = (t.team_name || '').toLowerCase();
      const desc = (t.description || '').toLowerCase();
      return name.includes(q) || desc.includes(q);
    });
  }, [teams, search]);

  const openCreateTeam = () => {
    setTeamMode('create');
    setSelectedTeam(null);
    setTeamForm({ team_name: '', description: '' });
    setShowTeamModal(true);
  };

  const openEditTeam = (team) => {
    setTeamMode('edit');
    setSelectedTeam(team);
    setTeamForm({ team_name: team?.team_name || '', description: team?.description || '' });
    setShowTeamModal(true);
  };

  const handleDeleteTeam = async (teamId) => {
    const ok = window.confirm('Delete this team?');
    if (!ok) return;
    setTeamsError('');
    try {
      await axios.delete(`${API_BASE_URL}/teams/${teamId}`, {
        headers: { accept: '*/*' },
      });
      await fetchTeams();
    } catch (e) {
      setTeamsError(e?.response?.data?.detail || e?.message || 'Failed to delete team');
    }
  };

  const handleSaveTeam = async () => {
    const team_name = String(teamForm.team_name || '').trim();
    if (!team_name) return;
    setSavingTeam(true);
    setTeamsError('');
    try {
      if (teamMode === 'create') {
        await axios.post(
          `${API_BASE_URL}/teams`,
          { team_name, description: String(teamForm.description || '') },
          {
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
            },
          },
        );
      } else {
        await axios.patch(
          `${API_BASE_URL}/teams/${selectedTeam.id}`,
          { team_name, description: String(teamForm.description || '') },
          {
            headers: {
              accept: 'application/json',
              'Content-Type': 'application/json',
            },
          },
        );
      }
      setShowTeamModal(false);
      await fetchTeams();
    } catch (e) {
      setTeamsError(e?.response?.data?.detail || e?.message || 'Failed to save team');
    } finally {
      setSavingTeam(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teams / Users</h1>

        <div className="flex items-center gap-3">
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={tab === 'teams' ? 'Search Teams' : 'Search Users'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500 text-sm"
            />
          </div>

          {tab === 'teams' ? (
            <Button onClick={openCreateTeam} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Team
            </Button>
          ) : (
            <Button onClick={() => navigate('/teams-users/invite')} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Invite Users
            </Button>
          )}
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
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {teamsError ? (
            <div className="p-4 border-b border-gray-200 bg-red-50 text-red-700 text-sm flex items-center justify-between">
              <div>{teamsError}</div>
              <button
                type="button"
                onClick={() => fetchTeams()}
                className="text-sm font-medium text-red-700 hover:text-red-800"
              >
                Retry
              </button>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loadingTeams ? (
                  <tr>
                    <td className="px-6 py-10 text-sm text-gray-500" colSpan={3}>
                      Loading teams…
                    </td>
                  </tr>
                ) : filteredTeams.length === 0 ? (
                  <tr>
                    <td className="px-6 py-10 text-sm text-gray-500" colSpan={3}>
                      No teams found.
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((t) => (
                    <tr key={t.id} className="bg-white">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.team_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">{t.description || ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => openEditTeam(t)}
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeam(t.id)}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                          <button type="button" className="p-2 rounded-md hover:bg-gray-50 border border-transparent hover:border-gray-200">
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={showTeamModal}
        onClose={() => setShowTeamModal(false)}
        title={teamMode === 'create' ? 'New Team' : 'Edit Team'}
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
            <input
              value={teamForm.team_name}
              onChange={(e) => setTeamForm((p) => ({ ...p, team_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Team name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={teamForm.description}
              onChange={(e) => setTeamForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              placeholder="Description"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowTeamModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTeam} disabled={savingTeam || !String(teamForm.team_name || '').trim()}>
              {savingTeam ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeamsUsers;
