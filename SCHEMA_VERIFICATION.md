# 🔍 Database Schema Verification Report

## ✅ Schema Safety Check for `npm run db:push`

### What `drizzle-kit push` Does:
- **Safe Operation**: Only adds/modifies columns and tables
- **No Data Loss**: Does NOT drop existing data
- **Incremental**: Compares current schema with database and makes only necessary changes
- **Idempotent**: Safe to run multiple times

---

## 📊 Complete Schema Overview

### Tables That Will Be Created/Updated:

#### 1. **users** table
```sql
- id (varchar, PK, UUID)
- first_name (text, NOT NULL, default '')
- last_name (text, NOT NULL, default '')
- email (text, NOT NULL, UNIQUE)
- password (text, NOT NULL)
- profile_picture (text, nullable)
- date_of_birth (text, nullable)
- gender (text, nullable)
- phone_number (text, nullable)
- ic_document (text, nullable) ⭐
- email_verified (boolean, default false) ⭐ EMAIL VERIFICATION
- verified (boolean, default false) ⭐ ADMIN/BUSINESS VERIFICATION
- business_count (integer, default 0)
- created_at (timestamp, default CURRENT_TIMESTAMP)
- updated_at (timestamp, default CURRENT_TIMESTAMP)
```

**Safety**: ✅ Existing users will be preserved. Both `email_verified` and `verified` columns are in schema - no data loss!

---

#### 2. **business_profiles** table
```sql
- id (varchar, PK, UUID)
- user_id (varchar, FK → users.id, CASCADE DELETE)
- business_name (text, NOT NULL, default 'Default Business') ⭐
- business_email (text, nullable)
- address (text, nullable)
- category (text, nullable)
- phone (text, nullable)
- website (text, nullable)
- tagline (text, nullable)
- business_registration_number (text, nullable)
- owner_name (text, nullable)
- year_established (text, nullable)
- number_of_employees (text, nullable)
- primary_affiliate_id (varchar, FK → main_affiliates.id, NOT NULL) ⭐
- qr_scans (text, default '0')
- network_connections (text, default '0')
- qr_code (text, nullable) ⭐
- passport_id (text, nullable) ⭐
- profile_picture (text, nullable)
- business_license (text, nullable)
- business_license_documents (jsonb, nullable) ⭐
- registration_certificate (text, nullable)
- registration_certificate_documents (jsonb, nullable) ⭐
- proof_of_operations (text, nullable)
- proof_of_operations_documents (jsonb, nullable) ⭐
- completed (boolean, default false)
- verified (boolean, default false)
- payment_status (text, default 'pending')
- rejected (boolean, default false)
- rejection_reason (text, nullable)
- status (text, default 'pending') ⭐
- archived (boolean, default false) ⭐
- priority (integer, nullable) ⭐
- created_at (timestamp, default CURRENT_TIMESTAMP)
- updated_at (timestamp, default CURRENT_TIMESTAMP)
```

**Safety**: ✅ Existing business profiles will be preserved. New columns added with defaults.

**Indexes**:
- `business_profiles_user_id_idx` on `user_id`

---

#### 3. **main_affiliates** table
```sql
- id (varchar, PK, UUID)
- name (text, NOT NULL)
- created_at (text, default CURRENT_TIMESTAMP)
```

**Default Data** (auto-inserted if empty):
- Malay Chambers
- Chinese Chambers
- Indian Chambers
- Others

**Safety**: ✅ Existing affiliates preserved. Defaults only inserted if table is empty.

---

#### 4. **secondary_affiliates** table
```sql
- id (varchar, PK, UUID)
- name (text, NOT NULL)
- created_at (text, default CURRENT_TIMESTAMP)
```

**Default Data** (auto-inserted if empty):
- BEDB
- Dynamik Technologies

**Safety**: ✅ Existing affiliates preserved.

---

#### 5. **business_secondary_affiliates** table ⭐
```sql
- id (varchar, PK, UUID)
- business_id (varchar, FK → business_profiles.id, CASCADE DELETE)
- secondary_affiliate_id (varchar, FK → secondary_affiliates.id)
- created_at (text, default CURRENT_TIMESTAMP)
```

**Note**: This is the NEW business-level secondary affiliates table (replaces old user-level one).

**Safety**: ✅ New table, no existing data to lose.

---

#### 6. **business_collaborations** table
```sql
- id (varchar, PK, UUID)
- business_id (varchar, FK → business_profiles.id, CASCADE DELETE)
- owner_id (varchar, FK → users.id, CASCADE DELETE)
- collaborator_id (varchar, FK → users.id, CASCADE DELETE)
- status (text, NOT NULL, default 'pending')
- role (text, NOT NULL, default 'collaborator')
- created_at (timestamp, default CURRENT_TIMESTAMP)
- updated_at (timestamp, default CURRENT_TIMESTAMP)
```

**Indexes**:
- `business_collaborations_business_id_idx`
- `business_collaborations_owner_id_idx`
- `business_collaborations_collaborator_id_idx`

