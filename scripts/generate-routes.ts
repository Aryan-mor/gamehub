import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(__dirname, '..');
const ACTIONS_DIR = path.join(ROOT, 'src', 'actions');
const OUT_FILE = path.join(ROOT, 'src', 'modules', 'core', 'routes.generated.ts');

function toRoute(filePath: string): string | null {
  // Expect filePath like: src/actions/games/poker/start/index.ts
  const rel = path.relative(path.join(ROOT, 'src', 'actions'), filePath);
  if (!rel || rel.startsWith('..')) return null;
  const parts = rel.split(path.sep);
  if (parts.length < 2) return null;
  // Drop trailing index.ts
  if (parts[parts.length - 1] !== 'index.ts') return null;
  parts.pop();
  // Compose dot route
  return parts.join('.');
}

async function walk(dir: string, files: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    // ignore archives and tests
    if (full.includes(`${path.sep}archive${path.sep}`) || full.includes(`${path.sep}__tests__${path.sep}`)) continue;
    if (e.isDirectory()) {
      await walk(full, files);
    } else if (e.isFile() && e.name === 'index.ts') {
      files.push(full);
    }
  }
  return files;
}

function buildTree(routes: string[]): unknown {
  const root: Record<string, any> = {};
  for (const route of routes) {
    const parts = route.split('.');
    let node: Record<string, any> = root;
    for (let i = 0; i < parts.length; i++) {
      const key = parts[i];
      const isLeaf = i === parts.length - 1;
      const existing = node[key];
      if (isLeaf) {
        // Set leaf value to full route
        if (existing && typeof existing === 'object') {
          // If already an object (because it had children), store self route
          existing._self = route;
        } else {
          node[key] = route;
        }
      } else {
        if (existing === undefined) {
          node[key] = {};
          node = node[key];
        } else if (typeof existing === 'string') {
          // Convert string leaf into object with _self, to allow children
          node[key] = { _self: existing };
          node = node[key];
        } else {
          node = existing;
        }
      }
    }
  }
  return root;
}

async function generate(): Promise<void> {
  const files = await walk(ACTIONS_DIR);
  const routes = files
    .map(toRoute)
    .filter((r): r is string => Boolean(r))
    .sort((a, b) => a.localeCompare(b));

  const tree = buildTree(routes);

  const header = `// GENERATED FILE – DO NOT EDIT\n` +
    `// Generated from src/actions folder structure\n`;

  const body = `export const ALL_ROUTES = ${JSON.stringify(routes)} as const;\n` +
    `export type ActionRoute = typeof ALL_ROUTES[number];\n` +
    `export const ROUTES = ${JSON.stringify(tree, null, 2)} as const;\n` +
    `export function isRoute(v: string): v is ActionRoute { return (ALL_ROUTES as readonly string[]).includes(v); }\n`;

  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  await fs.writeFile(OUT_FILE, header + '\n' + body);
  // eslint-disable-next-line no-console
  console.log(`Generated routes: ${routes.length} routes -> ${path.relative(ROOT, OUT_FILE)}`);
}

generate().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});


