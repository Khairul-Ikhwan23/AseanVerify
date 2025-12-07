import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, loginSchema, signupSchema, insertBusinessProfileSchema, createBusinessSchema, sendCollaborationInvitationSchema, respondToInvitationSchema, removeCollaboratorSchema } from "@shared/schema";
import { z } from "zod";
import * as authController from "./controllers/authController";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/signup", authController.signup);

  app.post("/api/auth/login", authController.login);

  app.get("/api/auth/verify", authController.verifyEmail);
  app.post("/api/auth/resend-verification", authController.resendVerification);

  // Dev-only: send a test email to verify SMTP/Ethereal setup
  if (process.env.NODE_ENV !== 'production') {
    app.post("/api/dev/test-email", async (req, res) => {
      try {
        const to = (req.body?.to || "").toString();
        if (!to) return res.status(400).json({ message: "Missing 'to' address" });
        const base = process.env.APP_BASE_URL || "http://localhost:5173";
        const link = `${base}/verify?token=dummy`;
        const { sendVerificationEmail } = await import("./services/emailService");
        await sendVerificationEmail(to, link);
        return res.json({ message: "Test email sent (check console for Ethereal preview URL if using fallback)." });
      } catch (e: any) {
        return res.status(500).json({ message: e?.message || "Failed to send test email" });
      }
    });
  }

  // Profile routes
  app.get("/api/profile/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const profile = await storage.getBusinessProfile(userId);
      res.json({ profile });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch profile" });
    }
  });

  // User data route (includes verification status)
  app.get("/api/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });

  app.post("/api/profile", async (req, res) => {
    try {
      console.log('Creating profile with data:', {
        ...req.body,
        businessLicense: req.body.businessLicense ? 'Document present' : 'No document',
        registrationCertificate: req.body.registrationCertificate ? 'Document present' : 'No document',
        proofOfOperations: req.body.proofOfOperations ? 'Document present' : 'No document',
      });
      
      const profileData = insertBusinessProfileSchema.parse(req.body);
      console.log('Parsed profile data:', {
        ...profileData,
        businessLicense: profileData.businessLicense ? 'Document present' : 'No document',
        registrationCertificate: profileData.registrationCertificate ? 'Document present' : 'No document',
        proofOfOperations: profileData.proofOfOperations ? 'Document present' : 'No document',
      });
      
      const profile = await storage.createBusinessProfile(profileData);
      res.json({ profile });
    } catch (error) {
      console.error('Error creating profile:', error);
      res.status(400).json({ message: "Invalid profile data" });
    }
  });

  app.patch("/api/profile/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;
      
      console.log('Updating profile for user:', userId, 'with data:', {
        ...updates,
        businessLicense: updates.businessLicense ? 'Document present' : 'No document',
        registrationCertificate: updates.registrationCertificate ? 'Document present' : 'No document',
        proofOfOperations: updates.proofOfOperations ? 'Document present' : 'No document',
      });
      
      const profile = await storage.updateBusinessProfile(userId, updates);
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      res.json({ profile });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(400).json({ message: "Failed to update profile" });
    }
  });

  // User profile update route (for profile and password changes)
  app.patch("/api/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const { email, currentPassword, newPassword, ...profileUpdates } = req.body;
      
      console.log('Updating user profile for user:', userId, 'with data:', {
        email: email ? 'Email provided' : 'No email change',
        passwordChange: newPassword ? 'Password change requested' : 'No password change',
        profileUpdates: Object.keys(profileUpdates).length > 0 ? 'Profile updates provided' : 'No profile updates',
      });
      
      // If password change is requested, include password fields
      const updateData = newPassword ? { email, currentPassword, newPassword, ...profileUpdates } : { email, ...profileUpdates };
      
      const user = await storage.updateUser(userId, updateData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(400).json({ message: "Failed to update user profile" });
    }
  });

  // User profile update route (for personal information)
  app.patch("/api/users/:userId/profile", async (req, res) => {
    try {
      const { userId } = req.params;
      const profileData = req.body;
      
      console.log('Updating user profile information for user:', userId, 'with data:', profileData);
      
      // Extract secondaryAffiliateIds before validation since it's not part of the user table
      const { secondaryAffiliateIds, ...userProfileData } = profileData;
      
      // Validate the profile data using the schema
      const { updateUserProfileSchema } = await import("@shared/schema");
      const validatedData = updateUserProfileSchema.parse(userProfileData);
      
      const user = await storage.updateUser(userId, validatedData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Note: Secondary affiliates are now handled at the business level, not user level
      console.log('User profile updated - secondary affiliates are now managed per business');

      res.json({ user });
    } catch (error) {
      console.error('Error updating user profile:', error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid profile data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to update user profile" });
      }
    }
  });

  // New multi-business routes
  app.get("/api/user/:userId/businesses", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log('API: Fetching businesses for user:', userId);
      const startTime = Date.now();
      const businesses = await storage.getUserBusinesses(userId);
      const endTime = Date.now();
      console.log(`API: Fetched ${businesses.length} businesses for user ${userId} in ${endTime - startTime}ms`);
      res.json({ businesses });
    } catch (error) {
      console.error('API: Error fetching user businesses:', error);
      res.status(500).json({ message: "Failed to fetch user businesses" });
    }
  });

  // Archive/Unarchive business (MUST come before general business routes)
  app.patch("/api/businesses/:businessId/archive", async (req, res) => {
    try {
      const { businessId } = req.params;
      const { archived } = req.body;
      
      console.log('Toggling archive status for business:', businessId, 'to:', archived);
      
      const business = await storage.toggleBusinessArchive(businessId, archived);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      res.json({ business });
    } catch (error) {
      console.error('Error toggling business archive status:', error);
      res.status(400).json({ message: "Failed to toggle business archive status" });
    }
  });

  // Update business status (MUST come before general business routes)
  app.patch("/api/businesses/:businessId/status", async (req, res) => {
    try {
      const { businessId } = req.params;
      const { status, verified, rejected, rejectionReason, paymentStatus } = req.body;
      
      console.log('Updating business status:', businessId, 'with data:', {
        status, verified, rejected, rejectionReason, paymentStatus
      });
      
      const business = await storage.updateBusinessStatus(
        businessId, 
        status, 
        verified, 
        rejected, 
        rejectionReason,
        paymentStatus
      );
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      console.log('Business status updated successfully:', business.id);
      res.json({ business });
    } catch (error) {
      console.error('Error updating business status:', error);
      res.status(400).json({ message: "Failed to update business status" });
    }
  });

  // Update business details
  app.patch("/api/businesses/:businessId", async (req, res) => {
    try {
      const { businessId } = req.params;
      const { secondaryAffiliateIds, ...updates } = req.body;
      
      console.log('Updating business:', businessId, 'with data:', updates);
      
      const business = await storage.updateBusiness(businessId, updates);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Handle secondary affiliates if provided
      if (secondaryAffiliateIds !== undefined) {
        await storage.setBusinessSecondaryAffiliates(businessId, secondaryAffiliateIds || []);
      }

      res.json({ business });
    } catch (error) {
      console.error('Error updating business:', error);
      res.status(400).json({ message: "Failed to update business" });
    }
  });

  // Delete business
  app.delete("/api/businesses/:businessId", async (req, res) => {
    try {
      const { businessId } = req.params;
      
      console.log('Deleting business:', businessId);
      
      const success = await storage.deleteBusiness(businessId);
      
      if (!success) {
        return res.status(404).json({ message: "Business not found" });
      }

      res.json({ message: "Business deleted successfully" });
    } catch (error) {
      console.error('Error deleting business:', error);
      res.status(400).json({ message: "Failed to delete business" });
    }
  });

  // Test endpoint to debug validation
  app.post("/api/test-validation", async (req, res) => {
    try {
      console.log('Test validation request:', req.body);
      const validatedData = createBusinessSchema.parse(req.body);
      console.log('Test validation successful:', validatedData);
      res.json({ success: true, data: validatedData });
    } catch (error) {
      console.log('Test validation error:', error);
      if (error instanceof z.ZodError) {
        console.log('Test Zod errors:', error.errors);
        res.status(400).json({ message: "Validation failed", errors: error.errors });
      } else {
        res.status(400).json({ message: "Test failed" });
      }
    }
  });

  app.post("/api/businesses", async (req, res) => {
    try {
      console.log('Business creation request received:', { 
        body: { ...req.body, businessLicenseDocuments: req.body.businessLicenseDocuments?.length || 0 },
        userId: req.body.userId 
      });
      
      const { userId, secondaryAffiliateIds, ...businessData } = req.body;
      
      if (!userId) {
        console.log('Business creation failed: userId is required');
        return res.status(400).json({ message: "userId is required" });
      }

      // Check if user is verified and profile is complete before allowing business creation
      const user = await storage.getUser(userId);
      if (!user) {
        console.log('Business creation failed: user not found');
        return res.status(404).json({ message: "User not found" });
      }

      // Enhanced verification check: User must be verified AND have complete profile
      if (!user.verified) {
        // Check profile completion percentage
        const requiredFields = [
          user.firstName,
          user.lastName,
          user.email,
          user.phoneNumber,
          user.dateOfBirth,
          user.gender,
          user.icDocument
        ];
        const filledFields = requiredFields.filter(field => field && field !== "").length;
        const completionPercentage = Math.round((filledFields / requiredFields.length) * 100);
        
        console.log('Business creation failed: user not verified', { 
          userId, 
          verified: user.verified, 
          profileCompletion: completionPercentage 
        });
        
        if (completionPercentage < 100) {
          const missingFields = [];
          if (!user.firstName) missingFields.push("First Name");
          if (!user.lastName) missingFields.push("Last Name");
          if (!user.email) missingFields.push("Email");
          if (!user.phoneNumber) missingFields.push("Phone Number");
          if (!user.dateOfBirth) missingFields.push("Date of Birth");
          if (!user.gender) missingFields.push("Gender");
          if (!user.icDocument) missingFields.push("IC Document");
          
          return res.status(403).json({ 
            message: `Complete your profile (${completionPercentage}% complete) and await admin verification to create businesses. Missing: ${missingFields.join(", ")}`,
            error: "PROFILE_INCOMPLETE",
            completionPercentage,
            missingFields
          });
        }
        
        return res.status(403).json({ 
          message: "Your profile is complete but awaiting admin verification. You'll be able to create businesses once verified by our admin team (1-3 business days).",
          error: "AWAITING_VERIFICATION",
          completionPercentage: 100
        });
      }
      
      // Use the createBusinessSchema for validation
      console.log('Validating business data:', businessData);
      const validatedData = createBusinessSchema.parse(businessData);
      console.log('Validation successful:', validatedData);
      
      // Create the business profile data
      const businessProfileData = {
        userId,
        businessName: validatedData.businessName,
        businessEmail: validatedData.businessEmail || null,
        category: validatedData.category || null,
        address: validatedData.address || null,
        phone: validatedData.phone || null,
        website: validatedData.website || null,
        tagline: validatedData.tagline || null,
        businessRegistrationNumber: validatedData.businessRegistrationNumber || null,
        ownerName: validatedData.ownerName || null,
        yearEstablished: validatedData.yearEstablished || null,
        numberOfEmployees: validatedData.numberOfEmployees || null,
        primaryAffiliateId: validatedData.primaryAffiliateId,
        profilePicture: validatedData.profilePicture || null,
        businessLicense: validatedData.businessLicense || null,
        businessLicenseDocuments: Array.isArray(validatedData.businessLicenseDocuments) ? validatedData.businessLicenseDocuments : [],
        registrationCertificate: validatedData.registrationCertificate || null,
        registrationCertificateDocuments: Array.isArray(validatedData.registrationCertificateDocuments) ? validatedData.registrationCertificateDocuments : [],
        proofOfOperations: validatedData.proofOfOperations || null,
        proofOfOperationsDocuments: Array.isArray(validatedData.proofOfOperationsDocuments) ? validatedData.proofOfOperationsDocuments : [],
      };
      
      console.log('Creating business with data:', {
        ...businessProfileData,
        businessLicenseDocuments: businessProfileData.businessLicenseDocuments?.length || 0,
        registrationCertificateDocuments: businessProfileData.registrationCertificateDocuments?.length || 0,
        proofOfOperationsDocuments: businessProfileData.proofOfOperationsDocuments?.length || 0,
      });
      const business = await storage.createBusiness(businessProfileData);
      console.log('Business created successfully:', business.id);
      
      // Handle secondary affiliates if provided (temporarily disabled until migration)
      if (secondaryAffiliateIds && Array.isArray(secondaryAffiliateIds) && secondaryAffiliateIds.length > 0) {
        try {
          await storage.setBusinessSecondaryAffiliates(business.id, secondaryAffiliateIds);
        } catch (error) {
          console.log('Secondary affiliates temporarily disabled until database migration');
        }
      }
      
      console.log('Sending response for business creation');
      res.json({ business });
    } catch (error) {
      console.error('Error creating business:', error);
      if (error instanceof z.ZodError) {
        console.log('Zod validation errors:', error.errors);
        res.status(400).json({ message: "Invalid business data", errors: error.errors });
      } else {
        console.log('Non-Zod error:', error);
        res.status(400).json({ message: "Invalid business data" });
      }
    }
  });

  // Affiliate routes
  app.get("/api/affiliates/main", async (req, res) => {
    try {
      const mainAffiliates = await storage.getAllMainAffiliates();
      res.json({ mainAffiliates });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch main affiliates" });
    }
  });

  app.get("/api/affiliates/secondary", async (req, res) => {
    try {
      const secondaryAffiliates = await storage.getAllSecondaryAffiliates();
      res.json({ secondaryAffiliates });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch secondary affiliates" });
    }
  });

  // Note: Secondary affiliates are now managed at the business level, not user level
  // This route is deprecated and will be removed
  app.get("/api/affiliates/user/:userId", async (req, res) => {
    res.json({ businessSecondaryAffiliates: [] });
  });

  // Note: Secondary affiliates are now managed at the business level, not user level
  // This route is deprecated and will be removed
  app.post("/api/affiliates/user/:userId", async (req, res) => {
    res.json({ message: "Secondary affiliates are now managed per business, not per user" });
  });

  // New business-level secondary affiliate routes
  app.get("/api/affiliates/business/:businessId", async (req, res) => {
    try {
      const { businessId } = req.params;
      const businessSecondaryAffiliates = await storage.getBusinessSecondaryAffiliates(businessId);
      res.json({ businessSecondaryAffiliates });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch business secondary affiliates" });
    }
  });

  app.post("/api/affiliates/business/:businessId", async (req, res) => {
    try {
      const { businessId } = req.params;
      const { secondaryAffiliateIds } = req.body;
      
      if (!Array.isArray(secondaryAffiliateIds)) {
        return res.status(400).json({ message: "secondaryAffiliateIds must be an array" });
      }
      
      await storage.setBusinessSecondaryAffiliates(businessId, secondaryAffiliateIds);
      res.json({ message: "Business secondary affiliates updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update business secondary affiliates" });
    }
  });

  // Collaboration routes
  app.post("/api/collaborations/invite", async (req, res) => {
    try {
      const { businessId, inviteeEmail, message, inviterId } = req.body;
      
      // Validate required fields
      if (!businessId || !inviteeEmail || !inviterId) {
        return res.status(400).json({ message: "Business ID, invitee email, and inviter ID are required" });
      }
      
      // Check if the business can add collaborators
      const business = await storage.getBusinessProfileById(businessId);
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }
      
      // Verify that the inviter owns the business
      if (business.userId !== inviterId) {
        return res.status(403).json({ message: "You can only invite collaborators to businesses you own" });
      }
      
      // Get inviter user to check email
      const inviter = await storage.getUserById(inviterId);
      if (!inviter) {
        return res.status(400).json({ message: "Invalid inviter ID" });
      }
      
      // Prevent self-invitation
      if (inviter.email === inviteeEmail) {
        return res.status(400).json({ message: "You cannot invite yourself as a collaborator" });
      }
      
      // Check if invitee user exists
      const invitee = await storage.getUserByEmail(inviteeEmail);
      if (!invitee) {
        return res.status(400).json({ message: "User with this email does not exist. They must create an account first." });
      }
      
      // Check if invitation already exists
      const existingInvitations = await storage.getCollaborationInvitations(invitee.id);
      const alreadyInvited = existingInvitations.some(inv => 
        inv.businessId === businessId && inv.status === 'pending'
      );
      
      if (alreadyInvited) {
        return res.status(400).json({ message: "An invitation has already been sent to this user for this business" });
      }
      
      // Check eligibility requirements
      if (business.rejected) {
        return res.status(403).json({ message: "Business has been rejected and cannot add collaborators" });
      }
      
      if (!business.verified) {
        return res.status(403).json({ message: "Business must be verified by admin before adding collaborators" });
      }
      
      if (business.paymentStatus !== "paid") {
        return res.status(403).json({ message: "Payment must be completed before adding collaborators" });
      }
      
      // Check if all required fields are completed (excluding secondary chambers)
      const requiredFields = [
        business.businessName,
        business.businessEmail,
        business.businessRegistrationNumber,
        business.yearEstablished,
        business.ownerName,
        business.category,
        business.numberOfEmployees,
        business.primaryAffiliateId,
        business.tagline,
        business.address,
        business.phone,
        business.registrationCertificate
      ];
      
      const allRequiredFieldsFilled = requiredFields.every(field => field && field !== "");
      if (!allRequiredFieldsFilled) {
        return res.status(403).json({ message: "All required profile fields must be completed before adding collaborators" });
      }
      
      const invitation = await storage.sendCollaborationInvitation(businessId, inviterId, inviteeEmail, message);
      res.json({ invitation });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid invitation data", errors: error.errors });
      } else {
        res.status(400).json({ message: error instanceof Error ? error.message : "Failed to send invitation" });
      }
    }
  });

  app.get("/api/collaborations/invitations/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const invitations = await storage.getCollaborationInvitations(userId);
      res.json({ invitations });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  app.post("/api/collaborations/respond", async (req, res) => {
    try {
      const { invitationId, action } = respondToInvitationSchema.parse(req.body);
      const success = await storage.respondToInvitation(invitationId, action);
      res.json({ success });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid response data", errors: error.errors });
      } else {
        res.status(400).json({ message: "Failed to respond to invitation" });
      }
    }
  });

  app.get("/api/collaborations/business/:businessId", async (req, res) => {
    try {
      const { businessId } = req.params;
      const collaborators = await storage.getBusinessCollaborators(businessId);
      res.json({ collaborators });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collaborators" });
    }
  });

  app.delete("/api/collaborations/business/:businessId/collaborator/:collaboratorId", async (req, res) => {
    try {
      const { businessId, collaboratorId } = req.params;
      const success = await storage.removeCollaborator(businessId, collaboratorId);
      res.json({ success });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove collaborator" });
    }
  });

  app.get("/api/collaborations/user/:userId/businesses", async (req, res) => {
    try {
      const { userId } = req.params;
      const businesses = await storage.getCollaboratedBusinesses(userId);
      res.json({ businesses });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch collaborated businesses" });
    }
  });

  // Get all businesses for a user (owned + collaborated)
  app.get("/api/user/:userId/all-businesses", async (req, res) => {
    try {
      const { userId } = req.params;
      console.log('API: Fetching all businesses for user:', userId);
      
      // Get owned businesses
      const ownedBusinesses = await storage.getUserBusinesses(userId);
      console.log('API: Found owned businesses:', ownedBusinesses.length);
      
      // Get collaborated businesses
      const collaboratedBusinesses = await storage.getCollaboratedBusinesses(userId);
      console.log('API: Found collaborated businesses:', collaboratedBusinesses.length);
      
      res.json({ 
        ownedBusinesses, 
        collaboratedBusinesses,
        allBusinesses: [...ownedBusinesses, ...collaboratedBusinesses]
      });
    } catch (error) {
      console.error('API: Error fetching user businesses:', error);
      res.status(500).json({ message: "Failed to fetch user businesses", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Admin: Verify user account
  app.patch("/api/admin/users/:userId/verify", async (req, res) => {
    try {
      const { userId } = req.params;
      const { verified, rejectionReason } = req.body;
      
      console.log('Admin verification request:', { userId, verified, rejectionReason });
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Get user to check if they exist and profile is complete
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if profile is complete before allowing verification
      const requiredFields = [
        user.firstName,
        user.lastName,
        user.email,
        user.phoneNumber,
        user.dateOfBirth,
        user.gender,
        user.icDocument
      ];
      const filledFields = requiredFields.filter(field => field && field !== "").length;
      const completionPercentage = Math.round((filledFields / requiredFields.length) * 100);
      
      if (completionPercentage < 100) {
        const missingFields = [];
        if (!user.firstName) missingFields.push("First Name");
        if (!user.lastName) missingFields.push("Last Name");
        if (!user.email) missingFields.push("Email");
        if (!user.phoneNumber) missingFields.push("Phone Number");
        if (!user.dateOfBirth) missingFields.push("Date of Birth");
        if (!user.gender) missingFields.push("Gender");
        if (!user.icDocument) missingFields.push("IC Document");
        
        return res.status(400).json({ 
          message: `Cannot verify user with incomplete profile (${completionPercentage}% complete). Missing: ${missingFields.join(", ")}`,
          error: "PROFILE_INCOMPLETE",
          completionPercentage,
          missingFields
        });
      }
      
      // Update user verification status
      const updatedUser = await storage.updateUserVerification(userId, verified);
      
      if (!updatedUser) {
        return res.status(500).json({ message: "Failed to update user verification status" });
      }
      
      console.log('Admin verification completed:', { 
        userId, 
        verified, 
        previousStatus: user.verified,
        newStatus: updatedUser.verified 
      });
      
      res.json({ 
        message: verified ? "User verified successfully" : "User verification removed",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          verified: updatedUser.verified,
          profileCompletion: 100
        }
      });
    } catch (error) {
      console.error('Admin verification error:', error);
      res.status(500).json({ message: "Failed to update user verification status" });
    }
  });

  // QR Code and Passport routes
  app.post("/api/businesses/:businessId/generate-qr", async (req, res) => {
    try {
      const { businessId } = req.params;
      const { userId } = req.body;

      console.log('QR API: Full request body:', req.body);
      console.log('QR API: Request headers:', req.headers);
      console.log('QR API: Generating QR code for business:', businessId, 'user:', userId);

      if (!userId) {
        console.log('QR API: No user ID provided in request body');
        return res.status(401).json({ message: "User ID is required" });
      }

      // Check if user owns this business or is a collaborator
      console.log('QR API: Checking user permissions...');
      const userBusinesses = await storage.getUserBusinesses(userId);
      console.log('QR API: User businesses:', userBusinesses.length);
      
      const isOwner = userBusinesses.some(b => b.id === businessId);
      const isCollaborator = await storage.isBusinessCollaborator(businessId, userId);
      
      console.log('QR API: Is owner:', isOwner, 'Is collaborator:', isCollaborator);

      if (!isOwner && !isCollaborator) {
        console.log('QR API: Access denied - user does not own or collaborate on business');
        return res.status(403).json({ message: "Access denied" });
      }

      // Generate QR code
      console.log('QR API: Generating QR code...');
      const result = await storage.generateBusinessQRCode(businessId);
      console.log('QR API: QR code generated successfully');
      
      res.json({
        success: true,
        qrCode: result.qrCode,
        passportId: result.passportId
      });
    } catch (error) {
      console.error('QR API: Error generating QR code:', error);
      res.status(500).json({ message: "Failed to generate QR code", error: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  app.post("/api/verify/qr", async (req, res) => {
    try {
      const { qrData } = req.body;

      if (!qrData) {
        return res.status(400).json({ message: "QR code data is required" });
      }

      const business = await storage.verifyBusinessByQRCode(qrData);
      
      if (!business) {
        return res.status(404).json({ message: "Invalid or expired QR code" });
      }

      res.json({
        success: true,
        business: {
          id: business.id,
          businessName: business.businessName,
          businessRegistrationNumber: business.businessRegistrationNumber,
          verified: business.verified,
          passportId: business.passportId,
          createdAt: business.createdAt
        }
      });
    } catch (error) {
      console.error('QR API: Error verifying QR code:', error);
      res.status(500).json({ message: "Failed to verify QR code" });
    }
  });

  app.get("/api/verify/:passportId", async (req, res) => {
    try {
      const { passportId } = req.params;

      const business = await storage.getBusinessByPassportId(passportId);
      
      if (!business) {
        return res.status(404).json({ message: "Invalid passport ID" });
      }

      res.json({
        success: true,
        business: {
          id: business.id,
          businessName: business.businessName,
          businessRegistrationNumber: business.businessRegistrationNumber,
          verified: business.verified,
          passportId: business.passportId,
          createdAt: business.createdAt
        }
      });
    } catch (error) {
      console.error('QR API: Error verifying passport ID:', error);
      res.status(500).json({ message: "Failed to verify passport ID" });
    }
  });

  // Test endpoint to check database schema
  app.get("/api/test/database-schema", async (req, res) => {
    try {
      const { sql } = await import("drizzle-orm");
      const { users } = await import("@shared/schema");
      
      // Check if ic_document column exists
      const result = await (storage as any).db.execute(sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'ic_document'
      `);
      
      // Get all columns in users table
      const tableInfo = await (storage as any).db.execute(sql`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        ORDER BY ordinal_position
      `);
      
      res.json({ 
        icDocumentColumn: result,
        allColumns: tableInfo,
        message: "Database schema check completed"
      });
    } catch (error: any) {
      console.error('Database schema test error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Test endpoint to apply ic_document migration
  app.post("/api/test/apply-ic-migration", async (req, res) => {
    try {
      const { sql } = await import("drizzle-orm");
      
      // Apply the migrations
      await (storage as any).db.execute(sql`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS ic_document TEXT
      `);
      
      await (storage as any).db.execute(sql`
        ALTER TABLE users ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT FALSE
      `);
      
      res.json({ 
        message: "IC document and verified field migrations applied successfully"
      });
    } catch (error: any) {
      console.error('Migration application error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Test endpoint to check users in database
  app.get("/api/test/check-users", async (req, res) => {
    try {
      const { sql } = await import("drizzle-orm");
      
      // Check if admin user exists
      const adminUser = await storage.getUserByEmail("admin@example.com");
      
      // Get all users count
      const allUsers = await (storage as any).db.execute(sql`SELECT COUNT(*) as count FROM users`);
      
      res.json({ 
        adminUserExists: !!adminUser,
        adminUser: adminUser ? { 
          id: adminUser.id, 
          email: adminUser.email, 
          firstName: adminUser.firstName,
          passwordSet: !!adminUser.password 
        } : null,
        totalUsers: allUsers.rows[0]?.count || 0,
        message: "User check completed"
      });
    } catch (error: any) {
      console.error('User check error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create admin user endpoint
  app.post("/api/test/create-admin", async (req, res) => {
    try {
      // Check if admin already exists
      const existingAdmin = await storage.getUserByEmail("admin@example.com");
      if (existingAdmin) {
        return res.json({ 
          message: "Admin user already exists",
          adminUser: { 
            id: existingAdmin.id, 
            email: existingAdmin.email, 
            firstName: existingAdmin.firstName 
          }
        });
      }

      // Create admin user
      const adminUser = await storage.createUser({
        firstName: "Admin",
        lastName: "User",
        email: "admin@example.com",
        password: "123",
        verified: true, // Admin is pre-verified
      });

      res.json({ 
        message: "Admin user created successfully",
        adminUser: { 
          id: adminUser.id, 
          email: adminUser.email, 
          firstName: adminUser.firstName 
        }
      });
    } catch (error: any) {
      console.error('Admin creation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Performance optimization endpoint
  app.post("/api/test/apply-performance-indexes", async (req, res) => {
    try {
      const { sql } = await import("drizzle-orm");
      
      // Apply performance indexes
      const indexes = [
        // Users table indexes
        `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
        `CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified)`,
        `CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at)`,
        
        // Business profiles indexes
        `CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id)`,
        `CREATE INDEX IF NOT EXISTS idx_business_profiles_verified ON business_profiles(verified)`,
        `CREATE INDEX IF NOT EXISTS idx_business_profiles_status ON business_profiles(status)`,
        `CREATE INDEX IF NOT EXISTS idx_business_profiles_archived ON business_profiles(archived)`,
        `CREATE INDEX IF NOT EXISTS idx_business_profiles_primary_affiliate ON business_profiles(primary_affiliate_id)`,
        `CREATE INDEX IF NOT EXISTS idx_business_profiles_payment_status ON business_profiles(payment_status)`,
        `CREATE INDEX IF NOT EXISTS idx_business_profiles_qr_code ON business_profiles(qr_code)`,
        `CREATE INDEX IF NOT EXISTS idx_business_profiles_passport_id ON business_profiles(passport_id)`,
        
        // Composite indexes
        `CREATE INDEX IF NOT EXISTS idx_business_profiles_user_verified ON business_profiles(user_id, verified)`,
        `CREATE INDEX IF NOT EXISTS idx_business_profiles_verified_paid ON business_profiles(verified, payment_status)`,
        `CREATE INDEX IF NOT EXISTS idx_users_verified_created ON users(verified, created_at)`
      ];

      for (const indexQuery of indexes) {
        await (storage as any).db.execute(sql.raw(indexQuery));
      }
      
      res.json({ 
        message: "Performance indexes applied successfully",
        indexesApplied: indexes.length
      });
    } catch (error: any) {
      console.error('Performance indexes application error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin routes
  app.get("/api/admin/users", async (req, res) => {
    try {
      console.log('Admin API: Fetching all users with profiles...');
      const users = await storage.getAllUsersWithProfiles();
      console.log('Admin API: Found users:', users.length);
      console.log('Admin API: Users data:', users);
      res.json({ users });
    } catch (error) {
      console.error('Admin API: Error fetching users:', error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // New endpoint to get all businesses across all users
  app.get("/api/admin/businesses", async (req, res) => {
    try {
      console.log('Admin API: Fetching all businesses...');
      const businesses = await storage.getAllBusinesses();
      console.log('Admin API: Found businesses:', businesses.length);
      res.json({ businesses });
    } catch (error) {
      console.error('Admin API: Error fetching businesses:', error);
      res.status(500).json({ message: "Failed to fetch businesses" });
    }
  });

  app.patch("/api/admin/users/:userId/verify", async (req, res) => {
    try {
      const { userId } = req.params;
      const { verified } = req.body;
      
      const profile = await storage.updateBusinessProfile(userId, {
        verified,
        rejected: false, // Clear rejection when verifying
        rejectionReason: null
      });
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      res.json({ profile });
    } catch (error) {
      res.status(500).json({ message: "Failed to update user verification status" });
    }
  });

  // User verification endpoint (separate from business verification)
  app.patch("/api/admin/users/:userId/verify-user", async (req, res) => {
    try {
      const { userId } = req.params;
      const { verified } = req.body;
      
      console.log('Admin API: Updating user verification status:', userId, 'verified:', verified);
      
      const user = await storage.updateUserVerification(userId, verified);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ user });
    } catch (error) {
      console.error('Admin API: Error updating user verification:', error);
      res.status(500).json({ message: "Failed to update user verification status" });
    }
  });

  app.patch("/api/admin/users/:userId/reject", async (req, res) => {
    try {
      const { userId } = req.params;
      const { rejected, rejectionReason } = req.body;
      
      console.log('Admin API: Rejecting user:', userId, 'reason:', rejectionReason);
      
      const profile = await storage.updateBusinessProfile(userId, {
        rejected,
        rejectionReason,
        verified: false // Clear verification when rejecting
      });
      
      if (!profile) {
        return res.status(404).json({ message: "Profile not found" });
      }

      res.json({ profile });
    } catch (error) {
      console.error('Admin API: Error rejecting user:', error);
      res.status(500).json({ message: "Failed to reject user" });
    }
  });

  // Business-specific verification endpoints
  app.patch("/api/admin/businesses/:businessId/verify", async (req, res) => {
    try {
      const { businessId } = req.params;
      const { verified, paymentStatus } = req.body;
      
      console.log('Admin API: Verifying business:', businessId, 'verified:', verified);
      
      // Get the business first to check completion
      const existingBusiness = await storage.getBusinessProfileById(businessId);
      if (!existingBusiness) {
        return res.status(404).json({ message: "Business not found" });
      }

      // Check if business meets verification requirements (99% completion)
      if (verified) {
        const requiredFields = [
          existingBusiness.businessName,
          existingBusiness.businessEmail,
          existingBusiness.businessRegistrationNumber,
          existingBusiness.yearEstablished,
          existingBusiness.ownerName,
          existingBusiness.category,
          existingBusiness.numberOfEmployees,
          existingBusiness.primaryAffiliateId,
          existingBusiness.tagline,
          existingBusiness.address,
          existingBusiness.phone,
          // Check for document arrays instead of single document fields
          Array.isArray(existingBusiness.registrationCertificateDocuments) && existingBusiness.registrationCertificateDocuments.length > 0 
            ? existingBusiness.registrationCertificateDocuments[0] 
            : existingBusiness.registrationCertificate
        ];
        
        const filledFields = requiredFields.filter(field => field && field !== "").length;
        const completionPercentage = Math.round((filledFields / requiredFields.length) * 100);
        
        if (completionPercentage < 99) {
          return res.status(400).json({ 
            message: "Business profile must be at least 99% complete for verification",
            completionPercentage,
            requiredPercentage: 99
          });
        }
      }
      
      const business = await storage.updateBusinessStatus(businessId, "verified", verified, false, undefined, paymentStatus);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      res.json({ business });
    } catch (error) {
      console.error('Admin API: Error verifying business:', error);
      res.status(500).json({ message: "Failed to verify business" });
    }
  });

  app.patch("/api/admin/businesses/:businessId/reject", async (req, res) => {
    try {
      const { businessId } = req.params;
      const { rejected, rejectionReason } = req.body;
      
      console.log('Admin API: Rejecting business:', businessId, 'reason:', rejectionReason);
      
      const business = await storage.updateBusinessStatus(businessId, "rejected", false, rejected, rejectionReason);
      
      if (!business) {
        return res.status(404).json({ message: "Business not found" });
      }

      res.json({ business });
    } catch (error) {
      console.error('Admin API: Error rejecting business:', error);
      res.status(500).json({ message: "Failed to reject business" });
    }
  });

  app.get("/api/admin/stats", async (req, res) => {
    try {
      const users = await storage.getAllUsersWithProfiles();
      const stats = {
        totalUsers: users.length,
        pendingReview: users.filter(u => !u.businessProfile?.verified).length,
        verified: users.filter(u => u.businessProfile?.verified).length,
        completedProfiles: users.filter(u => u.businessProfile?.completed).length,
        recentActivity: users.length // Placeholder for now
      };
      res.json({ stats });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch admin stats" });
    }
  });



  // Delete user account
  app.delete("/api/admin/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      
      console.log('Admin API: Deleting user:', userId);
      
      // First check if user exists
      const existingUser = await storage.getUserById(userId);
      if (!existingUser) {
        console.log('Admin API: User not found for deletion:', userId);
        return res.status(404).json({ message: "User not found" });
      }
      
      console.log('Admin API: Found user to delete:', { id: existingUser.id, email: existingUser.email });
      
      const success = await storage.deleteUser(userId);
      
      console.log('Admin API: Delete user result:', success);
      
      if (success) {
        // Verify the user was actually deleted
        const deletedUser = await storage.getUserById(userId);
        if (deletedUser) {
          console.log('Admin API: WARNING - User still exists after deletion:', userId);
          res.status(500).json({ message: "User deletion failed - user still exists" });
        } else {
          console.log('Admin API: User successfully deleted:', userId);
          res.json({ success: true, message: "User deleted successfully" });
        }
      } else {
        console.log('Admin API: Delete user returned false for user:', userId);
        res.status(500).json({ message: "User deletion failed" });
      }
    } catch (error) {
      console.error('Admin API: Error deleting user:', error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
