/**
 * Serveur statique de développement, sans dépendance.
 * Usage : node outils/serveur.mjs [port]
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.argv[2]) || 4173;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8'
};

createServer(async (req, res) => {
  const chemin = decodeURIComponent(req.url.split('?')[0]);
  const relatif = normalize(chemin === '/' ? '/index.html' : chemin).replace(/^([/\\])+/, '');
  const fichier = join(racine, relatif);

  if (!fichier.startsWith(racine)) {
    res.writeHead(403).end('Interdit');
    return;
  }

  try {
    const contenu = await readFile(fichier);
    res.writeHead(200, {
      'Content-Type': types[extname(fichier)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(contenu);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Introuvable');
  }
}).listen(port, () => {
  console.log('Simulateur servi sur http://localhost:' + port);
});
