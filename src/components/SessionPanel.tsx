'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Trash2, Download, FolderOpen, Clock } from 'lucide-react';
import { useTMStore } from '@/store/tmStore';

export default function SessionPanel() {
  const { savedSessions, saveSession, loadSession, deleteSession, definition } = useTMStore();
  const [name, setName] = useState('');

  const handleSave = () => {
    const sessionName = name.trim() || `${definition.name} – ${new Date().toLocaleString()}`;
    saveSession(sessionName);
    setName('');
  };

  return (
    <div className="space-y-5">
      {/* Save current */}
      <div
        className="rounded-xl p-4 space-y-3"
        style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
      >
        <div className="text-xs font-semibold uppercase tracking-widest opacity-60">Save Current Session</div>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder={`${definition.name} – ${new Date().toLocaleDateString()}`}
            className="styled-input flex-1"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(99,102,241,0.3)', border: '1px solid #6366f1', color: '#a5b4fc' }}
          >
            <Save size={14} />
            Save
          </motion.button>
        </div>
        <p className="text-xs opacity-40">Sessions are saved to localStorage and persist across page refreshes.</p>
      </div>

      {/* Saved sessions list */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest opacity-60 mb-3">
          Saved Sessions ({savedSessions.length})
        </div>

        <AnimatePresence>
          {savedSessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 opacity-30"
            >
              <div className="text-3xl mb-2">💾</div>
              <p className="text-sm">No saved sessions yet</p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {[...savedSessions].reverse().map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="rounded-xl p-4 flex items-center gap-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{session.name}</div>
                    <div className="flex items-center gap-3 mt-1 text-[10px] opacity-40">
                      <span className="flex items-center gap-1">
                        <Clock size={9} />
                        {new Date(session.savedAt).toLocaleString()}
                      </span>
                      <span>{session.definition.numTapes} tape(s)</span>
                      <span>{session.definition.states.length} states</span>
                    </div>
                    <div className="text-[10px] opacity-30 mt-0.5 font-mono truncate">
                      {session.definition.name}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => loadSession(session.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8' }}
                    >
                      <FolderOpen size={12} />
                      Load
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => deleteSession(session.id)}
                      className="p-1.5 rounded-lg opacity-40 hover:opacity-100 transition-opacity"
                      style={{ border: '1px solid rgba(239,68,68,0.3)' }}
                    >
                      <Trash2 size={12} style={{ color: '#f87171' }} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
