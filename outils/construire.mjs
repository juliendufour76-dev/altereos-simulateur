/**
 * Assemble le plugin WordPress : copie les assets de référence dans le dossier
 * du plugin, pour qu'il n'existe qu'une seule source de vérité.
 *
 * Usage : node outils/construire.mjs
 */
import { cp, mkdir, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const racine = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(racine, 'assets');
const cible = join(racine, 'wordpress', 'altereos-simulateur-doeth', 'assets');

const fichiers = ['doeth-core.js', 'doeth-simulateur.js', 'doeth-simulateur.css'];

await mkdir(cible, { recursive: true });

for (const fichier of fichiers) {
  await cp(join(source, fichier), join(cible, fichier));
  console.log('copié  ' + fichier);
}

const restants = (await readdir(source)).filter((f) => !fichiers.includes(f));
if (restants.length) {
  console.log('\nIgnorés (non déclarés dans construire.mjs) : ' + restants.join(', '));
}

console.log('\nPlugin prêt dans wordpress/altereos-simulateur-doeth/');
console.log('Archive : Compress-Archive -Path wordpress/altereos-simulateur-doeth -DestinationPath altereos-simulateur-doeth.zip');
