-- Safe migration: Preserve email_verified data before schema push
-- This migration copies email_verified data to verified column if verified is false/null

-- Step 1: Copy email_verified data to verified (only if verified is false/null)
UPDATE users 
SET verified = COALESCE(verified, email_verified, false)
WHERE email_verified IS NOT NULL 
  AND (verified IS NULL OR verified = false);

-- Step 2: Verify the migration
-- Check how many rows were updated
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN verified = true THEN 1 END) as verified_users,
  COUNT(CASE WHEN email_verified = true THEN 1 END) as email_verified_users
FROM users;

