import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  TMDefinition,
  TMConfig,
  TuringMachineSimulator,
  validateDefinition,
  ValidationResult,
  estimateSingleTapeSteps,
  ComparisonResult,
} from '@/lib/turingMachine';
import { EXAMPLE_MACHINES, EXAMPLE_INPUTS } from '@/lib/examples';

// ─── Types ────────────────────────────────────────────────────

export type AppStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface SavedSession {
  id: string;
  name: string;
  definition: TMDefinition;
  tapeInputs: string[];
  savedAt: string;
}

export interface TMStore {
  // Machine definition
  definition: TMDefinition;
  setDefinition: (def: TMDefinition) => void;
  loadExample: (name: string) => void;

  // Tape inputs
  tapeInputs: string[];
  setTapeInputs: (inputs: string[]) => void;

  // Simulation state
  history: TMConfig[];
  currentStep: number;
  appStatus: AppStatus;
  simulator: TuringMachineSimulator | null;
  speed: number; // ms per step
  setSpeed: (ms: number) => void;

  // Controls
  initialize: () => void;
  stepForward: () => void;
  stepBackward: () => void;
  runAuto: () => void;
  pause: () => void;
  reset: () => void;

  // Validation
  validation: ValidationResult | null;
  validate: () => void;

  // Performance comparison
  comparison: ComparisonResult | null;
  computeComparison: () => void;

  // UI state
  activeTab: 'visualizer' | 'editor' | 'examples' | 'tests' | 'sessions';
  setActiveTab: (tab: TMStore['activeTab']) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
  showTransitionTable: boolean;
  toggleTransitionTable: () => void;

  // Sessions
  savedSessions: SavedSession[];
  saveSession: (name: string) => void;
  loadSession: (id: string) => void;
  deleteSession: (id: string) => void;

  // Auto-run interval handle
  _intervalId: ReturnType<typeof setInterval> | null;
  _clearInterval: () => void;
}

// ─── Default definition ──────────────────────────────────────

const defaultDefinition: TMDefinition = EXAMPLE_MACHINES[0];
const defaultInputs: string[] = EXAMPLE_INPUTS[defaultDefinition.name] ?? ['', ''];

// ─── Store ────────────────────────────────────────────────────

