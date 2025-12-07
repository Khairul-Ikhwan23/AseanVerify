import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  Shield, 
  Building2, 
  Calendar,
  FileText,
  ArrowLeft,
  Loader2
} from "lucide-react";

interface BusinessVerificationData {
  id: string;
  businessName: string;
  businessRegistrationNumber: string;
  verified: boolean;
  passportId: string;
  createdAt: string;
}

export default function VerifyBusiness() {
  const [, setLocation] = useLocation();
  const [business, setBusiness] = useState<BusinessVerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passportId, setPassportId] = useState<string>("");

  useEffect(() => {
    // Get passport ID from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id') || window.location.pathname.split('/').pop();
    
    if (id) {
      setPassportId(id);
      verifyBusiness(id);
    } else {
      setError("No passport ID provided");
      setLoading(false);
    }
  }, []);

  const verifyBusiness = async (id: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/verify/${id}`);
      const data = await response.json();

      if (data.success) {
        setBusiness(data.business);
      } else {
        setError(data.message || "Business verification failed");
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError("Failed to verify business. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleBack = () => {
    setLocation('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-slate-600">Verifying business...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="mb-4 flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Business Verification</h1>
            <p className="text-slate-600">Verify the authenticity of MSME Passport</p>
          </div>

          {error ? (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : business ? (
            <div className="space-y-6">
              {/* Verification Status */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {business.verified ? (
                      <CheckCircle className="w-8 h-8 text-green-600" />
                    ) : (
                      <XCircle className="w-8 h-8 text-red-600" />
                    )}
                    <div>
                      <CardTitle className="text-xl">
                        {business.verified ? "Verified Business" : "Unverified Business"}
                      </CardTitle>
                      <p className="text-sm text-slate-600">
                        {business.verified 
                          ? "This business has been verified by Brunei Chamber of Commerce"
                          : "This business is not verified"
                        }
                      </p>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Business Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Business Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Business Name</label>
                      <p className="text-lg font-semibold text-slate-900">{business.businessName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Registration Number</label>
                      <p className="text-lg font-semibold text-slate-900">
                        {business.businessRegistrationNumber || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Passport ID</label>
                      <p className="text-lg font-semibold text-slate-900">{business.passportId}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Verified Date</label>
                      <p className="text-lg font-semibold text-slate-900">
                        {formatDate(business.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Verification Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Verification Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Verification Status</span>
                      <Badge variant={business.verified ? "default" : "destructive"}>
                        {business.verified ? "Verified" : "Not Verified"}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Verified By</span>
                      <span className="font-medium">Brunei Chamber of Commerce</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Verification Type</span>
                      <span className="font-medium">MSME Passport</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Disclaimer */}
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  This verification is based on the information provided at the time of registration. 
                  For the most current information, please contact the business directly or visit 
                  the Brunei Chamber of Commerce.
                </AlertDescription>
              </Alert>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
