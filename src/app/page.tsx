'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cpu, Moon, Sun, ChevronDown, ChevronUp,
  BookOpen, FlaskConical, Layers, Settings, Database
} from 'lucide-react';

import { useTMStore } from '@/store/tmStore';
import TapePanel from '@/components/TapePanel';
import ControlPanel from '@/components/ControlPanel';
import MachineEditor from '@/components/MachineEditor';
import ExamplesPanel from '@/components/ExamplesPanel';
import TestsPanel from '@/components/TestsPanel';
import TransitionTable from '@/components/TransitionTable';
import HistoryTimeline from '@/components/HistoryTimeline';
import SessionPanel from '@/components/SessionPanel';

type Tab = 'visualizer' | 'editor' | 'examples' | 'tests' | 'sessions';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'visualizer', label: 'Visualizer', icon: <Layers size={14} /> },
  { id: 'editor', label: 'Editor', icon: <Settings size={14} /> },
  { id: 'examples', label: 'Examples', icon: <BookOpen size={14} /> },
  { id: 'tests', label: 'Tests', icon: <FlaskConical size={14} /> },
  { id: 'sessions', label: 'Sessions', icon: <Database size={14} /> },
];

export default function Home() {
  const {
    darkMode,
    toggleDarkMode,
    activeTab,
    setActiveTab,
    definition,
    showTransitionTable,
    toggleTransitionTable,
  } = useTMStore();

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  return (
    <div
      className="min-h-screen relative"
      style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      {/* Animated background */}
      <div className="grid-bg" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* ── Header ────────────────────────────────────────────── */}
      <header
        className="relative z-10 px-6 py-4 flex items-center justify-between"
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'rgba(9,9,15,0.7)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo + title */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 0 20px rgba(99,102,241,0.5)',
              }}
            >
              <Cpu size={18} className="text-white" />
            </div>
            {/* Running pulse */}
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-tight">TM Visualizer</h1>
            <p className="text-[10px] opacity-40 leading-tight">Multi-Tape Turing Machine Simulator</p>
          </div>
        </div>

        {/* Machine name pill */}
        <div
          className="hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-mono"
          style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <span className="opacity-60">Machine:</span>
          <span style={{ color: '#a5b4fc' }}>{definition.name}</span>
          <span className="opacity-40 ml-1">{definition.numTapes}T</span>
        </div>

        {/* Dark mode toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleDarkMode}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-strong)' }}
          title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {darkMode ? <Sun size={16} className="opacity-70" /> : <Moon size={16} className="opacity-70" />}
        </motion.button>
      </header>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      <div
        className="relative z-10 px-6 py-3 flex gap-2 overflow-x-auto"
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'rgba(9,9,15,0.5)',
          backdropFilter: 'blur(12px)',
        }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as Tab)}
            className={`tab-btn flex items-center gap-2 ${activeTab === tab.id ? 'active' : ''}`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Main content ──────────────────────────────────────── */}
      <main className="relative z-10 p-4 md:p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'visualizer' && (
            <motion.div
              key="visualizer"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col xl:flex-row gap-5"
            >
              {/* Left: Tapes + History */}
              <div className="flex-1 min-w-0 space-y-5">
                {/* Tapes */}
                <div className="glass-panel rounded-2xl p-5">
                  <SectionHeader title="Tape Visualization" subtitle={`${definition.numTapes} tape(s) · ${definition.blankSymbol} = blank`} />
                  <TapePanel />
                </div>

                {/* History Timeline */}
                <div className="glass-panel rounded-2xl p-5">
                  <HistoryTimeline />
                </div>

                {/* Transition Table (collapsible) */}
                <div className="glass-panel rounded-2xl overflow-hidden">
                  <button
                    onClick={toggleTransitionTable}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/5 transition-colors"
                  >
                    <SectionHeader
                      title="Transition Function"
                      subtitle={`δ · ${definition.transitions.length} rules`}
                      noMargin
                    />
                    {showTransitionTable ? <ChevronUp size={14} className="opacity-50" /> : <ChevronDown size={14} className="opacity-50" />}
                  </button>
                  <AnimatePresence>
                    {showTransitionTable && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5">
                          <TransitionTable />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Right: Controls */}
              <div className="xl:w-80 flex-shrink-0">
                <ControlPanel />
              </div>
            </motion.div>
          )}

          {activeTab === 'editor' && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <div className="glass-panel rounded-2xl p-6">
                <SectionHeader
                  title="Machine Editor"
                  subtitle="Define states, alphabets, and transition rules"
                />
                <MachineEditor />
              </div>
            </motion.div>
          )}

          {activeTab === 'examples' && (
            <motion.div
              key="examples"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <div className="glass-panel rounded-2xl p-6">
                <SectionHeader
                  title="Example Machines"
                  subtitle="Preloaded Turing Machines demonstrating key concepts"
                />
                <ExamplesPanel />
              </div>
            </motion.div>
          )}

          {activeTab === 'tests' && (
            <motion.div
              key="tests"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <div className="glass-panel rounded-2xl p-6">
                <SectionHeader
                  title="Unit Tests"
                  subtitle="Automated correctness checks across all example machines"
                />
                <TestsPanel />
              </div>
            </motion.div>
          )}

          {activeTab === 'sessions' && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <div className="glass-panel rounded-2xl p-6">
                <SectionHeader
                  title="Saved Sessions"
                  subtitle="Save and restore your machine configurations"
                />
                <SessionPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Footer ────────────────────────────────────────────── */}
      <footer
        className="relative z-10 px-6 py-4 text-center text-xs opacity-25"
        style={{ borderTop: '1px solid var(--border)', marginTop: '40px' }}
      >
        Multi-Tape Turing Machine Visualizer · Built with Next.js, Zustand &amp; Framer Motion
      </footer>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  noMargin,
}: {
  title: string;
  subtitle?: string;
  noMargin?: boolean;
}) {
  return (
    <div className={noMargin ? '' : 'mb-5'}>
      <h2 className="text-base font-bold">{title}</h2>
      {subtitle && <p className="text-xs opacity-40 mt-0.5">{subtitle}</p>}
    </div>
  );
}
