-- Performance optimization indexes
-- This migration adds indexes to improve query performance

-- Index on users table for common queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Index on business_profiles table for common queries
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_verified ON business_profiles(verified);
CREATE INDEX IF NOT EXISTS idx_business_profiles_status ON business_profiles(status);
CREATE INDEX IF NOT EXISTS idx_business_profiles_archived ON business_profiles(archived);
CREATE INDEX IF NOT EXISTS idx_business_profiles_primary_affiliate ON business_profiles(primary_affiliate_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_payment_status ON business_profiles(payment_status);
CREATE INDEX IF NOT EXISTS idx_business_profiles_qr_code ON business_profiles(qr_code);
CREATE INDEX IF NOT EXISTS idx_business_profiles_passport_id ON business_profiles(passport_id);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_verified ON business_profiles(user_id, verified);
CREATE INDEX IF NOT EXISTS idx_business_profiles_verified_paid ON business_profiles(verified, payment_status);
CREATE INDEX IF NOT EXISTS idx_users_verified_created ON users(verified, created_at);

-- Index on collaboration tables
CREATE INDEX IF NOT EXISTS idx_collaboration_invitations_invitee_email ON collaboration_invitations(invitee_email);
CREATE INDEX IF NOT EXISTS idx_collaboration_invitations_business_id ON collaboration_invitations(business_id);
CREATE INDEX IF NOT EXISTS idx_business_collaborations_user_id ON business_collaborations(user_id);
CREATE INDEX IF NOT EXISTS idx_business_collaborations_business_id ON business_collaborations(business_id);

-- Index on affiliates tables
CREATE INDEX IF NOT EXISTS idx_business_secondary_affiliates_business_id ON business_secondary_affiliates(business_id);
CREATE INDEX IF NOT EXISTS idx_business_secondary_affiliates_secondary_affiliate_id ON business_secondary_affiliates(secondary_affiliate_id);
