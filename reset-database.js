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
  process.exit(1);
}

console.log('🗑️  Resetting database...');

try {
  const sqlClient = neon(DATABASE_URL);
  const db = drizzle(sqlClient);
  
  // Drop all tables in the correct order (respecting foreign key constraints)
  console.log('Dropping tables...');
  
  await sqlClient`DROP TABLE IF EXISTS "business_secondary_affiliates" CASCADE`;
  await sqlClient`DROP TABLE IF EXISTS "business_collaborations" CASCADE`;
  await sqlClient`DROP TABLE IF EXISTS "collaboration_invitations" CASCADE`;
  await sqlClient`DROP TABLE IF EXISTS "business_profiles" CASCADE`;
  await sqlClient`DROP TABLE IF EXISTS "secondary_affiliates" CASCADE`;
  await sqlClient`DROP TABLE IF EXISTS "main_affiliates" CASCADE`;
  await sqlClient`DROP TABLE IF EXISTS "users" CASCADE`;
  
  console.log('✅ Database reset complete!');
  console.log('You can now run: npm run db:push');
  
} catch (error) {
  console.error('❌ Database reset failed:', error.message);
  process.exit(1);
}

