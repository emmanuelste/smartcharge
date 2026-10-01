(() => {
  const navigation = [
    { href: '/portal/client-driver-charging-pwa-experience', label: 'Driver journey' },
    { href: '/portal/smartcharge-tanzania-public-portal-zero-login-history-tracker-1', label: 'History & receipts' },
    { href: '/portal/station-agent-box-operations-attendant-portal', label: 'Station console' },
    { href: '/portal/smartcharge-tanzania-interactive-live-portal-connected-ecosystem', label: 'Network map' },
    { href: '/portal/reliance-solutions-hq-admin-ewura-compliance-portal', label: 'Network & compliance' },
  ];

  function mountPortalShell() {
    if (!document.body || document.querySelector('[data-smartcharge-shell]')) {
      return;
    }

    document.querySelectorAll('img[src*="lh3.googleusercontent.com/aida/"], img[src="/reliance-logo.png"]').forEach((logo) => {
      logo.src = '/reliance-logo.png';
      logo.alt = 'Reliance Solutions and Technology';
      logo.style.maxWidth = '180px';
      logo.style.objectFit = 'contain';
    });

    document.body.classList.add('smartcharge-portal-shell');

    if (document.querySelector('body > aside.fixed.left-0')) {
      document.body.classList.add('smartcharge-has-sidebar');
    }

    const shell = document.createElement('nav');
    shell.className = 'smartcharge-shell';
    shell.dataset.smartchargeShell = 'true';
    shell.setAttribute('aria-label', 'SmartCharge workspace navigation');

    const inner = document.createElement('div');
    inner.className = 'smartcharge-shell__inner';

    const home = document.createElement('a');
    home.className = 'smartcharge-shell__home';
    home.href = '/';
    home.innerHTML = '<span class="smartcharge-shell__mark" aria-hidden="true">SC</span><span>Overview</span>';
    inner.append(home);

    const links = document.createElement('div');
    links.className = 'smartcharge-shell__links';

    navigation.forEach(({ href, label }) => {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = label;

      if (location.pathname === href) {
        link.setAttribute('aria-current', 'page');
      }

      links.append(link);
    });

    const demo = document.createElement('span');
    demo.className = 'smartcharge-shell__demo';
    demo.textContent = 'DEMO DATA';
    inner.append(links, demo);
    shell.append(inner);
    document.body.insertBefore(shell, document.body.firstChild);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountPortalShell, { once: true });
  } else {
    mountPortalShell();
  }
})();