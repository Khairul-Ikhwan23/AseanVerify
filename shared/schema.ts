import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, index, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  profilePicture: text("profile_picture"),
  dateOfBirth: text("date_of_birth"),
  gender: text("gender"),
  phoneNumber: text("phone_number"),
  icDocument: text("ic_document"), // Base64 encoded IC document
  emailVerified: boolean("email_verified").default(false), // Email verification status
  verified: boolean("verified").default(false), // Admin verification status (for business creation)
  businessCount: integer("business_count").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const businessProfiles = pgTable("business_profiles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  businessName: text("business_name").notNull().default("Default Business"), // Each business can have its own name
  businessEmail: text("business_email"), // Separate email for each business
  address: text("address"),
  category: text("category"),
  phone: text("phone"),
  website: text("website"),
  tagline: text("tagline"),
  businessRegistrationNumber: text("business_registration_number"),
  ownerName: text("owner_name"),
  yearEstablished: text("year_established"),
  numberOfEmployees: text("number_of_employees"),
  primaryAffiliateId: varchar("primary_affiliate_id").notNull().references(() => mainAffiliates.id), // Required primary chamber
  qrScans: text("qr_scans").default("0"),
  networkConnections: text("network_connections").default("0"),
  qrCode: text("qr_code"), // Unique QR code for verified businesses
  passportId: text("passport_id"), // Unique passport identifier
  profilePicture: text("profile_picture"),
  businessLicense: text("business_license"),
  businessLicenseDocuments: jsonb("business_license_documents"), // Array of base64 documents
  registrationCertificate: text("registration_certificate"),
  registrationCertificateDocuments: jsonb("registration_certificate_documents"), // Array of base64 documents
  proofOfOperations: text("proof_of_operations"),
  proofOfOperationsDocuments: jsonb("proof_of_operations_documents"), // Array of base64 documents
  completed: boolean("completed").default(false),
  verified: boolean("verified").default(false),
  paymentStatus: text("payment_status").default("pending"),
  rejected: boolean("rejected").default(false),
  rejectionReason: text("rejection_reason"),
  status: text("status").default("pending"), // pending, verified, rejected
  archived: boolean("archived").default(false),
  priority: integer("priority"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  userIdIdx: index("business_profiles_user_id_idx").on(table.userId),
}));

export const mainAffiliates = pgTable("main_affiliates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const secondaryAffiliates = pgTable("secondary_affiliates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const businessSecondaryAffiliates = pgTable("business_secondary_affiliates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businessProfiles.id, { onDelete: "cascade" }),
  secondaryAffiliateId: varchar("secondary_affiliate_id").notNull().references(() => secondaryAffiliates.id),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Business collaboration tables
export const businessCollaborations = pgTable("business_collaborations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businessProfiles.id, { onDelete: "cascade" }),
  ownerId: varchar("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  collaboratorId: varchar("collaborator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  role: text("role").notNull().default("collaborator"), // owner, collaborator
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  businessIdIdx: index("business_collaborations_business_id_idx").on(table.businessId),
  ownerIdIdx: index("business_collaborations_owner_id_idx").on(table.ownerId),
  collaboratorIdIdx: index("business_collaborations_collaborator_id_idx").on(table.collaboratorId),
}));

export const collaborationInvitations = pgTable("collaboration_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  businessId: varchar("business_id").notNull().references(() => businessProfiles.id, { onDelete: "cascade" }),
  inviterId: varchar("inviter_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  inviteeEmail: text("invitee_email").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, expired
  message: text("message"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  businessIdIdx: index("collaboration_invitations_business_id_idx").on(table.businessId),
  inviterIdIdx: index("collaboration_invitations_inviter_id_idx").on(table.inviterId),
  inviteeEmailIdx: index("collaboration_invitations_invitee_email_idx").on(table.inviteeEmail),
}));

// Email verification tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  usedAt: timestamp("used_at"),
}, (table) => ({
  userIdIdx: index("email_verification_tokens_user_id_idx").on(table.userId),
  expiresAtIdx: index("email_verification_tokens_expires_at_idx").on(table.expiresAt),
}));

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertBusinessProfileSchema = createInsertSchema(businessProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMainAffiliateSchema = createInsertSchema(mainAffiliates).omit({ id: true, createdAt: true });
export const insertSecondaryAffiliateSchema = createInsertSchema(secondaryAffiliates).omit({ id: true, createdAt: true });
export const insertBusinessSecondaryAffiliateSchema = createInsertSchema(businessSecondaryAffiliates).omit({ id: true, createdAt: true });
export const insertBusinessCollaborationSchema = createInsertSchema(businessCollaborations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCollaborationInvitationSchema = createInsertSchema(collaborationInvitations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertEmailVerificationTokenSchema = createInsertSchema(emailVerificationTokens).omit({ id: true, createdAt: true, usedAt: true });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Signup schema for new account creation
export const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// New schemas for business management
export const createBusinessSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  businessEmail: z.string().optional(),
  category: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  tagline: z.string().optional(),
  businessRegistrationNumber: z.string().optional(),
  ownerName: z.string().optional(),
  yearEstablished: z.string().optional(),
  numberOfEmployees: z.string().optional(),
  primaryAffiliateId: z.string().min(1, "Primary chamber is required"), // Required primary chamber
  secondaryAffiliateIds: z.array(z.string()).optional(), // Optional multiple secondary chambers
  profilePicture: z.string().optional(),
  businessLicense: z.string().optional(),
  businessLicenseDocuments: z.array(z.string()).optional(), // Array of base64 documents
  registrationCertificate: z.string().optional(),
  registrationCertificateDocuments: z.array(z.string()).optional(), // Array of base64 documents
  proofOfOperations: z.string().optional(),
  proofOfOperationsDocuments: z.array(z.string()).optional(), // Array of base64 documents
});

export const businessStatusSchema = z.enum(["pending", "verified", "rejected"]);

// User profile update schema
export const updateUserProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  profilePicture: z.string().optional(),
  icDocument: z.string().optional(),
});

// Password change schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Collaboration schemas
export const sendCollaborationInvitationSchema = z.object({
  businessId: z.string().min(1, "Business ID is required"),
  inviteeEmail: z.string().email("Invalid email address"),
  message: z.string().optional(),
});

export const respondToInvitationSchema = z.object({
  invitationId: z.string().min(1, "Invitation ID is required"),
  action: z.enum(["accept", "reject"]),
});

export const removeCollaboratorSchema = z.object({
  businessId: z.string().min(1, "Business ID is required"),
  collaboratorId: z.string().min(1, "Collaborator ID is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertBusinessProfile = z.infer<typeof insertBusinessProfileSchema>;
export type BusinessProfile = typeof businessProfiles.$inferSelect;
export type MainAffiliate = typeof mainAffiliates.$inferSelect;
export type SecondaryAffiliate = typeof secondaryAffiliates.$inferSelect;
export type BusinessSecondaryAffiliate = typeof businessSecondaryAffiliates.$inferSelect;
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type SignupData = z.infer<typeof signupSchema>;
export type CreateBusinessData = z.infer<typeof createBusinessSchema>;
export type BusinessStatus = z.infer<typeof businessStatusSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;

// Collaboration types
export type BusinessCollaboration = typeof businessCollaborations.$inferSelect;
export type CollaborationInvitation = typeof collaborationInvitations.$inferSelect;
export type SendCollaborationInvitation = z.infer<typeof sendCollaborationInvitationSchema>;
export type RespondToInvitation = z.infer<typeof respondToInvitationSchema>;
export type RemoveCollaborator = z.infer<typeof removeCollaboratorSchema>;
