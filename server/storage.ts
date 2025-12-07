
import { type User, type InsertUser, type BusinessProfile, type InsertBusinessProfile, type MainAffiliate, type SecondaryAffiliate, type BusinessSecondaryAffiliate, type EmailVerificationToken, users, businessProfiles, mainAffiliates, secondaryAffiliates, businessSecondaryAffiliates, emailVerificationTokens } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, inArray, sql } from "drizzle-orm";
import { CollaborationInvitation, collaborationInvitations, BusinessCollaboration, businessCollaborations } from "@shared/schema";
import { and } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  updateUserVerification(userId: string, verified: boolean): Promise<User | undefined>; // Updates email_verified
  updateUserAdminVerification(userId: string, verified: boolean): Promise<User | undefined>; // Updates verified (admin)
  deleteUser(userId: string): Promise<boolean>;
  getBusinessProfile(userId: string): Promise<BusinessProfile | undefined>;
  getBusinessProfileById(businessId: string): Promise<BusinessProfile | undefined>;
  createBusinessProfile(profile: InsertBusinessProfile): Promise<BusinessProfile>;
  updateBusinessProfile(userId: string, profile: Partial<InsertBusinessProfile>): Promise<BusinessProfile | undefined>;
  getAllMainAffiliates(): Promise<MainAffiliate[]>;
  getAllSecondaryAffiliates(): Promise<SecondaryAffiliate[]>;
  getBusinessSecondaryAffiliates(businessId: string): Promise<BusinessSecondaryAffiliate[]>;
  setBusinessSecondaryAffiliates(businessId: string, secondaryAffiliateIds: string[]): Promise<void>;
  initializeAffiliates(): Promise<void>;
  getAllUsersWithProfiles(): Promise<any[]>;
  // New methods for multi-business support
  getAllBusinesses(): Promise<any[]>;
  getUserBusinesses(userId: string): Promise<BusinessProfile[]>;
  createBusiness(businessData: InsertBusinessProfile): Promise<BusinessProfile>;
  updateBusinessStatus(businessId: string, status: string, verified?: boolean, rejected?: boolean, rejectionReason?: string, paymentStatus?: string): Promise<BusinessProfile | undefined>;
  deleteBusiness(businessId: string): Promise<boolean>;
  // Collaboration methods
  sendCollaborationInvitation(businessId: string, inviterId: string, inviteeEmail: string, message?: string): Promise<CollaborationInvitation>;
  getCollaborationInvitations(userId: string): Promise<CollaborationInvitation[]>;
  respondToInvitation(invitationId: string, action: 'accept' | 'reject'): Promise<boolean>;
  getBusinessCollaborators(businessId: string): Promise<BusinessCollaboration[]>;
  removeCollaborator(businessId: string, collaboratorId: string): Promise<boolean>;
  getCollaboratedBusinesses(userId: string): Promise<BusinessProfile[]>;
  isBusinessCollaborator(businessId: string, userId: string): Promise<boolean>;
  // Email verification
  createEmailVerificationToken(userId: string, tokenHash: string, expiresAt: Date): Promise<EmailVerificationToken>;
  getEmailVerificationTokenByHash(tokenHash: string): Promise<EmailVerificationToken | undefined>;
  deleteEmailVerificationToken(id: string): Promise<void>;
}

