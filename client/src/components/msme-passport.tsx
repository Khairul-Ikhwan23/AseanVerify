import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { QRCodeGenerator } from "@/lib/qr-generator";
import { useToast } from "@/hooks/use-toast";
import { authManager } from "@/lib/auth";
import { 
  Shield, 
  Star, 
  Mail, 
  Phone, 
  Linkedin, 
  MessageCircle, 
  X,
  Download,
  Share2,
  Loader2
} from "lucide-react";
import type { BusinessProfile } from "@shared/schema";

interface MSMEPassportProps {
  business: BusinessProfile;
  isOpen: boolean;
  onClose: () => void;
}

export default function MSMEPassport({ business, isOpen, onClose }: MSMEPassportProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrData, setQrData] = useState<string>("");
  const [passportId, setPassportId] = useState<string>("");
  const { toast } = useToast();
  const user = authManager.getCurrentUser();

  // Generate unique verification code
  const verificationCode = passportId || `MP-${business.businessRegistrationNumber?.slice(-6) || '000000'}-${new Date().getFullYear()}`;

  useEffect(() => {
    if (isOpen && business.id) {
      generateQRCode();
    }
  }, [isOpen, business.id]);

  const generateQRCode = async () => {
    try {
      setIsGeneratingQR(true);
      
      console.log('Generating QR code for business:', business.id, 'user:', user?.id);
      
      // Check if business already has QR code
      if (business.qrCode && business.passportId) {
        console.log('Using existing QR code');
        setQrData(business.qrCode);
        setPassportId(business.passportId);
        return;
      }

      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Generate new QR code
      console.log('Making API call to generate QR code...');
      const response = await fetch(`/api/businesses/${business.id}/generate-qr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id
        }),
      });

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error:', errorData);
        throw new Error(errorData.message || 'Failed to generate QR code');
      }

      const data = await response.json();
      console.log('QR code generated successfully:', data);
      setQrData(data.qrCode);
      setPassportId(data.passportId);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate QR code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      // Create a canvas to capture the passport
      const passportElement = document.getElementById('msme-passport');
      if (!passportElement) return;

      // Use html2canvas to capture the passport
      const canvas = await import('html2canvas').then(module => module.default);
      const passportCanvas = await canvas(passportElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true
      });

      // Convert to blob and download
      passportCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${business.businessName}-MSME-Passport.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Error downloading passport:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.origin + `/verify-business?id=${passportId}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${business.businessName} - MSME Passport`,
          text: `View ${business.businessName}'s verified MSME Passport`,
          url: shareUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link Copied",
          description: "Passport verification link copied to clipboard",
        });
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getExpiryDate = () => {
    if (!business.createdAt) return 'N/A';
    const issuedDate = new Date(business.createdAt);
    const expiryDate = new Date(issuedDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    return expiryDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">MSME Passport</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                {isDownloading ? 'Downloading...' : 'Download'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6">
          <Card id="msme-passport" className="w-full max-w-2xl mx-auto bg-white shadow-lg">
            <CardContent className="p-0">
              {/* Header Section - Yellow Background */}
              <div className="bg-yellow-400 p-6 relative">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Business Logo */}
                    {business.profilePicture ? (
                      <img 
                        src={business.profilePicture} 
                        alt={`${business.businessName} logo`}
                        className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500 border-2 border-white shadow-md">
                        <span className="text-center">No Image</span>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold text-black mb-1">MSME PASSPORT</h1>
                      <p className="text-sm text-black mb-4">ASEAN Business Verification</p>
                      
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs text-black font-medium">Business Name</p>
                          <p className="text-lg font-bold text-black">{business.businessName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-black font-medium">Registration</p>
                          <p className="text-sm font-semibold text-black">{business.businessRegistrationNumber || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-black font-medium">Membership</p>
                          <p className="text-sm font-semibold text-black">Active</p>
                        </div>
                        <div className="flex gap-6">
                          <div>
                            <p className="text-xs text-black font-medium">Issued</p>
                            <p className="text-sm font-semibold text-black">{formatDate(business.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-black font-medium">Expires</p>
                            <p className="text-sm font-semibold text-black">{getExpiryDate()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Badge */}
                  <Badge className="bg-yellow-500 text-black border-0 flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    FOUNDING 100
                  </Badge>
                </div>
              </div>

              {/* Middle Section - Light Grey Background */}
              <div className="bg-gray-100 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-4">
                      <Shield className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Verified By</p>
                        <p className="text-lg font-bold text-gray-900">Brunei Chamber of Commerce</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Verification Code</p>
                      <p className="text-sm font-bold text-gray-900">{verificationCode}</p>
                    </div>
                  </div>
                  
                  {/* QR Code */}
                  <div className="ml-6">
                    {isGeneratingQR ? (
                      <div className="w-[120px] h-[120px] bg-white p-2 rounded flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
                      </div>
                    ) : qrData ? (
                      <div>
                        <QRCodeGenerator 
                          value={qrData} 
                          size={120} 
                          className="bg-white p-2 rounded"
                        />
                        <div className="text-xs text-gray-500 mt-1">QR Code Generated</div>
                      </div>
                    ) : (
                      <div className="w-[120px] h-[120px] bg-gray-100 p-2 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-500">No QR Data</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 p-3 bg-white rounded text-xs text-gray-600">
                  <p>
                    This passport verifies the business registration and compliance status. 
                    Scan QR code for instant verification. Valid until expiry date shown. 
                    No personal data is embedded in QR code.
                  </p>
                </div>
              </div>

              {/* Bottom Section - Light Grey Background */}
              <div className="bg-gray-100 p-6">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Contact & Connect</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <Button variant="outline" className="flex items-center gap-2 h-12">
                    <Mail className="w-4 h-4" />
                    Email
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2 h-12">
                    <Phone className="w-4 h-4" />
                    Call
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2 h-12">
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2 h-12">
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </Button>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-100 text-gray-500">BUSINESS SHOWCASE</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
