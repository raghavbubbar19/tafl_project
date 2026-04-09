'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTapeWindow, tapeRead } from '@/lib/turingMachine';
import { useTMStore } from '@/store/tmStore';

// ─── Colour palette per tape index ───────────────────────────
const TAPE_COLORS = [
  { border: '#6366f1', head: '#818cf8', glow: 'rgba(99,102,241,0.4)', headGlow: 'rgba(129,140,248,0.6)', label: 'Tape 1' },
  { border: '#ec4899', head: '#f472b6', glow: 'rgba(236,72,153,0.4)', headGlow: 'rgba(244,114,182,0.6)', label: 'Tape 2' },
  { border: '#10b981', head: '#34d399', glow: 'rgba(16,185,129,0.4)', headGlow: 'rgba(52,211,153,0.6)', label: 'Tape 3' },
  { border: '#f59e0b', head: '#fbbf24', glow: 'rgba(245,158,11,0.4)', headGlow: 'rgba(251,191,36,0.6)', label: 'Tape 4' },
  { border: '#ef4444', head: '#f87171', glow: 'rgba(239,68,68,0.4)', headGlow: 'rgba(248,113,113,0.6)', label: 'Tape 5' },
];

const CELL_WIDTH = 48;
const CELLS_VISIBLE = 15;

interface TapeViewProps {
  tapeIndex: number;
}

