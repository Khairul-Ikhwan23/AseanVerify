import type { BusinessProfile, User } from "@shared/schema";

/**
 * Checks if a business is eligible for verification
 * Requirements:
 * 1. Business must not be rejected
 * 2. Business must not already be verified
 * 3. Profile completion must be at least 99%
 * 4. All critical fields must be filled
 */
export function isEligibleForVerification(business: BusinessProfile): boolean {
  // Check if business is rejected
  if (business.rejected) {
    return false;
  }

  // Check if business is already verified
  if (business.verified) {
    return false;
  }

  // Check if profile completion is at least 99%
  const completionPercentage = getBusinessCompletionPercentage(business);
  if (completionPercentage < 99) {
    return false;
  }

  return true;
}

/**
 * Calculates the business profile completion percentage
 * Returns a value between 0-100
 */
export function getBusinessCompletionPercentage(business: BusinessProfile): number {
  if (business.rejected) return 0;
  
  // Calculate completion based on required fields
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
    // Check for document arrays instead of single document fields
    Array.isArray(business.registrationCertificateDocuments) && business.registrationCertificateDocuments.length > 0 ? business.registrationCertificateDocuments[0] : business.registrationCertificate
  ];
  
  const filledFields = requiredFields.filter(field => field && field !== "").length;
  const fieldCompletionPercentage = Math.round((filledFields / requiredFields.length) * 100);
  
  // If payment is completed, return 100%, otherwise return field completion (max 99%)
  if (business.verified && business.paymentStatus === "paid") {
    return 100;
  }
  
  // Cap at 99% until payment is completed
  return Math.min(fieldCompletionPercentage, 99);
}

/**
 * Gets the reason why a business cannot be verified
 */
export function getVerificationEligibilityReason(business: BusinessProfile): string {
  if (business.rejected) {
    return "Business has been rejected and cannot be verified";
  }

  if (business.verified) {
    return "Business is already verified";
  }

  const completionPercentage = getBusinessCompletionPercentage(business);
  if (completionPercentage < 99) {
    const missingFields = getMissingRequiredFields(business);
    return `Profile completion is ${completionPercentage}%. Complete all required fields to reach 99%: ${missingFields.join(", ")}`;
  }

  return "Business is eligible for verification";
}

/**
 * Gets the list of missing required fields
 */
export function getMissingRequiredFields(business: BusinessProfile): string[] {
  const requiredFields = [
    { field: business.businessName, name: "Business Name" },
    { field: business.businessEmail, name: "Business Email" },
    { field: business.businessRegistrationNumber, name: "Registration Number" },
    { field: business.yearEstablished, name: "Year Established" },
    { field: business.ownerName, name: "Owner Name" },
    { field: business.category, name: "Category" },
    { field: business.numberOfEmployees, name: "Number of Employees" },
    { field: business.primaryAffiliateId, name: "Primary Chamber" },
    { field: business.tagline, name: "Tagline" },
    { field: business.address, name: "Address" },
    { field: business.phone, name: "Phone" },
    { 
      field: Array.isArray(business.registrationCertificateDocuments) && business.registrationCertificateDocuments.length > 0 
        ? business.registrationCertificateDocuments[0] 
        : business.registrationCertificate, 
      name: "Registration Certificate" 
    }
  ];

  return requiredFields
    .filter(({ field }) => !field || field === "")
    .map(({ name }) => name);
}

/**
 * Checks if a user is eligible for verification
 * Requirements:
 * 1. User must have all required personal information filled
 * 2. User must have uploaded IC document
 * 3. User must not already be verified
 */
export function isUserEligibleForVerification(user: User | undefined | null): boolean {
  // Return false if user is not provided
  if (!user) {
    return false;
  }

  // Check if user is already verified
  if (user.verified) {
    return false;
  }

  // Check if all required personal information is filled
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
  
  // All required fields must be filled
  return filledFields === requiredFields.length;
}

/**
 * Gets the reason why a user cannot be verified
 */
export function getUserVerificationEligibilityReason(user: User | undefined | null): string {
  // Return default message if user is not provided
  if (!user) {
    return "User data not available";
  }

  if (user.verified) {
    return "User is already verified";
  }

  const missingFields = getMissingUserRequiredFields(user);
  if (missingFields.length > 0) {
    return `Complete all required fields to be eligible for verification: ${missingFields.join(", ")}`;
  }

  return "User is eligible for verification";
}

/**
 * Gets the list of missing required user fields
 */
export function getMissingUserRequiredFields(user: User | undefined | null): string[] {
  // Return all required fields if user is not provided
  if (!user) {
    return ["First Name", "Last Name", "Email", "Phone Number", "Date of Birth", "Gender", "IC Document"];
  }

  const requiredFields = [
    { field: user.firstName, name: "First Name" },
    { field: user.lastName, name: "Last Name" },
    { field: user.email, name: "Email" },
    { field: user.phoneNumber, name: "Phone Number" },
    { field: user.dateOfBirth, name: "Date of Birth" },
    { field: user.gender, name: "Gender" },
    { field: user.icDocument, name: "IC Document" }
  ];

  return requiredFields
    .filter(({ field }) => !field || field === "")
    .map(({ name }) => name);
}

/**
 * Checks if a user has completed their profile but is awaiting admin verification
 * This means all required fields are filled but user.verified is still false
 */
