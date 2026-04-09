// ============================================================
// Core Turing Machine Simulation Engine
// Supports: Multi-tape, Multi-head, Deterministic TMs
// ============================================================

export type Direction = 'L' | 'R' | 'S';

/** A single transition rule */
export interface Transition {
  fromState: string;
  readSymbols: string[];   // one per tape
  toState: string;
  writeSymbols: string[];  // one per tape
  directions: Direction[]; // one per tape
}

/** Full machine definition */
export interface TMDefinition {
  name: string;
  description?: string;
  numTapes: number;
  states: string[];
  inputAlphabet: string[];
  tapeAlphabet: string[];
  blankSymbol: string;
  startState: string;
  acceptStates: string[];
  rejectStates: string[];
  transitions: Transition[];
}

/** Sparse tape: maps cell index (integer, can be negative) → symbol */
export type Tape = Map<number, string>;

/** Full machine configuration (snapshot) */
export interface TMConfig {
  step: number;
  state: string;
  tapes: Tape[];           // array of tapes
  headPositions: number[]; // one per tape
  appliedTransition: Transition | null;
  status: 'running' | 'accepted' | 'rejected' | 'halted' | 'error';
  errorMessage?: string;
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// ─── Tape helpers ────────────────────────────────────────────

export function tapeRead(tape: Tape, pos: number, blank: string): string {
  return tape.get(pos) ?? blank;
}

export function tapeWrite(tape: Tape, pos: number, symbol: string, blank: string): Tape {
  const next = new Map(tape);
  if (symbol === blank) {
    next.delete(pos); // keep tapes sparse
  } else {
    next.set(pos, symbol);
  }
  return next;
}

export function cloneTape(tape: Tape): Tape {
  return new Map(tape);
}

/** Get visible window of tape cells around a position */
export function getTapeWindow(
  tape: Tape,
  head: number,
  blank: string,
  left: number,
  right: number
): { index: number; symbol: string; isHead: boolean }[] {
  const cells = [];
  for (let i = left; i <= right; i++) {
    cells.push({
      index: i,
      symbol: tapeRead(tape, i, blank),
      isHead: i === head,
    });
  }
  return cells;
}

/** Build a Tape from an input string */
export function buildTapeFromInput(input: string, startPos = 0): Tape {
  const tape: Tape = new Map();
  for (let i = 0; i < input.length; i++) {
    tape.set(startPos + i, input[i]);
  }
  return tape;
}

// ─── Validation ──────────────────────────────────────────────

export function validateDefinition(def: TMDefinition): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!def.name?.trim()) errors.push('Machine must have a name.');
  if (def.numTapes < 1 || def.numTapes > 10) errors.push('Number of tapes must be between 1 and 10.');
  if (!def.states || def.states.length === 0) errors.push('At least one state is required.');

  const stateSet = new Set(def.states);
  if (!stateSet.has(def.startState)) errors.push(`Start state "${def.startState}" is not in states.`);

  for (const s of def.acceptStates) {
    if (!stateSet.has(s)) errors.push(`Accept state "${s}" is not in states.`);
  }
  for (const s of def.rejectStates) {
    if (!stateSet.has(s)) errors.push(`Reject state "${s}" is not in states.`);
  }
  if (!def.blankSymbol) errors.push('Blank symbol must be defined.');
  if (def.inputAlphabet.includes(def.blankSymbol)) warnings.push('Blank symbol is in input alphabet – unusual.');
  if (!def.tapeAlphabet.includes(def.blankSymbol)) errors.push('Blank symbol must be in tape alphabet.');

  for (const sym of def.inputAlphabet) {
    if (!def.tapeAlphabet.includes(sym)) errors.push(`Input symbol "${sym}" is not in tape alphabet.`);
  }

  const seenKeys = new Set<string>();
  for (const t of def.transitions) {
    if (!stateSet.has(t.fromState)) errors.push(`Transition from unknown state "${t.fromState}".`);
    if (!stateSet.has(t.toState)) errors.push(`Transition to unknown state "${t.toState}".`);
    if (t.readSymbols.length !== def.numTapes)
      errors.push(`Transition from "${t.fromState}" has ${t.readSymbols.length} read symbols but machine has ${def.numTapes} tapes.`);
    if (t.writeSymbols.length !== def.numTapes)
      errors.push(`Transition from "${t.fromState}" has ${t.writeSymbols.length} write symbols but machine has ${def.numTapes} tapes.`);
    if (t.directions.length !== def.numTapes)
      errors.push(`Transition from "${t.fromState}" has ${t.directions.length} directions but machine has ${def.numTapes} tapes.`);

    for (const sym of [...t.readSymbols, ...t.writeSymbols]) {
      if (sym !== '_WILDCARD_' && !def.tapeAlphabet.includes(sym))
        errors.push(`Symbol "${sym}" in transition from "${t.fromState}" is not in tape alphabet.`);
    }
    for (const d of t.directions) {
      if (!['L', 'R', 'S'].includes(d)) errors.push(`Invalid direction "${d}" in transition from "${t.fromState}".`);
    }

    const key = `${t.fromState}|${t.readSymbols.join(',')}`;
    if (seenKeys.has(key)) warnings.push(`Duplicate transition for (${t.fromState}, [${t.readSymbols.join(', ')}]) – machine is nondeterministic (first match used).`);
    seenKeys.add(key);
  }

  if (def.acceptStates.length === 0 && def.rejectStates.length === 0)
    warnings.push('No accept or reject states defined. Machine will only halt by lack of transitions.');

  return { valid: errors.length === 0, errors, warnings };
}

