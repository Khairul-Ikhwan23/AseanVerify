# Chamber Architecture Changes

## Overview
This document outlines the architectural changes made to move from user-level chamber associations to business-level chamber associations.

## What Changed

### Before (User-Level Chambers)
- Users had to select a primary chamber when creating their account
- Users could select multiple secondary chambers for their profile
- All businesses created by a user would inherit the same chamber associations
- Chamber selection was part of the user profile

### After (Business-Level Chambers)
- Users no longer select chambers when creating their account
- Each business can have its own primary chamber (required)
- Each business can have its own secondary chambers (optional)
- Chamber selection is now part of business creation/editing
- Users can have different chamber associations for different businesses

## Database Changes

### Tables Modified
1. **users table**
   - Removed `primary_affiliate_id` column
   - Users are no longer tied to specific chambers

2. **user_secondary_affiliates → business_secondary_affiliates**
   - Renamed table from `user_secondary_affiliates` to `business_secondary_affiliates`
   - Changed `user_id` column to `business_id`
   - Updated foreign key to reference `business_profiles(id)` instead of `users(id)`

3. **business_profiles table**
   - Kept `primary_affiliate_id` (required for each business)
   - Secondary chambers are now stored in the `business_secondary_affiliates` table

## API Changes

### Routes Modified
1. **`/api/users/:userId/profile` (PATCH)**
   - No longer accepts `primaryAffiliateId` or `secondaryAffiliateIds`
   - Only handles user profile information (name, email, phone, etc.)

2. **`/api/affiliates/user/:userId` (GET/POST)**
   - Deprecated - now returns empty array or informational message
   - Secondary affiliates are now managed per business

### New Routes Added
1. **`/api/affiliates/business/:businessId` (GET)**
   - Fetches secondary affiliates for a specific business

2. **`/api/affiliates/business/:businessId` (POST)**
   - Updates secondary affiliates for a specific business

## Client-Side Changes

### Profile Form
- Removed chamber selection UI
- Added informational note about chamber management
- Simplified form to only handle user profile information

### Business Forms
- Add Business Form: Already had primary chamber selection
- Edit Business Form: Already had primary chamber selection
- Both forms: Secondary chambers are optional and managed per business

## Benefits of This Change

1. **Flexibility**: Users can have different chamber associations for different businesses
2. **Business-Focused**: Chamber selection is now tied to business context, not user context
3. **Scalability**: Easier to manage multiple businesses with different chamber needs
4. **User Experience**: Users don't need to commit to chambers before creating businesses
5. **Data Integrity**: Chamber associations are more logically structured

## Migration Notes

### For Existing Users
- Existing user chamber associations will be lost
- Users will need to set chambers when creating/editing businesses
- No data migration is provided (clean slate approach)

### For Existing Businesses
- Existing businesses keep their `primary_affiliate_id`
- Secondary chamber associations will need to be recreated using the new business-level system

## Testing

After implementing these changes, test:
1. User signup (should not require chamber selection)
2. Business creation (should require primary chamber, optional secondary)
3. Business editing (should allow chamber changes)
4. Profile updates (should not include chamber fields)
5. Collaboration system (should work with new architecture)

## Rollback Plan

If needed, the changes can be rolled back by:
1. Reverting the database migration
2. Restoring the old API routes
3. Reverting client-side changes
4. Restoring user-level chamber logic
