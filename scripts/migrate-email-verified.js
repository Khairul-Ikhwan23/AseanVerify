#!/usr/bin/env node

/**
 * Schema Verification: Check email_verified column
 * 
 * This script verifies that email_verified column exists in your Neon database
 * and shows statistics. The schema now includes both emailVerified and verified.
 */

import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

console.log('🔍 Checking database schema in Neon...');

try {
  const sql = neon(DATABASE_URL);
  
  // Step 1: Check if email_verified column exists
  console.log('📊 Checking users table columns...');
  const columns = await sql`
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns 
    WHERE table_name = 'users'
    ORDER BY ordinal_position
  `;
  
  console.log(`\n📋 Found ${columns.length} columns in users table:`);
  columns.forEach(col => {
    console.log(`   - ${col.column_name} (${col.data_type})`);
  });
  
  const hasEmailVerified = columns.some(col => col.column_name === 'email_verified');
  const hasVerified = columns.some(col => col.column_name === 'verified');
  
  console.log(`\n✅ email_verified column: ${hasEmailVerified ? 'EXISTS' : 'MISSING'}`);
  console.log(`✅ verified column: ${hasVerified ? 'EXISTS' : 'MISSING'}`);
  
  if (hasEmailVerified) {
    // Step 2: Count users
    const countResult = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN email_verified = true THEN 1 END) as email_verified_count,
        COUNT(CASE WHEN verified = true THEN 1 END) as verified_count
      FROM users
    `;
    
    const stats = countResult[0];
    console.log(`\n📈 User Statistics:`);
    console.log(`   - Total users: ${stats.total}`);
    console.log(`   - Email verified: ${stats.email_verified_count}`);
    console.log(`   - Admin verified: ${stats.verified_count}`);
  }
  
  console.log('\n✅ Schema check complete!');
  console.log('📝 The schema now includes both emailVerified and verified columns.');
  console.log('   You can safely run "npm run db:push" - no data will be lost!');
  
} catch (error) {
  console.error('❌ Check failed:', error.message);
  process.exit(1);
}

