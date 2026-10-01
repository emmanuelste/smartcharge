import { useEffect, useState } from 'react';
import { CheckCircle2, ShieldCheck, Store, Zap } from 'lucide-react';

const services = [
  {
    id: 'driver',
    tone: 'primary',
    Icon: Zap,
    eyebrow: 'For drivers · start here',
    title: 'Charge or swap your vehicle',
    description:
      'Choose a direct percentage top-up, flat-rate charge, or battery swap. The next step shows hub options and an estimated amount before continuing.',
    highlightLabel: 'Example direct charge',
    highlightValue: '2,268 TZS',
    note: 'Example only · choose a session type to see its estimate.',
    btnLabel: 'Start a driver journey',
    route: '/portal/client-driver-charging-pwa-experience',
    secondaryLabel: 'Track a previous session',
    secondaryRoute: '/portal/smartcharge-tanzania-public-portal-zero-login-history-tracker-1',
    features: [
      'Select direct charge, full charge, or swap',
      'Browse hubs and request a bay hold',
      'Review sample payment and session steps',
    ],
  },
  {
    id: 'station',
    tone: 'secondary',
    Icon: Store,
    eyebrow: 'For station teams',
    title: 'Operate or set up a station',
    description:
      'Open the attendant console for bay allocation, driver hand-off, and receipt previews. Prospective partners can start a station setup inquiry.',
    highlightLabel: 'Operator workspace',
    highlightValue: 'Attendant console',
    note: 'Controls and telemetry are demonstration data.',
    btnLabel: 'Open station console',
    route: '/portal/station-agent-box-operations-attendant-portal',
    secondaryLabel: 'Request station setup',
    secondaryRoute: '/portal/smartcharge-tanzania-interactive-live-portal-connected-ecosystem#public-inquiry-form',
    features: [
      'Review the keypad and bay-control walkthrough',
      'Preview driver authentication and receipts',
      'Find the station partnership inquiry',
    ],
  },
  {
    id: 'network',
    tone: 'tertiary',
    Icon: ShieldCheck,
    eyebrow: 'For network & compliance teams',
    title: 'Review network and compliance views',
    description:
      'Explore the EWURA compliance dashboard or the public infrastructure map. Operational figures and controls are illustrative, not connected to live stations.',
    highlightLabel: 'Available views',
    highlightValue: 'EWURA · Network',
    note: 'Illustrative dashboards; no live control actions.',
    btnLabel: 'Open compliance dashboard',
    route: '/portal/reliance-solutions-hq-admin-ewura-compliance-portal',
    secondaryLabel: 'Explore public network',
    secondaryRoute: '/portal/smartcharge-tanzania-interactive-live-portal-connected-ecosystem',
    features: [
      'Review sample network and compliance summaries',
      'Explore the infrastructure overview',
      'Return here to switch to a driver or operator task',
    ],
  },
];

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);
  const [gatewayStatus, setGatewayStatus] = useState('checking');

  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetch('/api/health')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Gateway health check failed');
        }

        return response.json();
      })
      .then(({ ok }) => {
        if (isMounted) {
          setGatewayStatus(ok ? 'online' : 'offline');
        }
      })
      .catch(() => {
        if (isMounted) {
          setGatewayStatus('offline');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const currentService = services.find((service) => service.route === currentRoute);

  if (currentService) {
    return (
      <div className="portal-view-shell">
        <header className="portal-view-header">
          <button
            type="button"
            className="back-button"
            onClick={() => {
              window.history.pushState({}, '', '/');
              setCurrentRoute('/');
            }}
          >
            ← Overview
          </button>
          <div className="portal-view-title-wrap">
            <div className="portal-view-kicker">SmartCharge Tanzania</div>
            <h1>{currentService.title}</h1>
          </div>
        </header>

        <div className="portal-view-frame-wrap">
          <iframe title={currentService.title} src={currentService.route} className="portal-view-frame" />
        </div>
      </div>
    );
  }

  return (
    <div className="smartcharge-page">
      <section className="secondary-bar">
        <div className="secondary-bar__inner">
          <div className="label-pill">
            <span className="dot" />
            <span>SmartCharge service ecosystem</span>
          </div>
          <nav className="top-links" aria-label="Service navigation">
            <a href="/portal/client-driver-charging-pwa-experience">Charge or swap</a>
            <a href="/portal/smartcharge-tanzania-public-portal-zero-login-history-tracker-1">History &amp; receipts</a>
            <a href="/portal/station-agent-box-operations-attendant-portal">Station console</a>
          </nav>
        </div>
      </section>

      <header className="smartcharge-header">
        <div className="header-left">
          <img
            src="/reliance-logo.png"
            alt="Reliance Solutions and Technology (T) Limited"
            className="brand-mark"
          />
        </div>
        <div className="header-right">
          <div className="brand-text">
            <span className="brand-name">SmartCharge</span>
            <span className="brand-subtitle">RELIANCE SOLUTIONS &amp; TECH (T)</span>
          </div>
          <a href="/portal/client-driver-charging-pwa-experience" className="track-button">
            <Zap aria-hidden="true" />
            <span>Start a journey</span>
          </a>
        </div>
      </header>

      <section className="overview-intro" aria-labelledby="overview-heading">
        <div className="overview-copy">
          <div className="overview-kicker">Energy access, connected</div>
          <h1 id="overview-heading">Charge, swap, and power forward.</h1>
          <p>Choose the service pathway that fits your journey.</p>
        </div>
        <div className={`system-status ${gatewayStatus}`} role="status" aria-live="polite">
          <span className="system-status__dot" />
          <span className="system-status__copy">
            <span>Platform health</span>
            <strong>
              {gatewayStatus === 'checking'
                ? 'Checking API'
                : gatewayStatus === 'online'
                  ? 'Application API available'
                  : 'Application API unavailable'}
            </strong>
          </span>
        </div>
      </section>

      <p className="prototype-note" role="note">
        Demonstration experience: transactions, payments, telemetry, and device controls are simulated.
      </p>

      <main className="service-grid">
        {services.map((service) => (
          <article key={service.id} className={`service-card ${service.tone}`}>
            {service.badge ? <div className="floating-badge">{service.badge}</div> : null}

            <div className="card-icon-box">
              <service.Icon aria-hidden="true" />
            </div>

            <div className="card-eyebrow">{service.eyebrow}</div>
            <h3>{service.title}</h3>
            <p>{service.description}</p>

            <div className="price-box">
              <div className="price-row">
                <span>{service.highlightLabel}</span>
                <strong>{service.highlightValue}</strong>
              </div>
              <div className="price-note">{service.note}</div>
            </div>

            <ul className="feature-list">
              {service.features.map((feature) => (
                <li key={feature}>
                  <CheckCircle2 className="check-icon" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="card-actions">
              <a href={service.route} className="primary-link">{service.btnLabel}</a>
              <a href={service.secondaryRoute} className="secondary-link">{service.secondaryLabel}</a>
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}

export default App;
