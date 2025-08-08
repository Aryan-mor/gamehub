import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';

// This test builds the project and runs a tiny Node script against the built dist
// to assert that smart-router auto-discovery can import a discovered handler.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function run(cmd: string, cwd?: string): string {
  return execSync(cmd, {
    stdio: 'pipe',
    cwd,
    env: { ...process.env, CI: 'true' },
    encoding: 'utf-8',
  });
}

describe('Smart router build compatibility (auto-discovery)', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const distDir = path.join(projectRoot, 'dist');

  it('should build and auto-discover a poker room list handler at runtime', () => {
    // Build the project to dist without relying on pnpm binary in PATH
    // Use local TypeScript entry to avoid shell shim issues under Node 23
    const tscCmd = `node ${JSON.stringify(path.join(projectRoot, 'node_modules', 'typescript', 'bin', 'tsc'))} -p tsconfig.json`;
    run(tscCmd, projectRoot);

    // Construct a node script that requires compiled dist and dispatches a route
    const script = `
      (async () => {
        const { dispatch } = require(${JSON.stringify(path.join(distDir, 'modules/core/smart-router.js'))});
        const { initializeRoutes } = require(${JSON.stringify(path.join(distDir, 'main-router.js'))});
        const { default: logger } = require(${JSON.stringify(path.join(distDir, 'modules/core/logger.js'))});
        const { decodeAction } = require(${JSON.stringify(path.join(distDir, 'modules/core/route-alias.js'))});
        initializeRoutes();
        const context = {
          ctx: {
            t: (k) => k,
            replySmart: async () => {},
            keyboard: { buildCallbackData: () => 'noop' },
            log: logger,
          },
          user: { id: '123', username: 'test' }
        };
         await dispatch('games.poker.room.list', context);
        await dispatch(decodeAction('g.pk.st'), context); // encoded route decoded to full path (games.poker.start)
        console.log('OK');
      })().catch((e) => { console.error('ERR', e && e.message || e); process.exit(1); });
    `;

    // Avoid Node 23 eval_string syntax pitfalls by writing to a temp file
    const fs = require('node:fs');
    const tmpPath = path.join(projectRoot, '.tmp-router-check.js');
    fs.writeFileSync(tmpPath, script);
    const out = run(`node ${JSON.stringify(tmpPath)}`, projectRoot);
    expect(out.trim().endsWith('OK')).toBe(true);
  });
});


