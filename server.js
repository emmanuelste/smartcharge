import app from './server/app.js';
import { initializeDatabase, pool } from './server/database.js';

const isProduction = process.env.NODE_ENV === 'production';
const port = Number(process.env.PORT || 3001);

async function startServer() {
  if (isProduction && !pool) {
    throw new Error('DATABASE_URL must be configured before starting the production server');
  }

  if (pool) {
    await initializeDatabase();
    console.log('PostgreSQL schema is ready.');
  } else {
    console.warn('DATABASE_URL is missing. Persistent API workflows will return 503.');
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`SmartCharge API and React app listening on port ${port}`);
    console.log('Mobile-money payments and charger telemetry remain disabled until providers are configured.');
  });
}

startServer().catch((error) => {
  console.error('SmartCharge startup failed:', error.message);
  process.exit(1);
});
