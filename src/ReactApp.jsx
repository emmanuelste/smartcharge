import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowRight,
  BatteryCharging,
  Building2,
  Check,
  CircleAlert,
  ClipboardList,
  Gauge,
  LogIn,
  LogOut,
  MapPin,
  Plus,
  ShieldCheck,
  Store,
  WalletCards,
  Zap,
} from 'lucide-react';
import {
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { api } from './api';
import './react-app.css';

const navItems = [
  { to: '/', label: 'Overview', end: true },
  { to: '/driver', label: 'Driver' },
  { to: '/history', label: 'Request status' },
  { to: '/network', label: 'Stations' },
  { to: '/inquiries', label: 'Contact' },
];

const serviceOptions = [
  { value: 'direct_charge', label: 'Direct charge', Icon: Zap, detail: 'Choose a target battery level.' },
  { value: 'flat_charge', label: 'Full charge', Icon: BatteryCharging, detail: 'Request a charge to 100%.' },
  { value: 'battery_swap', label: 'Battery swap', Icon: ArrowDownLeft, detail: 'Request an available exchange.' },
];

const serviceLabels = {
  direct_charge: 'Direct charge',
  flat_charge: 'Full charge',
  battery_swap: 'Battery swap',
};

const stationStatuses = ['setup', 'operational', 'maintenance', 'offline'];

function useRemote(path) {
  const [state, setState] = useState({ data: null, loading: Boolean(path), error: '' });

  useEffect(() => {
    if (!path) return undefined;

    const controller = new AbortController();
    setState({ data: null, loading: true, error: '' });
    api(path, { signal: controller.signal })
      .then((data) => setState({ data, loading: false, error: '' }))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          setState({ data: null, loading: false, error: error.message });
        }
      });

    return () => controller.abort();
  }, [path]);

  return state;
}

function formatDate(value) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function PageHeading({ eyebrow, title, description, actions }) {
  return (
    <header className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {actions ? <div className="page-heading__actions">{actions}</div> : null}
    </header>
  );
}

