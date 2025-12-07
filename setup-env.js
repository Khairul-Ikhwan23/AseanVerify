#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = `# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/msme_passport

# Server Configuration
NODE_ENV=development
PORT=5000

# Session Configuration (for development)
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# Optional: Add any other environment variables your app needs
`;

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Created .env file with default configuration');
  console.log('📝 Please update the DATABASE_URL with your actual PostgreSQL credentials');
} else {
  console.log('⚠️  .env file already exists, skipping creation');
  console.log('📝 If you need to update it, please edit the .env file manually');
}

console.log('\n🚀 Next steps:');
console.log('1. Update DATABASE_URL in .env file if needed');
console.log('2. Run: npm install');
console.log('3. Start PostgreSQL (or run: docker-compose up -d)');
console.log('4. Run: npm run db:push');
console.log('5. Run: npm run dev');
