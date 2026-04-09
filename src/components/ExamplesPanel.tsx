'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useTMStore } from '@/store/tmStore';
import { EXAMPLE_MACHINES, EXAMPLE_INPUTS } from '@/lib/examples';

const TAPE_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

export default function ExamplesPanel() {
  const { loadExample, definition } = useTMStore();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-widest opacity-60 mb-1">
          Preloaded Machines
        </h2>
        <p className="text-xs opacity-40">
          Click any example to load it into the editor and visualizer.
        </p>
      </div>

      <div className="grid gap-4">
        {EXAMPLE_MACHINES.map((machine, i) => {
          const inputs = EXAMPLE_INPUTS[machine.name] ?? [];
          const isActive = definition.name === machine.name;

          return (
            <motion.button
              key={machine.name}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => loadExample(machine.name)}
              className="text-left rounded-2xl p-5 transition-all duration-200"
              style={{
                background: isActive
                  ? `linear-gradient(135deg, ${TAPE_COLORS[i % TAPE_COLORS.length]}22, transparent)`
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? TAPE_COLORS[i % TAPE_COLORS.length] + '60' : 'rgba(255,255,255,0.08)'}`,
                boxShadow: isActive ? `0 0 20px ${TAPE_COLORS[i % TAPE_COLORS.length]}20` : 'none',
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: TAPE_COLORS[i % TAPE_COLORS.length] }}
                    />
                    <span className="font-bold text-sm">{machine.name}</span>
                    {isActive && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                        style={{
                          background: `${TAPE_COLORS[i % TAPE_COLORS.length]}30`,
                          color: TAPE_COLORS[i % TAPE_COLORS.length],
                        }}
                      >
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs opacity-50 leading-relaxed">{machine.description}</p>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                <StatChip label="Tapes" value={machine.numTapes} color={TAPE_COLORS[i % TAPE_COLORS.length]} />
                <StatChip label="States" value={machine.states.length} color={TAPE_COLORS[i % TAPE_COLORS.length]} />
                <StatChip label="Transitions" value={machine.transitions.length} color={TAPE_COLORS[i % TAPE_COLORS.length]} />
                <StatChip label="Alphabet" value={machine.tapeAlphabet.length} color={TAPE_COLORS[i % TAPE_COLORS.length]} />
              </div>

              {/* Sample I/O */}
              <div className="space-y-2">
                <div className="text-[10px] uppercase tracking-widest opacity-40">Sample Inputs</div>
                {inputs.map((inp, ti) => (
                  <div key={ti} className="flex items-center gap-2">
                    <span className="text-[10px] opacity-40 w-12">Tape {ti + 1}:</span>
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded"
                      style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.7)' }}
                    >
                      {inp === '' ? '(blank)' : inp}
                    </span>
                  </div>
                ))}
              </div>

              {/* States display */}
              <div className="mt-3 flex flex-wrap gap-1">
                {machine.states.slice(0, 6).map((s) => (
                  <span
                    key={s}
                    className="text-[10px] font-mono px-2 py-0.5 rounded"
                    style={{
                      background: machine.acceptStates.includes(s)
                        ? 'rgba(16,185,129,0.2)'
                        : machine.rejectStates.includes(s)
                        ? 'rgba(239,68,68,0.2)'
                        : machine.startState === s
                        ? 'rgba(99,102,241,0.2)'
                        : 'rgba(255,255,255,0.05)',
                      color: machine.acceptStates.includes(s)
                        ? '#34d399'
                        : machine.rejectStates.includes(s)
                        ? '#f87171'
                        : machine.startState === s
                        ? '#818cf8'
                        : 'rgba(255,255,255,0.5)',
                      border: `1px solid ${
                        machine.acceptStates.includes(s)
                          ? 'rgba(16,185,129,0.3)'
                          : machine.rejectStates.includes(s)
                          ? 'rgba(239,68,68,0.3)'
                          : machine.startState === s
                          ? 'rgba(99,102,241,0.3)'
                          : 'rgba(255,255,255,0.07)'
                      }`,
                    }}
                  >
                    {machine.startState === s ? '→ ' : ''}{s}
                  </span>
                ))}
                {machine.states.length > 6 && (
                  <span className="text-[10px] opacity-30 self-center">+{machine.states.length - 6} more</span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Transition notation explanation */}
      <div
        className="rounded-xl p-4 mt-4"
        style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}
      >
        <div className="text-xs font-semibold uppercase tracking-widest opacity-60 mb-3">Transition Notation</div>
        <div className="text-xs font-mono opacity-70 leading-loose">
          <div><span style={{ color: '#818cf8' }}>(q, [a₁,...,aₖ])</span> → <span style={{ color: '#34d399' }}>(p, [b₁,...,bₖ], [d₁,...,dₖ])</span></div>
          <div className="mt-2 space-y-1 opacity-60 font-sans">
            <p>• q = current state, p = next state</p>
            <p>• aᵢ = symbol read on tape i</p>
            <p>• bᵢ = symbol written on tape i</p>
            <p>• dᵢ ∈ {'{'} L, R, S {'}'} = head direction on tape i</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="rounded-lg p-2 text-center"
      style={{ background: `${color}15`, border: `1px solid ${color}30` }}
    >
      <div className="text-base font-bold" style={{ color }}>{value}</div>
      <div className="text-[9px] opacity-50">{label}</div>
    </div>
  );
}
