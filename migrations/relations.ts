import { relations } from "drizzle-orm/relations";
import { users, businessProfiles, mainAffiliates, userSecondaryAffiliates, secondaryAffiliates } from "./schema";

export const businessProfilesRelations = relations(businessProfiles, ({one}) => ({
	user: one(users, {
		fields: [businessProfiles.userId],
		references: [users.id]
	}),
	mainAffiliate: one(mainAffiliates, {
		fields: [businessProfiles.primaryAffiliateId],
		references: [mainAffiliates.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	businessProfiles: many(businessProfiles),
	userSecondaryAffiliates: many(userSecondaryAffiliates),
}));

export const mainAffiliatesRelations = relations(mainAffiliates, ({many}) => ({
	businessProfiles: many(businessProfiles),
}));

export const userSecondaryAffiliatesRelations = relations(userSecondaryAffiliates, ({one}) => ({
	user: one(users, {
		fields: [userSecondaryAffiliates.userId],
		references: [users.id]
	}),
	secondaryAffiliate: one(secondaryAffiliates, {
		fields: [userSecondaryAffiliates.secondaryAffiliateId],
		references: [secondaryAffiliates.id]
	}),
}));

export const secondaryAffiliatesRelations = relations(secondaryAffiliates, ({many}) => ({
	userSecondaryAffiliates: many(userSecondaryAffiliates),
}));