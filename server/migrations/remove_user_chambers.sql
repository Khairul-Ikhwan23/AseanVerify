-- Migration: Remove user-level chamber associations and add business-level secondary chambers
-- This migration:
-- 1. Removes primaryAffiliateId from users table
-- 2. Renames userSecondaryAffiliates to businessSecondaryAffiliates
-- 3. Updates foreign key references

-- Step 1: Drop the primaryAffiliateId column from users table
ALTER TABLE users DROP COLUMN IF EXISTS primary_affiliate_id;

-- Step 2: Rename userSecondaryAffiliates table to businessSecondaryAffiliates
ALTER TABLE user_secondary_affiliates RENAME TO business_secondary_affiliates;

-- Step 3: Rename the user_id column to business_id
ALTER TABLE business_secondary_affiliates RENAME COLUMN user_id TO business_id;

-- Step 4: Add foreign key constraint for business_id referencing business_profiles
ALTER TABLE business_secondary_affiliates 
ADD CONSTRAINT fk_business_secondary_affiliates_business_id 
FOREIGN KEY (business_id) REFERENCES business_profiles(id) ON DELETE CASCADE;

-- Step 5: Drop the old foreign key constraint for user_id
ALTER TABLE business_secondary_affiliates 
DROP CONSTRAINT IF EXISTS user_secondary_affiliates_user_id_fkey;

-- Step 6: Create index on business_id for better performance
CREATE INDEX IF NOT EXISTS idx_business_secondary_affiliates_business_id 
ON business_secondary_affiliates(business_id);

-- Note: The primaryAffiliateId in business_profiles table remains unchanged
-- as businesses still need to select a primary chamber
