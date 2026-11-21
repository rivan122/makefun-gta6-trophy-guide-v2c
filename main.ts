// Leonida Platinum Log — hand-in program for gta6-trophy-guide-01.
//
// What lives in this repo is a static, offline web app: everything the
// reader needs sits under app/ (one page, one stylesheet, one script and
// the trophy data as JSON). There is no build step and the app asks the
// network for nothing beyond its own files.
//
// This program's only job is delivery. It mirrors app/ and screenshots/
// into the output directory and then asks the vendored make.fun library
// to summarise that delivery as dossier.json, which is what the scorer
// reads. vendor/makefun-frontend.ts is the kit's own file and is left
// exactly as shipped, because the scorer expects the dossier bytes its
// own library produces.
//
// Local run, standing in for the grader's /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the deliverables. app/ is copied wholesale; screenshots/ is
// created even if the folder were missing, then filled when present.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
const shotsSource = join(repoRoot, 'screenshots');
if (existsSync(shotsSource)) {
  cpSync(shotsSource, join(outputDir, 'screenshots'), { recursive: true });
}

// Caps taken from the competition gate: the text budget shapes the
// dossier itself, while the screenshot and app limits make this program
// refuse a delivery the scorer would refuse anyway (at most four
// screenshots of at most 256 KiB each; at most 993 app entries and
// 48 MiB of app files).
const gateCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};
const dossierText = buildDossier(outputDir, gateCaps);
writeFileSync(join(outputDir, 'dossier.json'), dossierText);
