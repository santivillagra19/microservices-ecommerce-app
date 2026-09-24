/**
 * E2E Test Harness & Execution Engine
 * Provides assertion helpers, test registry, HTTP client, and mock server lifecycle management.
 */

const assert = require('assert');
const { MockMicroservicesServer } = require('./mock_server');

class TestSuite {
  constructor(name) {
    this.name = name;
    this.tests = [];
    this.beforeAllHooks = [];
    this.afterAllHooks = [];
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
  }

  addTest(name, fn) {
    this.tests.push({ name, fn });
  }

  addBeforeAll(fn) {
    this.beforeAllHooks.push(fn);
  }

  addAfterAll(fn) {
    this.afterAllHooks.push(fn);
  }

  addBeforeEach(fn) {
    this.beforeEachHooks.push(fn);
  }

  addAfterEach(fn) {
    this.afterEachHooks.push(fn);
  }
}

class TestContext {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.mockServer = null;
    this.baseUrl = process.env.TEST_API_URL || 'http://localhost:18085';
    this.isStandaloneMock = !process.env.TEST_API_URL;
  }

  describe(name, fn) {
    const suite = new TestSuite(name);
    this.suites.push(suite);
    const prevSuite = this.currentSuite;
    this.currentSuite = suite;
    try {
      fn();
    } finally {
      this.currentSuite = prevSuite;
    }
  }

  test(name, fn) {
    if (!this.currentSuite) {
      this.describe('Default Suite', () => {
        this.currentSuite.addTest(name, fn);
      });
    } else {
      this.currentSuite.addTest(name, fn);
    }
  }

  beforeAll(fn) {
    if (this.currentSuite) this.currentSuite.addBeforeAll(fn);
  }

  afterAll(fn) {
    if (this.currentSuite) this.currentSuite.addAfterAll(fn);
  }

  beforeEach(fn) {
    if (this.currentSuite) this.currentSuite.addBeforeEach(fn);
  }

  afterEach(fn) {
    if (this.currentSuite) this.currentSuite.addAfterEach(fn);
  }

  async startServerIfNeeded() {
    if (this.isStandaloneMock && !this.mockServer) {
      const port = Number(new URL(this.baseUrl).port) || 18085;
      this.mockServer = new MockMicroservicesServer(port);
      await this.mockServer.start();
    }
  }

  async stopServerIfNeeded() {
    if (this.mockServer) {
      await this.mockServer.stop();
      this.mockServer = null;
    }
  }

  async resetMockState() {
    if (this.mockServer) {
      this.mockServer.resetState();
    } else {
      try {
        await fetch(`${this.baseUrl}/__mock/reset`, { method: 'POST' });
      } catch {
        // Live server might not have mock endpoint
      }
    }
  }

  async advanceMockTime(seconds) {
    if (this.mockServer) {
      this.mockServer.advanceTime(seconds);
    } else {
      try {
        await fetch(`${this.baseUrl}/__mock/advance-time`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seconds })
        });
      } catch {
        // Fallback for live server
      }
    }
  }

  async getCapturedEvents() {
    if (this.mockServer) {
      return [...this.mockServer.capturedEvents];
    }
    try {
      const res = await fetch(`${this.baseUrl}/__mock/events`);
      return await res.json();
    } catch {
      return [];
    }
  }

  async getAuditLogs() {
    if (this.mockServer) {
      return [...this.mockServer.auditLogs];
    }
    try {
      const res = await fetch(`${this.baseUrl}/__mock/audit-logs`);
      return await res.json();
    } catch {
      return [];
    }
  }

  async setStock(sku, quantity) {
    if (this.mockServer) {
      this.mockServer.inventory.set(sku, quantity);
    } else {
      await fetch(`${this.baseUrl}/__mock/set-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, quantity })
      });
    }
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const method = options.method || 'GET';
    const headers = { ...options.headers };

    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof URLSearchParams)) {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      body = JSON.stringify(body);
    }

    const response = await fetch(url, {
      method,
      headers,
      body
    });

    const contentType = response.headers.get('content-type') || '';
    let parsedBody;
    const rawText = await response.text();

    if (contentType.includes('application/json')) {
      try {
        parsedBody = JSON.parse(rawText);
      } catch {
        parsedBody = rawText;
      }
    } else {
      parsedBody = rawText;
    }

    return {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
      body: parsedBody,
      rawText
    };
  }

  async runSuite(suite) {
    const results = {
      name: suite.name,
      tests: [],
      passed: 0,
      failed: 0,
      durationMs: 0
    };

    const startTime = Date.now();

    for (const hook of suite.beforeAllHooks) {
      await hook();
    }

    for (const testCase of suite.tests) {
      for (const hook of suite.beforeEachHooks) {
        await hook();
      }

      const tStart = Date.now();
      let testResult = { name: testCase.name, status: 'PASSED', durationMs: 0, error: null };

      try {
        await testCase.fn();
        testResult.durationMs = Date.now() - tStart;
        results.passed++;
      } catch (err) {
        testResult.durationMs = Date.now() - tStart;
        testResult.status = 'FAILED';
        testResult.error = err.message || String(err);
        results.failed++;
      }

      results.tests.push(testResult);

      for (const hook of suite.afterEachHooks) {
        await hook();
      }
    }

    for (const hook of suite.afterAllHooks) {
      await hook();
    }

    results.durationMs = Date.now() - startTime;
    return results;
  }

  async runAll() {
    await this.startServerIfNeeded();
    const suiteResults = [];

    try {
      for (const suite of this.suites) {
        const res = await this.runSuite(suite);
        suiteResults.push(res);
      }
    } finally {
      await this.stopServerIfNeeded();
    }

    return suiteResults;
  }
}

const context = new TestContext();

function describe(name, fn) {
  context.describe(name, fn);
}

function test(name, fn) {
  context.test(name, fn);
}

const it = test;

function beforeAll(fn) {
  context.beforeAll(fn);
}

function afterAll(fn) {
  context.afterAll(fn);
}

function beforeEach(fn) {
  context.beforeEach(fn);
}

function afterEach(fn) {
  context.afterEach(fn);
}

function expect(actual) {
  return {
    toBe(expected) {
      assert.strictEqual(actual, expected, `Expected ${expected} but got ${actual}`);
    },
    toEqual(expected) {
      assert.deepStrictEqual(actual, expected, `Expected deep equality`);
    },
    toBeGreaterThan(expected) {
      assert.ok(actual > expected, `Expected ${actual} > ${expected}`);
    },
    toBeLessThan(expected) {
      assert.ok(actual < expected, `Expected ${actual} < ${expected}`);
    },
    toBeGreaterThanOrEqual(expected) {
      assert.ok(actual >= expected, `Expected ${actual} >= ${expected}`);
    },
    toContain(expected) {
      if (typeof actual === 'string') {
        assert.ok(actual.includes(expected), `Expected "${actual}" to contain "${expected}"`);
      } else if (Array.isArray(actual)) {
        assert.ok(actual.includes(expected), `Expected array to contain item`);
      } else {
        assert.fail(`toContain not supported for type ${typeof actual}`);
      }
    },
    toMatch(regex) {
      assert.match(String(actual), regex);
    },
    toBeDefined() {
      assert.ok(actual !== undefined, 'Expected value to be defined');
    },
    toBeUndefined() {
      assert.strictEqual(actual, undefined, `Expected value to be undefined but got ${actual}`);
    },
    toBeNull() {
      assert.strictEqual(actual, null, 'Expected value to be null');
    },
    toBeTruthy() {
      assert.ok(!!actual, 'Expected truthy value');
    },
    toBeFalsy() {
      assert.ok(!actual, 'Expected falsy value');
    }
  };
}

// Attach to global scope for seamless idiomatic test definitions
global.describe = describe;
global.test = test;
global.it = it;
global.beforeAll = beforeAll;
global.afterAll = afterAll;
global.beforeEach = beforeEach;
global.afterEach = afterEach;
global.expect = expect;
global.assert = assert;

module.exports = {
  describe,
  test,
  it,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  expect,
  assert,
  context,
  request: (ep, opt) => context.request(ep, opt)
};
