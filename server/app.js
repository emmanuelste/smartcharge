import bcrypt from 'bcryptjs';
import connectPgSimple from 'connect-pg-simple';
import { createHash, randomBytes } from 'node:crypto';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import session from 'express-session';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './database.js';

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const distPath = path.join(root, 'dist');
const PgStore = connectPgSimple(session);
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const trackingCodePattern = /^[A-Za-z0-9_-]{32}$/;
const serviceTypes = new Set(['direct_charge', 'flat_charge', 'battery_swap']);

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        baseUri: ["'self'"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        imgSrc: ["'self'", 'data:'],
        objectSrc: ["'none'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'same-site' },
  }),
);
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: false, limit: '16kb' }));

const sessionOptions = {
  name: 'smartcharge.sid',
  secret: process.env.SESSION_SECRET || 'local-development-only-change-before-deploy',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: 8 * 60 * 60 * 1000,
  },
};

if (pool) {
  sessionOptions.store = new PgStore({
    pool,
    tableName: 'user_sessions',
    createTableIfMissing: true,
  });
}

app.use(session(sessionOptions));

if (isProduction && (!pool || !process.env.SESSION_SECRET)) {
  throw new Error('DATABASE_URL and SESSION_SECRET must be configured in production');
}

function requireDatabase(req, res, next) {
  if (!pool) {
    return res.status(503).json({
      error: 'Persistent storage is not configured. Add DATABASE_URL before using this workflow.',
      code: 'DATABASE_NOT_CONFIGURED',
    });
  }

  next();
}

function requireSameOrigin(req, res, next) {
  const origin = req.get('origin');
  if (origin && new URL(origin).host !== req.get('host')) {
    return res.status(403).json({ error: 'Cross-origin requests are not accepted.' });
  }

  next();
}

