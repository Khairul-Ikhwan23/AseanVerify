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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { isUserEligibleForVerification, getUserVerificationEligibilityReason } from "@/lib/verification-eligibility";
import { 
  Users, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Search,
  Download,
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
  RefreshCw,
  Eye,
  Image,
  ChevronDown,
  ChevronRight,
  User
} from "lucide-react";

interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  profilePicture: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  phoneNumber: string | null;
  icDocument: string | null;
  verified: boolean;
  createdAt: Date | null;
  updatedAt: Date | null;
  businesses: Array<{
    id: string;
    businessName: string;
    verified: boolean;
    completed: boolean;
    rejected: boolean;
    rejectionReason?: string;
    paymentStatus: string;
    status: string;
  }>;
}

export default function AdminApprove() {
  const [, setLocation] = useLocation();
  const user = authManager.getCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  // Preview modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string; type: string } | null>(null);

  // Normalize stored document (JSON with metadata, data URL, or raw base64)
  const toDataUrl = (doc: string, fallbackName = "IC Document") => {
    try {
      const parsed = JSON.parse(doc);
      if (parsed?.data) {
        const type = parsed.type || "image/png";
        return {
          url: parsed.data.startsWith("data:") ? parsed.data : `data:${type};base64,${parsed.data}`,
          name: parsed.name || fallbackName,
          type
        };
      }
    } catch {}
    if (doc.startsWith("data:")) {
      const match = /^data:([^;]+);/.exec(doc);
      return { url: doc, name: fallbackName, type: match?.[1] || "application/octet-stream" };
    }
    return { url: `data:image/png;base64,${doc}`, name: fallbackName, type: "image/png" };
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

  // Fetch all users with their business profiles
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: !!isAdmin,
  });

  console.log('Admin page: isAdmin =', isAdmin);
  console.log('Admin page: usersData =', usersData);
  console.log('Admin page: error =', error);

  const users = (usersData as any)?.users as AdminUser[] || [];

  console.log('Admin page: Total users fetched:', users.length);
  console.log('Admin page: Users data:', users);
  
  // Debug logging
  users.forEach(user => {
    const businessCount = user.businesses ? user.businesses.length : 0;
    console.log(`User ${user.email} has ${businessCount} businesses:`, 
      user.businesses ? user.businesses.map(b => ({ name: b.businessName, verified: b.verified, rejected: b.rejected })) : 'No businesses'
    );
  });

  // Separate users based on their verification status
  const verifiedUsers = users.filter(user => user.verified);
  const unverifiedUsers = users.filter(user => !user.verified);
  const rejectedUsers = users.filter(user => 
    user.businesses && user.businesses.length > 0 && user.businesses.some(business => business.rejected)
  );

  console.log('Admin page: Verified users:', verifiedUsers.length);
  console.log('Admin page: Unverified users:', unverifiedUsers.length);
  console.log('Admin page: Unverified users details:', unverifiedUsers);

  // Filter users based on search
  const filterUsers = (userList: AdminUser[]) => {
    return userList.filter(user => {
      return user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
             user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             (user.businesses && user.businesses.some(business => 
               business.businessName.toLowerCase().includes(searchTerm.toLowerCase())
             ));
    });
  };

  const filteredVerifiedUsers = filterUsers(verifiedUsers);
  const filteredUnverifiedUsers = filterUsers(unverifiedUsers);
  const filteredRejectedUsers = filterUsers(rejectedUsers);

  // User verification mutation
  const verifyUserMutation = useMutation({
    mutationFn: async ({ userId, verified }: { userId: string; verified: boolean }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}/verify-user`, {
        verified
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Updated",
        description: "User verification status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user verification status.",
        variant: "destructive",
      });
    },
  });

  // Reject user mutation
  const rejectUserMutation = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}/reject`, {
        rejected: true,
        rejectionReason: reason
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setRejectReason("");
      setRejectingUserId(null);
      toast({
        title: "User Rejected",
        description: "User has been rejected with the provided reason.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject user.",
        variant: "destructive",
      });
    },
  });

  const handleVerifyUser = (userId: string, verified: boolean) => {
    verifyUserMutation.mutate({ userId, verified });
  };

  const handleRejectUser = (userId: string, reason: string) => {
    rejectUserMutation.mutate({ userId, reason });
  };

  const downloadDocument = (documentData: string, filename: string) => {
    if (!documentData) return;
    
    try {
      console.log('Downloading document:', filename);
      console.log('Document data type:', typeof documentData);
      console.log('Document data starts with:', documentData.substring(0, 50));
      
      let dataUrl = documentData;
      
      // If it's not already a data URL, convert base64 to data URL
      if (!documentData.startsWith('data:')) {
        // Try to detect file type from filename
        const fileExtension = filename.split('.').pop()?.toLowerCase();
        let mimeType = 'application/octet-stream';
        
        if (fileExtension === 'pdf') {
          mimeType = 'application/pdf';
        } else if (['jpg', 'jpeg'].includes(fileExtension || '')) {
          mimeType = 'image/jpeg';
        } else if (fileExtension === 'png') {
          mimeType = 'image/png';
        }
        
        dataUrl = `data:${mimeType};base64,${documentData}`;
      }
      
      // Create blob from data URL
      const response = fetch(dataUrl);
      response.then(res => res.blob()).then(blob => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast({
          title: "Download Successful",
          description: `${filename} has been downloaded successfully.`,
        });
      }).catch(error => {
        console.error('Error creating blob:', error);
        toast({
          title: "Download Error",
          description: "Failed to process document for download.",
          variant: "destructive",
        });
      });
      
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Download Error",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleUserExpansion = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const verifyUser = async (userId: string, verified: boolean) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ verified }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify user');
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      
      toast({
        title: verified ? "User Verified" : "User Unverified",
        description: `User has been ${verified ? 'verified' : 'unverified'} successfully.`,
      });
    } catch (error) {
      console.error('Error updating user verification:', error);
      toast({
        title: "Verification Error",
        description: "Failed to update user verification status.",
        variant: "destructive",
      });
    }
  };

  const renderUserCard = (user: AdminUser) => {
    const isExpanded = expandedUsers.has(user.id);
    const isVerified = user.verified;
    
    return (
      <Card key={user.id} className="hover:shadow-md transition-shadow">
        <CardHeader 
          className="cursor-pointer" 
          onClick={() => toggleUserExpansion(user.id)}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronRight className="w-5 h-5 text-slate-400" />
              )}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900">
                    {user.firstName} {user.lastName}
                  </div>
                  <div className="text-sm text-slate-500">{user.email}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {isVerified ? (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Clock className="w-3 h-3 mr-1" />
                  Pending Review
                </Badge>
              )}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    verifyUser(user.id, !isVerified);
                  }}
                  className={isVerified ? "text-red-600 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                >
                  {isVerified ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        {isExpanded && (
          <CardContent className="space-y-6 pt-0">
            {/* Personal Information */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                <User className="w-4 h-4 mr-2" />
                Personal Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Name: {user.firstName} {user.lastName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">{user.email}</span>
                </div>
                {user.phoneNumber && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">{user.phoneNumber}</span>
                  </div>
                )}
                {user.dateOfBirth && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">DOB: {new Date(user.dateOfBirth).toLocaleDateString()}</span>
                  </div>
                )}
                {user.gender && (
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-600">Gender: {user.gender}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-600">Joined: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
                </div>
              </div>
            </div>

            {/* IC Document */}
            {user.icDocument && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Identity Document
                </h4>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border">
                  <div className="flex items-center space-x-3">
                    <Image className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="font-medium text-blue-900">IC Document</div>
                      <div className="text-sm text-blue-700">Click to view/download</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (!user.icDocument) return;
                        const normalized = toDataUrl(user.icDocument, "IC Document");
                        setPreviewDoc(normalized);
                        setPreviewOpen(true);
                      }}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadDocument(user.icDocument!, 'ic-document.pdf')}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* User's Businesses */}
            <div>
              <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                <Building2 className="w-4 h-4 mr-2" />
                Businesses ({user.businesses ? user.businesses.length : 0})
              </h4>
          
          {!user.businesses || user.businesses.length === 0 ? (
            <p className="text-slate-500 text-sm">No businesses registered</p>
          ) : (
            <div className="space-y-3">
              {user.businesses.map((business) => (
                <div key={business.id} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-slate-900">{business.businessName}</h5>
                    <div className="flex items-center space-x-2">
                      {business.rejected ? (
                        <Badge variant="destructive" className="bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Rejected
                        </Badge>
                      ) : business.verified ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-slate-600">
                    <div className="flex items-center space-x-4">
                      <span>Status: {business.status}</span>
                      <span>Payment: {business.paymentStatus}</span>
                    </div>
                    {business.rejectionReason && (
                      <div className="mt-1 text-red-600">
                        <strong>Rejection Reason:</strong> {business.rejectionReason}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Verification Status */}
        <div>
          <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
            <Shield className="w-4 h-4 mr-2" />
            Verification Status
          </h4>
          <div className="p-4 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {isVerified ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <Clock className="w-5 h-5 text-orange-600" />
                )}
                <span className="font-medium">
                  {isVerified ? 'User Verified' : 'Pending Verification'}
                </span>
              </div>
              <Button
                variant={isVerified ? "destructive" : "default"}
                size="sm"
                onClick={() => verifyUser(user.id, !isVerified)}
              >
                {isVerified ? (
                  <>
                    <UserX className="w-4 h-4 mr-1" />
                    Unverify
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4 mr-1" />
                    Verify User
                  </>
                )}
              </Button>
            </div>
            <div className="mt-2 text-sm text-slate-600">
              {isVerified 
                ? 'This user can create and manage businesses.' 
                : 'This user needs admin verification to create businesses.'
              }
            </div>
          </div>
        </div>
      </CardContent>
        )}
      </Card>
    );
  };

  if (!user || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-[hsl(var(--asean-blue))]" />
            <h1 className="text-3xl font-bold text-slate-900">Admin Approval</h1>
          </div>
          <p className="text-slate-600">Review and approve business profiles</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-[hsl(var(--asean-blue))] rounded-md flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Total Users</p>
                  <p className="text-2xl font-semibold text-slate-900">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Pending Review</p>
                  <p className="text-2xl font-semibold text-slate-900">{unverifiedUsers.length}</p>
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
                  <p className="text-sm font-medium text-slate-600">Verified</p>
                  <p className="text-2xl font-semibold text-slate-900">{verifiedUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-slate-600">Rejected</p>
                  <p className="text-2xl font-semibold text-slate-900">{rejectedUsers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
        </div>

        {/* Search and Refresh */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Search by business name, email, or owner name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] })}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Data
              </Button>
            </div>
            
            {/* Debug Info */}
            <div className="mt-4 p-3 bg-slate-100 rounded-lg text-xs">
              <div className="font-semibold mb-2">Debug Info:</div>
              <div>Total Users: {users.length}</div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center space-x-2">
              <UserX className="w-4 h-4" />
              <span>Pending Review ({filteredUnverifiedUsers.length})</span>
            </TabsTrigger>
            <TabsTrigger value="verified" className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4" />
              <span>Verified Users ({filteredVerifiedUsers.length})</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4" />
              <span>Rejected Users ({filteredRejectedUsers.length})</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--asean-blue))] mx-auto"></div>
              </div>
            ) : filteredUnverifiedUsers.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <UserX className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Pending Reviews</h3>
                  <p className="text-slate-600">All users have been reviewed and verified.</p>
                </CardContent>
              </Card>
            ) : (
              filteredUnverifiedUsers.map(renderUserCard)
            )}
          </TabsContent>

          <TabsContent value="verified" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--asean-blue))] mx-auto"></div>
              </div>
            ) : filteredVerifiedUsers.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <UserCheck className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Verified Users</h3>
                  <p className="text-slate-600">No users have been verified yet.</p>
                </CardContent>
              </Card>
            ) : (
              filteredVerifiedUsers.map(renderUserCard)
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--asean-blue))] mx-auto"></div>
              </div>
            ) : filteredRejectedUsers.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <AlertTriangle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">No Rejected Users</h3>
                  <p className="text-slate-600">No users have been rejected yet.</p>
                </CardContent>
              </Card>
            ) : (
              filteredRejectedUsers.map(renderUserCard)
            )}
          </TabsContent>

        </Tabs>
      </div>

      {/* IC Document Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-3xl w-full">
          <DialogHeader>
            <DialogTitle>{previewDoc?.name || "IC Document"}</DialogTitle>
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