// ─── Simulator ───────────────────────────────────────────────

export class TuringMachineSimulator {
  private def: TMDefinition;
  private history: TMConfig[] = [];
  private loopDetectionLimit: number;

  constructor(def: TMDefinition, loopDetectionLimit = 10000) {
    this.def = def;
    this.loopDetectionLimit = loopDetectionLimit;
  }

  /** Create the initial configuration given tape inputs (one string per tape) */
  createInitialConfig(tapeInputs: string[]): TMConfig {
    const tapes: Tape[] = [];
    for (let i = 0; i < this.def.numTapes; i++) {
      tapes.push(buildTapeFromInput(tapeInputs[i] ?? '', 0));
    }
    const config: TMConfig = {
      step: 0,
      state: this.def.startState,
      tapes,
      headPositions: new Array(this.def.numTapes).fill(0),
      appliedTransition: null,
      status: 'running',
    };
    return config;
  }

  /** Find the applicable transition for a config */
  findTransition(config: TMConfig): Transition | null {
    const reads = config.tapes.map((tape, i) =>
      tapeRead(tape, config.headPositions[i], this.def.blankSymbol)
    );

    for (const t of this.def.transitions) {
      if (t.fromState !== config.state) continue;
      const matches = t.readSymbols.every((sym, i) => sym === '_WILDCARD_' || sym === reads[i]);
      if (matches) return t;
    }
    return null;
  }

