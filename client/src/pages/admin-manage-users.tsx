import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
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
  Edit,
  Trash2,
  Eye,
  Image,
  ChevronDown,
  ChevronRight,
  User,
  Save,
  X,
  AlertTriangle
} from "lucide-react";

interface AdminUser {
  id: string;
  businessName: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  gender?: string;
  icDocument?: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
  businessProfile?: {
    id?: string;
    ownerName?: string;
    phone?: string;
    website?: string;
    address?: string;
    yearEstablished?: string;
    numberOfEmployees?: string;
    businessRegistrationNumber?: string;
    verified?: boolean;
    completed?: boolean;
    businessLicense?: string;
    registrationCertificate?: string;
    proofOfOperations?: string;
    profilePicture?: string;
    primaryAffiliateId?: string;
  };
}

interface EditUserData {
  businessName: string;
  email: string;
  ownerName: string;
  phone: string;
  website: string;
  address: string;
  yearEstablished: string;
  numberOfEmployees: string;
  businessRegistrationNumber: string;
}

export default function AdminManageUsers() {
  const [, setLocation] = useLocation();
  const user = authManager.getCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [editData, setEditData] = useState<EditUserData>({
    businessName: "",
    email: "",
    ownerName: "",
    phone: "",
    website: "",
    address: "",
    yearEstablished: "",
    numberOfEmployees: "",
    businessRegistrationNumber: ""
  });

  // Check if user is super admin
  const isSuperAdmin = user?.email === "admin@example.com";

  useEffect(() => {
    if (!user) {
      setLocation('/login');
    } else if (!isSuperAdmin) {
      setLocation('/dashboard');
    }
  }, [user, isSuperAdmin, setLocation]);

  // Fetch all users with their business profiles
  const { data: usersData, isLoading, error } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: !!isSuperAdmin,
  });

  console.log('Admin manage users page: isSuperAdmin =', isSuperAdmin);
  console.log('Admin manage users page: usersData =', usersData);
  console.log('Admin manage users page: error =', error);

  const users = usersData?.users as AdminUser[] || [];

  console.log('Admin manage users page: Total users fetched:', users.length);
  console.log('Admin manage users page: Users data:', users);

  // Filter users based on search
  const filteredUsers = users.filter(user => {
    return user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.businessProfile?.ownerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
           user.businessProfile?.ownerName?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Update user mutation
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData, profileData }: { userId: string; userData: any; profileData: any }) => {
      // Update user basic info
      await apiRequest('PATCH', `/api/users/${userId}`, userData);
      
      // Update business profile
      if (profileData) {
        await apiRequest('PATCH', `/api/profile`, profileData);
      }
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setEditingUser(null);
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user information.",
        variant: "destructive",
      });
    },
  });

  // Delete user mutation
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('DELETE', `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Deleted",
        description: "User account has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete user account.",
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: AdminUser) => {
    setEditingUser(user);
    setEditData({
              businessName: user.businessProfile?.ownerName || "",
      email: user.email || "",
      ownerName: user.businessProfile?.ownerName || "",
      phone: user.businessProfile?.phone || "",
      website: user.businessProfile?.website || "",
      address: user.businessProfile?.address || "",
      yearEstablished: user.businessProfile?.yearEstablished || "",
      numberOfEmployees: user.businessProfile?.numberOfEmployees || "",
      businessRegistrationNumber: user.businessProfile?.businessRegistrationNumber || ""
    });
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

  const handleSaveUser = () => {
    if (!editingUser) return;

    const userData = {
      businessName: editData.businessName,
      email: editData.email
    };

    const profileData = {
      userId: editingUser.id,
      ownerName: editData.ownerName,
      phone: editData.phone,
      website: editData.website,
      address: editData.address,
      yearEstablished: editData.yearEstablished,
      numberOfEmployees: editData.numberOfEmployees,
      businessRegistrationNumber: editData.businessRegistrationNumber
    };

    updateUserMutation.mutate({
      userId: editingUser.id,
      userData,
      profileData
    });
  };

  const handleDeleteUser = (userId: string) => {
    deleteUserMutation.mutate(userId);
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
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditUser(user);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Edit User: {user.businessProfile?.businessName || user.email}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="businessName">Business Name</Label>
                        <Input
                          id="businessName"
                          value={editData.businessName}
                          onChange={(e) => setEditData({...editData, businessName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={editData.email}
                          onChange={(e) => setEditData({...editData, email: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ownerName">Owner Name</Label>
                        <Input
                          id="ownerName"
                          value={editData.ownerName}
                          onChange={(e) => setEditData({...editData, ownerName: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={editData.phone}
                          onChange={(e) => setEditData({...editData, phone: e.target.value})}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        value={editData.website}
                        onChange={(e) => setEditData({...editData, website: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={editData.address}
                        onChange={(e) => setEditData({...editData, address: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="yearEstablished">Year Established</Label>
                        <Input
                          id="yearEstablished"
                          value={editData.yearEstablished}
                          onChange={(e) => setEditData({...editData, yearEstablished: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="numberOfEmployees">Number of Employees</Label>
                        <Input
                          id="numberOfEmployees"
                          value={editData.numberOfEmployees}
                          onChange={(e) => setEditData({...editData, numberOfEmployees: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessRegistrationNumber">Registration Number</Label>
                        <Input
                          id="businessRegistrationNumber"
                          value={editData.businessRegistrationNumber}
                          onChange={(e) => setEditData({...editData, businessRegistrationNumber: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setEditingUser(null)}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveUser}
                        disabled={updateUserMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete the account for <strong>{user.businessProfile?.businessName || user.email}</strong>? 
                      This action cannot be undone and will permanently remove all user data including:
                      <ul className="list-disc list-inside mt-2 space-y-1">
                        <li>User account information</li>
                        <li>Business profile details</li>
                        <li>Uploaded documents</li>
                        <li>All associated data</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDeleteUser(user.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
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
                  <span className="text-slate-600">Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
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
                      onClick={() => window.open(user.icDocument, '_blank')}
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

            {/* Business Details */}
            {user.businessProfile && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                  <Building2 className="w-4 h-4 mr-2" />
                  Business Details
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {user.businessProfile.businessName && (
                    <div className="flex items-center space-x-2">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{user.businessProfile.businessName}</span>
                    </div>
                  )}
                  {user.businessProfile.ownerName && (
                    <div className="flex items-center space-x-2">
                      <UsersIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{user.businessProfile.ownerName}</span>
                    </div>
                  )}
                  {user.businessProfile.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{user.businessProfile.phone}</span>
                    </div>
                  )}
                  {user.businessProfile.website && (
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{user.businessProfile.website}</span>
                    </div>
                  )}
                  {user.businessProfile.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{user.businessProfile.address}</span>
                    </div>
                  )}
                  {user.businessProfile.yearEstablished && (
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">Est. {user.businessProfile.yearEstablished}</span>
                    </div>
                  )}
                  {user.businessProfile.numberOfEmployees && (
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">{user.businessProfile.numberOfEmployees} employees</span>
                    </div>
                  )}
                  {user.businessProfile.businessRegistrationNumber && (
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-600">Reg: {user.businessProfile.businessRegistrationNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Business Documents */}
            {user.businessProfile && (
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2" />
                  Business Documents
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {user.businessProfile.businessLicense && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Business License</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadDocument(user.businessProfile!.businessLicense!, 'business-license.pdf')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {user.businessProfile.registrationCertificate && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Registration Certificate</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadDocument(user.businessProfile!.registrationCertificate!, 'registration-certificate.pdf')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  {user.businessProfile.proofOfOperations && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Proof of Operations</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadDocument(user.businessProfile!.proofOfOperations!, 'proof-of-operations.pdf')}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

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

  if (!user || !isSuperAdmin) return null;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <Shield className="w-8 h-8 text-[hsl(var(--asean-blue))]" />
            <h1 className="text-3xl font-bold text-slate-900">User Management</h1>
          </div>
          <p className="text-slate-600">Manage user accounts and business profiles</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                  <p className="text-2xl font-semibold text-slate-900">
                    {users.filter(u => !u.businessProfile?.verified).length}
                  </p>
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
                  <p className="text-2xl font-semibold text-slate-900">
                    {users.filter(u => u.businessProfile?.verified).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Search by business name, email, or owner name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--asean-blue))] mx-auto"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Users Found</h3>
                <p className="text-slate-600">
                  {searchTerm ? 'No users match your search criteria.' : 'No users have been registered yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredUsers.map(renderUserCard)
          )}
        </div>
      </div>
    </div>
  );
}
