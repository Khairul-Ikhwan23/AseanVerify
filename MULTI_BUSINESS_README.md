# Multi-Business Management System

## Overview

The MSME Passport system now supports multiple businesses per user, allowing business owners to manage multiple business accounts from a single login. Each business has its own profile, verification status, and can be managed independently.

## Features

### For Users
- **Multiple Business Registration**: Register and manage multiple businesses under one account
- **Business Status Overview**: Clear visibility of each business's verification status (pending/verified/rejected)
- **Individual Business Management**: Each business has its own profile and settings
- **Add New Businesses**: Easy form to register additional businesses
- **Business Dashboard**: Overview of all businesses with progress indicators

### For Admins
- **Business Management**: View and manage all businesses across all users
- **Status Updates**: Update business verification status, approve, or reject with reasons
- **Business Analytics**: Overview of business statistics and verification progress

## Database Schema Changes

### New Fields Added

#### `users` table
- `created_at`: Timestamp when user account was created

#### `business_profiles` table
- `business_name`: Individual business name (required)
- `status`: Business status (pending/verified/rejected)
- `created_at`: Timestamp when business was created
- `updated_at`: Timestamp when business was last updated

### Key Changes
- Each business profile now has its own `business_name` field
- Business status is tracked separately from user verification
- Cascade delete ensures business profiles are removed when users are deleted
- Indexes added for better performance on business queries

## API Endpoints

### User Business Management
- `GET /api/user/:userId/businesses` - Get all businesses for a user
- `POST /api/businesses` - Create a new business
- `PATCH /api/businesses/:businessId/status` - Update business status

### Admin Business Management
- `GET /api/admin/businesses` - Get all businesses across all users
- `PATCH /api/admin/businesses/:businessId/status` - Admin update business status

## Components

### BusinessManager
Main component for displaying and managing multiple businesses. Shows:
- List of all user businesses
- Status badges for each business
- Progress indicators
- Business summary statistics
- Add business button

### AddBusinessForm
Modal form for creating new businesses with fields:
- Business name (required)
- Category selection
- Tagline
- Address
- Contact information (phone, website)

## Usage

### For Users
1. **Login**: Users log in with their existing credentials
2. **View Businesses**: Dashboard shows all registered businesses with status
3. **Add Business**: Click "Add Business" to register a new business
4. **Manage Business**: Click on any business to view details or complete profile
5. **Track Progress**: Monitor verification status and completion progress

### For Admins
1. **Access Admin Panel**: Navigate to admin routes
2. **View All Businesses**: See businesses across all users
3. **Update Status**: Approve, reject, or update business verification status
4. **Manage Users**: Continue to manage user accounts as before

## Migration

### Database Migration
The multi-business support has been implemented using Drizzle ORM. The schema changes have been applied to your PostgreSQL database using:

```bash
npm run db:push
```

This command:
- Adds new columns to existing tables
- Updates existing business profiles with business names
- Adds indexes for performance
- Sets up cascade delete relationships

### Data Migration
- Existing users will have their business name copied to the new `business_name` field
- All existing business profiles will be marked as "pending" status initially
- No data loss during migration

### Schema Changes Applied
The following changes were made to your database schema:

#### `users` table
- Added `created_at` timestamp field

#### `business_profiles` table  
- Added `business_name` field (required, with default value for existing records)
- Added `status` field (pending/verified/rejected)
- Added `created_at` and `updated_at` timestamp fields
- Updated foreign key to include cascade delete
- Added performance indexes

### Future Schema Changes
For any future schema changes, use:
- `npm run db:generate` - Generate migration files
- `npm run db:push` - Apply changes directly to database
- `npm run db:migrate` - Run existing migrations

## Business Status Flow

1. **Pending**: New business created, profile incomplete
2. **In Progress**: Profile partially completed
3. **Pending Verification**: Profile complete, awaiting admin review
4. **Verified**: Business approved and verified
5. **Rejected**: Business rejected with reason (can be resubmitted)

## Benefits

- **Scalability**: Users can manage multiple business ventures
- **Flexibility**: Each business can have different verification statuses
- **Efficiency**: Single login for multiple business management
- **Transparency**: Clear status visibility for all businesses
- **Admin Control**: Better oversight of business verification process

## Future Enhancements

- Business-specific dashboards
- Individual business QR codes
- Business-to-business networking
- Separate payment processing per business
- Business analytics and reporting
- Business category-specific features

## Technical Notes

- Uses React Query for efficient data fetching
- Implements proper TypeScript types for all new functionality
- Follows existing code patterns and styling
- Responsive design for mobile and desktop
- Proper error handling and loading states
- Database indexes for optimal performance

## Support

For technical support or questions about the multi-business system, refer to the development team or check the system logs for detailed error information.