function TapeView({ tapeIndex }: TapeViewProps) {
  const { history, currentStep, definition } = useTMStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const config = history[currentStep];
  const tape = config?.tapes?.[tapeIndex];
  const head = config?.headPositions?.[tapeIndex] ?? 0;
  const blank = definition.blankSymbol;
  const color = TAPE_COLORS[tapeIndex % TAPE_COLORS.length];

  const half = Math.floor(CELLS_VISIBLE / 2);
  const windowLeft = head - half;
  const windowRight = head + half + 1;

  const cells = useMemo(() => {
    if (!tape) return [];
    return getTapeWindow(tape, head, blank, windowLeft, windowRight);
  }, [tape, head, blank, windowLeft, windowRight]);

  // Highlight cells touched by the last transition
  const appliedTransition = config?.appliedTransition;
  const writtenSymbol = appliedTransition?.writeSymbols?.[tapeIndex];

  // Auto-scroll to center on head
  useEffect(() => {
    if (scrollRef.current) {
      const center = half * CELL_WIDTH;
      scrollRef.current.scrollLeft = center;
    }
  }, [head, half]);

  return (
    <div className="tape-container mb-6">
      {/* Tape label */}
      <div className="flex items-center gap-2 mb-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color.border, boxShadow: `0 0 6px ${color.border}` }}
        />
        <span className="text-xs font-semibold tracking-widest uppercase opacity-70">
          {color.label}
        </span>
        <span className="text-xs opacity-40 ml-2">
          Head @ {head}
        </span>
      </div>

      {/* The tape strip */}
      <div className="relative overflow-hidden rounded-xl" style={{ border: `1px solid ${color.border}30` }}>
        {/* Gradient fade edges */}
        <div
          className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, var(--bg-secondary), transparent)',
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to left, var(--bg-secondary), transparent)',
          }}
        />

        {/* Head indicator */}
        <div
          className="absolute top-0 bottom-0 w-[48px] z-20 pointer-events-none"
          style={{
            left: `calc(50% - 24px)`,
            background: `${color.headGlow}`,
            borderLeft: `2px solid ${color.head}`,
            borderRight: `2px solid ${color.head}`,
          }}
        />

        {/* Cells */}
        <div
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide py-3 px-4"
          style={{ scrollbarWidth: 'none' }}
        >
          <div className="flex gap-1 mx-auto">
            {cells.map(({ index, symbol, isHead }) => (
              <CellView
                key={index}
                index={index}
                symbol={symbol}
                isHead={isHead}
                wasWritten={isHead && writtenSymbol !== undefined && writtenSymbol !== symbol}
                color={color}
                blank={blank}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Index ruler */}
      <div className="flex gap-1 px-4 mt-1 overflow-hidden">
        {cells.map(({ index, isHead }) => (
          <div
            key={index}
            className="text-[9px] text-center flex-shrink-0 opacity-30"
            style={{ width: CELL_WIDTH - 4 }}
          >
            {isHead ? (
              <span style={{ color: color.head, opacity: 1, fontWeight: 700 }}>▲</span>
            ) : (
              index
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface CellViewProps {
  index: number;
  symbol: string;
  isHead: boolean;
  wasWritten: boolean;
  color: typeof TAPE_COLORS[0];
  blank: string;
}

function CellView({ symbol, isHead, wasWritten, color, blank }: CellViewProps) {
  const isBlank = symbol === blank;

  return (
    <motion.div
      layout
      animate={{
        scale: isHead ? 1.15 : 1,
        y: isHead ? -4 : 0,
      }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      className="relative flex-shrink-0 flex items-center justify-center rounded-lg text-sm font-mono font-bold select-none"
      style={{
        width: CELL_WIDTH - 4,
        height: 44,
        border: isHead
          ? `2px solid ${color.head}`
          : `1px solid ${isBlank ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.15)'}`,
        background: isHead
          ? `linear-gradient(135deg, ${color.glow}, ${color.border}30)`
          : isBlank
          ? 'rgba(255,255,255,0.02)'
          : 'rgba(255,255,255,0.06)',
        boxShadow: isHead ? `0 0 12px ${color.glow}` : 'none',
        color: isHead ? color.head : isBlank ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.85)',
      }}
    >
      <AnimatePresence mode="wait">
        <motion.span
          key={symbol}
          initial={{ opacity: 0, y: wasWritten ? -10 : 0 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: wasWritten ? 10 : 0 }}
          transition={{ duration: 0.15 }}
          className="text-sm"
        >
          {isBlank ? '␣' : symbol}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
}

export default function TapePanel() {
  const { definition, history, currentStep, appStatus } = useTMStore();
  const config = history[currentStep];

  if (appStatus === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center h-48 opacity-40">
        <div className="text-4xl mb-3">⚙️</div>
        <p className="text-sm">Initialize the machine to see tapes</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {Array.from({ length: definition.numTapes }, (_, i) => (
        <TapeView key={i} tapeIndex={i} />
      ))}

      {/* Current state badge */}
      {config && (
        <motion.div
          key={config.state}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 mt-2 flex-wrap"
        >
          <div
            className="px-4 py-2 rounded-xl text-sm font-bold font-mono tracking-wide"
            style={{
              background: config.status === 'accepted'
                ? 'linear-gradient(135deg, #064e3b, #10b981)'
                : config.status === 'rejected' || config.status === 'error'
                ? 'linear-gradient(135deg, #7f1d1d, #ef4444)'
                : config.status === 'halted'
                ? 'linear-gradient(135deg, #44403c, #f59e0b)'
                : 'linear-gradient(135deg, #1e1b4b, #6366f1)',
              border: `1px solid ${
                config.status === 'accepted' ? '#10b981'
                  : config.status === 'rejected' || config.status === 'error' ? '#ef4444'
                  : config.status === 'halted' ? '#f59e0b'
                  : '#6366f1'
              }`,
              boxShadow: `0 0 12px ${
                config.status === 'accepted' ? 'rgba(16,185,129,0.3)'
                  : config.status === 'rejected' || config.status === 'error' ? 'rgba(239,68,68,0.3)'
                  : config.status === 'halted' ? 'rgba(245,158,11,0.3)'
                  : 'rgba(99,102,241,0.3)'
              }`,
            }}
          >
            State: {config.state}
          </div>

          <div className="px-3 py-2 rounded-xl text-xs font-mono opacity-60 border border-white/10">
            Step {config.step}
          </div>

          {config.status === 'accepted' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #064e3b, #10b981)', color: '#6ee7b7', border: '1px solid #10b981' }}
            >
              ✓ ACCEPTED
            </motion.div>
          )}
          {(config.status === 'rejected' || config.status === 'halted') && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-4 py-2 rounded-xl text-sm font-bold"
              style={{ background: 'linear-gradient(135deg, #7f1d1d, #ef4444)', color: '#fca5a5', border: '1px solid #ef4444' }}
            >
              ✗ {config.status.toUpperCase()}
            </motion.div>
          )}
          {config.status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-3 py-2 rounded-xl text-xs font-mono max-w-md"
              style={{ background: 'rgba(127,29,29,0.6)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.5)' }}
            >
              ⚠ {config.errorMessage}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Applied transition display */}
      {config?.appliedTransition && (
        <motion.div
          key={JSON.stringify(config.appliedTransition)}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mt-3 px-4 py-3 rounded-xl text-xs font-mono"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}
        >
          <span className="opacity-50 mr-2">Applied:</span>
          <span style={{ color: '#818cf8' }}>({config.appliedTransition.fromState}, [{config.appliedTransition.readSymbols.join(', ')}])</span>
          <span className="opacity-40 mx-2">→</span>
          <span style={{ color: '#34d399' }}>({config.appliedTransition.toState}, [{config.appliedTransition.writeSymbols.join(', ')}], [{config.appliedTransition.directions.join(', ')}])</span>
        </motion.div>
      )}
    </div>
  );
}
