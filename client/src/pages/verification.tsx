import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, Star, Shield, Users, Globe, Award } from "lucide-react";
import Navigation from "@/components/navigation";
import { authManager } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import type { BusinessProfile } from "@shared/schema";

export default function Verification() {
  const [, setLocation] = useLocation();
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const user = authManager.getCurrentUser();

  const { data: profileData } = useQuery({
    queryKey: ['/api/profile', user?.id],
    enabled: !!user,
  });

  const profile = profileData?.profile as BusinessProfile | undefined;

  const handleBack = () => {
    setLocation('/dashboard');
  };

  const handleProceedToPayment = (tier: 'basic' | 'standard' | 'elite') => {
    if (!agreedToTerms) {
      alert('Please agree to the terms and conditions to proceed.');
      return;
    }

    // Check if all required documents are uploaded
    if (!profile?.businessLicense || !profile?.registrationCertificate) {
      alert('Please upload all required documents before proceeding to payment.');
      return;
    }

    // TODO: Integrate with payment gateway
    alert('Payment integration coming soon!');
  };

  if (!user) {
    setLocation('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Review & Submit</h1>
          <p className="text-slate-600">Confirm your application for $200/year</p>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          {/* Business Information */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Business Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-600">Name</p>
                <p className="font-medium text-slate-900">{user.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Registration</p>
                <p className="font-medium text-slate-900">{profile?.businessRegistrationNumber || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Sector</p>
                <p className="font-medium text-slate-900">{profile?.category || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Size</p>
                <p className="font-medium text-slate-900">{profile?.numberOfEmployees || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Uploaded Documents */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">Uploaded Documents</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                {profile?.businessLicense ? (
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                ) : (
                  <div className="w-5 h-5 border-2 border-red-300 rounded-full mr-3 flex items-center justify-center">
                    <span className="text-red-500 text-xs">!</span>
                  </div>
                )}
                <span className={`${profile?.businessLicense ? 'text-slate-700' : 'text-red-600'}`}>
                  Company Owner's Identification Card {!profile?.businessLicense && '(Required)'}
                </span>
              </div>
              <div className="flex items-center">
                {profile?.registrationCertificate ? (
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                ) : (
                  <div className="w-5 h-5 border-2 border-red-300 rounded-full mr-3 flex items-center justify-center">
                    <span className="text-red-500 text-xs">!</span>
                  </div>
                )}
                <span className={`${profile?.registrationCertificate ? 'text-slate-700' : 'text-red-600'}`}>
                  Registration Certificate {!profile?.registrationCertificate && '(Required)'}
                </span>
              </div>
              <div className="flex items-center">
                {profile?.proofOfOperations ? (
                  <Check className="w-5 h-5 text-green-500 mr-3" />
                ) : (
                  <div className="w-5 h-5 border-2 border-red-300 rounded-full mr-3 flex items-center justify-center">
                    <span className="text-red-500 text-xs">!</span>
                  </div>
                )}
                <span className={`${profile?.proofOfOperations ? 'text-slate-700' : 'text-red-600'}`}>
                  Proof of Operations (Optional - helps with legitimacy)
                </span>
              </div>
            </div>
            {(!profile?.businessLicense || !profile?.registrationCertificate) && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">
                  ⚠️ Registration Certificate and Company Owner's Identification Card are required before proceeding to payment. Please complete your profile first.
                </p>
              </div>
            )}
          </div>

          {/* Membership Tiers */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-6">Choose Your Membership Tier</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Basic Tier */}
              <Card className="border-2 border-slate-200 hover:border-slate-300 transition-colors">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Basic</h3>
                    <div className="text-3xl font-bold text-slate-600">$100</div>
                    <p className="text-sm text-slate-500">per year</p>
                    <div className="mt-2">
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                        Founders Only
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600 mb-6">
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Digital Business Passport
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      QR Code Generation
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Basic Network Access
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      MSME Verification
                    </li>
                  </ul>
                  <Button 
                    className="w-full bg-slate-600 hover:bg-slate-700"
                    disabled={!agreedToTerms || !profile?.businessLicense || !profile?.registrationCertificate}
                    onClick={(e) => handleProceedToPayment('basic')}
                  >
                    Select Basic
                  </Button>
                </CardContent>
              </Card>

              {/* Standard Tier */}
              <Card className="border-2 border-blue-200 bg-blue-50 hover:border-blue-300 transition-colors relative">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                    Most Popular
                  </span>
                </div>
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Standard</h3>
                    <div className="text-3xl font-bold text-blue-600">$200</div>
                    <p className="text-sm text-slate-500">per year</p>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600 mb-6">
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Everything in Basic
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Enhanced Network Access
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Priority Verification
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Business Analytics
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Chamber Events Access
                    </li>
                  </ul>
                  <Button 
                    className="w-full asean-blue"
                    disabled={!agreedToTerms || !profile?.businessLicense || !profile?.registrationCertificate}
                    onClick={(e) => handleProceedToPayment('standard')}
                  >
                    Select Standard
                  </Button>
                </CardContent>
              </Card>

              {/* Elite Tier */}
              <Card className="border-2 border-purple-200 bg-purple-50 hover:border-purple-300 transition-colors">
                <CardContent className="p-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Elite</h3>
                    <div className="text-3xl font-bold text-purple-600">$500</div>
                    <p className="text-sm text-slate-500">per year</p>
                    <div className="mt-2">
                      <span className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full font-medium">
                        Premium
                      </span>
                    </div>
                  </div>
                  <ul className="space-y-2 text-sm text-slate-600 mb-6">
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Everything in Standard
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Financial Statements Sharing
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Audited Accounts Access
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      VIP Chamber Access
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Investment Opportunities
                    </li>
                    <li className="flex items-center">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      Dedicated Support
                    </li>
                  </ul>
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={!agreedToTerms || !profile?.businessLicense || !profile?.registrationCertificate}
                    onClick={(e) => handleProceedToPayment('elite')}
                  >
                    Select Elite
                  </Button>
                </CardContent>
              </Card>
            </div>
            
            {/* Elite Tier Note */}
            <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <p className="text-sm text-purple-700">
                <span className="font-medium">Elite Tier Note:</span> The Elite tier requires businesses to be willing to share financial statements and audited accounts for enhanced verification and investment opportunities.
              </p>
            </div>
          </div>

          {/* Benefits Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">MSME Passport Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Global Recognition</h4>
                  <p className="text-sm text-slate-600">Get recognized as a verified MSME business worldwide</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Users className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Network Access</h4>
                  <p className="text-sm text-slate-600">Connect with other verified MSME businesses</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Award className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Trust & Credibility</h4>
                  <p className="text-sm text-slate-600">Build trust with customers and partners</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Digital Passport</h4>
                  <p className="text-sm text-slate-600">Get your digital business passport with QR code</p>
                </div>
              </div>
            </div>
          </div>

          {/* What happens next */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">What happens next?</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700">You will be redirected to our payment partner to complete the payment.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700">Your application will be reviewed by the local chamber.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700">You'll receive an email notification within 5-7 business days.</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-slate-700">Upon approval, your digital passport will be issued.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-start space-x-3 mb-6">
            <Checkbox 
              id="terms" 
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            />
            <label htmlFor="terms" className="text-sm text-slate-700 leading-relaxed">
              I agree to the terms and conditions and privacy policy. I understand that my information will be used for verification purposes only. I agree to the <span className="font-bold">annual membership fee</span> for the selected tier.
            </label>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="w-full sm:w-auto"
            >
              Back
            </Button>
            <Button 
              onClick={handleProceedToPayment}
              disabled={!agreedToTerms || !profile?.businessLicense || !profile?.registrationCertificate}
              className="w-full sm:w-auto asean-blue"
            >
              Proceed to Payment
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
