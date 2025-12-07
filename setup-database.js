#!/usr/bin/env node

import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.log('Please make sure your .env file contains a valid DATABASE_URL');
  process.exit(1);
}

console.log('🔍 Testing database connection...');

try {
  const sql = neon(DATABASE_URL);
  const db = drizzle(sql);
  
  // Test the connection
  const result = await sql`SELECT 1 as test`;
  console.log('✅ Database connection successful!');
  
  console.log('\n📋 Database setup complete!');
  console.log('You can now run: npm run dev');
  
} catch (error) {
  console.error('❌ Database connection failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Make sure PostgreSQL is running');
  console.log('2. Check your DATABASE_URL in the .env file');
  console.log('3. Ensure the database "msme_passport" exists');
  console.log('4. Verify your database credentials');
  
  if (error.message.includes('ECONNREFUSED')) {
    console.log('\n💡 If you don\'t have PostgreSQL installed:');
    console.log('- Install PostgreSQL from: https://www.postgresql.org/download/');
    console.log('- Or use a cloud service like Neon, Supabase, or Railway');
  }
  
  process.exit(1);
}
