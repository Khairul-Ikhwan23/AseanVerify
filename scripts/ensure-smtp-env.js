#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), '.env');
let envRaw = '';
if (fs.existsSync(envPath)) {
  envRaw = fs.readFileSync(envPath, 'utf8');
}

const parseEnv = (text) => {
  const obj = {};
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    obj[m[1]] = v;
  }
  return obj;
};

const envObj = parseEnv(envRaw);

const ensure = (k, v) => {
  if (!envObj[k]) envObj[k] = v;
};

// Ensure SMTP defaults
ensure('SMTP_HOST', envObj['SMTP_HOST'] || 'smtp.gmail.com');
ensure('SMTP_PORT', envObj['SMTP_PORT'] || '587');
ensure('SMTP_SECURE', envObj['SMTP_SECURE'] || 'false');
ensure('SMTP_USER', envObj['SMTP_USER'] || 'YOUR_GMAIL_ADDRESS_HERE');
// Insert provided app password
envObj['SMTP_PASS'] = 'kcpq hjse hgmr ycst';
ensure('EMAIL_FROM', envObj['EMAIL_FROM'] || envObj['SMTP_USER'] || 'YOUR_GMAIL_ADDRESS_HERE');
ensure('APP_BASE_URL', envObj['APP_BASE_URL'] || 'http://localhost:5173');

const serialize = (o) => Object.entries(o).map(([k,v]) => `${k}=${v}`).join('\n') + '\n';

const newEnv = serialize(envObj);
fs.writeFileSync(envPath, newEnv);
console.log('✅ SMTP env ensured in .env. Please update SMTP_USER/EMAIL_FROM with your Gmail address.');

