const express = require('express');
const { createEmployeesRouter } = require('./employees');

// Build the Express app. The database pool is passed in so tests can supply a fake one.
function createApp({ pool }) {
  const app = express();
  app.use(express.json());

  // Health check: reports whether the API can reach MySQL.
  app.get('/api/health', async (req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', db: 'connected' });
    } catch (error) {
      console.error('Health check failed:', error.code || error.message);
      res.status(503).json({ status: 'error', db: 'unreachable' });
    }
  });

  app.use('/api/employees', createEmployeesRouter({ pool }));

  // Unknown API routes
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  // Error handler. Express 5 forwards errors from async route handlers here.
  // Details are logged on the server, never sent to the client.
  // eslint-disable-next-line no-unused-vars
  app.use((error, req, res, next) => {
    if (error.type === 'entity.parse.failed') {
      return res.status(400).json({ errors: ['Request body is not valid JSON'] });
    }
    console.error('Request failed:', error.code || error.message);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