export function isUserAwaitingVerification(user: User | undefined | null): boolean {
  // Return false if user is not provided
  if (!user) {
    return false;
  }

  // User must not be verified yet
  if (user.verified) {
    return false;
  }

  // All required fields must be filled
  return isUserEligibleForVerification(user);
}

/**
 * Gets the user profile completion percentage
 * Returns a value between 0-100
 */
export function getUserProfileCompletionPercentage(user: User | undefined | null): number {
  // Return 0 if user is not provided
  if (!user) {
    return 0;
  }

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
  return Math.round((filledFields / requiredFields.length) * 100);
}

/**
 * Enhanced verification functions for optimized user verification workflow
 */

/**
 * Checks if a user can create businesses
 * Requirements:
 * 1. User must be verified by admin
 * 2. User profile must be 100% complete
 * 3. All critical fields must be filled
 */
export function canUserCreateBusinesses(user: User | undefined | null): boolean {
  // Return false if user is not provided
  if (!user) {
    return false;
  }

  // User must be verified by admin
  if (!user.verified) {
    return false;
  }

  // User profile must be 100% complete
  const completionPercentage = getUserProfileCompletionPercentage(user);
  if (completionPercentage < 100) {
    return false;
  }

  return true;
}

/**
 * Gets the reason why a user cannot create businesses
 */
export function getUserBusinessCreationEligibilityReason(user: User | undefined | null): string {
  // Return default message if user is not provided
  if (!user) {
    return "User data not available";
  }

  const completionPercentage = getUserProfileCompletionPercentage(user);
  
  if (!user.verified) {
    if (completionPercentage < 100) {
      const missingFields = getMissingUserRequiredFields(user);
      return `Complete your profile (${completionPercentage}% complete) and await admin verification to create businesses. Missing: ${missingFields.join(", ")}`;
    }
    
    return "Your profile is complete but awaiting admin verification. You'll be able to create businesses once verified by our admin team (1-3 business days).";
  }

  if (completionPercentage < 100) {
    const missingFields = getMissingUserRequiredFields(user);
    return `Complete your profile (${completionPercentage}% complete) to create businesses. Missing: ${missingFields.join(", ")}`;
  }

  return "You can create businesses";
}

/**
 * Gets the user's verification status for display
 */
export function getUserVerificationStatus(user: User | undefined | null): {
  status: 'incomplete' | 'awaiting' | 'verified' | 'error';
  message: string;
  completionPercentage: number;
  canCreateBusinesses: boolean;
  nextSteps: string[];
} {
  if (!user) {
    return {
      status: 'error',
      message: 'User data not available',
      completionPercentage: 0,
      canCreateBusinesses: false,
      nextSteps: ['Please log in again']
    };
  }

  const completionPercentage = getUserProfileCompletionPercentage(user);
  const canCreateBusinesses = canUserCreateBusinesses(user);
  const missingFields = getMissingUserRequiredFields(user);

  if (user.verified && completionPercentage === 100) {
    return {
      status: 'verified',
      message: '✅ Profile verified - You can create businesses',
      completionPercentage: 100,
      canCreateBusinesses: true,
      nextSteps: ['You can now create and manage businesses']
    };
  }

  if (!user.verified && completionPercentage === 100) {
    return {
      status: 'awaiting',
      message: '⏳ Profile complete - Awaiting admin verification',
      completionPercentage: 100,
      canCreateBusinesses: false,
      nextSteps: [
        'Your profile has been submitted for review',
        'Admin verification typically takes 1-3 business days',
        'You will receive an email once verified'
      ]
    };
  }

  return {
    status: 'incomplete',
    message: `📝 Complete your profile (${completionPercentage}% complete)`,
    completionPercentage,
    canCreateBusinesses: false,
    nextSteps: [
      'Complete all required profile fields',
      'Upload your IC document',
      'Submit for admin review'
    ].concat(missingFields.length > 0 ? [`Missing: ${missingFields.join(", ")}`] : [])
  };
}

/**
 * Checks if user profile is ready for admin review
 */
export function isUserProfileReadyForReview(user: User | undefined | null): boolean {
  if (!user) return false;
  
  const completionPercentage = getUserProfileCompletionPercentage(user);
  return completionPercentage === 100 && !user.verified;
}

/**
 * Gets a prioritized list of actions the user should take
 */
export function getUserNextActions(user: User | undefined | null): Array<{
  action: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}> {
  if (!user) {
    return [{
      action: 'login',
      description: 'Log in to your account',
      priority: 'high',
      completed: false
    }];
  }

  const actions = [];
  const completionPercentage = getUserProfileCompletionPercentage(user);
  const missingFields = getMissingUserRequiredFields(user);

  // Profile completion actions
  if (completionPercentage < 100) {
    missingFields.forEach(field => {
      actions.push({
        action: `complete_${field.toLowerCase().replace(' ', '_')}`,
        description: `Add ${field} to your profile`,
        priority: 'high' as const,
        completed: false
      });
    });
  }

  // Admin verification status
  if (completionPercentage === 100 && !user.verified) {
    actions.push({
      action: 'await_verification',
      description: 'Wait for admin verification (1-3 business days)',
      priority: 'medium' as const,
      completed: false
    });
  }

  // Business creation availability
  if (user.verified && completionPercentage === 100) {
    actions.push({
      action: 'create_business',
      description: 'Create your first business profile',
      priority: 'medium' as const,
      completed: false
    });
  }

  return actions;
}
