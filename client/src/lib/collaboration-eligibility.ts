import type { BusinessProfile } from "@shared/schema";

/**
 * Checks if a business is eligible to add collaborators
 * Requirements:
 * 1. Business must be verified by admin
 * 2. Payment status must be "paid"
 * 3. Profile must be completed (all required fields filled)
 * 4. Secondary chambers are optional and don't affect eligibility
 */
export function canAddCollaborators(business: BusinessProfile): boolean {
  // Check if business is verified and paid
  if (!business.verified || business.paymentStatus !== "paid") {
    return false;
  }

  // Check if business is rejected
  if (business.rejected) {
    return false;
  }

  // Check if all required fields are completed
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
  
  return allRequiredFieldsFilled;
}

/**
 * Gets the reason why a business cannot add collaborators
 */
export function getCollaborationEligibilityReason(business: BusinessProfile): string {
  if (business.rejected) {
    return "Business has been rejected and cannot add collaborators";
  }

  if (!business.verified) {
    return "Business must be verified by admin before adding collaborators";
  }

  if (business.paymentStatus !== "paid") {
    return "Payment must be completed before adding collaborators";
  }

  // Check required fields
  const requiredFields = [
    { name: "Business Name", value: business.businessName },
    { name: "Business Email", value: business.businessEmail },
    { name: "Business Registration Number", value: business.businessRegistrationNumber },
    { name: "Year Established", value: business.yearEstablished },
    { name: "Owner Name", value: business.ownerName },
    { name: "Business Category", value: business.category },
    { name: "Number of Employees", value: business.numberOfEmployees },
    { name: "Primary Chamber", value: business.primaryAffiliateId },
    { name: "Business Tagline", value: business.tagline },
    { name: "Business Address", value: business.address },
    { name: "Phone Number", value: business.phone },
    { name: "Registration Certificate", value: business.registrationCertificate }
  ];

  const missingFields = requiredFields
    .filter(field => !field.value || field.value === "")
    .map(field => field.name);

  if (missingFields.length > 0) {
    return `Complete these required fields: ${missingFields.join(", ")}`;
  }

  return "Eligible to add collaborators";
}
