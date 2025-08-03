#!/usr/bin/env tsx

import { supabase } from '../src/lib/supabase';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting Supabase Migration Setup...\n');

async function setupDatabase() {
  try {
    console.log('📋 Setting up database schema...');
    
    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'supabase-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema (this would typically be done through Supabase dashboard or CLI)
    console.log('✅ Schema file created at: supabase-schema.sql');
    console.log('📝 Please run this schema in your Supabase SQL editor');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/[YOUR_PROJECT]/sql');
    
  } catch (error) {
    console.error('❌ Error setting up database:', error);
  }
}

async function testConnection() {
  try {
    console.log('\n🔌 Testing Supabase connection...');
    
    // Test the connection by trying to query a table
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('⚠️  Connection test failed (this is expected if tables don\'t exist yet):', error.message);
    } else {
      console.log('✅ Supabase connection successful!');
    }
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

async function createSampleData() {
  try {
    console.log('\n📊 Creating sample data...');
    
    // Create a sample user
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        telegram_id: 123456789,
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User'
      })
      .select()
      .single();
    
    if (userError) {
      console.log('⚠️  Could not create sample user (table might not exist):', userError.message);
      return;
    }
    
    console.log('✅ Sample user created:', user);
    
    // Create a sample wallet
    const { data: wallet, error: walletError } = await supabase
      .from('wallets')
      .insert({
        user_id: user.id,
        balance: 1000.00
      })
      .select()
      .single();
    
    if (walletError) {
      console.log('⚠️  Could not create sample wallet:', walletError.message);
    } else {
      console.log('✅ Sample wallet created:', wallet);
    }
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
}

async function main() {
  console.log('🎯 Supabase Migration Setup Tool\n');
  
  // Check environment variables
  const requiredEnvVars = [
    'SUPABASE_PROJECT_URL',
    'SUPABASE_SERVICE_ROLE_SECRET'
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => console.error(`   - ${varName}`));
    console.log('\n📝 Please add these to your .env file');
    return;
  }
  
  console.log('✅ Environment variables configured');
  
  await testConnection();
  await setupDatabase();
  await createSampleData();
  
  console.log('\n🎉 Migration setup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Run the schema in Supabase SQL editor');
  console.log('2. Update your application code to use the new API routes');
  console.log('3. Test the migration with sample data');
  console.log('4. Remove Firebase dependencies from package.json');
  console.log('5. Update your deployment scripts');
}

main().catch(console.error); 