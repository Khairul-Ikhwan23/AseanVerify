-- Migration to update users table for personal profile fields
-- Remove business_name column and add new personal profile fields

-- Add new columns
ALTER TABLE "users" ADD COLUMN "first_name" text NOT NULL DEFAULT '';
ALTER TABLE "users" ADD COLUMN "last_name" text NOT NULL DEFAULT '';
ALTER TABLE "users" ADD COLUMN "profile_picture" text;
ALTER TABLE "users" ADD COLUMN "date_of_birth" text;
ALTER TABLE "users" ADD COLUMN "gender" text;
ALTER TABLE "users" ADD COLUMN "phone_number" text;
ALTER TABLE "users" ADD COLUMN "updated_at" timestamp DEFAULT CURRENT_TIMESTAMP;

-- Update existing users to have default names (you may want to customize this)
UPDATE "users" SET 
  "first_name" = COALESCE(SPLIT_PART("business_name", ' ', 1), 'User'),
  "last_name" = COALESCE(SPLIT_PART("business_name", ' ', 2), 'Account');

-- Remove the business_name column after data migration
ALTER TABLE "users" DROP COLUMN "business_name";