  /** Execute one step from a config, returns new config */
  step(config: TMConfig): TMConfig {
    if (config.status !== 'running') return config;

    // Check accept/reject
    if (this.def.acceptStates.includes(config.state)) {
      return { ...config, status: 'accepted' };
    }
    if (this.def.rejectStates.includes(config.state)) {
      return { ...config, status: 'rejected' };
    }

    const transition = this.findTransition(config);
    if (!transition) {
      // No applicable transition → implicit reject / halt
      return {
        ...config,
        status: 'halted',
        appliedTransition: null,
        errorMessage: `No transition for state "${config.state}" reading [${config.tapes.map((t, i) => tapeRead(t, config.headPositions[i], this.def.blankSymbol)).join(', ')}]`,
      };
    }

    // Apply transition
    const newTapes = config.tapes.map((tape, i) =>
      tapeWrite(tape, config.headPositions[i], transition.writeSymbols[i], this.def.blankSymbol)
    );

    const newHeads = config.headPositions.map((pos, i) => {
      const d = transition.directions[i];
      return d === 'L' ? pos - 1 : d === 'R' ? pos + 1 : pos;
    });

    const newState = transition.toState;
    let newStatus: TMConfig['status'] = 'running';

    // Check accept/reject after transition
    if (this.def.acceptStates.includes(newState)) newStatus = 'accepted';
    else if (this.def.rejectStates.includes(newState)) newStatus = 'rejected';

    return {
      step: config.step + 1,
      state: newState,
      tapes: newTapes,
      headPositions: newHeads,
      appliedTransition: transition,
      status: newStatus,
    };
  }

  /** Run from a starting config, collecting history. Returns final config. */
  run(
    initial: TMConfig,
    onStep?: (config: TMConfig) => void,
    maxSteps?: number
  ): TMConfig {
    const limit = maxSteps ?? this.loopDetectionLimit;
    this.history = [initial];
    let current = initial;

    while (current.status === 'running' && this.history.length <= limit) {
      current = this.step(current);
      this.history.push(current);
      onStep?.(current);
    }

    if (current.status === 'running') {
      current = {
        ...current,
        status: 'error',
        errorMessage: `Possible infinite loop detected: exceeded ${limit} steps.`,
      };
      this.history.push(current);
    }

    return current;
  }

  getHistory(): TMConfig[] {
    return this.history;
  }

  getDefinition(): TMDefinition {
    return this.def;
  }

  /** Step-by-step API with history maintained by caller */
  stepForward(history: TMConfig[]): TMConfig {
    const current = history[history.length - 1];
    if (current.status !== 'running') return current;
    if (current.step >= this.loopDetectionLimit) {
      return {
        ...current,
        status: 'error',
        errorMessage: `Possible infinite loop detected: exceeded ${this.loopDetectionLimit} steps.`,
      };
    }
    return this.step(current);
  }

  stepBackward(history: TMConfig[]): TMConfig {
    if (history.length <= 1) return history[0];
    return history[history.length - 2];
  }
}

// ─── Serialization ───────────────────────────────────────────

export function serializeConfig(config: TMConfig): object {
  return {
    ...config,
    tapes: config.tapes.map(tape => Object.fromEntries(tape)),
  };
}

export function deserializeDefinition(json: unknown): TMDefinition {
  // Basic shape validation
  if (typeof json !== 'object' || json === null) throw new Error('Invalid JSON: expected object');
  const d = json as Record<string, unknown>;
  const required = ['name', 'numTapes', 'states', 'inputAlphabet', 'tapeAlphabet', 'blankSymbol', 'startState', 'acceptStates', 'rejectStates', 'transitions'];
  for (const k of required) {
    if (!(k in d)) throw new Error(`Missing field: ${k}`);
  }
  return d as unknown as TMDefinition;
}

// ─── Performance comparison helper ───────────────────────────

export interface ComparisonResult {
  multiTapeSteps: number;
  singleTapeSteps: number;
  speedup: number;
}

/**
 * Simulate the equivalent single-tape machine's step count (theoretical quadratic overhead).
 * For educational display – we approximate O(n²) steps for a single-tape simulation.
 */
export function estimateSingleTapeSteps(multiTapeSteps: number, inputLength: number): ComparisonResult {
  // Classic result: any k-tape TM with t(n) steps can be simulated by a 1-tape TM in O(t(n)^2) steps
  const singleTapeSteps = Math.round(multiTapeSteps * Math.max(1, inputLength) * 1.5);
  return {
    multiTapeSteps,
    singleTapeSteps,
    speedup: singleTapeSteps / Math.max(1, multiTapeSteps),
  };
}
