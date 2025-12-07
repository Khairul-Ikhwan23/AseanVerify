import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navigation from "@/components/navigation";
import { QrCode, ArrowLeft, X, Loader2, CheckCircle, XCircle } from "lucide-react";
import { authManager } from "@/lib/auth";
import { Html5Qrcode } from "html5-qrcode";
import { useToast } from "@/hooks/use-toast";

export default function ScanQR() {
  const [, setLocation] = useLocation();
  const user = authManager.getCurrentUser();
  const { toast } = useToast();
  
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = "qr-reader";

  useEffect(() => {
    if (!user) {
      setLocation('/login');
    }
    
    // Cleanup scanner on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [user, setLocation]);

  const stopScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
      setIsScanning(false);
      setError(null);
    } catch (err) {
      console.error('Error stopping scanner:', err);
    }
  };

  const handleQRCodeScanned = useCallback(async (qrData: string) => {
    try {
      // Stop scanning immediately
      await stopScanner();
      setIsVerifying(true);

      // Parse QR data (could be JSON string or direct data)
      let qrDataToVerify = qrData;
      try {
        const parsed = JSON.parse(qrData);
        if (parsed.type === 'msme-passport') {
          qrDataToVerify = qrData; // Use full JSON string
        }
      } catch {
        // Not JSON, use as-is
      }

      // Verify QR code with backend
      const response = await fetch('/api/verify/qr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qrData: qrDataToVerify }),
      });

      const data = await response.json();

      if (data.success && data.business) {
        setScanResult(data.business);
        toast({
          title: "QR Code Verified",
          description: `Successfully verified ${data.business.businessName}`,
        });
        
        // Redirect to verification page after a short delay
        setTimeout(() => {
          setLocation(`/verify-business?id=${data.business.passportId}`);
        }, 1500);
      } else {
        throw new Error(data.message || 'Invalid QR code');
      }
    } catch (err: any) {
      console.error('Error verifying QR code:', err);
      setError(err.message || 'Failed to verify QR code');
      toast({
        title: "Verification Failed",
        description: err.message || 'Invalid or expired QR code',
        variant: "destructive"
      });
      setIsVerifying(false);
    }
  }, [setLocation, toast]);

  // Request camera permission explicitly
  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported in this browser');
      }

      // Request camera permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (err: any) {
      console.error('Camera permission error:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        throw new Error('Camera permission denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        throw new Error('No camera found on this device.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        throw new Error('Camera is already in use by another application.');
      } else if (err.name === 'OverconstrainedError' || err.name === 'ConstraintNotSatisfiedError') {
        throw new Error('Camera constraints not satisfied. Trying with default settings...');
      } else {
        throw new Error(err.message || 'Failed to access camera. Please check permissions.');
      }
    }
  };

  // Initialize scanner when isScanning becomes true and element exists
  useEffect(() => {
    if (!isScanning || scannerRef.current) return;

    const initScanner = async () => {
      try {
        // First, request camera permission explicitly
        await requestCameraPermission();
        
        // Wait a bit for DOM to render
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const element = document.getElementById(qrCodeRegionId);
        if (!element) {
          console.error('Scanner element not found');
          setError('Scanner element not found');
          setIsScanning(false);
          return;
        }

        // Create scanner instance
        const scanner = new Html5Qrcode(qrCodeRegionId);
        scannerRef.current = scanner;

        // Start scanning - try with back camera first, fallback to any camera
        try {
          await scanner.start(
            { facingMode: "environment" }, // Use back camera on mobile
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            (decodedText) => {
              // QR code detected
              handleQRCodeScanned(decodedText);
            },
            (errorMessage) => {
              // Ignore scanning errors (they're frequent during scanning)
            }
          );
        } catch (cameraError: any) {
          // If back camera fails, try any available camera
          console.log('Back camera failed, trying default camera...');
          await scanner.start(
            { facingMode: "user" }, // Try front camera
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0
            },
            (decodedText) => {
              handleQRCodeScanned(decodedText);
            },
            (errorMessage) => {
              // Ignore scanning errors
            }
          );
        }
      } catch (err: any) {
        console.error('Error starting scanner:', err);
        setError(err.message || 'Failed to start camera. Please check permissions.');
        setIsScanning(false);
        toast({
          title: "Camera Error",
          description: err.message || "Could not access camera. Please check permissions.",
          variant: "destructive"
        });
      }
    };

    initScanner();
  }, [isScanning, handleQRCodeScanned, toast]);

  const startScanner = () => {
    setError(null);
    setIsScanning(true);
    // Scanner initialization happens in useEffect when isScanning becomes true
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      setIsVerifying(true);

      // Create a temporary hidden div for file scanning (html5-qrcode needs an element)
      const tempId = 'qr-file-scanner-temp';
      let tempElement = document.getElementById(tempId);
      if (!tempElement) {
        tempElement = document.createElement('div');
        tempElement.id = tempId;
        tempElement.style.display = 'none';
        document.body.appendChild(tempElement);
      }

      // Use html5-qrcode to scan the uploaded file
      const scanner = new Html5Qrcode(tempId);
      
      try {
        const decodedText = await scanner.scanFile(file, true);
        
        // Process the scanned QR code
        await handleQRCodeScanned(decodedText);
      } catch (scanError: any) {
        // If scanning fails, try with different options
        try {
          const decodedText = await scanner.scanFile(file, false);
          await handleQRCodeScanned(decodedText);
        } catch (retryError: any) {
          throw new Error('Could not read QR code from image. Please ensure the image is clear and contains a valid QR code.');
        }
      } finally {
        // Clean up temporary element
        if (tempElement && tempElement.parentNode) {
          tempElement.parentNode.removeChild(tempElement);
        }
      }
    } catch (err: any) {
      console.error('Error scanning file:', err);
      setError(err.message || 'Failed to scan QR code from image');
      setIsVerifying(false);
      toast({
        title: "Scan Failed",
        description: err.message || 'Could not read QR code from image',
        variant: "destructive"
      });
    } finally {
      // Reset file input
      event.target.value = '';
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Navigation />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Scan QR Content */}
        <Card className="mb-6">
          <CardContent className="p-8 text-center">
            {!isScanning && !scanResult && (
              <>
                <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <QrCode className="w-12 h-12 text-slate-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Scan Business QR Code
                </h2>
                <p className="text-slate-600 mb-4">
                  Point your camera at another business's QR code or upload an image to connect and view their profile.
                </p>
                {window.location.protocol === 'http:' && (
                  <Alert className="mb-4 text-left">
                    <AlertDescription className="text-sm">
                      <strong>Note:</strong> Camera access may require HTTPS. If camera doesn't work, use the "Upload QR Code Image" option below.
                    </AlertDescription>
                  </Alert>
                )}
                <div className="space-y-3">
                  <Button 
                    className="asean-blue w-full"
                    onClick={startScanner}
                    disabled={isVerifying}
                  >
                    <QrCode className="w-5 h-5 mr-2" />
                    {isVerifying ? 'Verifying...' : 'Open Camera Scanner'}
                  </Button>
                  
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={isVerifying}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      id="qr-file-upload"
                    />
                    <Button 
                      variant="outline"
                      className="w-full"
                      disabled={isVerifying}
                      asChild
                    >
                      <label htmlFor="qr-file-upload" className="cursor-pointer flex items-center justify-center w-full">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Upload QR Code Image
                      </label>
                    </Button>
                  </div>
                </div>
              </>
            )}

            {isScanning && (
              <div className="space-y-4">
                <div className="relative">
                  <div id={qrCodeRegionId} className="mx-auto max-w-sm"></div>
                </div>
                <Button 
                  variant="destructive"
                  onClick={stopScanner}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Stop Scanning
                </Button>
              </div>
            )}

            {isVerifying && (
              <div className="space-y-4">
                <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-600" />
                <p className="text-slate-600">Verifying QR code...</p>
              </div>
            )}

            {scanResult && (
              <div className="space-y-4">
                <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
                <h3 className="text-lg font-semibold text-slate-900">
                  {scanResult.businessName}
                </h3>
                <p className="text-slate-600">
                  Redirecting to business profile...
                </p>
              </div>
            )}

            {error && (
              <Alert variant="destructive" className="mt-4">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Instructions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-900 mb-4">How to use:</h3>
            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-[hsl(var(--asean-blue))] rounded-full mt-2 flex-shrink-0"></div>
                <p>Find a business's QR code on their digital passport or business card</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-[hsl(var(--asean-blue))] rounded-full mt-2 flex-shrink-0"></div>
                <p>Point your camera at the QR code</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-[hsl(var(--asean-blue))] rounded-full mt-2 flex-shrink-0"></div>
                <p>View their business profile and connect with them</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* My Businesses Section - Mobile Only */}
        <div className="md:hidden">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">My Businesses</h3>
                <p className="text-slate-600 mb-4">
                  Manage your business profiles and access your MSME Passports.
                </p>
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => setLocation('/dashboard')}
                >
                  Go to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
