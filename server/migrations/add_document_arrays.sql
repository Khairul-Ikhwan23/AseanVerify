-- Migration: Add document array columns to business_profiles table
-- This migration adds support for multiple documents per field

-- Add new document array columns
ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS business_license_documents TEXT[] DEFAULT '{}';

ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS registration_certificate_documents TEXT[] DEFAULT '{}';

ALTER TABLE business_profiles 
ADD COLUMN IF NOT EXISTS proof_of_operations_documents TEXT[] DEFAULT '{}';

-- Create indexes for better performance when querying document arrays
CREATE INDEX IF NOT EXISTS idx_business_profiles_business_license_docs 
ON business_profiles USING GIN (business_license_documents);

CREATE INDEX IF NOT EXISTS idx_business_profiles_registration_cert_docs 
ON business_profiles USING GIN (registration_certificate_documents);

CREATE INDEX IF NOT EXISTS idx_business_profiles_proof_of_ops_docs 
ON business_profiles USING GIN (proof_of_operations_documents);

-- Note: The existing single document fields (business_license, registration_certificate, proof_of_operations)
-- are kept for backward compatibility but can be deprecated in future versions
