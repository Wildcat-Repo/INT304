const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');

// Start the app on a random free port, run fn against it, then close it
async function withServer(pool, fn) {
  const server = createApp({ pool }).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const base = `http://localhost:${server.address().port}`;
  try {
    await fn(base);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test('GET /api/health returns 200 when the database responds', async () => {
  const pool = { query: async () => [[{ 1: 1 }]] };
  await withServer(pool, async (base) => {
    const res = await fetch(`${base}/api/health`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'ok', db: 'connected' });
  });
});

test('GET /api/health returns 503 without leaking error details when the database is down', async () => {
  const pool = {
    query: async () => {
      throw Object.assign(new Error("Access denied for user 'x'"), { code: 'ER_ACCESS_DENIED_ERROR' });
    }
  };
  const originalError = console.error;
  console.error = () => {};
  try {
    await withServer(pool, async (base) => {
      const res = await fetch(`${base}/api/health`);
      assert.equal(res.status, 503);
      assert.deepEqual(await res.json(), { status: 'error', db: 'unreachable' });
    });
  } finally {
    console.error = originalError;
  }
});
