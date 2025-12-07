-- Migration to add primary_affiliate_id column and related tables to users table
-- This migration adds the missing columns and tables for the primary affiliate functionality

-- First, create the main_affiliates table if it doesn't exist
CREATE TABLE IF NOT EXISTS "main_affiliates" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "created_at" text DEFAULT CURRENT_TIMESTAMP
);

-- Create the secondary_affiliates table if it doesn't exist
CREATE TABLE IF NOT EXISTS "secondary_affiliates" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "created_at" text DEFAULT CURRENT_TIMESTAMP
);

-- Create the user_secondary_affiliates table if it doesn't exist
CREATE TABLE IF NOT EXISTS "user_secondary_affiliates" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "user_id" varchar NOT NULL REFERENCES "users"("id"),
    "secondary_affiliate_id" varchar NOT NULL REFERENCES "secondary_affiliates"("id"),
    "created_at" text DEFAULT CURRENT_TIMESTAMP
);

-- Add primary_affiliate_id column to users table with foreign key reference to main_affiliates
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "primary_affiliate_id" varchar REFERENCES "main_affiliates"("id");

-- Create index for better performance
CREATE INDEX IF NOT EXISTS "users_primary_affiliate_id_idx" ON "users"("primary_affiliate_id");

-- Insert some default main affiliates if the table is empty
INSERT INTO "main_affiliates" ("name") 
SELECT 'Malay Chambers' WHERE NOT EXISTS (SELECT 1 FROM "main_affiliates" WHERE "name" = 'Malay Chambers');

INSERT INTO "main_affiliates" ("name") 
SELECT 'Chinese Chambers' WHERE NOT EXISTS (SELECT 1 FROM "main_affiliates" WHERE "name" = 'Chinese Chambers');

INSERT INTO "main_affiliates" ("name") 
SELECT 'Indian Chambers' WHERE NOT EXISTS (SELECT 1 FROM "main_affiliates" WHERE "name" = 'Indian Chambers');

INSERT INTO "main_affiliates" ("name") 
SELECT 'Others' WHERE NOT EXISTS (SELECT 1 FROM "main_affiliates" WHERE "name" = 'Others');

-- Insert some default secondary affiliates if the table is empty
INSERT INTO "secondary_affiliates" ("name") 
SELECT 'BEDB' WHERE NOT EXISTS (SELECT 1 FROM "secondary_affiliates" WHERE "name" = 'BEDB');

INSERT INTO "secondary_affiliates" ("name") 
SELECT 'Dynamik Technologies' WHERE NOT EXISTS (SELECT 1 FROM "secondary_affiliates" WHERE "name" = 'Dynamik Technologies');
