import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { QRCodeGenerator } from "@/lib/qr-generator";
import type { AuthUser } from "@/lib/auth";
import type { BusinessProfile } from "@shared/schema";

interface PassportCardProps {
  user: AuthUser;
  profile?: BusinessProfile | null;
  onCompleteProfile: () => void;
  onViewPassport: () => void;
  onGetVerified?: () => void;
}

export default function PassportCard({ user, profile, onCompleteProfile, onViewPassport, onGetVerified }: PassportCardProps) {
  const isVerified = profile?.verified && profile?.paymentStatus === "paid" && !profile?.rejected;

  if (!isVerified) {
    return (
      <Card data-testid="card-passport-locked" className="bg-slate-100">
        <CardContent className="text-center py-8">
          <div className="w-24 h-24 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
            <Lock className="w-12 h-12 text-slate-400" data-testid="icon-lock" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2" data-testid="text-passport-locked">
            Passport Locked
          </h3>
          <p className="text-slate-600 mb-4" data-testid="text-complete-profile-msg">
            {profile?.rejected 
              ? "Your application has been rejected. Please review the feedback and update your profile."
              : profile?.completed 
                ? "Your profile is complete! Pay to get verified and unlock your MSME Passport."
                : "Complete your profile and pay to get verified to unlock your MSME Passport and QR code."
            }
          </p>
          <Button 
            onClick={profile?.rejected ? onCompleteProfile : (profile?.completed ? onGetVerified : onCompleteProfile)}
            className="asean-yellow"
            data-testid="button-complete-profile"
          >
            {profile?.rejected ? "Update Profile" : (profile?.completed ? "Get Verified" : "Complete Profile")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-passport-unlocked" className="bg-slate-100">
      <CardContent className="text-center py-6">
        <div className="bg-gradient-to-r from-blue-800 via-blue-900 to-slate-900 rounded-lg p-6 text-white mb-4 shadow-lg">
          <div className="flex items-center justify-center mb-3">
            {profile?.profilePicture ? (
              <img 
                src={profile.profilePicture} 
                alt="Company Logo" 
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-white">
                  {profile?.businessName ? profile.businessName.split(' ').map(word => word[0]).join('').toUpperCase() : 'MSME'}
                </span>
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold mb-2 text-white drop-shadow-lg" data-testid="text-business-name">
            {profile?.businessName || 'Business Name'}
          </h3>
          <p className="text-white font-medium drop-shadow-md" data-testid="text-business-tagline">
            {profile?.tagline || 'Your business tagline'}
          </p>
        </div>
        <div className="mb-4 flex justify-center">
          <QRCodeGenerator 
            value={`https://msmepassport.com/profile/${user.email}`}
            size={128}
          />
        </div>
        <Button 
          onClick={onViewPassport}
          className="asean-green"
          data-testid="button-view-passport"
        >
          View Full Passport
        </Button>
      </CardContent>
    </Card>
  );
}
