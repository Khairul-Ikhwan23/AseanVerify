# 🚀 Quick Start Guide

Your MSME Passport project is now ready to run! Here's how to get started:

## ✅ What's Already Set Up

- ✅ Dependencies installed
- ✅ Environment variables configured
- ✅ Database schema created
- ✅ Development server tested

## 🎯 Start the Application

```bash
npm run dev
```

The application will be available at: **http://localhost:5000**

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run test:db` | Test database connection |
| `npm run reset:db` | Reset database (⚠️ deletes all data) |
| `npm run db:push` | Update database schema |

## 🌐 Access the Application

Open your browser and go to: **http://localhost:5000**

You should see the MSME Passport application with:
- User registration and login
- Business profile management
- Document upload features
- QR code generation
- Admin panel

## 🔧 Troubleshooting

### Server won't start?
- Check if port 5000 is available
- Run `npm run test:db` to verify database connection
- Check the console for error messages

### Database issues?
- Run `npm run test:db` to test connection
- Run `npm run reset:db` to reset (⚠️ deletes data)
- Run `npm run db:push` to update schema

### Need to stop the server?
- Press `Ctrl+C` in the terminal where the server is running

## 📁 Project Structure

```
├── client/          # React frontend
├── server/          # Express.js backend
├── shared/          # Shared schemas
├── migrations/      # Database migrations
└── .env            # Environment variables
```

## 🎉 You're All Set!

Your MSME Passport application is now running locally. You can start developing, testing, and customizing the application as needed.

For detailed setup instructions, see `SETUP.md`.

