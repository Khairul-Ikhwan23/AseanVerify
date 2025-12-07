import { pgTable, unique, varchar, text, foreignKey, boolean } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const users = pgTable("users", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	businessName: text("business_name").notNull(),
	email: text().notNull(),
	password: text().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const businessProfiles = pgTable("business_profiles", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	address: text(),
	category: text(),
	phone: text(),
	website: text(),
	tagline: text(),
	businessRegistrationNumber: text("business_registration_number"),
	ownerName: text("owner_name"),
	yearEstablished: text("year_established"),
	numberOfEmployees: text("number_of_employees"),
	completed: boolean().default(false),
	qrScans: text("qr_scans").default('0'),
	networkConnections: text("network_connections").default('0'),
	profilePicture: text("profile_picture"),
	verified: boolean().default(false),
	paymentStatus: text("payment_status").default('pending'),
	businessLicense: text("business_license"),
	registrationCertificate: text("registration_certificate"),
	proofOfOperations: text("proof_of_operations"),
	primaryAffiliateId: varchar("primary_affiliate_id"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "business_profiles_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.primaryAffiliateId],
			foreignColumns: [mainAffiliates.id],
			name: "business_profiles_primary_affiliate_id_main_affiliates_id_fk"
		}),
]);

export const mainAffiliates = pgTable("main_affiliates", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	createdAt: text("created_at").default(CURRENT_TIMESTAMP),
});

export const userSecondaryAffiliates = pgTable("user_secondary_affiliates", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	userId: varchar("user_id").notNull(),
	secondaryAffiliateId: varchar("secondary_affiliate_id").notNull(),
	createdAt: text("created_at").default(CURRENT_TIMESTAMP),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_secondary_affiliates_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.secondaryAffiliateId],
			foreignColumns: [secondaryAffiliates.id],
			name: "user_secondary_affiliates_secondary_affiliate_id_secondary_affi"
		}),
]);

export const secondaryAffiliates = pgTable("secondary_affiliates", {
	id: varchar().default(gen_random_uuid()).primaryKey().notNull(),
	name: text().notNull(),
	createdAt: text("created_at").default(CURRENT_TIMESTAMP),
});
