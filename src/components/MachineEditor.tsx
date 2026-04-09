'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useTMStore } from '@/store/tmStore';
import { Transition, Direction, TMDefinition } from '@/lib/turingMachine';

export default function MachineEditor() {
  const { definition, setDefinition, tapeInputs, setTapeInputs, validate, validation } = useTMStore();
  const [expandedSection, setExpandedSection] = useState<string | null>('basic');
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState('');

  const def = definition;

  const update = (patch: Partial<TMDefinition>) => {
    setDefinition({ ...def, ...patch });
  };

  const addState = () => update({ states: [...def.states, `q${def.states.length}`] });
  const removeState = (s: string) => update({
    states: def.states.filter((x) => x !== s),
    acceptStates: def.acceptStates.filter((x) => x !== s),
    rejectStates: def.rejectStates.filter((x) => x !== s),
  });

  const addTransition = () => {
    const blank = def.blankSymbol;
    const t: Transition = {
      fromState: def.states[0] ?? 'q0',
      readSymbols: new Array(def.numTapes).fill(blank),
      toState: def.states[0] ?? 'q0',
      writeSymbols: new Array(def.numTapes).fill(blank),
      directions: new Array(def.numTapes).fill('R' as Direction),
    };
    update({ transitions: [...def.transitions, t] });
  };

  const updateTransition = (idx: number, patch: Partial<Transition>) => {
    const ts = def.transitions.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    update({ transitions: ts });
  };

  const removeTransition = (idx: number) => {
    update({ transitions: def.transitions.filter((_, i) => i !== idx) });
  };

  const handleJsonLoad = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setDefinition(parsed as TMDefinition);
      setJsonError('');
      setJsonMode(false);
    } catch (e) {
      setJsonError((e as Error).message);
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(def, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${def.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        setDefinition(parsed);
        setJsonError('');
      } catch (err) {
        setJsonError((err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-4">
      {/* JSON mode toggle */}
      <div className="flex gap-3 items-center flex-wrap">
        <button
          onClick={() => { setJsonMode(!jsonMode); setJsonText(JSON.stringify(def, null, 2)); }}
          className="text-xs px-4 py-2 rounded-xl font-semibold transition-all"
          style={{
            background: jsonMode ? 'rgba(99,102,241,0.3)' : 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(99,102,241,0.4)',
            color: '#a5b4fc',
          }}
        >
          {jsonMode ? '← Form Mode' : '{ } JSON Mode'}
        </button>
        <button
          onClick={handleExportJson}
          className="text-xs px-4 py-2 rounded-xl font-semibold transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
        >
          ↓ Export JSON
        </button>
        <label className="text-xs px-4 py-2 rounded-xl font-semibold transition-all cursor-pointer"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
        >
          ↑ Import JSON
          <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
        </label>
        <button
          onClick={validate}
          className="text-xs px-4 py-2 rounded-xl font-semibold transition-all ml-auto"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', color: '#34d399' }}
        >
          ✓ Validate
        </button>
      </div>

      {/* Validation result */}
      <AnimatePresence>
        {validation && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-xl p-4 space-y-2"
            style={{
              background: validation.valid ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              border: `1px solid ${validation.valid ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            }}
          >
            <div className="flex items-center gap-2">
              {validation.valid ? (
                <CheckCircle2 size={14} style={{ color: '#34d399' }} />
              ) : (
                <AlertCircle size={14} style={{ color: '#f87171' }} />
              )}
              <span className="text-xs font-bold" style={{ color: validation.valid ? '#34d399' : '#f87171' }}>
                {validation.valid ? 'Machine definition is valid' : `${validation.errors.length} error(s) found`}
              </span>
            </div>
            {validation.errors.map((e, i) => (
              <div key={i} className="text-xs flex gap-2" style={{ color: '#fca5a5' }}>
                <span>•</span><span>{e}</span>
              </div>
            ))}
            {validation.warnings.map((w, i) => (
              <div key={i} className="text-xs flex gap-2 opacity-70" style={{ color: '#fbbf24' }}>
                <Info size={11} className="mt-0.5 flex-shrink-0" /><span>{w}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {jsonMode ? (
        /* ── JSON Editor ──────────────────────────────────── */
        <div className="space-y-3">
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            rows={20}
            className="w-full font-mono text-xs rounded-xl p-4 resize-y"
            style={{
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#a5b4fc',
              outline: 'none',
            }}
          />
          {jsonError && (
            <p className="text-xs" style={{ color: '#f87171' }}>Parse error: {jsonError}</p>
          )}
          <button
            onClick={handleJsonLoad}
            className="px-4 py-2 rounded-xl text-sm font-bold"
            style={{ background: 'rgba(99,102,241,0.3)', border: '1px solid #6366f1', color: '#a5b4fc' }}
          >
            Load from JSON
          </button>
        </div>
      ) : (
        /* ── Form Editor ──────────────────────────────────── */
        <div className="space-y-3">
          {/* Basic info */}
          <Section
            title="Basic Info"
            id="basic"
            expanded={expandedSection}
            toggle={setExpandedSection}
          >
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Machine Name">
                <Input value={def.name} onChange={(v) => update({ name: v })} placeholder="My Machine" />
              </FieldGroup>
              <FieldGroup label="Number of Tapes">
                <select
                  value={def.numTapes}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    update({
                      numTapes: n,
                      transitions: def.transitions.map((t) => ({
                        ...t,
                        readSymbols: Array.from({ length: n }, (_, i) => t.readSymbols[i] ?? def.blankSymbol),
                        writeSymbols: Array.from({ length: n }, (_, i) => t.writeSymbols[i] ?? def.blankSymbol),
                        directions: Array.from({ length: n }, (_, i) => t.directions[i] ?? 'R'),
                      })),
                    });
                    setTapeInputs(Array.from({ length: n }, (_, i) => tapeInputs[i] ?? ''));
                  }}
                  className="styled-select"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </FieldGroup>
              <FieldGroup label="Blank Symbol">
                <Input value={def.blankSymbol} onChange={(v) => update({ blankSymbol: v })} placeholder="_" maxLength={3} />
              </FieldGroup>
              <FieldGroup label="Start State">
                <StateSelect
                  value={def.startState}
                  onChange={(v) => update({ startState: v })}
                  states={def.states}
                />
              </FieldGroup>
            </div>
            <FieldGroup label="Description">
              <Input value={def.description ?? ''} onChange={(v) => update({ description: v })} placeholder="What does this machine do?" />
            </FieldGroup>
          </Section>

          {/* Tape inputs */}
          <Section title="Tape Inputs" id="inputs" expanded={expandedSection} toggle={setExpandedSection}>
            {Array.from({ length: def.numTapes }, (_, i) => (
              <FieldGroup key={i} label={`Tape ${i + 1} Input`}>
                <Input
                  value={tapeInputs[i] ?? ''}
                  onChange={(v) => {
                    const arr = [...tapeInputs];
                    arr[i] = v;
                    setTapeInputs(arr);
                  }}
                  placeholder={i === 0 ? 'e.g. 10101' : '(leave blank)'}
                  mono
                />
              </FieldGroup>
            ))}
          </Section>

          {/* States */}
          <Section title="States" id="states" expanded={expandedSection} toggle={setExpandedSection}>
            <div className="flex flex-wrap gap-2 mb-3">
              {def.states.map((s) => (
                <div
                  key={s}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-mono"
                  style={{
                    background: def.acceptStates.includes(s)
                      ? 'rgba(16,185,129,0.2)'
                      : def.rejectStates.includes(s)
                      ? 'rgba(239,68,68,0.2)'
                      : def.startState === s
                      ? 'rgba(99,102,241,0.2)'
                      : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${
                      def.acceptStates.includes(s)
                        ? 'rgba(16,185,129,0.4)'
                        : def.rejectStates.includes(s)
                        ? 'rgba(239,68,68,0.4)'
                        : def.startState === s
                        ? 'rgba(99,102,241,0.4)'
                        : 'rgba(255,255,255,0.1)'
                    }`,
                  }}
                >
                  {s}
                  <button
                    onClick={() => removeState(s)}
                    className="ml-1 opacity-40 hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
              <button onClick={addState} className="add-btn">
                <Plus size={12} /> Add State
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Accept States (comma separated)">
                <Input
                  value={def.acceptStates.join(', ')}
                  onChange={(v) => update({ acceptStates: v.split(',').map((s) => s.trim()).filter(Boolean) })}
                  placeholder="q_accept"
                />
              </FieldGroup>
              <FieldGroup label="Reject States (comma separated)">
                <Input
                  value={def.rejectStates.join(', ')}
                  onChange={(v) => update({ rejectStates: v.split(',').map((s) => s.trim()).filter(Boolean) })}
                  placeholder="q_reject"
                />
              </FieldGroup>
            </div>
          </Section>

          {/* Alphabets */}
          <Section title="Alphabets" id="alphabets" expanded={expandedSection} toggle={setExpandedSection}>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Input Alphabet Σ (comma separated)">
                <Input
                  value={def.inputAlphabet.join(', ')}
                  onChange={(v) => update({ inputAlphabet: v.split(',').map((s) => s.trim()).filter(Boolean) })}
                  placeholder="0, 1"
                />
              </FieldGroup>
              <FieldGroup label="Tape Alphabet Γ (comma separated)">
                <Input
                  value={def.tapeAlphabet.join(', ')}
                  onChange={(v) => update({ tapeAlphabet: v.split(',').map((s) => s.trim()).filter(Boolean) })}
                  placeholder="0, 1, _"
                />
              </FieldGroup>
            </div>
          </Section>

          {/* Transitions */}
          <Section title={`Transitions (${def.transitions.length})`} id="transitions" expanded={expandedSection} toggle={setExpandedSection}>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {def.transitions.map((t, idx) => (
                <TransitionRow
                  key={idx}
                  transition={t}
                  index={idx}
                  states={def.states}
                  numTapes={def.numTapes}
                  tapeAlphabet={def.tapeAlphabet}
                  onChange={(patch) => updateTransition(idx, patch)}
                  onRemove={() => removeTransition(idx)}
                />
              ))}
            </div>
            <button onClick={addTransition} className="add-btn mt-3">
              <Plus size={12} /> Add Transition
            </button>
          </Section>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────

function Section({
  title, id, expanded, toggle, children,
}: {
  title: string;
  id: string;
  expanded: string | null;
  toggle: (id: string | null) => void;
  children: React.ReactNode;
}) {
  const isOpen = expanded === id;
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
      <button
        onClick={() => toggle(isOpen ? null : id)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-white/5 transition-colors"
      >
        <span>{title}</span>
        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 space-y-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs opacity-50 font-medium">{label}</label>
      {children}
    </div>
  );
}

function Input({
  value, onChange, placeholder, maxLength, mono,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  mono?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`styled-input ${mono ? 'font-mono' : ''}`}
    />
  );
}

function StateSelect({ value, onChange, states }: { value: string; onChange: (v: string) => void; states: string[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="styled-select">
      {states.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}

interface TransitionRowProps {
  transition: Transition;
  index: number;
  states: string[];
  numTapes: number;
  tapeAlphabet: string[];
  onChange: (patch: Partial<Transition>) => void;
  onRemove: () => void;
}

function TransitionRow({ transition, states, numTapes, tapeAlphabet, onChange, onRemove }: TransitionRowProps) {
  const symOptions = ['_WILDCARD_', ...tapeAlphabet];

  return (
    <div
      className="rounded-xl p-3 space-y-3"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-center gap-3">
        <FieldGroup label="From State">
          <StateSelect
            value={transition.fromState}
            onChange={(v) => onChange({ fromState: v })}
            states={states}
          />
        </FieldGroup>
        <span className="text-xl opacity-30 mt-5">→</span>
        <FieldGroup label="To State">
          <StateSelect
            value={transition.toState}
            onChange={(v) => onChange({ toState: v })}
            states={states}
          />
        </FieldGroup>
        <button onClick={onRemove} className="ml-auto mt-4 opacity-40 hover:opacity-100 transition-opacity">
          <Trash2 size={14} style={{ color: '#f87171' }} />
        </button>
      </div>

      {Array.from({ length: numTapes }, (_, i) => (
        <div key={i} className="grid grid-cols-3 gap-2">
          <FieldGroup label={`Read [T${i + 1}]`}>
            <select
              value={transition.readSymbols[i] ?? '_'}
              onChange={(e) => {
                const arr = [...transition.readSymbols];
                arr[i] = e.target.value;
                onChange({ readSymbols: arr });
              }}
              className="styled-select font-mono text-xs"
            >
              {symOptions.map((s) => (
                <option key={s} value={s}>{s === '_WILDCARD_' ? '* (any)' : s}</option>
              ))}
            </select>
          </FieldGroup>
          <FieldGroup label={`Write [T${i + 1}]`}>
            <select
              value={transition.writeSymbols[i] ?? '_'}
              onChange={(e) => {
                const arr = [...transition.writeSymbols];
                arr[i] = e.target.value;
                onChange({ writeSymbols: arr });
              }}
              className="styled-select font-mono text-xs"
            >
              {tapeAlphabet.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FieldGroup>
          <FieldGroup label={`Dir [T${i + 1}]`}>
            <select
              value={transition.directions[i] ?? 'R'}
              onChange={(e) => {
                const arr = [...transition.directions];
                arr[i] = e.target.value as Direction;
                onChange({ directions: arr });
              }}
              className="styled-select font-mono"
            >
              <option value="L">L (Left)</option>
              <option value="R">R (Right)</option>
              <option value="S">S (Stay)</option>
            </select>
          </FieldGroup>
        </div>
      ))}
    </div>
  );
}
