import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navigation from "@/components/navigation";
import { authManager } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Search,
  Download,
  Eye,
  Shield,
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Users as UsersIcon,
  UserCheck,
  UserX,
  Clock,
  AlertTriangle,
  DollarSign,
  RefreshCw,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { isEligibleForVerification, getVerificationEligibilityReason, getBusinessCompletionPercentage } from "@/lib/verification-eligibility";
import type { BusinessProfile } from "@shared/schema";

interface Business extends BusinessProfile {
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
}

interface GroupedBusinesses {
  [userId: string]: {
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
    businesses: Business[];
  };
}

export default function AdminBusinesses() {
  const [, setLocation] = useLocation();
  const user = authManager.getCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingBusinessId, setRejectingBusinessId] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  // Document preview modal state (shared for all business docs)
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string; type: string } | null>(null);

  const toDataUrl = (doc: any, name = "Document") => {
    if (!doc) return null;
    try {
      const parsed = typeof doc === 'string' ? JSON.parse(doc) : doc;
      if (parsed?.data) {
        const type = parsed.type || "image/png";
        return { url: parsed.data.startsWith("data:") ? parsed.data : `data:${type};base64,${parsed.data}`, name: parsed.name || name, type };
      }
    } catch {}
    if (typeof doc === 'string' && doc.startsWith("data:")) {
      const match = /^data:([^;]+);/.exec(doc);
      return { url: doc, name, type: match?.[1] || "application/octet-stream" };
    }
    if (typeof doc === 'string') {
      return { url: `data:image/png;base64,${doc}` , name, type: "image/png" };
    }
    return null;
  };

  // Check if user is admin
  const isAdmin = user?.email === "admin@example.com";

  useEffect(() => {
    if (!user) {
      setLocation('/login');
    } else if (!isAdmin) {
      setLocation('/dashboard');
    }
  }, [user, isAdmin, setLocation]);

  // Fetch all businesses
  const { data: businessesData, isLoading, error } = useQuery({
    queryKey: ['/api/admin/businesses'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/businesses');
      return response.json();
    },
    enabled: !!isAdmin,
  });

  const businesses = businessesData?.businesses as Business[] || [];

  // Group businesses by user
  const groupedBusinesses: GroupedBusinesses = businesses.reduce((acc, business) => {
    const userId = business.userId;
    if (!acc[userId]) {
      acc[userId] = {
        user: business.user,
        businesses: []
      };
    }
    acc[userId].businesses.push(business);
    return acc;
  }, {} as GroupedBusinesses);

  // Separate businesses into verified, unverified, and rejected
  const verifiedBusinesses = businesses.filter(business => business.verified && !business.rejected);
  const unverifiedBusinesses = businesses.filter(business => !business.verified && !business.rejected);
  const rejectedBusinesses = businesses.filter(business => business.rejected);

  // Filter businesses based on search
  const filterBusinesses = (businessList: Business[]) => {
    return businessList.filter(business => {
      return business.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             business.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
             business.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
             business.businessEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    });
  };

  const filteredVerifiedBusinesses = filterBusinesses(verifiedBusinesses);
  const filteredUnverifiedBusinesses = filterBusinesses(unverifiedBusinesses);
  const filteredRejectedBusinesses = filterBusinesses(rejectedBusinesses);

  // Group filtered businesses
  const getGroupedFilteredBusinesses = (businessList: Business[]) => {
    const filtered = businessList.reduce((acc, business) => {
      const userId = business.userId;
      if (!acc[userId]) {
        acc[userId] = {
          user: business.user,
          businesses: []
        };
      }
      acc[userId].businesses.push(business);
      return acc;
    }, {} as GroupedBusinesses);
    return filtered;
  };

  const groupedVerified = getGroupedFilteredBusinesses(filteredVerifiedBusinesses);
  const groupedUnverified = getGroupedFilteredBusinesses(filteredUnverifiedBusinesses);
  const groupedRejected = getGroupedFilteredBusinesses(filteredRejectedBusinesses);

  // Business verification mutation
  const verifyBusinessMutation = useMutation({
    mutationFn: async ({ businessId, verified }: { businessId: string; verified: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/businesses/${businessId}/verify`, {
        verified,
        paymentStatus: verified ? "paid" : "pending"
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/businesses'] });
      toast({
        title: "Business Updated",
        description: "Business verification status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || "Failed to update business verification status.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Reject business mutation
  const rejectBusinessMutation = useMutation({
    mutationFn: async ({ businessId, rejected, rejectionReason }: { businessId: string; rejected: boolean; rejectionReason: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/businesses/${businessId}/reject`, {
        rejected,
        rejectionReason
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/businesses'] });
      toast({
        title: "Business Rejected",
        description: "Business has been rejected successfully.",
      });
      setRejectReason("");
      setRejectingBusinessId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject business.",
        variant: "destructive",
      });
    },
  });

  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const renderBusinessCard = (business: Business) => (
    <Card key={business.id} className="mb-4">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">{business.businessName}</h3>
              <Badge variant={business.verified ? "default" : business.rejected ? "destructive" : "secondary"}>
                {business.verified ? "Verified" : business.rejected ? "Rejected" : "Pending"}
              </Badge>
              {/* Payment Status Badge */}
              {business.paymentStatus === 'paid' && (
                <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
                  <DollarSign className="w-3 h-3 mr-1" />
                  Paid
                </Badge>
              )}
              {business.paymentStatus === 'pending' && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                  <Clock className="w-3 h-3 mr-1" />
                  Payment Pending
                </Badge>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Owner Email:</span>
                  <span className="font-medium">{business.user.email}</span>
                </div>
                {business.businessEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Business Email:</span>
                    <span className="font-medium">{business.businessEmail}</span>
                  </div>
                )}
                {business.ownerName && (
                  <div className="flex items-center gap-2">
                    <UsersIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Owner:</span>
                    <span className="font-medium">{business.ownerName}</span>
                  </div>
                )}
                {business.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Phone:</span>
                    <span className="font-medium">{business.phone}</span>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                {business.website && (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Website:</span>
                    <a href={business.website} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                      {business.website}
                    </a>
                  </div>
                )}
                {business.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Address:</span>
                    <span className="font-medium">{business.address}</span>
                  </div>
                )}
                {business.yearEstablished && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Established:</span>
                    <span className="font-medium">{business.yearEstablished}</span>
                  </div>
                )}
                {business.category && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Category:</span>
                    <span className="font-medium">{business.category}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Completion Section */}
            <div className="mt-4 p-3 rounded-lg border-2 bg-slate-50 border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-slate-600" />
                  <span className="font-semibold text-slate-900">Profile Completion</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    {getBusinessCompletionPercentage(business)}%
                  </span>
                  {getBusinessCompletionPercentage(business) >= 99 ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-600" />
                  )}
                </div>
              </div>
              <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    getBusinessCompletionPercentage(business) >= 99 
                      ? 'bg-green-500' 
                      : getBusinessCompletionPercentage(business) >= 80
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${getBusinessCompletionPercentage(business)}%` }}
                ></div>
              </div>
              {getBusinessCompletionPercentage(business) < 99 && (
                <div className="mt-2 text-xs text-slate-600">
                  Complete all required fields to reach 99% for verification eligibility
                </div>
              )}
            </div>

            {/* Documents Section */}
            <div className="mt-4 p-3 rounded-lg border bg-white">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-5 h-5 text-slate-600" />
                <span className="font-semibold text-slate-900">Documents</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                {/* Company Owner's Identification Card */}
                <div className="p-3 rounded border">
                  <div className="font-medium text-slate-800 mb-2">Company Owner's Identification Card</div>
                  <div className="flex flex-col gap-2">
                    {(() => {
                      const docs = (business as any).businessLicenseDocuments as string[] | undefined;
                      const single = (business as any).businessLicense as string | undefined;
                      const items = docs && docs.length ? docs : single ? [single] : [];
                      return items.length ? items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const normalized = toDataUrl(item, "Company Owner's Identification Card");
                              if (!normalized) return;
                              setPreviewDoc(normalized);
                              setPreviewOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {`View Document ${idx + 1}`}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const doc = toDataUrl(item, "company-owner-id");
                              if (!doc) return;
                              const a = document.createElement('a');
                              a.href = doc.url;
                              a.download = `${doc.name || `company-owner-id-${idx + 1}`}`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            {`Download Document ${idx + 1}`}
                          </Button>
                        </div>
                      )) : (
                        <div className="text-slate-500 text-sm">No documents uploaded</div>
                      );
                    })()}
                  </div>
                </div>

                {/* Registration Certificate */}
                <div className="p-3 rounded border">
                  <div className="font-medium text-slate-800 mb-2">Registration Certificate</div>
                  <div className="flex flex-col gap-2">
                    {(() => {
                      const docs = (business as any).registrationCertificateDocuments as string[] | undefined;
                      const single = (business as any).registrationCertificate as string | undefined;
                      const items = docs && docs.length ? docs : single ? [single] : [];
                      return items.length ? items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const normalized = toDataUrl(item, "Registration Certificate");
                              if (!normalized) return;
                              setPreviewDoc(normalized);
                              setPreviewOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {`View Document ${idx + 1}`}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const doc = toDataUrl(item, "registration-certificate");
                              if (!doc) return;
                              const a = document.createElement('a');
                              a.href = doc.url;
                              a.download = `${doc.name || `registration-certificate-${idx + 1}`}`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            {`Download Document ${idx + 1}`}
                          </Button>
                        </div>
                      )) : (
                        <div className="text-slate-500 text-sm">No documents uploaded</div>
                      );
                    })()}
                  </div>
                </div>

                {/* Proof of Operations */}
                <div className="p-3 rounded border">
                  <div className="font-medium text-slate-800 mb-2">Proof of Operations</div>
                  <div className="flex flex-col gap-2">
                    {(() => {
                      const docs = (business as any).proofOfOperationsDocuments as string[] | undefined;
                      const single = (business as any).proofOfOperations as string | undefined;
                      const items = docs && docs.length ? docs : single ? [single] : [];
                      return items.length ? items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const normalized = toDataUrl(item, "Proof of Operations");
                              if (!normalized) return;
                              setPreviewDoc(normalized);
                              setPreviewOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {`View Document ${idx + 1}`}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const doc = toDataUrl(item, "proof-of-operations");
                              if (!doc) return;
                              const a = document.createElement('a');
                              a.href = doc.url;
                              a.download = `${doc.name || `proof-of-operations-${idx + 1}`}`;
                              document.body.appendChild(a);
                              a.click();
                              document.body.removeChild(a);
                            }}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            {`Download Document ${idx + 1}`}
                          </Button>
                        </div>
                      )) : (
                        <div className="text-slate-500 text-sm">No documents uploaded</div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Status Section */}
            <div className="mt-4 p-3 rounded-lg border-2" style={{
              backgroundColor: business.paymentStatus === 'paid' ? '#f0f9ff' : '#fefce8',
              borderColor: business.paymentStatus === 'paid' ? '#0ea5e9' : '#eab308'
            }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {business.paymentStatus === 'paid' ? (
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-600" />
                  )}
                  <span className="font-semibold text-slate-900">
                    Payment Status: {business.paymentStatus === 'paid' ? 'PAID' : 'PENDING'}
                  </span>
                </div>
                {business.paymentStatus === 'paid' && (
                  <Badge variant="default" className="bg-blue-600 text-white">
                    ✓ Payment Complete
                  </Badge>
                )}
              </div>
              <p className="text-sm text-slate-600 mt-1">
                {business.paymentStatus === 'paid' 
                  ? 'Business has completed payment for yearly subscription and verification service'
                  : 'Business has not yet completed payment for yearly subscription and verification service'
                }
              </p>
            </div>

            {business.rejectionReason && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-900">Rejection Reason:</p>
                    <p className="text-sm text-red-700">{business.rejectionReason}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end pt-4 border-t">
          <div className="flex items-center gap-2">
            {!business.verified && !business.rejected && (
              <>
                {isEligibleForVerification(business) ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="default"
                        disabled={verifyBusinessMutation.isPending}
                      >
                        <UserCheck className="w-4 h-4 mr-2" />
                        Verify
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Verify Business</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to verify this business? This will grant them access to the MSME Passport system and mark their payment as complete.
                          <br /><br />
                          <strong>Profile Completion:</strong> {getBusinessCompletionPercentage(business)}%
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => verifyBusinessMutation.mutate({ businessId: business.id, verified: true })}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Verify Business
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-red-600 max-w-48">
                      {getVerificationEligibilityReason(business)}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={true}
                    >
                      <UserCheck className="w-4 h-4 mr-2" />
                      Verify
                    </Button>
                  </div>
                )}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setRejectingBusinessId(business.id)}
                    >
                      <UserX className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject Business</AlertDialogTitle>
                      <AlertDialogDescription>
                        Please provide a reason for rejecting this business application.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                      <Label htmlFor="reject-reason">Rejection Reason</Label>
                      <Textarea
                        id="reject-reason"
                        placeholder="Enter the reason for rejection..."
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => {
                        setRejectReason("");
                        setRejectingBusinessId(null);
                      }}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => {
                          if (rejectReason.trim()) {
                            rejectBusinessMutation.mutate({
                              businessId: business.id,
                              rejected: true,
                              rejectionReason: rejectReason.trim()
                            });
                          }
                        }}
                        disabled={!rejectReason.trim() || rejectBusinessMutation.isPending}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Reject Business
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            
            {business.verified && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={verifyBusinessMutation.isPending}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Unverify
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Unverify Business</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to unverify this business? This will remove their verification status and they will need to be verified again.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => verifyBusinessMutation.mutate({ businessId: business.id, verified: false })}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Unverify Business
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderUserGroup = (userId: string, userData: { user: any; businesses: Business[] }) => {
    const isExpanded = expandedUsers.has(userId);
    const hasMultipleBusinesses = userData.businesses.length > 1;
    
    return (
      <Card key={userId} className="mb-6">
        <CardHeader 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => hasMultipleBusinesses && toggleUserExpansion(userId)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {hasMultipleBusinesses && (
                isExpanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-600" />
                <div>
                  <CardTitle className="text-lg">
                    {userData.user.firstName && userData.user.lastName 
                      ? `${userData.user.firstName} ${userData.user.lastName}`
                      : userData.user.email
                    }
                  </CardTitle>
                  <p className="text-sm text-gray-600">{userData.user.email}</p>
                </div>
              </div>
            </div>
            <Badge variant="outline">
              {userData.businesses.length} business{userData.businesses.length !== 1 ? 'es' : ''}
            </Badge>
          </div>
        </CardHeader>
        
        {(!hasMultipleBusinesses || isExpanded) && (
          <CardContent className="pt-0">
            {userData.businesses.map(renderBusinessCard)}
          </CardContent>
        )}
      </Card>
    );
  };

  if (!isAdmin) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-500" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Businesses</h2>
                <p className="text-gray-600">Failed to load business data. Please try again.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Management</h1>
          <p className="text-gray-600">Manage and verify individual businesses across all users</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-semibold text-gray-900">{unverifiedBusinesses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Verified</p>
                  <p className="text-2xl font-semibold text-gray-900">{verifiedBusinesses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-semibold text-gray-900">{rejectedBusinesses.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Paid Businesses</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {businesses.filter(b => b.paymentStatus === 'paid').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Payment Pending</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {businesses.filter(b => b.paymentStatus === 'pending' || !b.paymentStatus).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Search className="w-5 h-5 text-gray-500" />
              <Input
                placeholder="Search businesses by name, owner, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending">
              Pending ({filteredUnverifiedBusinesses.length})
            </TabsTrigger>
            <TabsTrigger value="verified">
              Verified ({filteredVerifiedBusinesses.length})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({filteredRejectedBusinesses.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {Object.keys(groupedUnverified).length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Businesses</h3>
                    <p className="text-gray-600">All businesses have been reviewed.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedUnverified).map(([userId, userData]) => 
                  renderUserGroup(userId, userData)
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="verified" className="mt-6">
            {Object.keys(groupedVerified).length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Verified Businesses</h3>
                    <p className="text-gray-600">No businesses have been verified yet.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedVerified).map(([userId, userData]) => 
                  renderUserGroup(userId, userData)
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            {Object.keys(groupedRejected).length === 0 ? (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center">
                    <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rejected Businesses</h3>
                    <p className="text-gray-600">No businesses have been rejected.</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedRejected).map(([userId, userData]) => 
                  renderUserGroup(userId, userData)
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Document Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>{previewDoc?.name || "Document"}</DialogTitle>
          </DialogHeader>
          {previewDoc && (
            previewDoc.type.includes("pdf") ? (
              <iframe src={previewDoc.url} className="w-full h-[70vh] rounded border" />
            ) : (
              <img
                src={previewDoc.url}
                alt={previewDoc.name}
                className="max-h-[70vh] w-auto mx-auto rounded border object-contain"
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
