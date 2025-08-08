import fs from 'node:fs';
import path from 'node:path';

function readJson(filePath: string): Record<string, unknown> {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as Record<string, unknown>;
}

function writeJson(filePath: string, data: Record<string, unknown>): void {
  const sortedEntries = Object.entries(data)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const sortedObj = Object.fromEntries(sortedEntries);
  fs.writeFileSync(filePath, JSON.stringify(sortedObj, null, 2) + '\n', 'utf-8');
}

function ensureStringValues(obj: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') out[k] = v;
    else if (v == null) out[k] = '';
    else out[k] = String(v);
  }
  return out;
}

const enPath = path.join(process.cwd(), 'locales', 'en', 'translation.json');
const faPath = path.join(process.cwd(), 'locales', 'fa', 'translation.json');

const enRaw = readJson(enPath);
const faRaw = readJson(faPath);

const en = ensureStringValues(enRaw);
const fa = ensureStringValues(faRaw);

// Build fa aligned to en: drop extras, add missing as empty strings
const alignedFa: Record<string, string> = {};
for (const key of Object.keys(en)) {
  alignedFa[key] = Object.prototype.hasOwnProperty.call(fa, key) ? fa[key] : '';
}

writeJson(enPath, en);
writeJson(faPath, alignedFa);

// eslint-disable-next-line no-console
console.log(`Aligned i18n: en=${Object.keys(en).length} keys, fa=${Object.keys(alignedFa).length} keys`);



