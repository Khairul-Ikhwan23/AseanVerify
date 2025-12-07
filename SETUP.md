# MSME Passport Project Setup Guide

This guide will help you set up the MSME Passport project to run on localhost.

## Prerequisites

1. **Node.js** (version 18 or higher)
2. **PostgreSQL** (version 12 or higher)
3. **npm** or **yarn**

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Database Setup

### Option A: Using Docker (if Docker is installed)

1. Start the database:
```bash
docker compose up -d
```

### Option B: Local PostgreSQL Installation (Recommended if no Docker)

1. **Download and Install PostgreSQL:**
   - Go to https://www.postgresql.org/download/windows/
   - Download and install PostgreSQL for Windows
   - During installation, remember the password you set for the `postgres` user

2. **Create the Database:**
   - Open pgAdmin (comes with PostgreSQL) or use psql command line
   - Create a new database named `msme_passport`
   - Note your database credentials (host, port, username, password)

3. **Update .env file:**
   - Update the `DATABASE_URL` in your `.env` file with your actual credentials
   - Format: `postgresql://username:password@localhost:5432/msme_passport`

### Option C: Using a Cloud Database (Alternative)

You can also use a cloud PostgreSQL service like:
- Neon (free tier available)
- Supabase (free tier available)
- Railway (free tier available)

Just update the `DATABASE_URL` in your `.env` file with the connection string provided by the service.

## Step 3: Environment Configuration

Create a `.env` file in the project root with the following content:

```env
# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/msme_passport

# Server Configuration
NODE_ENV=development
PORT=5000

# Session Configuration (for development)
SESSION_SECRET=your-super-secret-session-key-change-this-in-production
```

**Important:** Update the `DATABASE_URL` with your actual PostgreSQL credentials.

## Step 4: Database Migration

Run the database migrations to set up the required tables:

```bash
npm run db:push
```

## Step 5: Start the Development Server

```bash
npm run dev
```

The application will be available at: `http://localhost:5000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes
- `npm run db:generate` - Generate new migration files
- `npm run db:migrate` - Run database migrations
- `npm run check` - Type check the codebase

## Project Structure

- `client/` - React frontend application
- `server/` - Express.js backend API
- `shared/` - Shared TypeScript schemas and types
- `migrations/` - Database migration files

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check your `DATABASE_URL` in the `.env` file
- Verify database credentials and permissions

### Port Already in Use
- Change the `PORT` in your `.env` file
- Or kill the process using port 5000

### TypeScript Errors
- Run `npm run check` to see detailed error messages
- Ensure all dependencies are installed

## Features

This MSME Passport application includes:
- User authentication and registration
- Business profile management
- Document upload and verification
- QR code generation and scanning
- Admin panel for business approval
- Multi-business support per user
- Collaboration features

## Support

If you encounter any issues, check the console logs for detailed error messages and ensure all prerequisites are properly installed.