export const useTMStore = create<TMStore>()(
  persist(
    (set, get) => ({
      definition: defaultDefinition,
      tapeInputs: defaultInputs,
      history: [],
      currentStep: 0,
      appStatus: 'idle',
      simulator: null,
      speed: 400,
      validation: null,
      comparison: null,
      activeTab: 'visualizer',
      darkMode: true,
      showTransitionTable: true,
      savedSessions: [],
      _intervalId: null,

      setDefinition: (def) => {
        set({
          definition: def,
          tapeInputs: new Array(def.numTapes).fill(''),
          history: [],
          currentStep: 0,
          appStatus: 'idle',
          simulator: null,
          validation: null,
          comparison: null,
        });
      },

      loadExample: (name) => {
        const def = EXAMPLE_MACHINES.find((m) => m.name === name);
        if (!def) return;
        const inputs = EXAMPLE_INPUTS[name] ?? new Array(def.numTapes).fill('');
        get()._clearInterval();
        set({
          definition: def,
          tapeInputs: inputs,
          history: [],
          currentStep: 0,
          appStatus: 'idle',
          simulator: null,
          validation: null,
          comparison: null,
        });
      },

      setTapeInputs: (inputs) => set({ tapeInputs: inputs }),

      setSpeed: (ms) => set({ speed: ms }),

      validate: () => {
        const result = validateDefinition(get().definition);
        set({ validation: result });
      },

      initialize: () => {
        get()._clearInterval();
        const { definition, tapeInputs } = get();
        const validation = validateDefinition(definition);
        set({ validation });
        if (!validation.valid) return;

        const sim = new TuringMachineSimulator(definition, 10000);
        const paddedInputs = Array.from({ length: definition.numTapes }, (_, i) => tapeInputs[i] ?? '');
        const initial = sim.createInitialConfig(paddedInputs);
        set({
          simulator: sim,
          history: [initial],
          currentStep: 0,
          appStatus: 'paused',
          comparison: null,
        });
      },

      stepForward: () => {
        const { simulator, history, appStatus } = get();
        if (!simulator || appStatus === 'idle' || appStatus === 'finished') return;
        const current = history[history.length - 1];
        if (current.status !== 'running') {
          set({ appStatus: 'finished' });
          get().computeComparison();
          return;
        }
        const next = simulator.stepForward(history);
        const newHistory = [...history, next];
        set({ history: newHistory, currentStep: newHistory.length - 1 });
        if (next.status !== 'running') {
          set({ appStatus: 'finished' });
          get().computeComparison();
        }
      },

      stepBackward: () => {
        const { history, currentStep, appStatus } = get();
        if (currentStep <= 0 || appStatus === 'idle') return;
        const newStep = currentStep - 1;
        set({
          currentStep: newStep,
          appStatus: 'paused',
          history: history.slice(0, newStep + 1),
        });
      },

      runAuto: () => {
        get()._clearInterval();
        const { appStatus } = get();
        if (appStatus === 'idle') {
          get().initialize();
        }
        set({ appStatus: 'running' });

        const id = setInterval(() => {
          const { simulator, history, appStatus: status } = get();
          if (!simulator || status !== 'running') {
            get()._clearInterval();
            return;
          }
          const current = history[history.length - 1];
          if (current.status !== 'running') {
            get()._clearInterval();
            set({ appStatus: 'finished' });
            get().computeComparison();
            return;
          }
          const next = simulator.stepForward(history);
          const newHistory = [...history, next];
          set({ history: newHistory, currentStep: newHistory.length - 1 });
          if (next.status !== 'running') {
            get()._clearInterval();
            set({ appStatus: 'finished' });
            get().computeComparison();
          }
        }, get().speed);

        set({ _intervalId: id });
      },

      pause: () => {
        get()._clearInterval();
        set({ appStatus: 'paused' });
      },

      reset: () => {
        get()._clearInterval();
        set({
          history: [],
          currentStep: 0,
          appStatus: 'idle',
          simulator: null,
          comparison: null,
        });
      },

      computeComparison: () => {
        const { history, tapeInputs } = get();
        const steps = history.length - 1;
        const inputLen = (tapeInputs[0] ?? '').length;
        set({ comparison: estimateSingleTapeSteps(steps, inputLen) });
      },

      setActiveTab: (tab) => set({ activeTab: tab }),

      toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),

      toggleTransitionTable: () => set((s) => ({ showTransitionTable: !s.showTransitionTable })),

      saveSession: (name) => {
        const { definition, tapeInputs, savedSessions } = get();
        const session: SavedSession = {
          id: Date.now().toString(),
          name,
          definition,
          tapeInputs,
          savedAt: new Date().toISOString(),
        };
        set({ savedSessions: [...savedSessions, session] });
      },

      loadSession: (id) => {
        const { savedSessions } = get();
        const session = savedSessions.find((s) => s.id === id);
        if (!session) return;
        get()._clearInterval();
        set({
          definition: session.definition,
          tapeInputs: session.tapeInputs,
          history: [],
          currentStep: 0,
          appStatus: 'idle',
          simulator: null,
          validation: null,
          comparison: null,
        });
      },

      deleteSession: (id) => {
        set((s) => ({ savedSessions: s.savedSessions.filter((sess) => sess.id !== id) }));
      },

      _clearInterval: () => {
        const { _intervalId } = get();
        if (_intervalId !== null) {
          clearInterval(_intervalId);
          set({ _intervalId: null });
        }
      },
    }),
    {
      name: 'tm-visualizer-store',
      partialize: (state) => ({
        savedSessions: state.savedSessions,
        darkMode: state.darkMode,
        speed: state.speed,
        definition: state.definition,
        tapeInputs: state.tapeInputs,
      }),
    }
  )
);
