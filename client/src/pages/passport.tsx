import { useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Navigation from "@/components/navigation";
import { QRCodeGenerator } from "@/lib/qr-generator";
import { authManager } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { Lock, CheckCircle, AlertCircle, X } from "lucide-react";
import type { BusinessProfile } from "@shared/schema";

export default function Passport() {
  const [, setLocation] = useLocation();
  const user = authManager.getCurrentUser();

  useEffect(() => {
    if (!user) {
      setLocation('/login');
    }
  }, [user, setLocation]);

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['/api/profile', user?.id],
    enabled: !!user,
  });

  const { data: userData, isLoading: userLoading } = useQuery<{ user?: any }>({
    queryKey: ['/api/user', user?.id],
    enabled: !!user,
  });

  const profile = profileData?.profile as BusinessProfile | undefined;
  const currentUser = userData?.user;

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--asean-blue))] mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is verified and has paid
  const isVerified = profile?.verified && profile?.paymentStatus === "paid";
  const isProfileComplete = profile?.completed;

  // If profile is not complete, show locked state
  if (!isProfileComplete) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Close Button */}
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
          
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <Lock className="w-12 h-12 text-slate-400" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-4">Profile Incomplete</h1>
              <p className="text-slate-600 mb-6">
                Please complete your business profile to unlock your MSME Passport.
              </p>
              <Button 
                onClick={() => setLocation('/profile-form')}
                className="asean-blue"
              >
                Complete Profile
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // If not verified, show locked state
  if (!isVerified) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
        <Navigation />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Close Button */}
          <div className="flex justify-end mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/dashboard')}
              className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              <X className="w-4 h-4 mr-2" />
              Close
            </Button>
          </div>
          
          <Card className="text-center">
            <CardContent className="p-8">
              <div className="w-24 h-24 bg-yellow-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                <AlertCircle className="w-12 h-12 text-yellow-500" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-4">Passport Locked</h1>
              <p className="text-slate-600 mb-6">
                Your profile is complete, but you need to verify and pay for your MSME Passport to unlock it.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-center space-x-2 text-sm text-slate-600">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Profile Complete</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-slate-600">
                  <Lock className="w-4 h-4 text-yellow-500" />
                  <span>Verification Required</span>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-slate-600">
                  <Lock className="w-4 h-4 text-yellow-500" />
                  <span>Payment Required</span>
                </div>
              </div>
              <Button 
                onClick={() => setLocation('/verification')}
                className="asean-blue"
              >
                Get Verified
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // User is verified and paid - show the actual passport
  const handleShare = async () => {
    const url = `https://msmepassport.com/profile/${user?.email}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user?.businessName} - MSME Passport`,
          text: `Connect with ${user?.businessName}`,
          url: url
        });
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      try {
        await navigator.clipboard.writeText(url);
        alert('Passport link copied to clipboard!');
      } catch (error) {
        console.error('Failed to copy URL:', error);
      }
    }
  };

  const initials = profile?.businessName ? profile.businessName.split(' ').map(word => word[0]).join('').toUpperCase() : 'MSME';

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Close Button */}
        <div className="flex justify-end mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation('/dashboard')}
            className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          >
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
        
        {/* Business Card */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden mb-8" data-testid="card-passport">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-blue-800 via-blue-900 to-slate-900 px-8 py-12 text-white text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full mx-auto mb-4 flex items-center justify-center overflow-hidden">
              {profile?.profilePicture ? (
                <img 
                  src={profile.profilePicture} 
                  alt="Company Logo" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-3xl font-bold" data-testid="text-initials">{initials}</span>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2 drop-shadow-lg" data-testid="text-business-name">{profile?.businessName || 'Business Name'}</h1>
            <p className="text-white text-lg font-medium drop-shadow-md" data-testid="text-tagline">
              {profile?.tagline || 'Your business tagline'}
            </p>
            
            {/* Verification Badges */}
            <div className="flex justify-center space-x-3 mt-4">
              {currentUser?.verified ? (
                <div className="flex items-center space-x-1 bg-green-500/80 text-white px-3 py-1 rounded-full shadow-lg">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Verified User</span>
                </div>
              ) : null}
              {profile?.verified && profile?.paymentStatus === "paid" ? (
                <div className="flex items-center space-x-1 bg-yellow-500/80 text-white px-3 py-1 rounded-full shadow-lg">
                  <CheckCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Verified Business</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Business Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Contact Information</h3>
                <div className="space-y-2 text-slate-700">
                  <p data-testid="text-email">Email: {profile?.businessEmail || profile?.phone || 'Not provided'}</p>
                  <p data-testid="text-phone">Phone: {profile?.phone || 'Not provided'}</p>
                  <p data-testid="text-website">Website: {profile?.website || 'Not provided'}</p>
                  <p data-testid="text-address">Address: {profile?.address || 'Not provided'}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">Business Details</h3>
                <div className="space-y-2 text-slate-700">
                  <p data-testid="text-category">Category: {profile?.category || 'Not specified'}</p>
                  <p data-testid="text-employees">Employees: {profile?.numberOfEmployees || 'Not specified'}</p>
                  <p data-testid="text-established">Established: {profile?.yearEstablished || 'Not specified'}</p>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="text-center border-t border-slate-200 pt-8">
              <h3 className="font-semibold text-slate-900 mb-4">Scan to Connect</h3>
              <div className="flex justify-center mb-4">
                <QRCodeGenerator 
                  value={`https://msmepassport.com/profile/${user?.email}`}
                  size={120}
                />
              </div>
              <p className="text-sm text-slate-500 mb-4">
                Share this QR code with other businesses to connect
              </p>
              <Button 
                onClick={handleShare}
                className="asean-blue"
              >
                Share Passport
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
