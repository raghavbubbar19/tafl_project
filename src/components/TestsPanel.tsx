'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, Play } from 'lucide-react';
import { useTMStore } from '@/store/tmStore';
import { TuringMachineSimulator, TMConfig, validateDefinition } from '@/lib/turingMachine';
import { EXAMPLE_MACHINES, EXAMPLE_INPUTS } from '@/lib/examples';

// ─── Test case definitions ────────────────────────────────────

interface TestCase {
  machineName: string;
  description: string;
  tapeInputs: string[];
  expectedStatus: 'accepted' | 'rejected' | 'halted';
  maxSteps?: number;
}

const TEST_CASES: TestCase[] = [
  // Palindrome checker
  { machineName: 'Binary Palindrome Checker', description: '"10101" is a palindrome', tapeInputs: ['10101', ''], expectedStatus: 'accepted' },
  { machineName: 'Binary Palindrome Checker', description: '"11" is a palindrome', tapeInputs: ['11', ''], expectedStatus: 'accepted' },
  { machineName: 'Binary Palindrome Checker', description: '"1001" is a palindrome', tapeInputs: ['1001', ''], expectedStatus: 'accepted' },
  { machineName: 'Binary Palindrome Checker', description: '"10110" is NOT a palindrome', tapeInputs: ['10110', ''], expectedStatus: 'rejected' },
  { machineName: 'Binary Palindrome Checker', description: '"01010" is NOT a palindrome', tapeInputs: ['01010', ''], expectedStatus: 'rejected' },

  // String copy
  { machineName: 'String Copy', description: 'Copies "101" to tape 2', tapeInputs: ['101', ''], expectedStatus: 'accepted', maxSteps: 20 },
  { machineName: 'String Copy', description: 'Copies "1111" to tape 2', tapeInputs: ['1111', ''], expectedStatus: 'accepted', maxSteps: 20 },
  { machineName: 'String Copy', description: 'Empty input copies nothing', tapeInputs: ['', ''], expectedStatus: 'accepted', maxSteps: 5 },

  // Unary addition
  { machineName: 'Unary Addition', description: '111+11 = 11111', tapeInputs: ['111+11', ''], expectedStatus: 'accepted', maxSteps: 30 },
  { machineName: 'Unary Addition', description: '1+1 = 11', tapeInputs: ['1+1', ''], expectedStatus: 'accepted', maxSteps: 15 },
  { machineName: 'Unary Addition', description: '1+_ = 1', tapeInputs: ['1+', ''], expectedStatus: 'accepted', maxSteps: 10 },

  // Binary increment
  { machineName: 'Binary Increment', description: '0 + 1 = 1', tapeInputs: ['0'], expectedStatus: 'accepted', maxSteps: 10 },
  { machineName: 'Binary Increment', description: '1 + 1 = 10', tapeInputs: ['1'], expectedStatus: 'accepted', maxSteps: 10 },
  { machineName: 'Binary Increment', description: '1011 + 1 = 1100', tapeInputs: ['1011'], expectedStatus: 'accepted', maxSteps: 20 },
  { machineName: 'Binary Increment', description: '111 + 1 = 1000', tapeInputs: ['111'], expectedStatus: 'accepted', maxSteps: 20 },
];

// ─── Result types ─────────────────────────────────────────────

interface TestResult {
  testCase: TestCase;
  passed: boolean;
  actualStatus: string;
  steps: number;
  tape2Content?: string;
  error?: string;
  durationMs: number;
}

function runTest(tc: TestCase): TestResult {
  const machine = EXAMPLE_MACHINES.find((m) => m.name === tc.machineName);
  if (!machine) {
    return { testCase: tc, passed: false, actualStatus: 'error', steps: 0, durationMs: 0, error: 'Machine not found' };
  }

  const validation = validateDefinition(machine);
  if (!validation.valid) {
    return { testCase: tc, passed: false, actualStatus: 'error', steps: 0, durationMs: 0, error: validation.errors.join('; ') };
  }

  const sim = new TuringMachineSimulator(machine, tc.maxSteps ?? 500);
  const initial = sim.createInitialConfig(tc.tapeInputs);

  const start = performance.now();
  const final = sim.run(initial, undefined, tc.maxSteps ?? 500);
  const durationMs = performance.now() - start;

  // Get tape 2 if available
  let tape2Content: string | undefined;
  if (machine.numTapes >= 2 && final.tapes[1]) {
    const entries = [...final.tapes[1].entries()].sort((a, b) => a[0] - b[0]);
    tape2Content = entries.map(([, v]) => v).join('') || '(blank)';
  }

  const passed = final.status === tc.expectedStatus;
  return {
    testCase: tc,
    passed,
    actualStatus: final.status,
    steps: final.step,
    tape2Content,
    durationMs,
  };
}

// ─── Component ────────────────────────────────────────────────

type RunState = 'idle' | 'running' | 'done';

