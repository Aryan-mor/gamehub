#!/usr/bin/env tsx
import { promises as fs } from 'node:fs';
import path from 'node:path';

async function main(): Promise<void> {
  const [, , routeArg, ...rest] = process.argv;
  if (!routeArg) {
    console.error('Usage: pnpm scaffold:action <dot.route> [--force] [--no-test]');
    process.exit(1);
  }

  const route = routeArg.trim();
  const force = rest.includes('--force');
  const withTest = !rest.includes('--no-test');

  // Resolve paths
  const root = path.resolve(__dirname, '..');
  const srcDir = path.join(root, 'src');
  const actionsDir = path.join(srcDir, 'actions');
  const routePath = route.split('.').join(path.sep);
  const targetDir = path.join(actionsDir, routePath);
  const indexFile = path.join(targetDir, 'index.ts');
  const testFile = path.join(targetDir, 'e2e.test.ts');

  // Ensure directory exists
  await fs.mkdir(targetDir, { recursive: true });

  // Create index.ts
  const indexExists = await exists(indexFile);
  if (indexExists && !force) {
    console.error(`index.ts already exists at ${path.relative(root, indexFile)}. Use --force to overwrite.`);
  } else {
    const indexContent = buildHandlerTemplate(route);
    await fs.writeFile(indexFile, indexContent, 'utf8');
    console.log(`Created ${path.relative(root, indexFile)}`);
  }

  // Create e2e.test.ts
  if (withTest) {
    const testExists = await exists(testFile);
    if (testExists && !force) {
      console.error(`e2e.test.ts already exists at ${path.relative(root, testFile)}. Use --force to overwrite.`);
    } else {
      const testContent = buildTestTemplate(route);
      await fs.writeFile(testFile, testContent, 'utf8');
      console.log(`Created ${path.relative(root, testFile)}`);
    }
  }

  console.log('Done. Run: pnpm routes:gen');
}

function buildHandlerTemplate(route: string): string {
  return `import { HandlerContext, createHandler } from '@/modules/core/handler';

export const key = '${route}';

async function handle(context: HandlerContext): Promise<void> {
  const { ctx } = context;
  await ctx.replySmart(ctx.t('bot.start.welcome'));
}

export default createHandler(handle);
`;
}

function buildTestTemplate(route: string): string {
  return `import { describe, it, expect } from 'vitest';
import { encodeAction } from '@/modules/core/route-alias';

describe('${route} e2e (scaffold)', () => {
  it('should encode callback under 64 bytes', () => {
    const payload = JSON.stringify({ action: encodeAction('${route}') });
    expect(Buffer.byteLength(payload, 'utf8')).toBeLessThan(64);
  });
});
`;
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.stat(p);
    return true;
  } catch {
    return false;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


