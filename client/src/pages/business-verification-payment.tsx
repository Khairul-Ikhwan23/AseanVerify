import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Shield, ArrowLeft, DollarSign } from "lucide-react";
import Navigation from "@/components/navigation";
import { authManager } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface BusinessVerificationPaymentProps {
  businessId?: string;
  businessName?: string;
}

export default function BusinessVerificationPayment({ 
  businessId, 
  businessName 
}: BusinessVerificationPaymentProps) {
  const [, setLocation] = useLocation();
  const user = authManager.getCurrentUser();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  // Get business details from URL params if not passed as props
  const urlParams = new URLSearchParams(window.location.search);
  const businessIdFromUrl = businessId || urlParams.get("businessId");
  const businessNameFromUrl = businessName || urlParams.get("businessName");

  if (!user) {
    setLocation('/login');
    return null;
  }

  if (!businessIdFromUrl || !businessNameFromUrl) {
    setLocation('/dashboard');
    return null;
  }

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update business payment status
      const response = await fetch(`/api/businesses/${businessIdFromUrl}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'pending',
          verified: false,
          rejected: false,
          rejectionReason: null,
          paymentStatus: 'paid'
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update payment status');
      }

      const result = await response.json();
      console.log('Payment API response:', result);

      toast({
        title: "Payment Successful!",
        description: "Your business verification payment has been processed. It's now pending admin review.",
      });

      // Redirect to dashboard
      setLocation('/dashboard');
      
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackToDashboard = () => {
    setLocation('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navigation />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={handleBackToDashboard}
            className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-900 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-slate-900">Business Verification</h1>
          </div>
          <p className="text-lg text-slate-600 max-w-md mx-auto">
            Verify your business "{businessNameFromUrl}" and unlock collaboration opportunities
          </p>
        </div>

        {/* Main Payment Card */}
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl font-semibold text-slate-900">
              Annual Verification Fee
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-8 px-8 pb-8">
            {/* Price Display */}
            <div className="text-center">
              <div className="inline-flex items-baseline gap-2">
                <span className="text-6xl font-bold text-blue-600">$100</span>
                <span className="text-xl text-slate-500">/year</span>
              </div>
              <p className="text-slate-600 mt-2">One-time payment for 12 months of service</p>
            </div>

            {/* Benefits List */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 text-center mb-4">
                What's Included
              </h3>
              <div className="grid gap-3">
                {[
                  "Business profile verification & admin review",
                  "Public business listing & discoverability",
                  "Full collaboration eligibility",
                  "Priority customer support",
                  "12 months of premium features"
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Button */}
            <div className="pt-4">
              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <div className="w-6 h-6 mr-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-6 h-6 mr-3" />
                    Pay $100.00
                  </>
                )}
              </Button>
              
              <p className="text-xs text-slate-500 text-center mt-3">
                🔒 Secure payment processing • No recurring charges
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            By proceeding, you agree to our{" "}
            <a href="#" className="text-blue-600 hover:underline font-medium">Terms of Service</a>
            {" "}and{" "}
            <a href="#" className="text-blue-600 hover:underline font-medium">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
