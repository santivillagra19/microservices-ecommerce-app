#!/usr/bin/env node

/**
 * Entry point to execute the complete E2E test suite
 * Usage:
 *   node tests/e2e/run_all_e2e_tests.js
 */

const { runE2ETests } = require('./runner');

runE2ETests().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