export class PostgresStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;

  constructor() {
    const sql = neon(process.env.DATABASE_URL!);
    this.db = drizzle(sql);
  }

  async getUser(id: string): Promise<User | undefined> {
    console.log('Storage: Getting user with ID:', id);
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    console.log('Storage: Retrieved user data:', result[0]);
    return result[0];
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    console.log('Storage: Creating user with data:', {
      ...insertUser,
      password: insertUser.password ? 'Password provided' : 'No password'
    });
    
    const result = await this.db.insert(users).values(insertUser).returning();
    console.log('Storage: Created user result:', result[0]);
    return result[0];
  }

  async getBusinessProfile(userId: string): Promise<BusinessProfile | undefined> {
    const result = await this.db.select().from(businessProfiles).where(eq(businessProfiles.userId, userId)).limit(1);
    return result[0];
  }

  async getBusinessProfileById(businessId: string): Promise<BusinessProfile | undefined> {
    console.log('Storage: Getting business profile by ID:', businessId);
    const result = await this.db.select().from(businessProfiles).where(eq(businessProfiles.id, businessId)).limit(1);
    console.log('Storage: Retrieved business profile by ID:', result[0]);
    return result[0];
  }

  async createBusinessProfile(insertProfile: InsertBusinessProfile): Promise<BusinessProfile> {
    console.log('Storage: Creating business profile with data:', {
      ...insertProfile,
      businessLicense: insertProfile.businessLicense ? 'Document present' : 'No document',
      registrationCertificate: insertProfile.registrationCertificate ? 'Document present' : 'No document',
      proofOfOperations: insertProfile.proofOfOperations ? 'Document present' : 'No document',
    });
    
    const result = await this.db.insert(businessProfiles).values(insertProfile).returning();
    console.log('Storage: Created profile result:', result[0]);
    return result[0];
  }

  async updateBusinessProfile(userId: string, updates: Partial<InsertBusinessProfile>): Promise<BusinessProfile | undefined> {
    console.log('Storage: Updating business profile for user:', userId, 'with updates:', {
      ...updates,
      businessLicense: updates.businessLicense ? 'Document present' : 'No document',
      registrationCertificate: updates.registrationCertificate ? 'Document present' : 'No document',
      proofOfOperations: updates.proofOfOperations ? 'Document present' : 'No document',
    });
    
    const result = await this.db
      .update(businessProfiles)
      .set(updates)
      .where(eq(businessProfiles.userId, userId))
      .returning();
    
    console.log('Storage: Updated profile result:', result[0]);
    return result[0];
  }

  async getAllMainAffiliates(): Promise<MainAffiliate[]> {
    return await this.db.select().from(mainAffiliates).orderBy(mainAffiliates.name);
  }

  async getAllSecondaryAffiliates(): Promise<SecondaryAffiliate[]> {
    return await this.db.select().from(secondaryAffiliates).orderBy(secondaryAffiliates.name);
  }

  async getBusinessSecondaryAffiliates(businessId: string): Promise<BusinessSecondaryAffiliate[]> {
    return await this.db.select().from(businessSecondaryAffiliates).where(eq(businessSecondaryAffiliates.businessId, businessId));
  }

  async setBusinessSecondaryAffiliates(businessId: string, secondaryAffiliateIds: string[]): Promise<void> {
    // First, delete existing associations
    await this.db.delete(businessSecondaryAffiliates).where(eq(businessSecondaryAffiliates.businessId, businessId));
    
    // Then, insert new associations
    if (secondaryAffiliateIds.length > 0) {
      const associations = secondaryAffiliateIds.map(affiliateId => ({
        businessId,
        secondaryAffiliateId: affiliateId
      }));
      await this.db.insert(businessSecondaryAffiliates).values(associations);
    }
  }

  async initializeAffiliates(): Promise<void> {
    // Check if main affiliates already exist
    const existingMainAffiliates = await this.getAllMainAffiliates();
    if (existingMainAffiliates.length === 0) {
      const mainAffiliateData = [
        { name: "Malay Chambers" },
        { name: "Chinese Chambers" },
        { name: "Indian Chambers" },
        { name: "Others" }
      ];
      await this.db.insert(mainAffiliates).values(mainAffiliateData);
      console.log('Storage: Initialized main affiliates');
    }

    // Check if secondary affiliates already exist
    const existingSecondaryAffiliates = await this.getAllSecondaryAffiliates();
    if (existingSecondaryAffiliates.length === 0) {
      const secondaryAffiliateData = [
        { name: "BEDB" },
        { name: "Dynamik Technologies" }
      ];
      await this.db.insert(secondaryAffiliates).values(secondaryAffiliateData);
      console.log('Storage: Initialized secondary affiliates');
    }
  }

  async getAllUsersWithProfiles(): Promise<any[]> {
    console.log('Storage: Getting all users with their businesses...');
    const allUsers = await this.db.select().from(users);
    console.log('Storage: Found users in database:', allUsers.length);
    
    const usersWithBusinesses = [];

    for (const user of allUsers) {
      const userBusinesses = await this.getUserBusinesses(user.id);
      console.log(`Storage: Businesses for user ${user.id}:`, userBusinesses.length);
      usersWithBusinesses.push({
        ...user,
        businesses: userBusinesses
      });
    }

    console.log('Storage: Returning users with businesses:', usersWithBusinesses.length);
    return usersWithBusinesses;
  }

  async getAllBusinesses(): Promise<any[]> {
    console.log('Storage: Getting all businesses with user info...');
    
    // Get all businesses with their user information
    const businessesWithUsers = await this.db
      .select({
        business: businessProfiles,
        user: users
      })
      .from(businessProfiles)
      .leftJoin(users, eq(businessProfiles.userId, users.id));
    
    console.log('Storage: Found businesses:', businessesWithUsers.length);
    
    // Transform the data to include user info with each business
    const businesses = businessesWithUsers.map(({ business, user }) => ({
      ...business,
      user: user ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      } : null
    }));

    console.log('Storage: Returning businesses with user info:', businesses.length);
    return businesses;
  }

  async updateUser(userId: string, updates: any): Promise<User | undefined> {
    console.log('Storage: Updating user:', userId, 'with updates:', updates);
    
    // Handle password change if provided
    if (updates.currentPassword && updates.newPassword) {
      // First verify current password
      const currentUser = await this.db.select().from(users).where(eq(users.id, userId));
      if (!currentUser[0] || currentUser[0].password !== updates.currentPassword) {
        throw new Error('Current password is incorrect');
      }
      
      // Update with new password
      const result = await this.db
        .update(users)
        .set({ 
          email: updates.email || currentUser[0].email,
          password: updates.newPassword 
        })
        .where(eq(users.id, userId))
        .returning();
      
      console.log('Storage: Updated user with password change result:', result[0]);
      return result[0];
    }
    
    // Regular update without password change
    const { currentPassword, newPassword, ...regularUpdates } = updates;
    const result = await this.db
      .update(users)
      .set(regularUpdates)
      .where(eq(users.id, userId))
      .returning();
    
    console.log('Storage: Updated user result:', result[0]);
    return result[0];
  }

  async updateUserVerification(userId: string, verified: boolean): Promise<User | undefined> {
    console.log('Storage: Updating user email verification:', userId, 'emailVerified:', verified);
    
    const result = await this.db
      .update(users)
      .set({ emailVerified: verified })
      .where(eq(users.id, userId))
      .returning();
    
    console.log('Storage: Updated user email verification result:', result[0]);
    return result[0];
  }

  async updateUserAdminVerification(userId: string, verified: boolean): Promise<User | undefined> {
    console.log('Storage: Updating user admin verification:', userId, 'verified:', verified);
    
    const result = await this.db
      .update(users)
      .set({ verified })
      .where(eq(users.id, userId))
      .returning();
    
    console.log('Storage: Updated user admin verification result:', result[0]);
    return result[0];
  }

  async deleteUser(userId: string): Promise<boolean> {
    console.log('Storage: Deleting user:', userId);
    
    try {
      // First delete the business profile
      await this.db.delete(businessProfiles).where(eq(businessProfiles.userId, userId));
      console.log('Storage: Deleted business profile for user:', userId);
      
      // Delete business secondary affiliates for all user's businesses
      const userBusinesses = await this.getUserBusinesses(userId);
      for (const business of userBusinesses) {
        await this.db.delete(businessSecondaryAffiliates).where(eq(businessSecondaryAffiliates.businessId, business.id));
      }
      console.log('Storage: Deleted business secondary affiliates for user:', userId);
      
      // Finally delete the user
      const result = await this.db.delete(users).where(eq(users.id, userId)).returning();
      console.log('Storage: Deleted user result:', result[0]);
      
      return result.length > 0;
    } catch (error) {
      console.error('Storage: Error deleting user:', error);
      return false;
    }
  }

  async getUserBusinesses(userId: string): Promise<BusinessProfile[]> {
    console.log('Storage: Getting businesses for user:', userId);
    const startTime = Date.now();
    const result = await this.db
      .select()
      .from(businessProfiles)
      .where(eq(businessProfiles.userId, userId))
      .orderBy(businessProfiles.archived, businessProfiles.createdAt);
    const endTime = Date.now();
    console.log(`Storage: Found ${result.length} businesses for user ${userId} in ${endTime - startTime}ms`);
    return result;
  }

  async createBusiness(businessData: InsertBusinessProfile): Promise<BusinessProfile> {
    console.log('Storage: Creating new business profile for user:', businessData.userId);
    // Determine priority as (existing businesses + 1)
    const existing = await this.getUserBusinesses(businessData.userId);
    const priority = (existing?.length ?? 0) + 1;
    const result = await this.db.insert(businessProfiles).values({ ...businessData, priority }).returning();
    // Increment user's businessCount
    await this.db
      .update(users)
      .set({ businessCount: sql`${users.businessCount} + 1` })
      .where(eq(users.id, businessData.userId));
    console.log('Storage: Created new business profile result:', result[0]);
    return result[0];
  }

  async updateBusinessStatus(businessId: string, status: string, verified?: boolean, rejected?: boolean, rejectionReason?: string, paymentStatus?: string): Promise<BusinessProfile | undefined> {
    console.log('Storage: Updating business status for business:', businessId, 'to', status, 'with verified:', verified, 'rejected:', rejected, 'reason:', rejectionReason, 'paymentStatus:', paymentStatus);
    const updateData: any = { status };
    
    // Only update verified/rejected if explicitly provided
    if (verified !== undefined) {
      updateData.verified = verified;
    }
    if (rejected !== undefined) {
      updateData.rejected = rejected;
    }
    if (rejectionReason !== undefined) {
      updateData.rejectionReason = rejectionReason;
    }
    if (paymentStatus !== undefined) {
      updateData.paymentStatus = paymentStatus;
    }
    
    const result = await this.db
      .update(businessProfiles)
      .set(updateData)
      .where(eq(businessProfiles.id, businessId))
      .returning();
    console.log('Storage: Updated business status result:', result[0]);
    return result[0];
  }

  async updateBusiness(businessId: string, updates: any): Promise<BusinessProfile | undefined> {
    console.log('Storage: Updating business:', businessId, 'with updates:', updates);
    
    const result = await this.db
      .update(businessProfiles)
      .set(updates)
      .where(eq(businessProfiles.id, businessId))
      .returning();
    
    console.log('Storage: Updated business result:', result[0]);
    return result[0];
  }

  async deleteBusiness(businessId: string): Promise<boolean> {
    console.log('Storage: Deleting business:', businessId);
    
    try {
      // Fetch business to get userId for decrement
      const target = await this.db.select().from(businessProfiles).where(eq(businessProfiles.id, businessId)).limit(1);
      const result = await this.db
        .delete(businessProfiles)
        .where(eq(businessProfiles.id, businessId))
        .returning();
      
      console.log('Storage: Deleted business result:', result[0]);
      if (result.length > 0 && target[0]) {
        await this.db
          .update(users)
          .set({ businessCount: sql`${users.businessCount} - 1` })
          .where(eq(users.id, (target[0] as any).userId));
      }
      return result.length > 0;
    } catch (error) {
      console.error('Storage: Error deleting business:', error);
      return false;
    }
  }

  async toggleBusinessArchive(businessId: string, archived: boolean): Promise<BusinessProfile | undefined> {
    console.log('Storage: Toggling archive status for business:', businessId, 'to:', archived);
    
    try {
      const result = await this.db
        .update(businessProfiles)
        .set({ archived })
        .where(eq(businessProfiles.id, businessId))
        .returning();
      
      console.log('Storage: Updated business archive status result:', result[0]);
      return result[0];
    } catch (error) {
      console.error('Storage: Error updating business archive status:', error);
      return undefined;
    }
  }

  // Collaboration methods
  async sendCollaborationInvitation(businessId: string, inviterId: string, inviteeEmail: string, message?: string): Promise<CollaborationInvitation> {
    console.log('Storage: Sending collaboration invitation for business:', businessId, 'from:', inviterId, 'to:', inviteeEmail);
    
    // Check if user with this email exists
    const invitee = await this.getUserByEmail(inviteeEmail);
    if (!invitee) {
      throw new Error('User with this email does not exist');
    }
    
    // Check if invitation already exists
    const existingInvitation = await this.db
      .select()
      .from(collaborationInvitations)
      .where(and(
        eq(collaborationInvitations.businessId, businessId),
        eq(collaborationInvitations.inviteeEmail, inviteeEmail),
        eq(collaborationInvitations.status, 'pending')
      ));
    
    if (existingInvitation.length > 0) {
      throw new Error('Invitation already sent to this user');
    }
    
    const result = await this.db.insert(collaborationInvitations).values({
      businessId,
      inviterId,
      inviteeEmail,
      message,
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    }).returning();
    
    console.log('Storage: Sent collaboration invitation result:', result[0]);
    return result[0];
  }

  async getCollaborationInvitations(userId: string): Promise<CollaborationInvitation[]> {
    console.log('Storage: Getting collaboration invitations for user:', userId);
    
    // Get user's email first
    const user = await this.getUser(userId);
    if (!user) {
      return [];
    }
    
    const result = await this.db
      .select()
      .from(collaborationInvitations)
      .where(and(
        eq(collaborationInvitations.inviteeEmail, user.email),
        eq(collaborationInvitations.status, 'pending')
      ));
    
    console.log('Storage: Found collaboration invitations:', result.length);
    return result;
  }

  async respondToInvitation(invitationId: string, action: 'accept' | 'reject'): Promise<boolean> {
    console.log('Storage: Responding to collaboration invitation:', invitationId, 'with action:', action);
    
    const invitation = await this.db
      .select()
      .from(collaborationInvitations)
      .where(eq(collaborationInvitations.id, invitationId))
      .limit(1);
    
    if (!invitation[0]) {
      console.error('Storage: Collaboration invitation not found for ID:', invitationId);
      return false;
    }

    const updatedStatus = action === 'accept' ? 'accepted' : 'rejected';
    
    // Update invitation status
    await this.db
      .update(collaborationInvitations)
      .set({ status: updatedStatus })
      .where(eq(collaborationInvitations.id, invitationId));
    
    // If accepted, create collaboration
    if (action === 'accept') {
      const invitee = await this.getUserByEmail(invitation[0].inviteeEmail);
      if (invitee) {
        await this.db.insert(businessCollaborations).values({
          businessId: invitation[0].businessId,
          ownerId: invitation[0].inviterId,
          collaboratorId: invitee.id,
          status: 'accepted',
          role: 'collaborator'
        });
      }
    }
    
    console.log('Storage: Responded to collaboration invitation successfully');
    return true;
  }

  async getBusinessCollaborators(businessId: string): Promise<BusinessCollaboration[]> {
    console.log('Storage: Getting collaborators for business:', businessId);
    const result = await this.db
      .select()
      .from(businessCollaborations)
      .where(and(
        eq(businessCollaborations.businessId, businessId),
        eq(businessCollaborations.status, 'accepted')
      ));
    console.log('Storage: Found collaborators:', result.length);
    return result;
  }

  async removeCollaborator(businessId: string, collaboratorId: string): Promise<boolean> {
    console.log('Storage: Removing collaborator from business:', businessId, 'collaborator:', collaboratorId);
    const result = await this.db
      .delete(businessCollaborations)
      .where(and(
        eq(businessCollaborations.businessId, businessId),
        eq(businessCollaborations.collaboratorId, collaboratorId)
      ))
      .returning();
    
    console.log('Storage: Removed collaborator result:', result.length > 0);
    return result.length > 0;
  }

  async getCollaboratedBusinesses(userId: string): Promise<BusinessProfile[]> {
    console.log('Storage: Getting collaborated businesses for user:', userId);
    
    // Get businesses where user is a collaborator
    const collaborations = await this.db
      .select()
      .from(businessCollaborations)
      .where(and(
        eq(businessCollaborations.collaboratorId, userId),
        eq(businessCollaborations.status, 'accepted')
      ));
    
    if (collaborations.length === 0) {
      return [];
    }
    
    const businessIds = collaborations.map(c => c.businessId);
    const result = await this.db
      .select()
      .from(businessProfiles)
      .where(inArray(businessProfiles.id, businessIds));
    
    console.log('Storage: Found collaborated businesses:', result.length);
    return result;
  }

  async isBusinessCollaborator(businessId: string, userId: string): Promise<boolean> {
    console.log('Storage: Checking if user is collaborator for business:', businessId, 'user:', userId);
    const result = await this.db
      .select()
      .from(businessCollaborations)
      .where(and(
        eq(businessCollaborations.businessId, businessId),
        eq(businessCollaborations.collaboratorId, userId),
        eq(businessCollaborations.status, 'accepted')
      ));
    console.log('Storage: Is collaborator:', result.length > 0);
    return result.length > 0;
  }

  // QR Code and Passport methods
  async generateBusinessQRCode(businessId: string): Promise<{ qrCode: string; passportId: string }> {
    console.log('Storage: Generating QR code for business:', businessId);
    
    // Generate unique passport ID
    const passportId = `MP-${businessId.slice(-8).toUpperCase()}-${new Date().getFullYear()}`;
    
    // Generate QR code data
    const qrData = JSON.stringify({
      businessId,
      passportId,
      timestamp: new Date().toISOString(),
      type: 'msme-passport'
    });
    
    // Update business with QR code and passport ID
    const result = await this.db
      .update(businessProfiles)
      .set({ 
        qrCode: qrData,
        passportId: passportId
      })
      .where(eq(businessProfiles.id, businessId))
      .returning();
    
    console.log('Storage: Generated QR code for business:', result[0]);
    return { qrCode: qrData, passportId };
  }

  async verifyBusinessByQRCode(qrData: string): Promise<BusinessProfile | null> {
    console.log('Storage: Verifying business by QR code');
    
    try {
      const qrInfo = JSON.parse(qrData);
      
      if (qrInfo.type !== 'msme-passport') {
        console.log('Storage: Invalid QR code type');
        return null;
      }
      
      const business = await this.db
        .select()
        .from(businessProfiles)
        .where(and(
          eq(businessProfiles.id, qrInfo.businessId),
          eq(businessProfiles.verified, true),
          eq(businessProfiles.paymentStatus, 'paid')
        ))
        .limit(1);
      
      if (business.length === 0) {
        console.log('Storage: Business not found or not verified');
        return null;
      }
      
      console.log('Storage: Business verified successfully:', business[0]);
      return business[0];
    } catch (error) {
      console.error('Storage: Error verifying QR code:', error);
      return null;
    }
  }

  async getBusinessByPassportId(passportId: string): Promise<BusinessProfile | null> {
    console.log('Storage: Getting business by passport ID:', passportId);
    
    const result = await this.db
      .select()
      .from(businessProfiles)
      .where(and(
        eq(businessProfiles.passportId, passportId),
        eq(businessProfiles.verified, true),
        eq(businessProfiles.paymentStatus, 'paid')
      ))
      .limit(1);
    
    console.log('Storage: Found business by passport ID:', result.length > 0);
    return result[0] || null;
  }

  // Email verification
  async createEmailVerificationToken(userId: string, tokenHash: string, expiresAt: Date): Promise<EmailVerificationToken> {
    const result = await this.db.insert(emailVerificationTokens).values({ userId, tokenHash, expiresAt }).returning();
    return result[0];
  }

  async getEmailVerificationTokenByHash(tokenHash: string): Promise<EmailVerificationToken | undefined> {
    const result = await this.db.select().from(emailVerificationTokens).where(eq(emailVerificationTokens.tokenHash, tokenHash)).limit(1);
    return result[0];
  }

  async deleteEmailVerificationToken(id: string): Promise<void> {
    await this.db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, id));
  }
}

export const storage = new PostgresStorage();
