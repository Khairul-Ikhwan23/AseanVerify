-- Add QR code and passport ID fields to business_profiles table
ALTER TABLE business_profiles 
ADD COLUMN qr_code TEXT,
ADD COLUMN passport_id TEXT;

-- Create index on passport_id for faster lookups
CREATE INDEX IF NOT EXISTS business_profiles_passport_id_idx ON business_profiles(passport_id);

-- Create index on qr_code for faster lookups
CREATE INDEX IF NOT EXISTS business_profiles_qr_code_idx ON business_profiles(qr_code);
