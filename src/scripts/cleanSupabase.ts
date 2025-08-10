#!/usr/bin/env tsx

import 'dotenv/config';
import { supabase } from '@/lib/supabase';
import { logger } from '@/modules/core/logger';

interface DeleteResult {
  table: string;
  deleted?: number;
  error?: string;
}

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

async function deleteAllFrom(table: string, idColumn: string): Promise<DeleteResult> {
  try {
    // Use a condition that matches all rows regardless of UUID type
    const { error } = await supabase
      .from(table)
      .delete()
      .not(idColumn, 'is', null);

    if (error) {
      return { table, error: error.message };
    }
    return { table };
  } catch (err) {
    return { table, error: (err as Error).message };
  }
}

async function deleteAllAuthUsers(): Promise<{ deleted: number; errors: number }>{
  let page = 1;
  const perPage = 1000;
  let totalDeleted = 0;
  let totalErrors = 0;

  // Paginate through all auth users
  // Loop until no users remain
  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      logger.error({ err: error }, 'Failed to list auth users');
      break;
    }
    const users = data?.users ?? [];
    if (users.length === 0) break;

    for (const user of users) {
      const del = await supabase.auth.admin.deleteUser(user.id);
      if (del.error) {
        totalErrors += 1;
        logger.error({ err: del.error, userId: user.id }, 'Failed to delete auth user');
      } else {
        totalDeleted += 1;
      }
    }

    page += 1;
  }

  return { deleted: totalDeleted, errors: totalErrors };
}

async function main(): Promise<void> {
  const force = hasFlag('--yes') || process.env.DB_CLEAN_FORCE === '1' || process.env.DB_CLEAN_CONFIRM === 'true';
  const includeAuth = !hasFlag('--skip-auth');

  if (!force) {
    logger.error('Refusing to clean Supabase without --yes (or DB_CLEAN_CONFIRM=true)');
    process.exit(2);
  }

  logger.warn('Starting Supabase cleanup (ALL DATA WILL BE DELETED)');

  // Order matters due to FKs
  const steps: Array<Promise<DeleteResult>> = [
    deleteAllFrom('room_players', 'id'),
    deleteAllFrom('rooms', 'id'),
    deleteAllFrom('users', 'id'),
  ];

  const results = await Promise.all(steps);
  for (const r of results) {
    if (r.error) {
      logger.error({ table: r.table, error: r.error }, 'Table delete error');
    } else {
      logger.info({ table: r.table }, 'Table cleared');
    }
  }

  if (includeAuth) {
    logger.warn('Deleting all Supabase auth users...');
    const authRes = await deleteAllAuthUsers();
    logger.info({ deleted: authRes.deleted, errors: authRes.errors }, 'Auth users deletion summary');
  }

  logger.info('Supabase cleanup completed');
}

main().then(() => process.exit(0)).catch((err) => {
  logger.error({ err }, 'Supabase cleanup failed');
  process.exit(1);
});


