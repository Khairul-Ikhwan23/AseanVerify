import { useState, useEffect, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Building2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Edit, 
  Archive, 
  Users, 
  UserPlus, 
  Info, 
  Shield, 
  FileText 
} from "lucide-react";
import { authManager } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { queryKeys } from "@/lib/queryClient";
import type { BusinessProfile, CreateBusinessData } from "@shared/schema";
import BusinessDetailModal from "./business-detail-modal";
import CollaborationInvite from "./collaboration-invite";
import MSMEPassport from "./msme-passport";
import { canAddCollaborators, getCollaborationEligibilityReason } from "@/lib/collaboration-eligibility";
import { isEligibleForVerification, getVerificationEligibilityReason, getBusinessCompletionPercentage, isUserEligibleForVerification, getUserVerificationEligibilityReason, isUserAwaitingVerification, getUserProfileCompletionPercentage, canUserCreateBusinesses, getUserBusinessCreationEligibilityReason, getUserVerificationStatus } from "@/lib/verification-eligibility";

interface BusinessManagerProps {
  onAddBusiness: () => void;
  onViewBusiness: (business: BusinessProfile) => void;
  onEditBusiness: (business: BusinessProfile) => void;
}

export default function BusinessManager({ onAddBusiness, onViewBusiness, onEditBusiness }: BusinessManagerProps) {
  const user = authManager.getCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessProfile | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCollaborationInvite, setShowCollaborationInvite] = useState(false);
  const [selectedBusinessForCollaboration, setSelectedBusinessForCollaboration] = useState<BusinessProfile | null>(null);
  const [showPassport, setShowPassport] = useState(false);
  const [selectedBusinessForPassport, setSelectedBusinessForPassport] = useState<BusinessProfile | null>(null);

  // Fetch affiliates for display with optimized caching
  const { data: primaryAffiliatesData } = useQuery({
    queryKey: queryKeys.affiliates.main,
    staleTime: 30 * 60 * 1000, // 30 minutes (affiliates don't change often)
    gcTime: 60 * 60 * 1000, // 1 hour
  });

  const { data: userSecondaryAffiliatesData } = useQuery({
    queryKey: queryKeys.affiliates.userSecondary(user?.id || ''),
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch current user data for verification status
  const { data: userData, isLoading: userDataLoading } = useQuery<{ user?: any }>({
    queryKey: queryKeys.users.byId(user?.id || ''),
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutes (user data changes more frequently)
  });

  const currentUser = userData?.user;

  // Memoize affiliate data
  const affiliateData = useMemo(() => ({
    primaryAffiliates: (primaryAffiliatesData as any)?.mainAffiliates || [],
    userSecondaryAffiliates: (userSecondaryAffiliatesData as any)?.userSecondaryAffiliates || []
  }), [primaryAffiliatesData, userSecondaryAffiliatesData]);

  const { primaryAffiliates, userSecondaryAffiliates } = affiliateData;

  const { data: businessesData, isLoading, error } = useQuery({
    queryKey: queryKeys.businesses.allByUser(user?.id || ''),
    enabled: !!user,
    staleTime: 60000, // Cache for 60 seconds (increased from 30)
    gcTime: 600000, // Keep in cache for 10 minutes (increased from 5)
  });

  // Memoize business data to prevent unnecessary re-renders
  const businessData = useMemo(() => ({
    ownedBusinesses: (businessesData as any)?.ownedBusinesses || [],
    collaboratedBusinesses: (businessesData as any)?.collaboratedBusinesses || [],
    allBusinesses: (businessesData as any)?.allBusinesses || []
  }), [businessesData]);

  const { ownedBusinesses, collaboratedBusinesses, allBusinesses } = businessData;

  // Update selectedBusiness when business data is refreshed
  useEffect(() => {
    if (selectedBusiness && allBusinesses.length > 0) {
      const updatedBusiness = allBusinesses.find((b: BusinessProfile) => b.id === selectedBusiness.id);
      if (updatedBusiness) {
        setSelectedBusiness(updatedBusiness);
      }
    }
  }, [allBusinesses, selectedBusiness]);



  // Memoize the status badge function to prevent unnecessary re-renders
  const getStatusBadge = useCallback((business: BusinessProfile) => {
    if (business.archived) {
      return (
        <Badge variant="outline" className="flex items-center gap-1 bg-slate-100 text-slate-600">
          <Archive className="w-3 h-3" />
          Archived
        </Badge>
      );
    }
    
    if (business.rejected) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Rejected
        </Badge>
      );
    }
    
    if (business.verified && business.paymentStatus === "paid") {
      return (
        <Badge variant="default" className="bg-green-600 flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Verified
        </Badge>
      );
    }
    
    if (business.completed) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Pending Verification
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        Incomplete
      </Badge>
    );
  }, []);

  // Memoize the progress percentage function
  const getProgressPercentage = useCallback((business: BusinessProfile) => {
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
      Array.isArray(business.registrationCertificateDocuments) && business.registrationCertificateDocuments.length > 0 
        ? business.registrationCertificateDocuments[0] 
        : business.registrationCertificate
    ];
    
    const filledFields = requiredFields.filter(field => field && field !== "").length;
    const fieldCompletionPercentage = Math.round((filledFields / requiredFields.length) * 100);
    
    // If payment is completed, return 100%, otherwise return field completion (max 99%)
    if (business.verified && business.paymentStatus === "paid") {
      return 100;
    }
    
    // Cap at 99% until payment is completed
    return Math.min(fieldCompletionPercentage, 99);
  }, []);

  const getPrimaryAffiliateName = (business: BusinessProfile) => {
    const affiliate = primaryAffiliates.find((a: any) => a.id === business.primaryAffiliateId);
    return affiliate?.name || 'Unknown Chamber';
  };

  const getSecondaryAffiliateNames = () => {
    return userSecondaryAffiliates.map((usa: any) => {
      // This would need to be enhanced to get the actual affiliate names
      return usa.secondaryAffiliateId;
    });
  };

  const handleCollaborationInvite = (business: BusinessProfile) => {
    setSelectedBusinessForCollaboration(business);
    setShowCollaborationInvite(true);
  };

  const handleCollaborationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/user', user?.id, 'all-businesses'] });
  };

  const handleViewPassport = (business: BusinessProfile) => {
    setSelectedBusinessForPassport(business);
    setShowPassport(true);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Businesses</h2>
          <p className="text-slate-600 mt-1">
            Manage all your registered businesses and their verification status
          </p>
        </div>
{userDataLoading ? (
          <Button disabled className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Business
          </Button>
        ) : canUserCreateBusinesses(currentUser) ? (
          <Button onClick={onAddBusiness} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white">
            <Plus className="w-4 h-4" />
            Add Business
          </Button>
        ) : (
          <Button disabled className="flex items-center gap-2 opacity-50">
            <Plus className="w-4 h-4" />
            Add Business
          </Button>
        )}
      </div>

      {/* Businesses Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-600 mt-2">Loading your businesses...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
            <p className="text-lg font-medium">Failed to load businesses</p>
            <p className="text-sm text-slate-600 mt-1">{error.message}</p>
          </div>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/user', user?.id, 'all-businesses'] })}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      ) : allBusinesses.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Building2 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No Businesses Yet</h3>
            <p className="text-slate-600 mb-4">
              You haven't registered any businesses yet. Start by adding your first business.
            </p>
            {userDataLoading ? (
              <Button disabled className="flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Register Your First Business
              </Button>
            ) : currentUser?.verified ? (
              <Button onClick={onAddBusiness} className="flex items-center gap-2 mx-auto">
                <Plus className="w-4 h-4" />
                Register Your First Business
              </Button>
            ) : isUserAwaitingVerification(currentUser) ? (
              <div className="space-y-3">
                <Button disabled className="flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" />
                  Register Your First Business
                </Button>
                <div className="max-w-md mx-auto">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-blue-800 mb-1">
                          Awaiting Admin Verification
                        </p>
                        <p className="text-xs text-blue-700">
                          Your profile is 100% complete and has been submitted for review.
                        </p>
                        <p className="text-xs text-blue-600 mt-2">
                          Verification should be completed within 1-3 business days. You'll be able to register businesses once verified.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <Button disabled className="flex items-center gap-2 mx-auto">
                  <Plus className="w-4 h-4" />
                  Register Your First Business
                </Button>
                <div className="max-w-md mx-auto">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-amber-800 mb-1">
                          Profile Verification Required
                        </p>
                        <p className="text-xs text-amber-700">
                          {getUserVerificationEligibilityReason(currentUser)}
                        </p>
                        <p className="text-xs text-amber-600 mt-2">
                          Complete your profile and get verified to start registering businesses.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <div className="flex gap-6 pb-4" style={{ minWidth: `${allBusinesses.length * 320}px` }}>
            {allBusinesses.map((business: BusinessProfile) => (
            <Card 
              key={business.id} 
              className={`hover:shadow-lg transition-shadow cursor-pointer w-80 flex-shrink-0 ${
                business.archived ? 'opacity-60 bg-slate-50' : ''
              }`}
              onClick={() => onViewBusiness(business)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg font-semibold text-slate-900 line-clamp-2">
                    {business.businessName}
                  </CardTitle>
                  <div className="flex flex-col items-end gap-2">
                    {getStatusBadge(business)}
                    {/* Show if this is a collaborated business */}
                    {collaboratedBusinesses.some((cb: BusinessProfile) => cb.id === business.id) && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        Collaborator
                      </Badge>
                    )}
                  </div>
                </div>
                {business.category && (
                  <p className="text-sm text-slate-600">{business.category}</p>
                )}
              </CardHeader>
              <CardContent className="pt-0">
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
                    <span>Profile Completion</span>
                    <span>{getProgressPercentage(business)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        business.rejected 
                          ? 'bg-red-500' 
                          : business.verified && business.paymentStatus === "paid"
                          ? 'bg-green-500'
                          : business.completed
                          ? 'bg-blue-500'
                          : 'bg-slate-400'
                      }`}
                      style={{ width: `${getProgressPercentage(business)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Collaboration Eligibility */}
                <div className="mb-4 flex items-center gap-2 text-xs">
                  {canAddCollaborators(business) ? (
                    <div className="flex items-center gap-1 text-green-700">
                      <UserPlus className="w-3 h-3" />
                      <span>Ready for collaboration</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-700">
                      <Info className="w-3 h-3" />
                      <span>Collaboration restricted</span>
                    </div>
                  )}
                </div>

                {/* Business Details */}
                <div className="space-y-2 text-sm">
                  {business.businessEmail && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="w-4 h-4">📧</span>
                      <span className="line-clamp-1">{business.businessEmail}</span>
                    </div>
                  )}
                  {business.address && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="w-4 h-4">📍</span>
                      <span className="line-clamp-1">{business.address}</span>
                    </div>
                  )}
                  {business.phone && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="w-4 h-4">📞</span>
                      <span>{business.phone}</span>
                    </div>
                  )}
                  {business.website && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <span className="w-4 h-4">🌐</span>
                      <span className="line-clamp-1">{business.website}</span>
                    </div>
                  )}
                </div>

                {/* Affiliate Information */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">Primary Chamber:</span>
                    <span>{getPrimaryAffiliateName(business)}</span>
                  </div>
                  {userSecondaryAffiliates.length > 0 && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">Secondary Chambers:</span>
                      <span className="text-xs">
                        {userSecondaryAffiliates.length} selected
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-4 space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedBusiness(business);
                      setShowDetailModal(true);
                    }}
                  >
                    {business.rejected ? 'Review & Resubmit' : 'Manage Business'}
                  </Button>
                  
                  {/* Passport Button - Only for verified businesses */}
                  {business.verified && business.paymentStatus === 'paid' && (
                    <Button 
                      variant="default" 
                      className="w-full bg-green-600 hover:bg-green-700 text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewPassport(business);
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      View Passport
                    </Button>
                  )}
                  
                  <div className="flex gap-2">
                    {/* Only show Edit button for owned businesses */}
                    {ownedBusinesses.some((ob: BusinessProfile) => ob.id === business.id) && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditBusiness(business);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    )}
                    {/* Only show Collaborate button for owned businesses */}
                    {ownedBusinesses.some((ob: BusinessProfile) => ob.id === business.id) && (
                      canAddCollaborators(business) ? (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCollaborationInvite(business);
                          }}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Collaborate
                        </Button>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          disabled
                          title={getCollaborationEligibilityReason(business)}
                          className="flex-1 opacity-50 cursor-not-allowed"
                        >
                          <Info className="w-4 h-4 mr-2" />
                          Collaborate
                        </Button>
                      )
                    )}
                  </div>
                </div>

                {/* Verification Section */}
                {!business.verified && !business.rejected && ownedBusinesses.some((ob: BusinessProfile) => ob.id === business.id) && (
                  <div className="mt-4 p-3 border rounded-md" style={{
                    backgroundColor: isEligibleForVerification(business) ? '#f0f9ff' : '#fefce8',
                    borderColor: isEligibleForVerification(business) ? '#0ea5e9' : '#eab308'
                  }}>
                    <div className="flex items-start gap-3">
                      <Shield className={`w-5 h-5 mt-0.5 flex-shrink-0 ${isEligibleForVerification(business) ? 'text-blue-600' : 'text-amber-600'}`} />
                      <div className="flex-1">
                        <h4 className={`text-sm font-medium mb-1 ${isEligibleForVerification(business) ? 'text-blue-900' : 'text-amber-900'}`}>
                          {isEligibleForVerification(business) ? 'Ready for Verification!' : 'Verification Requirements'}
                        </h4>
                        <p className={`text-xs mb-3 ${isEligibleForVerification(business) ? 'text-blue-700' : 'text-amber-700'}`}>
                          {isEligibleForVerification(business) 
                            ? 'Your business profile is complete and ready for admin verification. Submit for verification to get your MSME Passport.'
                            : getVerificationEligibilityReason(business)
                          }
                        </p>
                        {isEligibleForVerification(business) ? (
                          <Button 
                            variant="default" 
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Navigate to payment page with business details
                              const params = new URLSearchParams({
                                businessId: business.id,
                                businessName: business.businessName
                              });
                              window.location.href = `/business-verification-payment?${params.toString()}`;
                            }}
                          >
                            <Shield className="w-4 h-4 mr-2" />
                            Verify Now
                          </Button>
                        ) : (
                          <div className="text-xs text-amber-700">
                            <strong>Profile Completion:</strong> {getBusinessCompletionPercentage(business)}% (99% required)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejection Reason */}
                {business.rejected && business.rejectionReason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-xs text-red-700 font-medium mb-1">Rejection Reason:</p>
                    <p className="text-xs text-red-600">{business.rejectionReason}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      {allBusinesses.length > 0 && (
        <Card className="bg-slate-50">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Business Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">{allBusinesses.length}</div>
                <div className="text-sm text-slate-600">Total Businesses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {allBusinesses.filter((b: BusinessProfile) => b.verified && b.paymentStatus === "paid").length}
                </div>
                <div className="text-sm text-slate-600">Verified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {allBusinesses.filter((b: BusinessProfile) => b.completed && !b.verified).length}
                </div>
                <div className="text-sm text-slate-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {allBusinesses.filter((b: BusinessProfile) => b.rejected).length}
                </div>
                <div className="text-sm text-slate-600">Rejected</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Detail Modal */}
      <BusinessDetailModal
        business={selectedBusiness}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedBusiness(null);
        }}
        onEditBusiness={onEditBusiness}
      />

      {/* Collaboration Invite Modal */}
      {showCollaborationInvite && selectedBusinessForCollaboration && (
        <CollaborationInvite
          businessId={selectedBusinessForCollaboration.id}
          businessName={selectedBusinessForCollaboration.businessName}
          onClose={() => {
            setShowCollaborationInvite(false);
            setSelectedBusinessForCollaboration(null);
          }}
          onSuccess={handleCollaborationSuccess}
        />
      )}

      {/* MSME Passport Modal */}
      {showPassport && selectedBusinessForPassport && (
        <MSMEPassport
          business={selectedBusinessForPassport}
          isOpen={showPassport}
          onClose={() => {
            setShowPassport(false);
            setSelectedBusinessForPassport(null);
          }}
        />
      )}
    </div>
  );
}
