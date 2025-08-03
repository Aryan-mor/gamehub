#!/usr/bin/env tsx
import { supabase } from '../src/lib/supabase';
import { readFileSync } from 'fs';
import { join } from 'path';

async function fixChatIdMigration() {
  console.log('🔧 Fixing chat_id column type in room_messages table...\n');
  
  try {
    // Read the migration SQL file
    const migrationPath = join(__dirname, 'fix-chat-id-migration.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Executing migration SQL...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('⚠️ exec_sql not available, trying direct query...');
      
      // Split the SQL into individual statements
      const statements = migrationSQL.split(';').filter(stmt => stmt.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`🔧 Executing: ${statement.trim().substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (stmtError) {
            console.log(`⚠️ Statement failed (this might be expected): ${stmtError.message}`);
          }
        }
      }
    } else {
      console.log('✅ Migration executed successfully');
    }
    
    // Verify the column type
    console.log('\n🔍 Verifying column type...');
    const { data: columnInfo, error: verifyError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, character_maximum_length')
      .eq('table_name', 'room_messages')
      .eq('column_name', 'chat_id')
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying column:', verifyError);
    } else {
      console.log('✅ Column info:', columnInfo);
      if (columnInfo?.data_type === 'bigint') {
        console.log('🎉 chat_id column is now BIGINT type!');
      } else {
        console.log('⚠️ chat_id column type:', columnInfo?.data_type);
      }
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

fixChatIdMigration().then(() => {
  console.log('\n🏁 Migration script completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
}); 