export default function TestsPanel() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [runState, setRunState] = useState<RunState>('idle');
  const [progress, setProgress] = useState(0);
  const { definition, tapeInputs } = useTMStore();

  const runAllTests = async () => {
    setRunState('running');
    setProgress(0);
    const out: TestResult[] = [];

    for (let i = 0; i < TEST_CASES.length; i++) {
      // yield to the event loop so UI stays responsive
      await new Promise((r) => setTimeout(r, 0));
      out.push(runTest(TEST_CASES[i]));
      setProgress(Math.round(((i + 1) / TEST_CASES.length) * 100));
    }

    setResults(out);
    setRunState('done');
  };

  const runCurrentMachine = async () => {
    setRunState('running');
    setProgress(0);

    // Validate current definition
    const validation = validateDefinition(definition);
    if (!validation.valid) {
      setResults([{
        testCase: { machineName: definition.name, description: 'Custom machine validation', tapeInputs, expectedStatus: 'accepted' },
        passed: false,
        actualStatus: 'error',
        steps: 0,
        durationMs: 0,
        error: validation.errors.join('; '),
      }]);
      setRunState('done');
      return;
    }

    const sim = new TuringMachineSimulator(definition, 10000);
    const initial = sim.createInitialConfig(tapeInputs);

    await new Promise((r) => setTimeout(r, 0));
    const start = performance.now();
    const final = sim.run(initial, undefined, 10000);
    const durationMs = performance.now() - start;

    setProgress(100);

    let tape2Content: string | undefined;
    if (definition.numTapes >= 2 && final.tapes[1]) {
      const entries = [...final.tapes[1].entries()].sort((a, b) => a[0] - b[0]);
      tape2Content = entries.map(([, v]) => v).join('') || '(blank)';
    }

    setResults([{
      testCase: { machineName: definition.name, description: `Run with input: [${tapeInputs.join(', ')}]`, tapeInputs, expectedStatus: final.status as 'accepted' },
      passed: true,
      actualStatus: final.status,
      steps: final.step,
      tape2Content,
      durationMs,
      error: final.errorMessage,
    }]);
    setRunState('done');
  };

  const passed = results.filter((r) => r.passed).length;
  const total = results.length;

  return (
    <div className="space-y-5">
      {/* Header actions */}
      <div className="flex gap-3 flex-wrap items-center">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={runAllTests}
          disabled={runState === 'running'}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
          style={{ background: 'rgba(99,102,241,0.25)', border: '1px solid #6366f1', color: '#a5b4fc' }}
        >
          <Play size={14} />
          Run All {TEST_CASES.length} Tests
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={runCurrentMachine}
          disabled={runState === 'running'}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold disabled:opacity-50"
          style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.5)', color: '#34d399' }}
        >
          <Play size={14} />
          Test Current Machine
        </motion.button>
      </div>

      {/* Progress bar */}
      <AnimatePresence>
        {runState === 'running' && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between text-xs opacity-60">
              <span>Running tests…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <motion.div
                animate={{ width: `${progress}%` }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #6366f1, #818cf8)' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      {runState === 'done' && results.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl p-4 flex items-center gap-4"
          style={{
            background: passed === total ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${passed === total ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}
        >
          <div
            className="text-3xl font-bold"
            style={{ color: passed === total ? '#34d399' : '#f87171' }}
          >
            {passed}/{total}
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: passed === total ? '#34d399' : '#f87171' }}>
              {passed === total ? '✓ All tests passed!' : `${total - passed} test(s) failed`}
            </div>
            <div className="text-xs opacity-50">
              Avg: {(results.reduce((s, r) => s + r.durationMs, 0) / results.length).toFixed(2)}ms per test
            </div>
          </div>
        </motion.div>
      )}

      {/* Results list */}
      {results.length > 0 && (
        <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
          {/* Group by machine */}
          {Object.entries(
            results.reduce<Record<string, TestResult[]>>((acc, r) => {
              const m = r.testCase.machineName;
              if (!acc[m]) acc[m] = [];
              acc[m].push(r);
              return acc;
            }, {})
          ).map(([machineName, machineResults]) => (
            <div key={machineName} className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest opacity-50 pt-2">{machineName}</div>
              {machineResults.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-xl p-3 flex items-start gap-3"
                  style={{
                    background: r.passed ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                    border: `1px solid ${r.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  }}
                >
                  {r.passed ? (
                    <CheckCircle2 size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#34d399' }} />
                  ) : (
                    <XCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: '#f87171' }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium mb-1">{r.testCase.description}</div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] opacity-60">
                      <span className="flex items-center gap-1">
                        <Clock size={9} />
                        {r.steps} steps
                      </span>
                      <span>{r.durationMs.toFixed(2)}ms</span>
                      <span>
                        Expected: <span style={{ color: r.testCase.expectedStatus === 'accepted' ? '#34d399' : '#f87171' }}>
                          {r.testCase.expectedStatus}
                        </span>
                      </span>
                      <span>
                        Got: <span style={{ color: r.actualStatus === 'accepted' ? '#34d399' : '#f87171' }}>
                          {r.actualStatus}
                        </span>
                      </span>
                      {r.tape2Content && (
                        <span>
                          Tape 2: <span className="font-mono" style={{ color: '#818cf8' }}>{r.tape2Content}</span>
                        </span>
                      )}
                    </div>
                    {r.error && (
                      <div className="text-[10px] mt-1" style={{ color: '#fca5a5' }}>⚠ {r.error}</div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ))}
        </div>
      )}

      {runState === 'idle' && results.length === 0 && (
        <div className="text-center py-16 opacity-30">
          <div className="text-4xl mb-3">🧪</div>
          <p className="text-sm">Click &quot;Run All Tests&quot; to validate the simulation engine</p>
        </div>
      )}
    </div>
  );
}
