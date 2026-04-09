'use client';

import React, { useMemo } from 'react';
import { useTMStore } from '@/store/tmStore';
import { tapeRead } from '@/lib/turingMachine';

const TAPE_COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444'];

export default function TransitionTable() {
  const { definition, history, currentStep } = useTMStore();
  const currentConfig = history[currentStep];
  const appliedTransition = currentConfig?.appliedTransition;

  const { transitions } = definition;

  const isApplied = (i: number) =>
    appliedTransition === transitions[i];

  // Current reads
  const currentReads = useMemo(() => {
    if (!currentConfig) return [];
    return currentConfig.tapes.map((tape, i) =>
      tapeRead(tape, currentConfig.headPositions[i], definition.blankSymbol)
    );
  }, [currentConfig, definition.blankSymbol]);

  const isCurrentlyMatching = (i: number) => {
    if (!currentConfig) return false;
    const t = transitions[i];
    if (t.fromState !== currentConfig.state) return false;
    return t.readSymbols.every((sym, ti) => sym === '_WILDCARD_' || sym === currentReads[ti]);
  };

  if (transitions.length === 0) {
    return (
      <div className="text-center py-8 opacity-30 text-sm">No transitions defined.</div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <table className="w-full text-xs font-mono border-collapse">
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.04)' }}>
            <th className="px-3 py-2.5 text-left font-semibold opacity-50 whitespace-nowrap">From</th>
            {Array.from({ length: definition.numTapes }, (_, i) => (
              <th key={i} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap" style={{ color: TAPE_COLORS[i % TAPE_COLORS.length] + 'cc' }}>
                Read T{i + 1}
              </th>
            ))}
            <th className="px-3 py-2.5 text-left font-semibold opacity-50 whitespace-nowrap">→ To</th>
            {Array.from({ length: definition.numTapes }, (_, i) => (
              <th key={i} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap" style={{ color: TAPE_COLORS[i % TAPE_COLORS.length] + 'cc' }}>
                Write T{i + 1}
              </th>
            ))}
            {Array.from({ length: definition.numTapes }, (_, i) => (
              <th key={i} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap" style={{ color: TAPE_COLORS[i % TAPE_COLORS.length] + 'cc' }}>
                Dir T{i + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {transitions.map((t, i) => {
            const applied = isApplied(i);
            const matching = isCurrentlyMatching(i);

            return (
              <tr
                key={i}
                style={{
                  background: applied
                    ? 'rgba(99,102,241,0.2)'
                    : matching
                    ? 'rgba(99,102,241,0.07)'
                    : i % 2 === 0
                    ? 'rgba(255,255,255,0.015)'
                    : 'transparent',
                  borderLeft: applied
                    ? '2px solid #6366f1'
                    : matching
                    ? '2px solid rgba(99,102,241,0.4)'
                    : '2px solid transparent',
                  transition: 'background 0.2s',
                }}
              >
                <td className="px-3 py-2 whitespace-nowrap">
                  <span
                    className="px-2 py-0.5 rounded"
                    style={{
                      background: definition.startState === t.fromState ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)',
                      color: definition.startState === t.fromState ? '#818cf8' : 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {t.fromState}
                  </span>
                </td>
                {t.readSymbols.map((sym, ti) => (
                  <td key={ti} className="px-3 py-2 whitespace-nowrap">
                    <span
                      style={{
                        color: sym === '_WILDCARD_' ? '#fbbf24' : sym === definition.blankSymbol ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)',
                      }}
                    >
                      {sym === '_WILDCARD_' ? '*' : sym === definition.blankSymbol ? '␣' : sym}
                    </span>
                  </td>
                ))}
                <td className="px-3 py-2 whitespace-nowrap">
                  <span
                    className="px-2 py-0.5 rounded"
                    style={{
                      background: definition.acceptStates.includes(t.toState)
                        ? 'rgba(16,185,129,0.2)'
                        : definition.rejectStates.includes(t.toState)
                        ? 'rgba(239,68,68,0.2)'
                        : 'rgba(255,255,255,0.06)',
                      color: definition.acceptStates.includes(t.toState)
                        ? '#34d399'
                        : definition.rejectStates.includes(t.toState)
                        ? '#f87171'
                        : 'rgba(255,255,255,0.7)',
                    }}
                  >
                    {t.toState}
                  </span>
                </td>
                {t.writeSymbols.map((sym, ti) => (
                  <td key={ti} className="px-3 py-2 whitespace-nowrap" style={{ color: TAPE_COLORS[ti % TAPE_COLORS.length] + 'cc' }}>
                    {sym === definition.blankSymbol ? '␣' : sym}
                  </td>
                ))}
                {t.directions.map((dir, ti) => (
                  <td key={ti} className="px-3 py-2 whitespace-nowrap">
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                      style={{
                        background: dir === 'L' ? 'rgba(236,72,153,0.2)' : dir === 'R' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)',
                        color: dir === 'L' ? '#f472b6' : dir === 'R' ? '#34d399' : '#fbbf24',
                      }}
                    >
                      {dir}
                    </span>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
