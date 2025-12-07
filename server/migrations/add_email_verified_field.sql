-- Add email_verified field to users table
-- This separates email verification from admin verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Update existing users: if verified=true, set both email_verified=true and verified=true
-- This ensures existing verified users remain verified for both email and admin
UPDATE users SET email_verified = verified WHERE verified = true;