function InlineNotice({ children, tone = 'info' }) {
  if (!children) return null;
  const Icon = tone === 'error' ? CircleAlert : Check;
  return (
    <div className={`notice notice--${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon size={18} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function LoadState({ loading, error, empty, children }) {
  if (loading) return <div className="empty-state" role="status">Loading records…</div>;
  if (error) return <InlineNotice tone="error">{error}</InlineNotice>;
  if (empty) return <div className="empty-state">{empty}</div>;
  return children;
}

function ReactApp() {
  const [auth, setAuth] = useState({ ready: false, user: null, staffConfigured: null, error: '' });
  const [health, setHealth] = useState({ status: 'checking', database: 'checking' });
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    let active = true;
    api('/api/auth/session')
      .then((result) => {
        if (active) setAuth({ ready: true, user: result.user, staffConfigured: result.staffConfigured, error: '' });
      })
      .catch((error) => {
        if (active) setAuth({ ready: true, user: null, staffConfigured: null, error: error.message });
      });

    api('/api/health')
      .then((result) => {
        if (active) setHealth({ status: result.ok ? 'online' : 'offline', database: result.database });
      })
      .catch(() => {
        if (active) setHealth({ status: 'offline', database: 'unavailable' });
      });

    return () => { active = false; };
  }, []);

  async function signOut() {
    try {
      await api('/api/auth/logout', { method: 'POST', body: {} });
    } finally {
      setAuth((previous) => ({ ...previous, user: null }));
    }
  }

  function signedIn(user) {
    setAuth((previous) => ({ ...previous, user }));
    setAuthError('');
  }

  return (
    <div className="app-shell">
      <TopNavigation health={health} user={auth.user} onSignOut={signOut} />
      {authError ? <div className="app-error" role="alert">{authError}</div> : null}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<OverviewPage health={health} />} />
          <Route path="/driver" element={<DriverPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/network" element={<NetworkPage />} />
          <Route path="/inquiries" element={<InquiryPage />} />
          <Route path="/staff/login" element={<StaffLogin auth={auth} onSignedIn={signedIn} />} />
          <Route path="/staff/security" element={<RequireStaff auth={auth}><StaffPassword user={auth.user} onUpdated={signedIn} /></RequireStaff>} />
          <Route path="/stations" element={<RequireStaff auth={auth}><StationOperations /></RequireStaff>} />
          <Route path="/compliance" element={<RequireAdmin auth={auth}><CompliancePage /></RequireAdmin>} />
          <Route path="/portal/client-driver-charging-pwa-experience" element={<Navigate to="/driver" replace />} />
          <Route path="/portal/smartcharge-tanzania-public-portal-zero-login-history-tracker-1" element={<Navigate to="/history" replace />} />
          <Route path="/portal/smartcharge-tanzania-public-portal-zero-login-history-tracker-2" element={<Navigate to="/network" replace />} />
          <Route path="/portal/station-agent-box-operations-attendant-portal" element={<Navigate to="/stations" replace />} />
          <Route path="/portal/smartcharge-tanzania-interactive-live-portal-connected-ecosystem" element={<Navigate to="/network" replace />} />
          <Route path="/portal/reliance-solutions-hq-admin-ewura-compliance-portal" element={<Navigate to="/compliance" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <footer className="app-footer">
        <span>Reliance Solutions &amp; Technology (T) Ltd.</span>
        <span>Payments and charger telemetry require provider configuration.</span>
      </footer>
    </div>
  );
}

function TopNavigation({ health, user, onSignOut }) {
  return (
    <header className="top-navigation">
      <div className="top-navigation__inner">
        <Link className="brand-lockup" to="/" aria-label="SmartCharge overview">
          <span className="brand-mark">SC</span>
          <span className="brand-copy"><strong>SmartCharge</strong><small>RELIANCE SOLUTIONS &amp; TECH (T)</small></span>
        </Link>
        <nav className="primary-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => isActive ? 'is-active' : ''}>
              {item.label}
            </NavLink>
          ))}
          {user ? <NavLink to="/stations" className={({ isActive }) => isActive ? 'is-active' : ''}>Operations</NavLink> : null}
          {user?.role === 'admin' ? <NavLink to="/compliance" className={({ isActive }) => isActive ? 'is-active' : ''}>Compliance</NavLink> : null}
        </nav>
        <div className="top-navigation__right">
          <span className={`health-pill health-pill--${health.status}`}>
            <span className="health-dot" />
            {health.status === 'online' ? 'Database connected' : health.status === 'checking' ? 'Checking service' : 'Service unavailable'}
          </span>
          {user ? (
            <button className="quiet-button" type="button" onClick={onSignOut} aria-label="Sign out">
              <LogOut size={17} /><span>Sign out</span>
            </button>
          ) : (
            <Link className="quiet-button" to="/staff/login"><LogIn size={17} /><span>Staff</span></Link>
          )}
        </div>
      </div>
    </header>
  );
}

function OverviewPage({ health }) {
  const { data, loading, error } = useRemote('/api/public/stations');
  const count = data?.stations?.length ?? 0;
  const services = [
    { to: '/driver', label: 'Driver', title: 'Request a charge or swap', description: 'Choose an operational station and submit a request. Payment remains unavailable until a provider is connected.', Icon: Zap, action: 'Start request' },
    { to: '/network', label: 'Network', title: 'Browse registered stations', description: 'See stations entered by the operations team. No sample locations or synthetic availability.', Icon: MapPin, action: 'View stations' },
    { to: '/history', label: 'Tracking', title: 'Check a request status', description: 'Use the private tracking code issued when a real request is submitted.', Icon: ClipboardList, action: 'Check status' },
  ];

  return (
    <>
      <section className="overview-hero">
        <div className="overview-hero__copy">
          <p className="eyebrow">Tanzania · electric mobility network</p>
          <h1>Energy services grounded in real station data.</h1>
          <p>Submit a driver request, register operational sites, and manage staff access from one connected workspace.</p>
        </div>
        <div className="overview-hero__status">
          <span className={`health-dot health-dot--${health.status}`} />
          <div><span>Application database</span><strong>{health.status === 'online' ? 'Connected' : health.status === 'checking' ? 'Checking' : 'Unavailable'}</strong></div>
          <div className="hero-metric"><strong>{loading ? '—' : count}</strong><span>operational stations</span></div>
        </div>
      </section>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <section className="route-grid" aria-label="Choose a task">
        {services.map(({ to, label, title, description, Icon, action }) => (
          <article className="route-card" key={to}>
            <div className="route-card__top"><span className="route-icon"><Icon size={21} /></span><span className="route-label">{label}</span></div>
            <div><h2>{title}</h2><p>{description}</p></div>
            <Link className="primary-button" to={to}>{action}<ArrowRight size={17} /></Link>
          </article>
        ))}
      </section>
      <section className="integration-status" aria-label="Integration status">
        <div><span className="status-indicator status-indicator--off" /><span>Mobile-money provider</span><strong>Not configured</strong></div>
        <div><span className="status-indicator status-indicator--off" /><span>Charger telemetry and control</span><strong>Not configured</strong></div>
        <Link to="/staff/login">Staff setup <ArrowRight size={15} /></Link>
      </section>
    </>
  );
}

function DriverPage() {
  const stations = useRemote('/api/public/stations');
  const tariffs = useRemote('/api/public/tariffs');
  const [serviceType, setServiceType] = useState('direct_charge');
  const [stationId, setStationId] = useState('');
  const [vehicleRegistration, setVehicleRegistration] = useState('');
  const [startingSoc, setStartingSoc] = useState('');
  const [targetSoc, setTargetSoc] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);
  const navigate = useNavigate();
  const tariff = tariffs.data?.tariffs?.find((item) => item.service_type === serviceType);
  const amount = useMemo(() => {
    if (!tariff) return null;
    if (serviceType === 'direct_charge' && startingSoc !== '' && targetSoc !== '' && tariff.billing_unit === 'per_10_percent') {
      return Math.ceil((Number(targetSoc) - Number(startingSoc)) / 10) * tariff.amount_tzs;
    }
    return serviceType !== 'direct_charge' && tariff.billing_unit === 'per_request' ? tariff.amount_tzs : null;
  }, [serviceType, startingSoc, targetSoc, tariff]);

  async function submitRequest(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = await api('/api/public/driver-requests', {
        method: 'POST',
        body: {
          stationId,
          serviceType,
          vehicleRegistration,
          startingSoc: serviceType === 'direct_charge' ? startingSoc : null,
          targetSoc: serviceType === 'battery_swap' ? null : serviceType === 'flat_charge' ? 100 : targetSoc,
        },
      });
      setCreated(result);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  if (created) {
    return (
      <section className="content-column">
        <PageHeading eyebrow="Driver request" title="Request recorded" description="This request is saved. It is not a reservation or a payment." />
        <article className="data-panel success-panel">
          <Check size={22} />
          <h2>Keep your tracking code</h2>
          <code className="tracking-code">{created.trackingCode}</code>
          <p>Status: <strong>{created.request.status}</strong>. Payment: <strong>not configured</strong>.</p>
          <div className="button-row">
            <button className="secondary-button" type="button" onClick={() => navigator.clipboard?.writeText(created.trackingCode)}>Copy code</button>
            <button className="primary-button" type="button" onClick={() => navigate('/history', { state: { code: created.trackingCode } })}>Check request status<ArrowRight size={17} /></button>
            <button className="text-button" type="button" onClick={() => setCreated(null)}>New request</button>
          </div>
        </article>
      </section>
    );
  }

  return (
    <section className="content-column">
      <PageHeading eyebrow="Driver services" title="Request a charging session or swap" description="Requests are stored with a private tracking code. Submission does not reserve hardware or initiate payment." />
      <div className="form-layout">
        <form className="data-panel form-panel" onSubmit={submitRequest}>
          <InlineNotice tone="error">{error}</InlineNotice>
          <label className="field-label" htmlFor="stationId">Operational station</label>
          <LoadState loading={stations.loading} error={stations.error} empty={!stations.data?.stations?.length ? 'No operational stations are registered yet. A staff administrator must add a station and set its status to operational.' : null}>
            <select id="stationId" required value={stationId} onChange={(event) => setStationId(event.target.value)}>
              <option value="">Choose a station</option>
              {stations.data?.stations?.map((station) => <option key={station.id} value={station.id}>{station.name} · {station.address}</option>)}
            </select>
          </LoadState>

          <fieldset className="service-picker">
            <legend className="field-label">Service type</legend>
            <div className="service-picker__grid">
              {serviceOptions.map(({ value, label, detail, Icon }) => (
                <label className={`service-option ${serviceType === value ? 'is-selected' : ''}`} key={value}>
                  <input type="radio" name="serviceType" value={value} checked={serviceType === value} onChange={() => setServiceType(value)} />
                  <Icon size={19} /><strong>{label}</strong><small>{detail}</small>
                </label>
              ))}
            </div>
          </fieldset>

          {serviceType === 'direct_charge' ? (
            <div className="field-grid">
              <div><label className="field-label" htmlFor="startingSoc">Starting battery (%)</label><input id="startingSoc" type="number" min="0" max="99" required value={startingSoc} onChange={(event) => setStartingSoc(event.target.value)} /></div>
              <div><label className="field-label" htmlFor="targetSoc">Target battery (%)</label><input id="targetSoc" type="number" min={startingSoc ? Number(startingSoc) + 1 : 1} max="100" required value={targetSoc} onChange={(event) => setTargetSoc(event.target.value)} /></div>
            </div>
          ) : serviceType === 'flat_charge' ? <p className="form-note">Full charge requests target 100%. Final price is shown only when a tariff is configured.</p> : <p className="form-note">Swap availability is confirmed by station staff. No battery is held by this request.</p>}

          <div><label className="field-label" htmlFor="vehicleRegistration">Vehicle registration <span className="optional-label">Optional</span></label><input id="vehicleRegistration" maxLength="24" value={vehicleRegistration} onChange={(event) => setVehicleRegistration(event.target.value)} autoComplete="off" /></div>
          <div className="quote-panel">
            <span>Configured estimate</span>
            <strong>{amount === null ? 'Not available' : `${amount.toLocaleString()} TZS`}</strong>
            <small>{tariffs.loading ? 'Checking configured rates…' : tariff ? `Rate: ${tariff.unit_label}` : 'No approved tariff is configured for this service.'}</small>
          </div>
          <InlineNotice>Mobile-money payments are not configured. This form creates a request only.</InlineNotice>
          <button className="primary-button" type="submit" disabled={saving || stations.loading || !stationId}>{saving ? 'Saving request…' : 'Submit request'}<ArrowRight size={17} /></button>
        </form>
        <aside className="side-note">
          <h2>What happens next</h2>
          <ol><li>Choose a registered operational station.</li><li>Submit a session request.</li><li>Use the private tracking code to check staff updates.</li></ol>
          <p>No payment is collected and no live charger is controlled from this page.</p>
        </aside>
      </div>
    </section>
  );
}

function HistoryPage() {
  const location = useLocation();
  const [code, setCode] = useState(location.state?.code || '');
  const [request, setRequest] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function lookup(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setRequest(null);
    try {
      const result = await api(`/api/public/driver-requests/${encodeURIComponent(code.trim())}`);
      setRequest(result.request);
    } catch (lookupError) {
      setError(lookupError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="content-column">
      <PageHeading eyebrow="Request tracking" title="Check a request status" description="Enter the private tracking code issued when a driver request was submitted. No sample profiles are shown." />
      <form className="data-panel lookup-form" onSubmit={lookup}>
        <label className="field-label" htmlFor="trackingCode">Tracking code</label>
        <div className="lookup-row"><input id="trackingCode" autoComplete="off" required value={code} onChange={(event) => setCode(event.target.value)} /><button className="primary-button" type="submit" disabled={loading}>{loading ? 'Checking…' : 'Check status'}<ArrowRight size={17} /></button></div>
        <p className="form-note">Your tracking code is a private bearer credential. Do not share it publicly.</p>
        <InlineNotice tone="error">{error}</InlineNotice>
      </form>
      {request ? <RequestDetails request={request} /> : null}
    </section>
  );
}

function RequestDetails({ request }) {
  return (
    <article className="data-panel request-details">
      <div className="panel-heading"><div><p className="eyebrow">Request record</p><h2>{request.station_name}</h2></div><StatusTag value={request.status} /></div>
      <dl className="detail-grid">
        <div><dt>Service</dt><dd>{serviceLabels[request.service_type]}</dd></div>
        <div><dt>Payment state</dt><dd>{request.payment_status === 'not_configured' ? 'Not available' : request.payment_status}</dd></div>
        <div><dt>Station</dt><dd>{request.station_code} · {request.station_address}</dd></div>
        <div><dt>Submitted</dt><dd>{formatDate(request.created_at)}</dd></div>
        <div><dt>Estimate</dt><dd>{request.quoted_amount_tzs == null ? 'Not configured' : `${Number(request.quoted_amount_tzs).toLocaleString()} TZS`}</dd></div>
        {request.vehicle_registration ? <div><dt>Vehicle</dt><dd>{request.vehicle_registration}</dd></div> : null}
      </dl>
    </article>
  );
}

function NetworkPage() {
  const { data, loading, error } = useRemote('/api/public/stations');
  const stations = data?.stations || [];
  return (
    <section className="content-column">
      <PageHeading eyebrow="Public network" title="Registered operational stations" description="This list comes from station records maintained by staff. Availability is not connected to live charger telemetry." actions={<Link className="secondary-button" to="/inquiries">Station inquiry</Link>} />
      <LoadState loading={loading} error={error} empty={!stations.length ? 'No operational stations are registered. Check back after a station administrator adds and activates a site.' : null}>
        <div className="station-list">{stations.map((station) => <StationCard station={station} key={station.id} />)}</div>
      </LoadState>
    </section>
  );
}

function StationCard({ station }) {
  return (
    <article className="station-card">
      <span className="route-icon"><MapPin size={20} /></span>
      <div className="station-card__body"><div className="station-card__title"><h2>{station.name}</h2><StatusTag value={station.status} /></div><p>{station.station_code} · {station.region}</p><p>{station.address}</p><small>Manually reported status · {station.connector_count} connectors · {station.battery_swap_count} swap bays</small></div>
    </article>
  );
}

function StaffLogin({ auth, onSignedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (auth.user) return <Navigate to="/stations" replace />;

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = await api('/api/auth/login', { method: 'POST', body: { email, password } });
      onSignedIn(result.user);
      navigate(result.user.mustChangePassword ? '/staff/security' : location.state?.from || '/stations', { replace: true });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="narrow-page">
      <PageHeading eyebrow="Staff access" title="Sign in to operations" description="Only authorized staff can manage station records, requests, and tariffs." />
      <form className="data-panel form-panel" onSubmit={submit}>
        <InlineNotice tone="error">{error}</InlineNotice>
        <InlineNotice tone="error">{auth.error}</InlineNotice>
        <label className="field-label" htmlFor="staffEmail">Work email</label><input id="staffEmail" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
        <label className="field-label" htmlFor="staffPassword">Password</label><input id="staffPassword" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Signing in…' : 'Sign in'}<LogIn size={17} /></button>
        {auth.staffConfigured === false ? <p className="form-note">No staff accounts exist yet. An authorized operator must run <code>npm run staff:create</code> with the production database linked.</p> : null}
      </form>
    </section>
  );
}

function RequireStaff({ auth, children }) {
  const location = useLocation();
  if (!auth.ready) return <div className="empty-state">Checking staff session…</div>;
  if (!auth.user) return <Navigate to="/staff/login" state={{ from: location.pathname }} replace />;
  if (auth.user.mustChangePassword && location.pathname !== '/staff/security') return <Navigate to="/staff/security" replace />;
  return children;
}

function RequireAdmin({ auth, children }) {
  if (!auth.ready) return <div className="empty-state">Checking staff session…</div>;
  if (!auth.user) return <Navigate to="/staff/login" state={{ from: '/compliance' }} replace />;
  if (auth.user.mustChangePassword) return <Navigate to="/staff/security" replace />;
  if (auth.user.role !== 'admin') return <Navigate to="/stations" replace />;
  return children;
}

function StaffPassword({ user, onUpdated }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  async function submit(event) {
    event.preventDefault();
    if (newPassword !== confirmation) {
      setError('The new passwords do not match.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await api('/api/auth/password', { method: 'POST', body: { currentPassword, newPassword } });
      onUpdated(result.user);
      navigate(result.user.role === 'admin' ? '/compliance' : '/stations', { replace: true });
    } catch (changeError) {
      setError(changeError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="narrow-page">
      <PageHeading eyebrow="Secure staff access" title="Choose a new password" description={`The temporary password for ${user.email} must be changed before continuing.`} />
      <form className="data-panel form-panel" onSubmit={submit}>
        <InlineNotice tone="error">{error}</InlineNotice>
        <label className="field-label">Temporary password<input type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></label>
        <label className="field-label">New password<input type="password" autoComplete="new-password" minLength="12" maxLength="72" required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></label>
        <label className="field-label">Confirm new password<input type="password" autoComplete="new-password" minLength="12" maxLength="72" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
        <button className="primary-button" disabled={saving}>{saving ? 'Updating…' : 'Update password'}<ArrowRight size={17} /></button>
      </form>
    </section>
  );
}

function StationOperations() {
  const [refresh, setRefresh] = useState(0);
  const [stationError, setStationError] = useState('');
  const [requestError, setRequestError] = useState('');
  const [saving, setSaving] = useState(false);
  const stations = useRemote(`/api/staff/stations?refresh=${refresh}`);
  const requests = useRemote(`/api/staff/driver-requests?refresh=${refresh}`);
  const [form, setForm] = useState({ stationCode: '', name: '', address: '', region: '', connectorCount: 0, batterySwapCount: 0 });
  const user = useRemote('/api/auth/session').data?.user;

  async function createStation(event) {
    event.preventDefault();
    setSaving(true);
    setStationError('');
    try {
      await api('/api/staff/stations', { method: 'POST', body: form });
      setForm({ stationCode: '', name: '', address: '', region: '', connectorCount: 0, batterySwapCount: 0 });
      setRefresh((value) => value + 1);
    } catch (error) {
      setStationError(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateStation(stationId, status) {
    setStationError('');
    try {
      await api(`/api/staff/stations/${stationId}/status`, { method: 'PATCH', body: { status } });
      setRefresh((value) => value + 1);
    } catch (error) {
      setStationError(error.message);
    }
  }

  async function updateRequest(requestId, status) {
    setRequestError('');
    try {
      await api(`/api/staff/driver-requests/${requestId}/status`, { method: 'PATCH', body: { status } });
      setRefresh((value) => value + 1);
    } catch (error) {
      setRequestError(error.message);
    }
  }

  return (
    <section className="content-column">
      <PageHeading eyebrow="Station operations" title="Station records and requests" description="These records are stored in PostgreSQL. Availability is manually managed until device telemetry is integrated." />
      <InlineNotice tone="error">{stationError}</InlineNotice>
      {user?.role === 'admin' ? (
        <details className="data-panel collapsible-panel"><summary><Plus size={17} /> Register a station</summary>
          <form className="form-grid" onSubmit={createStation}>
            <label className="field-label">Station code<input required maxLength="32" value={form.stationCode} onChange={(e) => setForm({ ...form, stationCode: e.target.value.toUpperCase() })} /></label>
            <label className="field-label">Station name<input required maxLength="160" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="field-label field-span-2">Address<input required maxLength="240" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
            <label className="field-label">Region<input value={form.region} maxLength="100" onChange={(e) => setForm({ ...form, region: e.target.value })} /></label>
            <label className="field-label">Connectors<input type="number" min="0" value={form.connectorCount} onChange={(e) => setForm({ ...form, connectorCount: Number(e.target.value) })} /></label>
            <label className="field-label">Swap bays<input type="number" min="0" value={form.batterySwapCount} onChange={(e) => setForm({ ...form, batterySwapCount: Number(e.target.value) })} /></label>
            <button className="primary-button field-span-2" disabled={saving}>{saving ? 'Saving…' : 'Create station record'}<Plus size={17} /></button>
          </form>
        </details>
      ) : <div className="data-panel"><p>Station creation is restricted to administrator accounts.</p></div>}
      <section className="data-panel">
        <div className="panel-heading"><div><p className="eyebrow">Inventory</p><h2>Stations</h2></div><span className="count-badge">{stations.data?.stations?.length ?? '—'}</span></div>
        <LoadState loading={stations.loading} error={stations.error} empty={!stations.data?.stations?.length ? 'No station records have been created.' : null}>
          <div className="table-wrap"><table><thead><tr><th>Station</th><th>Location</th><th>Equipment</th><th>Reported status</th></tr></thead><tbody>{stations.data?.stations?.map((station) => <tr key={station.id}><td><strong>{station.name}</strong><small>{station.station_code}</small></td><td>{station.address}<small>{station.region}</small></td><td>{station.connector_count} connectors · {station.battery_swap_count} swap bays</td><td><select aria-label={`Status for ${station.name}`} value={station.status} onChange={(event) => updateStation(station.id, event.target.value)}>{stationStatuses.map((status) => <option key={status} value={status}>{status}</option>)}</select><small>Manual</small></td></tr>)}</tbody></table></div>
        </LoadState>
      </section>
      <section className="data-panel">
        <div className="panel-heading"><div><p className="eyebrow">Driver workflow</p><h2>Session requests</h2></div></div>
        <InlineNotice tone="error">{requestError}</InlineNotice>
        <LoadState loading={requests.loading} error={requests.error} empty={!requests.data?.requests?.length ? 'No driver requests have been submitted.' : null}>
          <div className="table-wrap"><table><thead><tr><th>Submitted</th><th>Station</th><th>Request</th><th>Tariff</th><th>Status</th><th>Update</th></tr></thead><tbody>{requests.data?.requests?.map((request) => <tr key={request.id}><td>{formatDate(request.created_at)}</td><td>{request.station_code}<small>{request.station_name}</small></td><td>{serviceLabels[request.service_type]}<small>{request.vehicle_registration || 'Vehicle not provided'}</small></td><td>{request.quoted_amount_tzs == null ? 'Not configured' : `${Number(request.quoted_amount_tzs).toLocaleString()} TZS`}<small>Payment unavailable</small></td><td><StatusTag value={request.status} /></td><td><select aria-label={`Update ${request.id}`} value={request.status} onChange={(event) => updateRequest(request.id, event.target.value)}><option value={request.status}>{request.status}</option>{['accepted', 'declined', 'in_progress', 'completed', 'cancelled'].filter((status) => status !== request.status).map((status) => <option key={status}>{status}</option>)}</select></td></tr>)}</tbody></table></div>
        </LoadState>
      </section>
    </section>
  );
}

function CompliancePage() {
  const [refresh, setRefresh] = useState(0);
  const summary = useRemote(`/api/staff/summary?refresh=${refresh}`);
  const tariffs = useRemote(`/api/staff/tariffs?refresh=${refresh}`);
  const inquiries = useRemote(`/api/staff/inquiries?refresh=${refresh}`);
  const [staffError, setStaffError] = useState('');
  const [staffMessage, setStaffMessage] = useState('');
  const [staffSaving, setStaffSaving] = useState(false);
  const [tariffError, setTariffError] = useState('');
  const [inquiryError, setInquiryError] = useState('');

  async function createStaff(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStaffError('');
    setStaffMessage('');
    setStaffSaving(true);
    try {
      const result = await api('/api/staff/users', {
        method: 'POST',
        body: { email: data.get('email'), role: data.get('role'), temporaryPassword: data.get('temporaryPassword') },
      });
      setStaffMessage(`${result.user.email} created as ${result.user.role}. They must change the temporary password on first sign-in.`);
      form.reset();
    } catch (error) {
      setStaffError(error.message);
    } finally {
      setStaffSaving(false);
    }
  }

  async function saveTariff(event, serviceType) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setTariffError('');
    try {
      await api(`/api/staff/tariffs/${serviceType}`, {
        method: 'PUT',
        body: { amountTzs: Number(data.get('amountTzs')), billingUnit: serviceType === 'direct_charge' ? 'per_10_percent' : 'per_request', unitLabel: data.get('unitLabel') },
      });
      setRefresh((value) => value + 1);
    } catch (error) {
      setTariffError(error.message);
    }
  }

  async function updateInquiry(id, status) {
    setInquiryError('');
    try {
      await api(`/api/staff/inquiries/${id}/status`, { method: 'PATCH', body: { status } });
      setRefresh((value) => value + 1);
    } catch (error) {
      setInquiryError(error.message);
    }
  }

  const rateOptions = [
    { type: 'direct_charge', title: 'Direct charge', unit: 'per_10_percent', placeholder: 'TZS per 10% battery increase' },
    { type: 'flat_charge', title: 'Full charge', unit: 'per_request', placeholder: 'TZS per request' },
    { type: 'battery_swap', title: 'Battery swap', unit: 'per_request', placeholder: 'TZS per swap request' },
  ];

  return (
    <section className="content-column">
      <PageHeading eyebrow="Compliance and configuration" title="Operational records" description="Values below come from the database. No external EWURA, TRA, payment, or charger system is connected." />
      <LoadState loading={summary.loading} error={summary.error}>
        <div className="metric-grid">{[
          ['Total stations', summary.data?.summary?.total_stations],
          ['Operational stations', summary.data?.summary?.operational_stations],
          ['Submitted requests', summary.data?.summary?.submitted_requests],
          ['Open inquiries', summary.data?.summary?.open_inquiries],
        ].map(([label, value]) => <article className="metric-card" key={label}><span>{label}</span><strong>{value ?? 0}</strong></article>)}</div>
      </LoadState>
      <section className="data-panel">
        <div className="panel-heading"><div><p className="eyebrow">Access control</p><h2>Create a staff account</h2></div></div>
        <p className="form-note">A temporary password is stored only as a hash. Share it through a secure channel; the staff member must change it after signing in.</p>
        <InlineNotice tone="error">{staffError}</InlineNotice>
        <InlineNotice tone="success">{staffMessage}</InlineNotice>
        <form className="form-grid" onSubmit={createStaff}>
          <label className="field-label">Work email<input name="email" type="email" required maxLength="254" autoComplete="off" /></label>
          <label className="field-label">Role<select name="role" required><option value="operator">Station operator</option><option value="admin">Administrator</option></select></label>
          <label className="field-label field-span-2">Temporary password<input name="temporaryPassword" type="password" required minLength="12" maxLength="72" autoComplete="new-password" /></label>
          <button className="primary-button field-span-2" type="submit" disabled={staffSaving}>{staffSaving ? 'Creating account…' : 'Create staff account'}<Plus size={17} /></button>
        </form>
      </section>
      <section className="data-panel">
        <div className="panel-heading"><div><p className="eyebrow">Pricing</p><h2>Approved tariff configuration</h2></div></div>
        <p className="form-note">Only enter tariffs approved for your operating area. No default rates are inserted.</p>
        <InlineNotice tone="error">{tariffError}</InlineNotice>
        <LoadState loading={tariffs.loading} error={tariffs.error} empty={!tariffs.data?.tariffs?.length ? 'No active tariffs are configured.' : null}>
          <div className="tariff-list">{tariffs.data?.tariffs?.map((tariff) => <div className="tariff-row" key={tariff.service_type}><span>{serviceLabels[tariff.service_type]}</span><strong>{Number(tariff.amount_tzs).toLocaleString()} TZS</strong><small>{tariff.unit_label}</small></div>)}</div>
        </LoadState>
        <div className="tariff-editor">{rateOptions.map((option) => <form className="tariff-form" key={option.type} onSubmit={(event) => saveTariff(event, option.type)}><h3>{option.title}</h3><label className="field-label">Amount (TZS)<input name="amountTzs" type="number" min="0" required /></label><label className="field-label">Unit label<input name="unitLabel" placeholder={option.placeholder} required maxLength="48" /></label><button className="secondary-button" type="submit">Save rate</button></form>)}</div>
      </section>
      <section className="data-panel">
        <div className="panel-heading"><div><p className="eyebrow">Public requests</p><h2>Station inquiries</h2></div></div>
        <InlineNotice tone="error">{inquiryError}</InlineNotice>
        <LoadState loading={inquiries.loading} error={inquiries.error} empty={!inquiries.data?.inquiries?.length ? 'No inquiries have been received.' : null}>
          <div className="inquiry-list">{inquiries.data?.inquiries?.map((item) => <article className="inquiry-row" key={item.id}><div><strong>{item.name}</strong><small>{item.reference_code} · {item.topic} · {formatDate(item.created_at)}</small><p>{item.message}</p><a href={`mailto:${item.email}`}>{item.email}</a></div><select aria-label={`Update inquiry ${item.reference_code}`} value={item.status} onChange={(event) => updateInquiry(item.id, event.target.value)}>{['open', 'in_progress', 'resolved', 'closed'].map((status) => <option key={status}>{status}</option>)}</select></article>)}</div>
        </LoadState>
      </section>
    </section>
  );
}

function InquiryPage() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  async function submit(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setSaving(true);
    setError('');
    try {
      const result = await api('/api/public/inquiries', { method: 'POST', body: Object.fromEntries(data.entries()) });
      setCreated(result.inquiry);
      event.currentTarget.reset();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="narrow-page">
      <PageHeading eyebrow="Contact operations" title="Submit an inquiry" description="Your message is stored for staff review and receives a reference code." />
      {created ? <div className="data-panel success-panel"><Check size={21} /><div><h2>Inquiry recorded</h2><p>Reference: <strong>{created.reference_code}</strong> · status: {created.status}</p></div></div> : null}
      <form className="data-panel form-panel" onSubmit={submit}>
        <InlineNotice tone="error">{error}</InlineNotice>
        <label className="field-label">Name<input name="name" required maxLength="120" autoComplete="name" /></label>
        <label className="field-label">Email<input name="email" type="email" required maxLength="254" autoComplete="email" /></label>
        <label className="field-label">Phone <span className="optional-label">Optional</span><input name="phone" maxLength="32" autoComplete="tel" /></label>
        <label className="field-label">Topic<select name="topic" required><option value="station_setup">Station setup</option><option value="support">Service support</option><option value="compliance">Compliance inquiry</option></select></label>
        <label className="field-label">Message<textarea name="message" rows="5" required minLength="10" maxLength="2000" /></label>
        <button className="primary-button" type="submit" disabled={saving}>{saving ? 'Sending…' : 'Send inquiry'}<ArrowRight size={17} /></button>
      </form>
    </section>
  );
}

function StatusTag({ value }) {
  return <span className={`status-tag status-tag--${String(value).replaceAll('_', '-')}`}>{String(value).replaceAll('_', ' ')}</span>;
}

function NotFoundPage() {
  return <section className="narrow-page"><PageHeading eyebrow="Not found" title="This page is unavailable" description="The address may have changed." /><Link className="primary-button" to="/">Return to overview<ArrowRight size={17} /></Link></section>;
}

export default ReactApp;