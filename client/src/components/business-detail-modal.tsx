import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { X, Building2, Edit, Trash2, CheckCircle, XCircle, Clock, AlertCircle, Mail, Phone, Globe, MapPin, Calendar, Users, FileText, Archive, RotateCcw, UserPlus, Info } from "lucide-react";
import { authManager } from "@/lib/auth";
import type { BusinessProfile } from "@shared/schema";
import EditBusinessForm from "./edit-business-form";
import { canAddCollaborators, getCollaborationEligibilityReason } from "@/lib/collaboration-eligibility";

interface BusinessDetailModalProps {
  business: BusinessProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onEditBusiness: (business: BusinessProfile) => void;
}

export default function BusinessDetailModal({ business, isOpen, onClose, onEditBusiness }: BusinessDetailModalProps) {
  const user = authManager.getCurrentUser();
  const queryClient = useQueryClient();
  const [showEditForm, setShowEditForm] = useState(false);

  // Fetch affiliates for display
  const { data: primaryAffiliatesData } = useQuery({
    queryKey: ['/api/affiliates/main'],
    queryFn: async () => {
      const response = await fetch('/api/affiliates/main');
      if (!response.ok) throw new Error('Failed to fetch primary affiliates');
      return response.json();
    },
  });

  const { data: userSecondaryAffiliatesData } = useQuery({
    queryKey: ['/api/affiliates/user', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/affiliates/user/${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch user secondary affiliates');
      return response.json();
    },
    enabled: !!user,
  });

  const primaryAffiliates = primaryAffiliatesData?.mainAffiliates || [];
  const userSecondaryAffiliates = userSecondaryAffiliatesData?.userSecondaryAffiliates || [];

  const deleteBusinessMutation = useMutation({
    mutationFn: async (businessId: string) => {
      console.log('Client: Deleting business:', businessId);
      const response = await fetch(`/api/businesses/${businessId}`, {
        method: "DELETE",
      });

      console.log('Client: Delete response status:', response.status);
      console.log('Client: Delete response headers:', response.headers);

      if (!response.ok) {
        // Try to parse JSON error, fallback to text if it's HTML
        let errorMessage = "Failed to delete business";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.log('Client: JSON error data:', errorData);
        } catch (parseError) {
          // If JSON parsing fails, it might be HTML, so use status text
          errorMessage = response.statusText || errorMessage;
          console.log('Client: Parse error, using status text:', response.statusText);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Client: Delete successful:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user', user?.id, 'all-businesses'] });
      onClose();
    },
    onError: (error) => {
      console.error("Error deleting business:", error);
      alert(error.message || "Failed to delete business");
    },
  });

  const archiveBusinessMutation = useMutation({
    mutationFn: async ({ businessId, archived }: { businessId: string; archived: boolean }) => {
      const response = await fetch(`/api/businesses/${businessId}/archive`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ archived }),
      });

      if (!response.ok) {
        // Try to parse JSON error, fallback to text if it's HTML
        let errorMessage = "Failed to update business archive status";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If JSON parsing fails, it might be HTML, so use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user', user?.id, 'all-businesses'] });
    },
    onError: (error) => {
      console.error("Error updating business archive status:", error);
      alert(error.message || "Failed to update business archive status");
    },
  });

  const getStatusBadge = (business: BusinessProfile) => {
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
  };

  const getProgressPercentage = (business: BusinessProfile) => {
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
  };

  const getPrimaryAffiliateName = (business: BusinessProfile) => {
    const affiliate = primaryAffiliates.find(a => a.id === business.primaryAffiliateId);
    return affiliate?.name || 'Unknown Chamber';
  };

  const handleDelete = () => {
    if (business) {
      deleteBusinessMutation.mutate(business.id);
    }
  };

  const handleEdit = () => {
    if (business) {
      onEditBusiness(business);
      setShowEditForm(true);
    }
  };

  const handleArchiveToggle = () => {
    if (business) {
      archiveBusinessMutation.mutate({ 
        businessId: business.id, 
        archived: !business.archived 
      });
    }
  };

  const handleEditSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/user', user?.id, 'all-businesses'] });
    setShowEditForm(false);
  };

  if (!business) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          aria-describedby="business-details-description"
        >
                     <DialogHeader>
             <div className="flex items-center gap-3">
               <Building2 className="w-6 h-6 text-blue-600" />
               <DialogTitle>Business Details</DialogTitle>
             </div>
           </DialogHeader>

          <div id="business-details-description" className="sr-only">
            Detailed information about {business.businessName} including contact details, business information, chamber affiliations, and documents.
          </div>
          <div className="space-y-6">
            {/* Business Header */}
            <div className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                    {business.profilePicture ? (
                      <img 
                        src={business.profilePicture} 
                        alt="Business Logo" 
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <Building2 className="w-8 h-8 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{business.businessName}</h2>
                    {business.tagline && (
                      <p className="text-slate-600 mt-1">{business.tagline}</p>
                    )}
                  </div>
                </div>
                {getStatusBadge(business)}
              </div>

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

              {/* Collaboration Status */}
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <UserPlus className="w-5 h-5 text-slate-600" />
                  <h3 className="font-medium text-slate-900">Collaboration Status</h3>
                </div>
                {canAddCollaborators(business) ? (
                  <div className="flex items-center gap-2 text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Ready to add collaborators</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Info className="w-4 h-4" />
                      <span className="text-sm font-medium">Collaboration restricted</span>
                    </div>
                    <p className="text-xs text-slate-600 ml-6">
                      {getCollaborationEligibilityReason(business)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Business Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {business.businessEmail && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span>{business.businessEmail}</span>
                    </div>
                  )}
                  {business.phone && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <Phone className="w-4 h-4 text-slate-500" />
                      <span>{business.phone}</span>
                    </div>
                  )}
                  {business.website && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <Globe className="w-4 h-4 text-slate-500" />
                      <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {business.website}
                      </a>
                    </div>
                  )}
                  {business.address && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <span>{business.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Business Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Business Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {business.category && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <span>{business.category}</span>
                    </div>
                  )}
                  {business.ownerName && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>Owner: {business.ownerName}</span>
                    </div>
                  )}
                  {business.yearEstablished && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span>Established: {business.yearEstablished}</span>
                    </div>
                  )}
                  {business.numberOfEmployees && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span>Employees: {business.numberOfEmployees}</span>
                    </div>
                  )}
                  {business.businessRegistrationNumber && (
                    <div className="flex items-center gap-3 text-slate-700">
                      <FileText className="w-4 h-4 text-slate-500" />
                      <span>Registration: {business.businessRegistrationNumber}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Affiliate Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Chamber Affiliations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-slate-700">
                  <Users className="w-4 h-4 text-slate-500" />
                  <span className="font-medium">Primary Chamber:</span>
                  <span>{getPrimaryAffiliateName(business)}</span>
                </div>
                {userSecondaryAffiliates.length > 0 && (
                  <div className="flex items-center gap-3 text-slate-700">
                    <Users className="w-4 h-4 text-slate-500" />
                    <span className="font-medium">Secondary Chambers:</span>
                    <span>{userSecondaryAffiliates.length} selected</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Documents Section */}
            {(business.businessLicense || business.registrationCertificate || business.proofOfOperations) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {business.businessLicense && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">ID Card</span>
                        </div>
                        <p className="text-xs text-green-600">Uploaded</p>
                      </div>
                    )}
                    {business.registrationCertificate && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Registration Certificate</span>
                        </div>
                        <p className="text-xs text-green-600">Uploaded</p>
                      </div>
                    )}
                    {business.proofOfOperations && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Proof of Operations</span>
                        </div>
                        <p className="text-xs text-green-600">Uploaded</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Rejection Reason */}
            {business.rejected && business.rejectionReason && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-lg text-red-800">Rejection Reason</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-red-700">{business.rejectionReason}</p>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              {canAddCollaborators(business) ? (
                <Button
                  variant="default"
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    // TODO: Open collaboration invite modal
                    console.log('Open collaboration invite for:', business.id);
                  }}
                >
                  <UserPlus className="w-4 h-4" />
                  Add Collaborator
                </Button>
              ) : (
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled
                  title={getCollaborationEligibilityReason(business)}
                >
                  <UserPlus className="w-4 h-4" />
                  Add Collaborator
                </Button>
              )}

              <Button
                onClick={handleArchiveToggle}
                variant={business.archived ? "outline" : "secondary"}
                className="flex items-center gap-2"
                disabled={archiveBusinessMutation.isPending}
              >
                {archiveBusinessMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {business.archived ? "Unarchiving..." : "Archiving..."}
                  </>
                ) : (
                  <>
                    {business.archived ? (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        Unarchive Business
                      </>
                    ) : (
                      <>
                        <Archive className="w-4 h-4" />
                        Archive Business
                      </>
                    )}
                  </>
                )}
              </Button>
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Business
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Business</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{business.businessName}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={deleteBusinessMutation.isPending}
                    >
                      {deleteBusinessMutation.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Business Form Modal */}
      {showEditForm && (
        <EditBusinessForm
          business={business}
          onClose={() => setShowEditForm(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </>
  );
}