**Safety**: ✅ New table, no existing data.

---

#### 7. **collaboration_invitations** table
```sql
- id (varchar, PK, UUID)
- business_id (varchar, FK → business_profiles.id, CASCADE DELETE)
- inviter_id (varchar, FK → users.id, CASCADE DELETE)
- invitee_email (text, NOT NULL)
- status (text, NOT NULL, default 'pending')
- message (text, nullable)
- expires_at (timestamp, nullable)
- created_at (timestamp, default CURRENT_TIMESTAMP)
- updated_at (timestamp, default CURRENT_TIMESTAMP)
```

**Indexes**:
- `collaboration_invitations_business_id_idx`
- `collaboration_invitations_inviter_id_idx`
- `collaboration_invitations_invitee_email_idx`

**Safety**: ✅ New table, no existing data.

---

#### 8. **email_verification_tokens** table
```sql
- id (varchar, PK, UUID)
- user_id (varchar, FK → users.id, CASCADE DELETE)
- token_hash (text, NOT NULL)
- expires_at (timestamp, NOT NULL)
- created_at (timestamp, default CURRENT_TIMESTAMP)
- used_at (timestamp, nullable)
```

**Indexes**:
- `email_verification_tokens_user_id_idx`
- `email_verification_tokens_expires_at_idx`

**Safety**: ✅ New table, no existing data.

---

## ⚠️ Important Notes

### Architecture Change Detected:
- **Old**: `user_secondary_affiliates` (user-level) - from migration 0002
- **New**: `business_secondary_affiliates` (business-level) - in current schema

**Impact**: 
- If you have an old `user_secondary_affiliates` table, it will NOT be automatically migrated
- The new `business_secondary_affiliates` table will be created
- Old table will remain but won't be used by the app
- **No data loss** - old data stays, just not used

**Recommendation**: If you have data in `user_secondary_affiliates`, you may want to manually migrate it to `business_secondary_affiliates` after push.

---

## ✅ Schema Updated: Both Columns Preserved

### ✅ Both `email_verified` and `verified` Are Now in Schema

**Schema Update:**
- ✅ `emailVerified` (maps to `email_verified` column) - Email verification status
- ✅ `verified` - Admin/business verification status
- ✅ Both columns are preserved - **NO DATA LOSS**

**What Changed:**
- Schema now includes `emailVerified: boolean("email_verified").default(false)`
- Code updated to use `emailVerified` for email verification checks
- `verified` is used for admin/business verification (unchanged)

---

## ✅ Safety Guarantees

### What `db:push` WILL Do:
- ✅ Add missing columns to existing tables
- ✅ Create new tables
- ✅ Add indexes
- ✅ Set up foreign keys
- ✅ Add default values to new columns
- ✅ Preserve ALL existing data (both `email_verified` and `verified`)

### What `db:push` WILL NOT Do:
- ❌ Drop existing columns (both are in schema now)
- ❌ Delete existing data
- ❌ Modify existing data values

---

## 🔍 Verification Checklist

Before running `npm run db:push`, verify:

- [ ] **Backup** (if you have important data): Export your Neon database
- [ ] **Schema matches**: Current `shared/schema.ts` is what you want
- [ ] **No conflicts**: Check if you have old `user_secondary_affiliates` table
- [ ] **Environment**: `DATABASE_URL` is set correctly in Railway

---

## 📋 Expected Changes Summary

### New Columns Added:
1. **users**: `ic_document` (if not exists)
2. **business_profiles**: 
   - `business_name` (if not exists)
   - `business_email` (if not exists)
   - `qr_code` (if not exists)
   - `passport_id` (if not exists)
   - `business_license_documents` (jsonb, if not exists)
   - `registration_certificate_documents` (jsonb, if not exists)
   - `proof_of_operations_documents` (jsonb, if not exists)
   - `status` (if not exists)
   - `archived` (if not exists)
   - `priority` (if not exists)

### New Tables Created:
1. `business_secondary_affiliates` (if not exists)
2. `business_collaborations` (if not exists)
3. `collaboration_invitations` (if not exists)
4. `email_verification_tokens` (if not exists)

### Default Data Initialized:
- Main affiliates (if table is empty)
- Secondary affiliates (if table is empty)

---

## 🎯 Conclusion

**✅ SAFE TO RUN**: `npm run db:push` is safe - both columns are in schema!

**What happens**:
1. Compares `shared/schema.ts` with your Neon database
2. Adds missing columns/tables (if any)
3. Preserves ALL existing data (both `email_verified` and `verified`)
4. Initializes default data (chambers) if tables are empty

**Your data is safe!** 🛡️

---

## 🚀 Ready to Deploy?

### Optional: Verify Schema First

**Check your Neon database schema:**
```bash
npm run db:migrate-email-verified
```

This will show you:
- Current columns in your database
- User statistics
- Confirmation that both columns exist

### Push Schema

**On Railway:**
```bash
railway run npm run db:push
```

**Or Locally:**
```bash
npm run db:push
```

**No migration needed - both columns are preserved!** ✅

