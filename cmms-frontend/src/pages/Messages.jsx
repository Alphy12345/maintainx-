import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Bell, MoreVertical, UserCircle2 } from 'lucide-react';
import { Button, Card } from '../components';

const Messages = () => {
  const [tab, setTab] = useState('messages');
  const [search, setSearch] = useState('');

  const conversations = useMemo(() => {
    return [
      {
        id: 'C-ALL',
        title: 'All Team',
        subtitle: 'Organization-wide conversation',
        updatedLabel: 'Yesterday',
      },
    ];
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) =>
      `${c.title} ${c.subtitle}`.toLowerCase().includes(q)
    );
  }, [conversations, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search or start a new chat"
              className="w-80 pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Message
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-4">
          <div className="border-b border-gray-200 px-4 pt-3">
            <div className="flex items-center gap-6 text-sm">
              <button
                type="button"
                onClick={() => setTab('messages')}
                className={`pb-3 border-b-2 ${
                  tab === 'messages'
                    ? 'border-primary-600 text-primary-700 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Messages
              </button>
              <button
                type="button"
                onClick={() => setTab('threads')}
                className={`pb-3 border-b-2 ${
                  tab === 'threads'
                    ? 'border-primary-600 text-primary-700 font-medium'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Threads
              </button>
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="text-xs text-gray-500 mb-2">Direct Messages</div>
            <div className="space-y-2">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className="w-full text-left rounded-md border border-gray-200 bg-white hover:bg-gray-50 px-3 py-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                      <UserCircle2 className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-medium text-gray-900 truncate">{c.title}</div>
                        <div className="text-xs text-gray-500 shrink-0">{c.updatedLabel}</div>
                      </div>
                      <div className="text-sm text-gray-600 truncate">{c.subtitle}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-8">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                <UserCircle2 className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <div className="font-medium text-gray-900">All Team</div>
                <button type="button" className="text-xs text-primary-600 hover:text-primary-700">
                  View Conversation Information
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="h-9 w-9 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                title="Notifications"
              >
                <Bell className="h-4 w-4 text-gray-600" />
              </button>
              <button
                type="button"
                className="h-9 w-9 rounded-md border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                title="More"
              >
                <MoreVertical className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div className="px-6 py-10">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="h-24 w-24 rounded-full bg-primary-50 flex items-center justify-center">
                <div className="h-14 w-14 rounded-full bg-primary-600" />
              </div>
              <div>
                <div className="text-lg font-semibold text-gray-900">Start adding conversations</div>
                <div className="text-sm text-gray-600">Click the New Message button in the top right to get started</div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 px-5 py-4">
            <div className="text-xs text-gray-500 mb-2">Go ahead and write the first message!</div>
            <div className="flex items-end gap-3">
              <textarea
                rows={2}
                placeholder="Write a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <Button variant="secondary">Send</Button>
            </div>
          </div>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs text-gray-500"
      >
        Messages UI is a placeholder layout (no backend/websocket yet).
      </motion.div>
    </div>
  );
};

export default Messages;
