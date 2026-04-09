import type { TMDefinition } from './turingMachine';

// ============================================================
// Preloaded Example Turing Machines
// ============================================================

/**
 * Example 1: Binary Palindrome Checker (2-tape)
 * Tape 1: input string, Tape 2: working tape
 * Accepts if the binary string is a palindrome
 */
export const palindromeChecker: TMDefinition = {
  name: 'Binary Palindrome Checker',
  description: 'Checks if a binary string is a palindrome using 2 tapes. Tape 1 holds input; tape 2 is used as a copy. Accepts palindromes.',
  numTapes: 2,
  states: ['q_start', 'q_copy', 'q_rewind1', 'q_rewind2', 'q_compare', 'q_accept', 'q_reject'],
  inputAlphabet: ['0', '1'],
  tapeAlphabet: ['0', '1', '_'],
  blankSymbol: '_',
  startState: 'q_start',
  acceptStates: ['q_accept'],
  rejectStates: ['q_reject'],
  transitions: [
    // Phase 1: copy tape 1 → tape 2
    { fromState: 'q_start', readSymbols: ['0', '_'], toState: 'q_copy', writeSymbols: ['0', '0'], directions: ['R', 'R'] },
    { fromState: 'q_start', readSymbols: ['1', '_'], toState: 'q_copy', writeSymbols: ['1', '1'], directions: ['R', 'R'] },
    { fromState: 'q_start', readSymbols: ['_', '_'], toState: 'q_accept', writeSymbols: ['_', '_'], directions: ['S', 'S'] },
    { fromState: 'q_copy', readSymbols: ['0', '_'], toState: 'q_copy', writeSymbols: ['0', '0'], directions: ['R', 'R'] },
    { fromState: 'q_copy', readSymbols: ['1', '_'], toState: 'q_copy', writeSymbols: ['1', '1'], directions: ['R', 'R'] },
    { fromState: 'q_copy', readSymbols: ['_', '_'], toState: 'q_rewind1', writeSymbols: ['_', '_'], directions: ['L', 'L'] },
    // Phase 2: rewind tape 1 to start, tape 2 to end
    { fromState: 'q_rewind1', readSymbols: ['0', '0'], toState: 'q_rewind1', writeSymbols: ['0', '0'], directions: ['L', 'S'] },
    { fromState: 'q_rewind1', readSymbols: ['0', '1'], toState: 'q_rewind1', writeSymbols: ['0', '1'], directions: ['L', 'S'] },
    { fromState: 'q_rewind1', readSymbols: ['1', '0'], toState: 'q_rewind1', writeSymbols: ['1', '0'], directions: ['L', 'S'] },
    { fromState: 'q_rewind1', readSymbols: ['1', '1'], toState: 'q_rewind1', writeSymbols: ['1', '1'], directions: ['L', 'S'] },
    { fromState: 'q_rewind1', readSymbols: ['_', '0'], toState: 'q_rewind2', writeSymbols: ['_', '0'], directions: ['R', 'S'] },
    { fromState: 'q_rewind1', readSymbols: ['_', '1'], toState: 'q_rewind2', writeSymbols: ['_', '1'], directions: ['R', 'S'] },
    { fromState: 'q_rewind1', readSymbols: ['_', '_'], toState: 'q_accept', writeSymbols: ['_', '_'], directions: ['S', 'S'] },
    // Phase 3: compare tape 1 forward with tape 2 backward
    { fromState: 'q_rewind2', readSymbols: ['0', '0'], toState: 'q_compare', writeSymbols: ['0', '0'], directions: ['S', 'S'] },
    { fromState: 'q_rewind2', readSymbols: ['1', '1'], toState: 'q_compare', writeSymbols: ['1', '1'], directions: ['S', 'S'] },
    { fromState: 'q_rewind2', readSymbols: ['0', '1'], toState: 'q_reject', writeSymbols: ['0', '1'], directions: ['S', 'S'] },
    { fromState: 'q_rewind2', readSymbols: ['1', '0'], toState: 'q_reject', writeSymbols: ['1', '0'], directions: ['S', 'S'] },
    { fromState: 'q_compare', readSymbols: ['0', '0'], toState: 'q_compare', writeSymbols: ['0', '0'], directions: ['R', 'L'] },
    { fromState: 'q_compare', readSymbols: ['1', '1'], toState: 'q_compare', writeSymbols: ['1', '1'], directions: ['R', 'L'] },
    { fromState: 'q_compare', readSymbols: ['0', '1'], toState: 'q_reject', writeSymbols: ['0', '1'], directions: ['S', 'S'] },
    { fromState: 'q_compare', readSymbols: ['1', '0'], toState: 'q_reject', writeSymbols: ['1', '0'], directions: ['S', 'S'] },
    { fromState: 'q_compare', readSymbols: ['_', '_'], toState: 'q_accept', writeSymbols: ['_', '_'], directions: ['S', 'S'] },
    { fromState: 'q_compare', readSymbols: ['_', '0'], toState: 'q_accept', writeSymbols: ['_', '0'], directions: ['S', 'S'] },
    { fromState: 'q_compare', readSymbols: ['_', '1'], toState: 'q_accept', writeSymbols: ['_', '1'], directions: ['S', 'S'] },
  ],
};

