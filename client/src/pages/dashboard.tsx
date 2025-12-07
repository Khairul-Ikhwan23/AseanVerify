import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import PassportCard from "@/components/passport-card";
import BusinessManager from "@/components/business-manager";
import AddBusinessForm from "@/components/add-business-form";
import EditBusinessForm from "@/components/edit-business-form";
import CollaborationInvitations from "@/components/collaboration-invitations";
import { VerificationStatusCard } from "@/components/document-upload";
import { authManager } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import type { BusinessProfile } from "@shared/schema";

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const user = authManager.getCurrentUser();
  const [showAddBusinessForm, setShowAddBusinessForm] = useState(false);
  const [showEditBusinessForm, setShowEditBusinessForm] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<BusinessProfile | null>(null);

  useEffect(() => {
    if (!user) {
      setLocation('/login');
    }
  }, [user, setLocation]);

  const { data: profileData, isLoading } = useQuery<{ profile?: BusinessProfile }>({
    queryKey: ['/api/profile', user?.id],
    enabled: !!user,
  });

  const { data: userData, isLoading: userLoading } = useQuery<{ user?: any }>({
    queryKey: ['/api/user', user?.id],
    enabled: !!user,
  });

  const profile = profileData?.profile;
  const currentUser = userData?.user;

  // Check if user is rejected
  const isRejected = profile?.rejected;
  const rejectionReason = profile?.rejectionReason;

  if (!user) return null;

  const handleAddBusiness = () => {
    setShowAddBusinessForm(true);
  };

  const handleBusinessAdded = () => {
    setShowAddBusinessForm(false);
  };

  const handleViewBusiness = (business: BusinessProfile) => {
    // This is now handled by the BusinessDetailModal in BusinessManager
    console.log('View business:', business);
  };

  const handleEditBusiness = (business: BusinessProfile) => {
    setSelectedBusiness(business);
    setShowEditBusinessForm(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Navigation />
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Rejection Notification */}
          {isRejected && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Application Rejected
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p className="mb-2">
                      <strong>Reason for rejection:</strong>
                    </p>
                    <p className="bg-red-100 p-3 rounded-md border-l-4 border-red-400">
                      {rejectionReason || "No specific reason provided."}
                    </p>
                    <p className="mt-2 text-xs">
                      Please review the feedback above and update your application accordingly. 
                      You can resubmit your application after making the necessary changes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Welcome Section */}
          <div className="bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 rounded-lg shadow-lg p-6 mb-8 relative">
            <h1 className="text-3xl font-bold text-white mb-2" data-testid="text-welcome">
              Welcome, {currentUser?.firstName || user.firstName} {currentUser?.lastName || user.lastName}!
            </h1>
            <p className="text-blue-100 mb-4" data-testid="text-welcome-subtitle">
              Manage your digital business passports and grow your MSME network.
            </p>
            
            {/* Verified Badges - Mobile: Below Text, Desktop: Top Right */}
            <div className="sm:hidden mb-2 space-y-2">
              {currentUser?.verified ? (
                <div className="flex items-center space-x-2 bg-green-500/70 text-white px-3 py-1.5 rounded-full shadow-lg w-fit">
                  <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold">Verified User</span>
                </div>
              ) : null}
              {profile?.verified && profile?.paymentStatus === "paid" ? (
                <div className="flex items-center space-x-2 bg-yellow-500/70 text-white px-3 py-1.5 rounded-full shadow-lg w-fit">
                  <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-2.5 h-2.5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold">Verified Business</span>
                </div>
              ) : null}
            </div>
            
            {/* Badge Container - Desktop: Right Side, Vertically Centered */}
            <div className="hidden sm:block absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="flex flex-col items-end space-y-2">
                {/* User Verification Badge */}
                {currentUser?.verified ? (
                  <div className="w-10 h-10 bg-green-500/70 rounded-full shadow-lg flex items-center justify-center" title="Verified User">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : null}
                {/* Business Verification Badge */}
                {profile?.verified && profile?.paymentStatus === "paid" ? (
                  <div className="w-10 h-10 bg-yellow-500/70 rounded-full shadow-lg flex items-center justify-center" title="Verified Business">
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Collaboration Invitations */}
          <div className="mb-8">
            <CollaborationInvitations
              onInvitationResponded={() => {
                // Refresh business data when invitation is responded to
                console.log('Collaboration invitation responded to');
              }}
            />
          </div>

          {/* Verification Status Card */}
          {!currentUser?.verified && (
            <div className="mb-8">
              <VerificationStatusCard
                user={currentUser}
                onCompleteProfile={() => setLocation('/profile-form')}
              />
            </div>
          )}

          {/* Multi-Business Management */}
          <BusinessManager
            onAddBusiness={handleAddBusiness}
            onViewBusiness={handleViewBusiness}
            onEditBusiness={handleEditBusiness}
          />

          {/* Add Business Form Modal */}
          {showAddBusinessForm && (
            <AddBusinessForm
              onClose={() => setShowAddBusinessForm(false)}
              onSuccess={handleBusinessAdded}
            />
          )}

          {/* Edit Business Form Modal */}
          {showEditBusinessForm && selectedBusiness && (
            <EditBusinessForm
              business={selectedBusiness}
              onClose={() => {
                setShowEditBusinessForm(false);
                setSelectedBusiness(null);
              }}
              onSuccess={() => {
                setShowEditBusinessForm(false);
                setSelectedBusiness(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
