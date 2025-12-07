#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/set-smtp-user.js <email>');
  process.exit(1);
}

const envPath = path.resolve(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('.env not found. Run npm run setup or create a .env first.');
  process.exit(1);
}

const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
const updateKV = (arr, key, value) => {
  let found = false;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i].startsWith(`${key}=`)) {
      arr[i] = `${key}=${value}`;
      found = true;
      break;
    }
  }
  if (!found) arr.push(`${key}=${value}`);
};

updateKV(lines, 'SMTP_USER', email);
updateKV(lines, 'EMAIL_FROM', email);

fs.writeFileSync(envPath, lines.join('\n'));
console.log(`✅ Updated SMTP_USER and EMAIL_FROM to ${email}`);

