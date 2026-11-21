const express = require('express');
const { randomUUID } = require('node:crypto');

// Columns returned to the client. The internal auto-increment id stays private;
// employee_id is the public identifier.
const COLUMNS = 'employee_id, name, email, title, department, created_at';

// Form fields and their maximum lengths (these match db/schema.sql)
const FIELDS = { name: 100, email: 255, title: 100, department: 100 };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Check the request body. Returns { errors, values }: errors is empty when the input is valid.
function validateEmployee(body) {
  const errors = [];
  const values = {};

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: ['Request body must be a JSON object'], values };
  }

  for (const [field, maxLength] of Object.entries(FIELDS)) {
    const raw = body[field];
    if (raw !== undefined && raw !== null && typeof raw !== 'string') {
      errors.push(`${field} must be a string`);
      continue;
    }
    const value = (raw || '').trim();
    if (value.length > maxLength) {
      errors.push(`${field} must be at most ${maxLength} characters`);
    }
    // Store empty optional fields as NULL rather than ''
    values[field] = value === '' ? null : value;
  }

  if (!values.name) {
    errors.push('name is required');
  }
  if (values.email && !EMAIL_PATTERN.test(values.email)) {
    errors.push('email must be a valid email address');
  }

  return { errors, values };
}

function createEmployeesRouter({ pool }) {
  const router = express.Router();

  // List all employees, oldest first (the order they were added)
  router.get('/', async (req, res) => {
    const [rows] = await pool.execute(`SELECT ${COLUMNS} FROM employees ORDER BY id`);
    res.json(rows);
  });

  // Get one employee by employee_id
  router.get('/:employeeId', async (req, res) => {
    const [rows] = await pool.execute(
      `SELECT ${COLUMNS} FROM employees WHERE employee_id = ?`,
      [req.params.employeeId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(rows[0]);
  });

  // Create an employee. The API generates employee_id; any id sent by the client is ignored.
  router.post('/', async (req, res) => {
    const { errors, values } = validateEmployee(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const employeeId = randomUUID();
    await pool.execute(
      'INSERT INTO employees (employee_id, name, email, title, department) VALUES (?, ?, ?, ?, ?)',
      [employeeId, values.name, values.email, values.title, values.department]
    );

    const [rows] = await pool.execute(
      `SELECT ${COLUMNS} FROM employees WHERE employee_id = ?`,
      [employeeId]
    );
    res.status(201).location(`/api/employees/${employeeId}`).json(rows[0]);
  });

  return router;
}

module.exports = { createEmployeesRouter, validateEmployee };
