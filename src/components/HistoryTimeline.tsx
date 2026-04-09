'use client';

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTMStore } from '@/store/tmStore';
import { tapeRead } from '@/lib/turingMachine';

const STATUS_COLORS: Record<string, string> = {
  running: '#6366f1',
  accepted: '#10b981',
  rejected: '#ef4444',
  halted: '#f59e0b',
  error: '#f87171',
};

export default function HistoryTimeline() {
  const { history, currentStep, appStatus, definition } = useTMStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the current step
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current.querySelector(`[data-step="${currentStep}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentStep]);

  if (appStatus === 'idle' || history.length === 0) {
    return (
      <div className="text-center py-6 opacity-30 text-xs">
        Execution history will appear here
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest opacity-60">
          Computation History
        </span>
        <span className="text-xs opacity-40">{history.length} snapshots</span>
      </div>

      {/* Timeline scroll container */}
      <div ref={scrollRef} className="overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
        <div className="flex gap-1.5 min-w-max px-1">
          {history.map((config, i) => {
            const isCurrent = i === currentStep;
            const color = STATUS_COLORS[config.status] ?? '#6366f1';

            return (
              <motion.div
                key={i}
                data-step={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.01, 0.3) }}
                className="flex flex-col items-center gap-1 cursor-default"
              >
                {/* Step dot */}
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0 transition-all duration-200"
                  style={{
                    background: color,
                    boxShadow: isCurrent ? `0 0 8px ${color}` : 'none',
                    transform: isCurrent ? 'scale(1.8)' : 'scale(1)',
                  }}
                />

                {/* State label */}
                <div
                  className="text-[8px] font-mono px-1.5 py-0.5 rounded whitespace-nowrap"
                  style={{
                    background: isCurrent ? `${color}30` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${isCurrent ? color + '60' : 'transparent'}`,
                    color: isCurrent ? color : 'rgba(255,255,255,0.35)',
                    fontWeight: isCurrent ? 700 : 400,
                  }}
                >
                  {config.state}
                </div>

                {/* Step number */}
                <div className="text-[7px] opacity-20">{i}</div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Current step detail */}
      {history[currentStep] && (
        <div
          className="rounded-xl p-3 text-xs font-mono space-y-2"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div className="flex gap-4 flex-wrap">
            <span className="opacity-50">Step {history[currentStep].step}</span>
            <span className="opacity-50">State: <span className="opacity-100" style={{ color: '#818cf8' }}>{history[currentStep].state}</span></span>
            {history[currentStep].tapes.map((tape, i) => (
              <span key={i} className="opacity-50">
                T{i + 1}@{history[currentStep].headPositions[i]}: <span className="opacity-100" style={{ color: '#34d399' }}>
                  {tapeRead(tape, history[currentStep].headPositions[i], definition.blankSymbol)}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