/**
 * Example 2: String Copy (2-tape)
 * Copies the contents of Tape 1 onto Tape 2
 */
export const stringCopy: TMDefinition = {
  name: 'String Copy',
  description: 'Copies the input string from Tape 1 to Tape 2. Works with any binary string. Demonstrates classic 2-tape efficiency.',
  numTapes: 2,
  states: ['q_copy', 'q_done'],
  inputAlphabet: ['0', '1'],
  tapeAlphabet: ['0', '1', '_'],
  blankSymbol: '_',
  startState: 'q_copy',
  acceptStates: ['q_done'],
  rejectStates: [],
  transitions: [
    { fromState: 'q_copy', readSymbols: ['0', '_'], toState: 'q_copy', writeSymbols: ['0', '0'], directions: ['R', 'R'] },
    { fromState: 'q_copy', readSymbols: ['1', '_'], toState: 'q_copy', writeSymbols: ['1', '1'], directions: ['R', 'R'] },
    { fromState: 'q_copy', readSymbols: ['_', '_'], toState: 'q_done', writeSymbols: ['_', '_'], directions: ['S', 'S'] },
  ],
};

/**
 * Example 3: Unary Addition (2-tape)
 * Adds two unary numbers separated by '+'.
 * e.g., "111+11" → tape 2 will contain "11111"
 */
export const unaryAddition: TMDefinition = {
  name: 'Unary Addition',
  description: 'Adds two unary numbers A+B (using \'1\' strokes separated by \'+\'). The result (A+B strokes) is written on Tape 2.',
  numTapes: 2,
  states: ['q_skip_first', 'q_skip_plus', 'q_copy_second', 'q_done'],
  inputAlphabet: ['1', '+'],
  tapeAlphabet: ['1', '+', '_'],
  blankSymbol: '_',
  startState: 'q_skip_first',
  acceptStates: ['q_done'],
  rejectStates: [],
  transitions: [
    // Copy first number to tape 2
    { fromState: 'q_skip_first', readSymbols: ['1', '_'], toState: 'q_skip_first', writeSymbols: ['1', '1'], directions: ['R', 'R'] },
    // Hit the '+': skip it on tape 1, don't write on tape 2
    { fromState: 'q_skip_first', readSymbols: ['+', '_'], toState: 'q_skip_plus', writeSymbols: ['+', '_'], directions: ['R', 'S'] },
    // Copy second number to tape 2 (continuing from current tape 2 head)
    { fromState: 'q_skip_plus', readSymbols: ['1', '_'], toState: 'q_copy_second', writeSymbols: ['1', '1'], directions: ['R', 'R'] },
    { fromState: 'q_copy_second', readSymbols: ['1', '_'], toState: 'q_copy_second', writeSymbols: ['1', '1'], directions: ['R', 'R'] },
    { fromState: 'q_copy_second', readSymbols: ['_', '_'], toState: 'q_done', writeSymbols: ['_', '_'], directions: ['S', 'S'] },
    { fromState: 'q_skip_plus', readSymbols: ['_', '_'], toState: 'q_done', writeSymbols: ['_', '_'], directions: ['S', 'S'] },
  ],
};

/**
 * Example 4: Binary Increment (single tape)
 * Increments a binary number by 1, right to left.
 */
export const binaryIncrement: TMDefinition = {
  name: 'Binary Increment',
  description: 'Increments a binary number by 1. Reads from right to left, carrying as needed. Single tape machine.',
  numTapes: 1,
  states: ['q_right', 'q_carry', 'q_done'],
  inputAlphabet: ['0', '1'],
  tapeAlphabet: ['0', '1', '_'],
  blankSymbol: '_',
  startState: 'q_right',
  acceptStates: ['q_done'],
  rejectStates: [],
  transitions: [
    // Move right to find end of number
    { fromState: 'q_right', readSymbols: ['0'], toState: 'q_right', writeSymbols: ['0'], directions: ['R'] },
    { fromState: 'q_right', readSymbols: ['1'], toState: 'q_right', writeSymbols: ['1'], directions: ['R'] },
    { fromState: 'q_right', readSymbols: ['_'], toState: 'q_carry', writeSymbols: ['_'], directions: ['L'] },
    // Carry phase: 1+1=10, 0+1=1
    { fromState: 'q_carry', readSymbols: ['1'], toState: 'q_carry', writeSymbols: ['0'], directions: ['L'] },
    { fromState: 'q_carry', readSymbols: ['0'], toState: 'q_done', writeSymbols: ['1'], directions: ['S'] },
    { fromState: 'q_carry', readSymbols: ['_'], toState: 'q_done', writeSymbols: ['1'], directions: ['S'] },
  ],
};

export const EXAMPLE_MACHINES: TMDefinition[] = [
  palindromeChecker,
  stringCopy,
  unaryAddition,
  binaryIncrement,
];

export const EXAMPLE_INPUTS: Record<string, string[]> = {
  'Binary Palindrome Checker': ['10101', ''],
  'String Copy': ['10110', ''],
  'Unary Addition': ['111+11', ''],
  'Binary Increment': ['1011'],
};
