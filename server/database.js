import pg from 'pg';

const { Pool } = pg;

export const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    })
  : null;

pool?.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

export async function initializeDatabase() {
  if (!pool) {
    throw new Error('DATABASE_URL is not configured');
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS staff_users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('operator', 'admin')),
      active BOOLEAN NOT NULL DEFAULT TRUE,
      must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS stations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      station_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      region TEXT NOT NULL DEFAULT 'Dar es Salaam',
      status TEXT NOT NULL DEFAULT 'setup' CHECK (status IN ('setup', 'operational', 'maintenance', 'offline')),
      status_source TEXT NOT NULL DEFAULT 'manual',
      connector_count INTEGER NOT NULL DEFAULT 0 CHECK (connector_count >= 0),
      battery_swap_count INTEGER NOT NULL DEFAULT 0 CHECK (battery_swap_count >= 0),
      latitude NUMERIC(9, 6),
      longitude NUMERIC(9, 6),
      notes TEXT NOT NULL DEFAULT '',
      created_by UUID REFERENCES staff_users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS tariff_rates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      service_type TEXT NOT NULL CHECK (service_type IN ('direct_charge', 'flat_charge', 'battery_swap')),
      amount_tzs INTEGER NOT NULL CHECK (amount_tzs >= 0),
      billing_unit TEXT NOT NULL CHECK (billing_unit IN ('per_10_percent', 'per_request')),
      unit_label TEXT NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
      created_by UUID REFERENCES staff_users(id),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (
        (service_type = 'direct_charge' AND billing_unit = 'per_10_percent') OR
        (service_type <> 'direct_charge' AND billing_unit = 'per_request')
      )
    );

    CREATE TABLE IF NOT EXISTS driver_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tracking_code_hash CHAR(64) NOT NULL UNIQUE,
      station_id UUID NOT NULL REFERENCES stations(id),
      service_type TEXT NOT NULL CHECK (service_type IN ('direct_charge', 'flat_charge', 'battery_swap')),
      vehicle_registration TEXT NOT NULL DEFAULT '',
      starting_soc SMALLINT,
      target_soc SMALLINT,
      quoted_amount_tzs INTEGER,
      status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'declined', 'in_progress', 'completed', 'cancelled')),
      payment_status TEXT NOT NULL DEFAULT 'not_configured' CHECK (payment_status IN ('not_configured', 'pending', 'paid', 'failed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS driver_requests_station_created_idx ON driver_requests (station_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS driver_requests_status_idx ON driver_requests (status, created_at DESC);

    CREATE TABLE IF NOT EXISTS inquiries (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      reference_code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '',
      topic TEXT NOT NULL CHECK (topic IN ('station_setup', 'support', 'compliance')),
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS audit_events (
      id BIGSERIAL PRIMARY KEY,
      actor_id UUID REFERENCES staff_users(id),
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT NOT NULL DEFAULT '',
      details JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS audit_events_created_idx ON audit_events (created_at DESC);
  `);
}