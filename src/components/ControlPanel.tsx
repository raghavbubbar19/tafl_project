'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Play, Pause, SkipForward, SkipBack, RotateCcw,
  FastForward, Gauge
} from 'lucide-react';
import { useTMStore } from '@/store/tmStore';

const SPEED_STEPS = [
  { label: '0.25×', ms: 1600 },
  { label: '0.5×', ms: 800 },
  { label: '1×', ms: 400 },
  { label: '2×', ms: 200 },
  { label: '4×', ms: 100 },
  { label: '8×', ms: 50 },
  { label: 'Max', ms: 10 },
];

export default function ControlPanel() {
  const {
    appStatus,
    history,
    currentStep,
    speed,
    initialize,
    stepForward,
    stepBackward,
    runAuto,
    pause,
    reset,
    setSpeed,
    comparison,
    validation,
  } = useTMStore();

  const currentConfig = history[currentStep];
  const canStep = appStatus === 'paused' && currentConfig?.status === 'running';
  const canRewind = currentStep > 0 && appStatus !== 'idle';
  const isFinished = appStatus === 'finished';
  const isRunning = appStatus === 'running';
  const isIdle = appStatus === 'idle';

  const currentSpeedIdx = SPEED_STEPS.findIndex((s) => s.ms === speed);
  const speedLabel = SPEED_STEPS[currentSpeedIdx]?.label ?? '1×';

  return (
    <div className="glass-panel rounded-2xl p-5 space-y-5">
      {/* Status Badge */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest opacity-60">Controls</h2>
        <StatusBadge status={appStatus} />
      </div>

      {/* Main action buttons */}
      <div className="flex gap-2 flex-wrap">
        {/* Initialize / Reset */}
        {isIdle ? (
          <ControlButton
            onClick={initialize}
            icon={<Play size={16} />}
            label="Initialize"
            accent="#6366f1"
            disabled={validation?.valid === false}
            tooltip="Set up machine with current tape inputs"
          />
        ) : (
          <ControlButton
            onClick={reset}
            icon={<RotateCcw size={16} />}
            label="Reset"
            accent="#6b7280"
            tooltip="Reset to idle state"
          />
        )}

        {/* Step Back */}
        <ControlButton
          onClick={stepBackward}
          icon={<SkipBack size={16} />}
          label="Back"
          disabled={!canRewind}
          tooltip="Step backward (rewind history)"
        />

        {/* Step Forward */}
        <ControlButton
          onClick={stepForward}
          icon={<SkipForward size={16} />}
          label="Step"
          disabled={!canStep}
          accent="#6366f1"
          tooltip="Execute one transition"
        />

        {/* Run / Pause */}
        {isRunning ? (
          <ControlButton
            onClick={pause}
            icon={<Pause size={16} />}
            label="Pause"
            accent="#f59e0b"
            tooltip="Pause auto-execution"
          />
        ) : (
          <ControlButton
            onClick={runAuto}
            icon={<FastForward size={16} />}
            label="Run"
            disabled={isFinished}
            accent="#10b981"
            tooltip="Auto-run until halted"
          />
        )}
      </div>

      {/* Speed control */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs opacity-60">
            <Gauge size={13} />
            <span>Speed</span>
          </div>
          <span className="text-xs font-bold" style={{ color: '#818cf8' }}>{speedLabel}</span>
        </div>
        <div className="flex gap-1">
          {SPEED_STEPS.map((step, i) => (
            <button
              key={i}
              onClick={() => setSpeed(step.ms)}
              className="flex-1 py-1 rounded-lg text-[10px] font-bold transition-all duration-200"
              style={{
                background: speed === step.ms ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.05)',
                border: speed === step.ms ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                color: speed === step.ms ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
              }}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step counter */}
      {!isIdle && (
        <div className="grid grid-cols-3 gap-3">
          <Metric label="Step" value={currentConfig?.step ?? 0} color="#818cf8" />
          <Metric label="History" value={history.length} color="#34d399" />
          <Metric
            label="State"
            value={currentConfig?.state ?? '-'}
            color={
              currentConfig?.status === 'accepted' ? '#34d399'
              : currentConfig?.status === 'rejected' ? '#f87171'
              : '#fbbf24'
            }
            mono
          />
        </div>
      )}

      {/* Comparison */}
      {comparison && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 space-y-3"
          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}
        >
          <div className="text-xs font-semibold uppercase tracking-widest opacity-60">Performance Comparison</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: '#818cf8' }}>{comparison.multiTapeSteps}</div>
              <div className="text-[10px] opacity-50">Multi-tape steps</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold" style={{ color: '#f87171' }}>{comparison.singleTapeSteps}</div>
              <div className="text-[10px] opacity-50">Equiv. single-tape</div>
            </div>
          </div>
          <div className="text-center">
            <span className="text-xs" style={{ color: '#34d399' }}>~{comparison.speedup.toFixed(1)}× speedup</span>
            <div className="text-[10px] opacity-40 mt-1">O(t²) single-tape simulation overhead</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    idle: { label: 'Idle', color: '#9ca3af', bg: 'rgba(156,163,175,0.15)' },
    running: { label: '● Running', color: '#34d399', bg: 'rgba(16,185,129,0.15)' },
    paused: { label: '⏸ Paused', color: '#fbbf24', bg: 'rgba(245,158,11,0.15)' },
    finished: { label: '■ Done', color: '#818cf8', bg: 'rgba(99,102,241,0.15)' },
  };
  const s = map[status] ?? map.idle;
  return (
    <span
      className="text-xs font-bold px-3 py-1 rounded-full"
      style={{ color: s.color, background: s.bg }}
    >
      {s.label}
    </span>
  );
}

function Metric({
  label, value, color, mono,
}: {
  label: string; value: string | number; color: string; mono?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-3 text-center"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div
        className={`text-lg font-bold ${mono ? 'font-mono' : ''} truncate`}
        style={{ color }}
      >
        {value}
      </div>
      <div className="text-[10px] opacity-40 mt-0.5">{label}</div>
    </div>
  );
}

interface ControlButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  accent?: string;
  tooltip?: string;
}

function ControlButton({ onClick, icon, label, disabled, accent = '#6b7280', tooltip }: ControlButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.04 }}
      whileTap={{ scale: disabled ? 1 : 0.96 }}
      onClick={onClick}
      disabled={disabled}
      title={tooltip}
      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
      style={{
        background: disabled ? 'rgba(255,255,255,0.04)' : `${accent}22`,
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.08)' : accent + '70'}`,
        color: disabled ? 'rgba(255,255,255,0.3)' : accent,
        boxShadow: disabled ? 'none' : `0 0 8px ${accent}30`,
      }}
    >
      {icon}
      <span>{label}</span>
    </motion.button>
  );
}
