/**
 * Central E2E Test Suite Runner
 * Executes all 4 tiers of tests:
 * - Tier 1: Feature Coverage (≥85 tests across 17 features)
 * - Tier 2: Boundary & Corner Cases (≥85 tests across 17 features)
 * - Tier 3: Cross-Feature Interactions (pairwise tests)
 * - Tier 4: Real-World Scenarios (5 end-to-end user scenarios)
 *
 * Exits with 0 if all pass; non-zero if any test fails.
 */

const fs = require('fs');
const path = require('path');
const { context } = require('./harness');

async function discoverTestFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await discoverTestFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith('.test.js')) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

async function runE2ETests() {
  const rootE2EDir = path.resolve(__dirname);
  const tiers = [
    { id: 'Tier 1', name: 'Feature Coverage', dir: path.join(rootE2EDir, 'tier1_feature_coverage') },
    { id: 'Tier 2', name: 'Boundary & Corner Cases', dir: path.join(rootE2EDir, 'tier2_boundary_corner') },
    { id: 'Tier 3', name: 'Cross-Feature Interactions', dir: path.join(rootE2EDir, 'tier3_cross_feature') },
    { id: 'Tier 4', name: 'Real-World Scenarios', dir: path.join(rootE2EDir, 'tier4_real_world_scenarios') }
  ];

  console.log('='.repeat(80));
  console.log('       MICROSERVICES E-COMMERCE CHECKOUT - E2E TEST SUITE RUNNER       ');
  console.log('='.repeat(80));
  console.log(`Execution Mode: ${context.isStandaloneMock ? 'Self-Contained Contract Mock Server' : 'Live Endpoints'}`);
  console.log(`Target Base URL: ${context.baseUrl}`);
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('-'.repeat(80));

  await context.startServerIfNeeded();

  let grandTotalTests = 0;
  let grandTotalPassed = 0;
  let grandTotalFailed = 0;
  const globalStartTime = Date.now();
  const tierReports = [];

  try {
    for (const tier of tiers) {
      console.log(`\n▶ Running ${tier.id}: ${tier.name}...`);
      const testFiles = await discoverTestFiles(tier.dir);

      let tierPassed = 0;
      let tierFailed = 0;
      let tierTotal = 0;
      const tierStartTime = Date.now();
      const failedTests = [];

      for (const file of testFiles) {
        // Reset context suites before loading the file
        context.suites = [];

        // Clear require cache for clean runs
        delete require.cache[require.resolve(file)];
        require(file);

        // Run suites declared in this file
        for (const suite of context.suites) {
          const suiteResult = await context.runSuite(suite);
          tierPassed += suiteResult.passed;
          tierFailed += suiteResult.failed;
          tierTotal += suiteResult.tests.length;

          for (const t of suiteResult.tests) {
            if (t.status === 'FAILED') {
              failedTests.push({ file: path.basename(file), suite: suite.name, test: t.name, error: t.error });
            }
          }
        }
      }

      const tierDurationMs = Date.now() - tierStartTime;
      tierReports.push({
        id: tier.id,
        name: tier.name,
        filesCount: testFiles.length,
        total: tierTotal,
        passed: tierPassed,
        failed: tierFailed,
        durationMs: tierDurationMs,
        failedTests
      });

      grandTotalTests += tierTotal;
      grandTotalPassed += tierPassed;
      grandTotalFailed += tierFailed;

      const tierStatusIcon = tierFailed === 0 ? '✓ PASS' : '✗ FAIL';
      console.log(`  ${tierStatusIcon}  ${tier.id} completed: ${tierPassed}/${tierTotal} passed (${tierDurationMs}ms) across ${testFiles.length} files`);
    }
  } finally {
    await context.stopServerIfNeeded();
  }

  const globalDurationMs = Date.now() - globalStartTime;

  console.log('\n' + '='.repeat(80));
  console.log('                          TEST EXECUTION SUMMARY                               ');
  console.log('='.repeat(80));
  console.log(
    'Tier'.padEnd(10) +
    'Description'.padEnd(30) +
    'Files'.padEnd(10) +
    'Tests'.padEnd(10) +
    'Passed'.padEnd(10) +
    'Failed'.padEnd(10) +
    'Duration'
  );
  console.log('-'.repeat(80));

  for (const report of tierReports) {
    console.log(
      report.id.padEnd(10) +
      report.name.padEnd(30) +
      String(report.filesCount).padEnd(10) +
      String(report.total).padEnd(10) +
      String(report.passed).padEnd(10) +
      String(report.failed).padEnd(10) +
      `${report.durationMs}ms`
    );
  }

  console.log('-'.repeat(80));
  console.log(
    'TOTAL'.padEnd(40) +
    String(tierReports.reduce((acc, r) => acc + r.filesCount, 0)).padEnd(10) +
    String(grandTotalTests).padEnd(10) +
    String(grandTotalPassed).padEnd(10) +
    String(grandTotalFailed).padEnd(10) +
    `${globalDurationMs}ms`
  );
  console.log('='.repeat(80));

  if (grandTotalFailed > 0) {
    console.log('\nFAILURES:');
    for (const report of tierReports) {
      for (const f of report.failedTests) {
        console.log(`  [${report.id}] ${f.file} -> ${f.suite} -> ${f.test}`);
        console.log(`    Error: ${f.error}\n`);
      }
    }
    console.log(`\nOVERALL STATUS: FAILED (${grandTotalFailed} tests failed)`);
    process.exit(1);
  } else {
    console.log(`\nOVERALL STATUS: ALL ${grandTotalTests} TESTS PASSED (100% SUCCESS)`);
    process.exit(0);
  }
}

if (require.main === module) {
  runE2ETests().catch((err) => {
    console.error('Fatal Test Runner Error:', err);
    process.exit(1);
  });
}

module.exports = { runE2ETests };