async function requireStaff(req, res, next) {
  if (!req.session?.staffId || !pool) {
    return res.status(401).json({ error: 'Sign in with a staff account to continue.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, role, must_change_password FROM staff_users WHERE id = $1 AND active = TRUE',
      [req.session.staffId],
    );
    if (!result.rowCount) {
      req.session.destroy(() => {});
      return res.status(401).json({ error: 'This staff account is no longer active.' });
    }

    req.staff = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

function requireAdmin(req, res, next) {
  if (req.staff?.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator access is required.' });
  }

  next();
}

function cleanText(value, maxLength = 160) {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function trackingHash(code) {
  return createHash('sha256').update(code).digest('hex');
}

async function writeAudit(actorId, action, resourceType, resourceId = '', details = {}) {
  await pool.query(
    `INSERT INTO audit_events (actor_id, action, resource_type, resource_id, details)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [actorId, action, resourceType, resourceId, JSON.stringify(details)],
  );
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Try again later.' },
});
const publicWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again later.' },
});
const trackingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 60,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many status checks. Try again later.' },
});

app.get('/api/health', asyncRoute(async (_req, res) => {
  if (!pool) {
    return res.status(503).json({ ok: false, database: 'not_configured' });
  }

  await pool.query('SELECT 1');
  res.json({
    ok: true,
    database: 'connected',
    integrations: {
      mobileMoney: 'not_configured',
      chargerTelemetry: 'not_configured',
    },
    timestamp: new Date().toISOString(),
  });
}));

app.get('/api/public/stations', requireDatabase, asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `SELECT id, station_code, name, address, region, status, status_source,
            connector_count, battery_swap_count, latitude, longitude
       FROM stations
      WHERE status = 'operational'
      ORDER BY name`,
  );
  res.json({ stations: result.rows });
}));

app.get('/api/public/tariffs', requireDatabase, asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `SELECT DISTINCT ON (service_type) service_type, amount_tzs, billing_unit, unit_label, effective_from
       FROM tariff_rates
      WHERE active = TRUE AND effective_from <= CURRENT_DATE
      ORDER BY service_type, effective_from DESC, created_at DESC`,
  );
  res.json({ tariffs: result.rows });
}));

app.post('/api/public/driver-requests', publicWriteLimiter, requireDatabase, requireSameOrigin, asyncRoute(async (req, res) => {
  const stationId = cleanText(req.body.stationId, 36);
  const serviceType = cleanText(req.body.serviceType, 32);
  const vehicleRegistration = cleanText(req.body.vehicleRegistration, 24).toUpperCase();
  const startingSoc = req.body.startingSoc === '' || req.body.startingSoc == null ? null : Number(req.body.startingSoc);
  const targetSoc = req.body.targetSoc === '' || req.body.targetSoc == null ? null : Number(req.body.targetSoc);

  if (!uuidPattern.test(stationId) || !serviceTypes.has(serviceType)) {
    return res.status(400).json({ error: 'Choose an operational station and a valid service.' });
  }

  if (serviceType === 'direct_charge' && (!Number.isInteger(startingSoc) || !Number.isInteger(targetSoc) || startingSoc < 0 || targetSoc > 100 || targetSoc <= startingSoc)) {
    return res.status(400).json({ error: 'Enter a valid starting and target battery percentage.' });
  }

  if (serviceType === 'flat_charge' && targetSoc !== 100) {
    return res.status(400).json({ error: 'A flat charge request must target 100%.' });
  }

  const station = await pool.query(
    `SELECT id FROM stations WHERE id = $1 AND status = 'operational'`,
    [stationId],
  );
  if (!station.rowCount) {
    return res.status(409).json({ error: 'That station is not currently accepting requests.' });
  }

  const tariff = await pool.query(
    `SELECT amount_tzs, billing_unit
       FROM tariff_rates
      WHERE service_type = $1 AND active = TRUE AND effective_from <= CURRENT_DATE
      ORDER BY effective_from DESC, created_at DESC LIMIT 1`,
    [serviceType],
  );

  let quotedAmount = null;
  if (tariff.rowCount && serviceType === 'direct_charge' && tariff.rows[0].billing_unit === 'per_10_percent') {
    quotedAmount = Math.ceil((targetSoc - startingSoc) / 10) * tariff.rows[0].amount_tzs;
  } else if (tariff.rowCount && tariff.rows[0].billing_unit === 'per_request') {
    quotedAmount = tariff.rows[0].amount_tzs;
  }

  const trackingCode = randomBytes(24).toString('base64url');
  const result = await pool.query(
    `INSERT INTO driver_requests
       (tracking_code_hash, station_id, service_type, vehicle_registration, starting_soc, target_soc, quoted_amount_tzs)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, status, payment_status, created_at`,
    [trackingHash(trackingCode), stationId, serviceType, vehicleRegistration, startingSoc, targetSoc, quotedAmount],
  );

  res.status(201).json({
    request: result.rows[0],
    trackingCode,
    payment: { available: false, reason: 'A mobile-money provider has not been configured.' },
  });
}));

app.get('/api/public/driver-requests/:trackingCode', trackingLimiter, requireDatabase, asyncRoute(async (req, res) => {
  const code = req.params.trackingCode;
  if (!trackingCodePattern.test(code)) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  const result = await pool.query(
    `SELECT r.id, r.service_type, r.vehicle_registration, r.starting_soc, r.target_soc,
            r.quoted_amount_tzs, r.status, r.payment_status, r.created_at,
            s.station_code, s.name AS station_name, s.address AS station_address
       FROM driver_requests r
       JOIN stations s ON s.id = r.station_id
      WHERE r.tracking_code_hash = $1`,
    [trackingHash(code)],
  );

  if (!result.rowCount) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  res.json({ request: result.rows[0] });
}));

app.post('/api/public/inquiries', publicWriteLimiter, requireDatabase, requireSameOrigin, asyncRoute(async (req, res) => {
  const name = cleanText(req.body.name, 120);
  const email = cleanText(req.body.email, 254).toLowerCase();
  const phone = cleanText(req.body.phone, 32);
  const topic = cleanText(req.body.topic, 32);
  const message = cleanText(req.body.message, 2_000);

  if (!name || !/^\S+@\S+\.\S+$/.test(email) || !message || !['station_setup', 'support', 'compliance'].includes(topic)) {
    return res.status(400).json({ error: 'Complete the required fields with a valid email address.' });
  }

  const referenceCode = `SC-${randomBytes(6).toString('hex').toUpperCase()}`;
  const result = await pool.query(
    `INSERT INTO inquiries (reference_code, name, email, phone, topic, message)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING reference_code, status, created_at`,
    [referenceCode, name, email, phone, topic, message],
  );

  res.status(201).json({ inquiry: result.rows[0] });
}));

app.get('/api/auth/session', requireDatabase, asyncRoute(async (req, res) => {
  if (!req.session?.staffId) {
    const result = await pool.query('SELECT EXISTS (SELECT 1 FROM staff_users WHERE active = TRUE) AS staff_configured');
    return res.json({ user: null, staffConfigured: result.rows[0].staff_configured });
  }

  const result = await pool.query(
    'SELECT id, email, role, must_change_password FROM staff_users WHERE id = $1 AND active = TRUE',
    [req.session.staffId],
  );
  const user = result.rows[0];
  res.json({
    user: user ? {
      id: user.id,
      email: user.email,
      role: user.role,
      mustChangePassword: user.must_change_password,
    } : null,
    staffConfigured: true,
  });
}));

app.post('/api/auth/login', requireDatabase, requireSameOrigin, loginLimiter, asyncRoute(async (req, res) => {
  const email = cleanText(req.body.email, 254).toLowerCase();
  const password = typeof req.body.password === 'string' ? req.body.password : '';
  const result = await pool.query(
    'SELECT id, email, role, password_hash, must_change_password FROM staff_users WHERE lower(email) = $1 AND active = TRUE',
    [email],
  );
  const user = result.rows[0];
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }

  await new Promise((resolve, reject) => req.session.regenerate((error) => error ? reject(error) : resolve()));
  req.session.staffId = user.id;
  await pool.query('UPDATE staff_users SET last_login_at = NOW() WHERE id = $1', [user.id]);
  await writeAudit(user.id, 'staff.login', 'staff_user', user.id);
  res.json({ user: { id: user.id, email: user.email, role: user.role, mustChangePassword: user.must_change_password } });
}));

app.post('/api/auth/logout', requireSameOrigin, asyncRoute(async (req, res) => {
  if (!req.session) {
    return res.json({ ok: true });
  }

  await new Promise((resolve) => req.session.destroy(() => resolve()));
  res.clearCookie('smartcharge.sid', { httpOnly: true, sameSite: 'lax', secure: isProduction });
  res.json({ ok: true });
}));

app.post('/api/auth/password', requireDatabase, requireSameOrigin, requireStaff, asyncRoute(async (req, res) => {
  const currentPassword = typeof req.body.currentPassword === 'string' ? req.body.currentPassword : '';
  const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
  if (newPassword.length < 12 || newPassword.length > 72) {
    return res.status(400).json({ error: 'New password must be between 12 and 72 characters.' });
  }

  const result = await pool.query('SELECT password_hash FROM staff_users WHERE id = $1 AND active = TRUE', [req.staff.id]);
  if (!result.rowCount || !(await bcrypt.compare(currentPassword, result.rows[0].password_hash))) {
    return res.status(401).json({ error: 'Current password is incorrect.' });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await pool.query('UPDATE staff_users SET password_hash = $1, must_change_password = FALSE WHERE id = $2', [passwordHash, req.staff.id]);
  await writeAudit(req.staff.id, 'staff.password_changed', 'staff_user', req.staff.id);
  res.json({ ok: true, user: { id: req.staff.id, email: req.staff.email, role: req.staff.role, mustChangePassword: false } });
}));

app.post('/api/staff/users', requireDatabase, requireSameOrigin, requireStaff, requireAdmin, asyncRoute(async (req, res) => {
  const email = cleanText(req.body.email, 254).toLowerCase();
  const password = typeof req.body.temporaryPassword === 'string' ? req.body.temporaryPassword : '';
  const role = cleanText(req.body.role, 16);
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 12 || password.length > 72 || !['operator', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Enter a valid email, a temporary password of at least 12 characters, and a supported role.' });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const result = await pool.query(
    `INSERT INTO staff_users (email, password_hash, role, must_change_password)
     VALUES ($1, $2, $3, TRUE)
     RETURNING id, email, role, must_change_password, created_at`,
    [email, passwordHash, role],
  );
  await writeAudit(req.staff.id, 'staff.created', 'staff_user', result.rows[0].id, { email, role });
  res.status(201).json({ user: result.rows[0] });
}));

app.get('/api/staff/stations', requireDatabase, requireStaff, asyncRoute(async (_req, res) => {
  const result = await pool.query('SELECT * FROM stations ORDER BY created_at DESC');
  res.json({ stations: result.rows });
}));

app.post('/api/staff/stations', requireDatabase, requireSameOrigin, requireStaff, requireAdmin, asyncRoute(async (req, res) => {
  const stationCode = cleanText(req.body.stationCode, 32).toUpperCase();
  const name = cleanText(req.body.name, 160);
  const address = cleanText(req.body.address, 240);
  const region = cleanText(req.body.region, 100) || 'Dar es Salaam';
  const connectorCount = Number(req.body.connectorCount || 0);
  const batterySwapCount = Number(req.body.batterySwapCount || 0);

  if (!/^[A-Z0-9-]{3,32}$/.test(stationCode) || !name || !address || !Number.isInteger(connectorCount) || connectorCount < 0 || !Number.isInteger(batterySwapCount) || batterySwapCount < 0) {
    return res.status(400).json({ error: 'Enter a station code, name, address, and valid equipment counts.' });
  }

  const result = await pool.query(
    `INSERT INTO stations (station_code, name, address, region, connector_count, battery_swap_count, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [stationCode, name, address, region, connectorCount, batterySwapCount, req.staff.id],
  );
  await writeAudit(req.staff.id, 'station.created', 'station', result.rows[0].id, { stationCode });
  res.status(201).json({ station: result.rows[0] });
}));

app.patch('/api/staff/stations/:stationId/status', requireDatabase, requireSameOrigin, requireStaff, asyncRoute(async (req, res) => {
  const stationId = req.params.stationId;
  const status = cleanText(req.body.status, 24);
  if (!uuidPattern.test(stationId) || !['setup', 'operational', 'maintenance', 'offline'].includes(status)) {
    return res.status(400).json({ error: 'Choose a valid station and status.' });
  }

  const result = await pool.query(
    `UPDATE stations SET status = $1, status_source = 'manual', updated_at = NOW()
      WHERE id = $2 RETURNING id, station_code, status, status_source, updated_at`,
    [status, stationId],
  );
  if (!result.rowCount) {
    return res.status(404).json({ error: 'Station not found.' });
  }

  await writeAudit(req.staff.id, 'station.status_changed', 'station', stationId, { status, source: 'manual' });
  res.json({ station: result.rows[0] });
}));

app.get('/api/staff/driver-requests', requireDatabase, requireStaff, asyncRoute(async (req, res) => {
  const result = await pool.query(
    `SELECT r.id, r.service_type, r.vehicle_registration, r.starting_soc, r.target_soc,
            r.quoted_amount_tzs, r.status, r.payment_status, r.created_at,
            s.station_code, s.name AS station_name
       FROM driver_requests r
       JOIN stations s ON s.id = r.station_id
      ORDER BY r.created_at DESC LIMIT 100`,
  );
  res.json({ requests: result.rows });
}));

app.patch('/api/staff/driver-requests/:requestId/status', requireDatabase, requireSameOrigin, requireStaff, asyncRoute(async (req, res) => {
  const requestId = req.params.requestId;
  const status = cleanText(req.body.status, 24);
  if (!uuidPattern.test(requestId) || !['accepted', 'declined', 'in_progress', 'completed', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Choose a valid request and next status.' });
  }

  const result = await pool.query(
    `UPDATE driver_requests SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, status, updated_at`,
    [status, requestId],
  );
  if (!result.rowCount) {
    return res.status(404).json({ error: 'Driver request not found.' });
  }

  await writeAudit(req.staff.id, 'driver_request.status_changed', 'driver_request', requestId, { status });
  res.json({ request: result.rows[0] });
}));

app.get('/api/staff/tariffs', requireDatabase, requireStaff, requireAdmin, asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `SELECT DISTINCT ON (service_type) service_type, amount_tzs, billing_unit, unit_label, effective_from, created_at
       FROM tariff_rates WHERE active = TRUE ORDER BY service_type, effective_from DESC, created_at DESC`,
  );
  res.json({ tariffs: result.rows });
}));

app.put('/api/staff/tariffs/:serviceType', requireDatabase, requireSameOrigin, requireStaff, requireAdmin, asyncRoute(async (req, res) => {
  const serviceType = req.params.serviceType;
  const amountTzs = Number(req.body.amountTzs);
  const billingUnit = cleanText(req.body.billingUnit, 32);
  const unitLabel = cleanText(req.body.unitLabel, 48);
  const validUnit = serviceType === 'direct_charge' ? billingUnit === 'per_10_percent' : billingUnit === 'per_request';

  if (!serviceTypes.has(serviceType) || !Number.isSafeInteger(amountTzs) || amountTzs < 0 || !validUnit || !unitLabel) {
    return res.status(400).json({ error: 'Enter a valid amount, billing unit, and unit label for this service.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('UPDATE tariff_rates SET active = FALSE WHERE service_type = $1 AND active = TRUE', [serviceType]);
    const result = await client.query(
      `INSERT INTO tariff_rates (service_type, amount_tzs, billing_unit, unit_label, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING service_type, amount_tzs, billing_unit, unit_label, effective_from`,
      [serviceType, amountTzs, billingUnit, unitLabel, req.staff.id],
    );
    await client.query('COMMIT');
    await writeAudit(req.staff.id, 'tariff.updated', 'tariff', serviceType, { amountTzs, billingUnit, unitLabel });
    res.json({ tariff: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

app.get('/api/staff/summary', requireDatabase, requireStaff, requireAdmin, asyncRoute(async (_req, res) => {
  const result = await pool.query(`
    SELECT
      (SELECT COUNT(*)::int FROM stations) AS total_stations,
      (SELECT COUNT(*)::int FROM stations WHERE status = 'operational') AS operational_stations,
      (SELECT COUNT(*)::int FROM driver_requests WHERE status = 'submitted') AS submitted_requests,
      (SELECT COUNT(*)::int FROM inquiries WHERE status = 'open') AS open_inquiries,
      (SELECT COUNT(*)::int FROM tariff_rates WHERE active = TRUE) AS active_tariffs
  `);
  res.json({ summary: result.rows[0] });
}));

app.get('/api/staff/inquiries', requireDatabase, requireStaff, requireAdmin, asyncRoute(async (_req, res) => {
  const result = await pool.query(
    `SELECT id, reference_code, name, email, phone, topic, message, status, created_at
       FROM inquiries ORDER BY created_at DESC LIMIT 100`,
  );
  res.json({ inquiries: result.rows });
}));

app.patch('/api/staff/inquiries/:inquiryId/status', requireDatabase, requireSameOrigin, requireStaff, requireAdmin, asyncRoute(async (req, res) => {
  const inquiryId = req.params.inquiryId;
  const status = cleanText(req.body.status, 24);
  if (!uuidPattern.test(inquiryId) || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
    return res.status(400).json({ error: 'Choose a valid inquiry and status.' });
  }

  const result = await pool.query(
    `UPDATE inquiries SET status = $1 WHERE id = $2 RETURNING id, reference_code, status`,
    [status, inquiryId],
  );
  if (!result.rowCount) {
    return res.status(404).json({ error: 'Inquiry not found.' });
  }

  await writeAudit(req.staff.id, 'inquiry.status_changed', 'inquiry', inquiryId, { status });
  res.json({ inquiry: result.rows[0] });
}));

app.post('/api/payments', requireSameOrigin, (_req, res) => {
  res.status(503).json({
    code: 'PAYMENT_PROVIDER_NOT_CONFIGURED',
    error: 'Mobile-money payments are unavailable until a merchant provider is configured.',
  });
});

app.get('/api/device-integrations/status', (_req, res) => {
  res.json({ status: 'not_configured', message: 'No charger telemetry or control gateway is connected.' });
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found.' }));

app.use(express.static(distPath, { index: false, maxAge: isProduction ? '1h' : 0 }));
app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));

app.use((error, _req, res, _next) => {
  if (error.code === '23505') {
    return res.status(409).json({ error: 'That value is already in use.' });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Request body must contain valid JSON.' });
  }

  console.error('Request failed:', error.message);
  res.status(500).json({ error: 'The request could not be completed.' });
});

export default app;