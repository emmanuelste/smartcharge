const services = [
  {
    id: 'billing',
    tone: 'primary',
    icon: 'speed',
    eyebrow: 'Predictable Billing',
    title: 'Standard Direct AC Charging',
    description:
      'Pay-As-You-Go battery percentage top-ups (40% to 100%). Clear, predictable percentage rates eliminate complex kWh math for drivers at the roadside.',
    highlightLabel: 'Direct AC Tariff Cap',
    highlightValue: '378 TZS per 10% SoC',
    note: 'Regulated under EWURA 2026 Schedule B',
    btnLabel: 'Open charging portal',
    route: '/portal/smartcharge-tanzania-public-portal-zero-login-history-tracker-1',
    features: [
      'Universal Type 2 & GB/T standard guns',
      'Automated session cutoff to preserve cell lifespan',
      'Instant SMS confirmation with TRA digital stamp',
    ],
  },
  {
    id: 'swap',
    tone: 'secondary',
    icon: 'swap_calls',
    eyebrow: 'Instant Energy Restored',
    title: 'Instant Battery Swapping (2-Min Turnaround)',
    description:
      'Hand over your depleted battery and drive away with a 100% calibrated battery in under 120 seconds. Built specifically for high-tempo commercial Boda Boda riders.',
    highlightLabel: 'Standard Swap Fee',
    highlightValue: '5,140 TZS / Pack',
    note: 'Includes telemetry battery health diagnostics',
    badge: 'High Fleet Velocity',
    btnLabel: 'Open swap experience',
    route: '/portal/smartcharge-tanzania-public-portal-zero-login-history-tracker-2',
    features: [
      'NFC tap verification or USSD push authorization',
      'Cell thermal shielding for tropical ambient heat',
      'Escrow pack tracking to prevent battery fraud',
    ],
  },
  {
    id: 'franchise',
    tone: 'tertiary',
    icon: 'storefront',
    eyebrow: 'Commercial Franchise',
    title: 'Micro-Franchise Agent Boxes',
    description:
      'Turn your retail shop, petrol station, or kiosk into an authorized revenue-generating SmartCharge station with our 90/10 automated revenue split model.',
    highlightLabel: 'Agent Revenue Payout',
    highlightValue: 'Daily automated M-Pesa',
    note: 'Complete turnkey hardware installation',
    btnLabel: 'Open franchise flow',
    route: '/portal/station-agent-box-operations-attendant-portal',
    features: [
      'Compact, lockable 4-bay or 8-bay smart enclosures',
      'Pre-certified EWURA commercial power approval',
      '24/7 remote monitoring and maintenance support',
    ],
  },
];

function App() {
  const [currentRoute, setCurrentRoute] = useState(window.location.pathname);

  useEffect(() => {
    const handleRouteChange = () => {
      setCurrentRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  const currentService = services.find((service) => service.route === currentRoute);

  if (currentService) {
    return (
      <div className="portal-view-shell">
        <header className="portal-view-header">
          <button type="button" className="back-button" onClick={() => {
            window.history.pushState({}, '', '/');
            setCurrentRoute('/');
          }}>
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
          <a href="/portal/smartcharge-tanzania-public-portal-zero-login-history-tracker-1" className="track-button">
            <span className="material-symbols-outlined">bolt</span>
            <span>Track Charging &amp; Swaps</span>
          </a>
        </div>
      </header>

      <section className="secondary-bar">
        <div className="secondary-bar__inner">
          <div className="label-pill">
            <span className="dot" />
            <span>SmartCharge service ecosystem</span>
          </div>
          <nav className="top-links" aria-label="Service navigation">
            <a href="/portal/smartcharge-tanzania-public-portal-zero-login-history-tracker-1">Driver Portal</a>
            <a href="/portal/smartcharge-tanzania-public-portal-zero-login-history-tracker-2">Swap &amp; History</a>
            <a href="/portal/station-agent-box-operations-attendant-portal">Agent Console</a>
          </nav>
        </div>
      </section>

      <main className="service-grid">
        {services.map((service) => (
          <article key={service.id} className={`service-card ${service.tone}`}>
            {service.badge ? <div className="floating-badge">{service.badge}</div> : null}

            <div className="card-icon-box">
              <span className="material-symbols-outlined">{service.icon}</span>
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
                  <span className="material-symbols-outlined check-icon">check_circle</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <div className="card-actions">
              <a href={service.route} className="primary-link">{service.btnLabel}</a>
              <a href="/" className="secondary-link">Overview</a>
            </div>
          </article>
        ))}
      </main>
    </div>
  );
}

export default App;
