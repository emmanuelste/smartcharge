import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const DEFAULT_PORT = Number(process.env.PORT || 3001);

function getAvailablePort(startingPort) {
  return new Promise((resolve, reject) => {
    const server = app.listen(startingPort);

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        resolve(getAvailablePort(startingPort + 1));
        server.close();
      } else {
        reject(error);
      }
    });

    server.on('listening', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

const workspaceRoot = __dirname;
const projectRoot = path.join(workspaceRoot, 'stitch_smartcharge_tanzania_e_mobility_ecosystem');
const toolkitRoot = fs.existsSync(projectRoot) ? projectRoot : workspaceRoot;

function getPortalDirectories() {
  return fs
    .readdirSync(toolkitRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const dirPath = path.join(toolkitRoot, entry.name);
      const htmlPath = path.join(dirPath, 'code.html');
      const hasCodeHtml = fs.existsSync(htmlPath);
      const slug = entry.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      return {
        name: entry.name,
        slug,
        route: `/portal/${slug}`,
        path: dirPath,
        hasCodeHtml,
      };
    })
    .filter((portal) => portal.hasCodeHtml);
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'smartcharge-ecosystem', timestamp: new Date().toISOString() });
});

app.get('/api/portals', (req, res) => {
  const portals = getPortalDirectories().map(({ name, slug, route }) => ({
    name,
    slug,
    route,
    title: name
      .split('-')
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' '),
  }));

  res.json({ project: 'SmartCharge Tanzania e-Mobility Ecosystem', portals });
});

app.get('/portal/:slug', (req, res) => {
  const slug = req.params.slug;
  const match = getPortalDirectories().find((portal) => portal.slug === slug);

  if (!match) {
    return res.status(404).json({ error: 'Portal not found' });
  }

  const htmlPath = path.join(match.path, 'code.html');
  const html = fs
    .readFileSync(htmlPath, 'utf8')
    .replace(
      /<link\b(?=[^>]*\bhref=["']https:\/\/fonts\.googleapis\.com\/css2\?family=Material\+Symbols[^"']*["'])[^>]*>/gi,
      '',
    )
    .replace(
      /(\bsrc=["'])https:\/\/lh3\.googleusercontent\.com\/aida\/[^"']+(["'])/gi,
      '$1/reliance-logo.png$2',
    )
    .replace(/<\/head>/i, '<link rel="stylesheet" href="/portal-shell.css"></head>');
  res.type('html').send(html.replace(/<\/body>/i, '<script defer src="/portal-shell.js"></script></body>'));
});

const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/portal')) {
      return next();
    }

    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      message: 'SmartCharge ecosystem backend is running. Start the Vite frontend with npm run dev.',
      api: '/api/portals',
      portals: getPortalDirectories().map((portal) => portal.route),
    });
  });
}

async function startServer() {
  const PORT = await getAvailablePort(DEFAULT_PORT);

  app.listen(PORT, () => {
    console.log(`SmartCharge ecosystem server is running on http://localhost:${PORT}`);
    console.log(`Available portals: ${getPortalDirectories().map((portal) => portal.name).join(', ')}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
