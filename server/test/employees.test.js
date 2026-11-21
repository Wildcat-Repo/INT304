const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const { validateEmployee } = require('../src/employees');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

// A small in-memory stand-in for the mysql2 pool that understands the queries the router uses
function fakePool(initialRows = []) {
  const rows = [...initialRows];
  const calls = [];
  return {
    rows,
    calls,
    async execute(sql, params = []) {
      calls.push({ sql, params });
      if (sql.startsWith('INSERT')) {
        const [employee_id, name, email, title, department] = params;
        rows.push({ employee_id, name, email, title, department, created_at: '2026-11-21T00:00:00.000Z' });
        return [{ affectedRows: 1 }];
      }
      if (sql.includes('WHERE employee_id = ?')) {
        return [rows.filter((r) => r.employee_id === params[0])];
      }
      return [rows];
    },
    async query() {
      return [[{ 1: 1 }]];
    }
  };
}

function failingPool() {
  return {
    async execute() {
      throw Object.assign(new Error('connect ECONNREFUSED'), { code: 'ECONNREFUSED' });
    }
  };
}

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

function post(base, body) {
  return fetch(`${base}/api/employees`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
}

// Silence console.error for tests that trigger expected server errors
async function quietly(fn) {
  const original = console.error;
  console.error = () => {};
  try {
    await fn();
  } finally {
    console.error = original;
  }
}

describe('GET /api/employees', () => {
  test('returns an empty array when there are no employees', async () => {
    await withServer(fakePool(), async (base) => {
      const res = await fetch(`${base}/api/employees`);
      assert.equal(res.status, 200);
      assert.deepEqual(await res.json(), []);
    });
  });

  test('returns saved employees without the internal id', async () => {
    const pool = fakePool([{ employee_id: 'abc', name: 'Jane Doe', email: null, title: null, department: null }]);
    await withServer(pool, async (base) => {
      const res = await fetch(`${base}/api/employees`);
      const body = await res.json();
      assert.equal(body[0].name, 'Jane Doe');
      assert.ok(!pool.calls[0].sql.match(/SELECT\s+id\b|,\s*id\b/), 'internal id must not be selected');
    });
  });
});

describe('GET /api/employees/:employeeId', () => {
  test('returns the matching employee', async () => {
    const pool = fakePool([{ employee_id: 'abc', name: 'Jane Doe' }]);
    await withServer(pool, async (base) => {
      const res = await fetch(`${base}/api/employees/abc`);
      assert.equal(res.status, 200);
      assert.equal((await res.json()).name, 'Jane Doe');
    });
  });

  test('returns 404 for an unknown employee_id', async () => {
    await withServer(fakePool(), async (base) => {
      const res = await fetch(`${base}/api/employees/nope`);
      assert.equal(res.status, 404);
      assert.deepEqual(await res.json(), { error: 'Employee not found' });
    });
  });
});

describe('POST /api/employees', () => {
  test('creates an employee with a generated UUID and returns 201', async () => {
    const pool = fakePool();
    await withServer(pool, async (base) => {
      const res = await post(base, { name: '  Jane Doe  ', email: 'jane@example.com', title: 'Engineer', department: '' });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.match(body.employee_id, UUID_PATTERN);
      assert.equal(res.headers.get('location'), `/api/employees/${body.employee_id}`);
      assert.equal(body.name, 'Jane Doe', 'name is trimmed');
      assert.equal(body.department, null, 'empty optional fields are stored as NULL');
    });
  });

  test('ignores any id or employee_id sent by the client', async () => {
    const pool = fakePool();
    await withServer(pool, async (base) => {
      const res = await post(base, { name: 'Jane', id: '1', employee_id: 'client-chosen' });
      const body = await res.json();
      assert.notEqual(body.employee_id, 'client-chosen');
      assert.match(body.employee_id, UUID_PATTERN);
    });
  });

  test('uses placeholders, not string-built SQL', async () => {
    const pool = fakePool();
    await withServer(pool, async (base) => {
      await post(base, { name: "Robert'); DROP TABLE employees;--" });
      const insert = pool.calls.find((c) => c.sql.startsWith('INSERT'));
      assert.ok(!insert.sql.includes('Robert'), 'value must not appear in SQL text');
      assert.equal(insert.params[1], "Robert'); DROP TABLE employees;--");
    });
  });

  test('two employees get different employee_ids', async () => {
    const pool = fakePool();
    await withServer(pool, async (base) => {
      const a = await (await post(base, { name: 'A' })).json();
      const b = await (await post(base, { name: 'B' })).json();
      assert.notEqual(a.employee_id, b.employee_id);
    });
  });

  test('returns 400 with errors and does not insert when input is invalid', async () => {
    const pool = fakePool();
    await withServer(pool, async (base) => {
      const res = await post(base, { name: '   ', email: 'not-an-email' });
      assert.equal(res.status, 400);
      assert.deepEqual((await res.json()).errors, ['name is required', 'email must be a valid email address']);
      assert.equal(pool.calls.length, 0);
    });
  });

  test('returns 400 for malformed JSON', async () => {
    await withServer(fakePool(), async (base) => {
      const res = await post(base, '{"name": ');
      assert.equal(res.status, 400);
      assert.deepEqual(await res.json(), { errors: ['Request body is not valid JSON'] });
    });
  });
});

describe('errors and unknown routes', () => {
  test('database failures return a generic 500 without details', async () => {
    await quietly(() =>
      withServer(failingPool(), async (base) => {
        const res = await fetch(`${base}/api/employees`);
        assert.equal(res.status, 500);
        assert.deepEqual(await res.json(), { error: 'Internal server error' });
      })
    );
  });

  test('unknown /api routes return JSON 404', async () => {
    await withServer(fakePool(), async (base) => {
      const res = await fetch(`${base}/api/nothing-here`);
      assert.equal(res.status, 404);
      assert.deepEqual(await res.json(), { error: 'Not found' });
    });
  });
});

describe('validateEmployee', () => {
  test('rejects non-object bodies', () => {
    assert.deepEqual(validateEmployee([]).errors, ['Request body must be a JSON object']);
    assert.deepEqual(validateEmployee(null).errors, ['Request body must be a JSON object']);
  });

  test('rejects non-string fields', () => {
    assert.ok(validateEmployee({ name: 42 }).errors.includes('name must be a string'));
  });

  test('enforces the column length limits from schema.sql', () => {
    const { errors } = validateEmployee({ name: 'x'.repeat(101), email: `${'a'.repeat(250)}@b.com` });
    assert.ok(errors.includes('name must be at most 100 characters'));
    assert.ok(errors.includes('email must be at most 255 characters'));
  });

  test('accepts a minimal valid employee', () => {
    const { errors, values } = validateEmployee({ name: 'Jane' });
    assert.deepEqual(errors, []);
    assert.deepEqual(values, { name: 'Jane', email: null, title: null, department: null });
  });
});
