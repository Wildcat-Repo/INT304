const { createApp } = require('./app');
const { createPool } = require('./db');

const port = Number(process.env.PORT) || 5001;
const pool = createPool();
const app = createApp({ pool });

const server = app.listen(port, () => {
  console.log(`Employee API listening on http://localhost:${port}`);
});

// Close the HTTP server and the database pool cleanly on Ctrl+C or a stop signal
function shutdown() {
  server.close(() => pool.end().finally(() => process.exit(0)));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
