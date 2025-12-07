#!/usr/bin/env node
import crypto from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const userId = process.argv[2];
if (!userId) {
  console.error('Usage: node scripts/insert-verification-token.js <userId>');
  process.exit(1);
}

const run = async () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const sql = neon(url);
  const raw = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  const expires = new Date(Date.now() + 24*60*60*1000).toISOString();
  await sql`INSERT INTO email_verification_tokens (id,user_id,token_hash,expires_at) VALUES (gen_random_uuid(), ${userId}, ${hash}, ${expires})`;
  console.log(raw);
};

run().catch((e)=>{ console.error(e); process.exit(1); });

