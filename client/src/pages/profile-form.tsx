import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X, Plus } from "lucide-react";
import Navigation from "@/components/navigation";
import { authManager } from "@/lib/auth";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import ProfilePictureUpload from "@/components/profile-picture-upload";

interface IcDocumentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // base64 data
}

export default function ProfileForm() {
  const [, setLocation] = useLocation();
  const user = authManager.getCurrentUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch user's profile data
  const { data: profileData } = useQuery({
    queryKey: ['/api/profile', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/profile/${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch user profile');
      return response.json();
    },
    enabled: !!user,
  });

  const profile = profileData?.profile;

  // Fetch user data from API to get all fields including icDocument
  const { data: userData, isLoading: userDataLoading } = useQuery<{ user?: any }>({
    queryKey: ['/api/user', user?.id],
    queryFn: async () => {
      const response = await fetch(`/api/user/${user?.id}`);
      if (!response.ok) throw new Error('Failed to fetch user data');
      return response.json();
    },
    enabled: !!user,
  });

  const currentUser = userData?.user;

  // Debug logging
  console.log('Profile form - user from auth:', user);
  console.log('Profile form - currentUser from API:', currentUser);
  console.log('Profile form - userDataLoading:', userDataLoading);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    dateOfBirth: "",
    gender: "",
    profilePicture: "",
    icDocument: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!user) {
      setLocation('/login');
    }
  }, [user, setLocation]);

  // Track if form has been initialized to prevent overwriting user input
  const [formInitialized, setFormInitialized] = useState(false);
  const [icDocumentFile, setIcDocumentFile] = useState<IcDocumentFile | null>(null);

  // Debug logging
  console.log("Profile form render - icDocumentFile:", icDocumentFile);
  console.log("Profile form render - formData.icDocument exists:", !!formData.icDocument);
  console.log("Profile form render - currentUser:", currentUser);

  // Helper functions for file handling
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('word') || type.includes('document')) return '📝';
    return '📎';
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleIcDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "File size must be less than 10MB",
        variant: "destructive",
      });
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      const fileData: IcDocumentFile = {
        id: `ic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        data: base64
      };

      setIcDocumentFile(fileData);
      handleInputChange("icDocument", base64);

      toast({
        title: "IC Document Uploaded",
        description: `${file.name} uploaded successfully`,
      });
    } catch (error) {
      console.error('Error uploading IC document:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload IC document. Please try again.",
        variant: "destructive",
      });
    }

    // Reset input
    event.target.value = '';
  };

  // Update form data when user data is available (only on initial load)
  useEffect(() => {
    if (!formInitialized) {
      // First, try to populate with basic user data from auth
      if (user) {
        setFormData(prev => ({
          ...prev,
          firstName: user.firstName || prev.firstName,
          lastName: user.lastName || prev.lastName,
          email: user.email || prev.email,
          phoneNumber: user.phoneNumber || prev.phoneNumber,
          dateOfBirth: user.dateOfBirth || prev.dateOfBirth,
          gender: user.gender || prev.gender,
          profilePicture: user.profilePicture || prev.profilePicture,
          icDocument: user.icDocument || prev.icDocument,
        }));
        
        // Parse existing IC document from auth user
        if (user.icDocument && user.icDocument.trim() !== "") {
          console.log("Parsing IC document from auth user");
          try {
            const parsed = JSON.parse(user.icDocument);
            if (parsed.name && parsed.data) {
              setIcDocumentFile(parsed as IcDocumentFile);
            }
          } catch {
            // Legacy format - create basic metadata
            setIcDocumentFile({
              id: `legacy-ic-${Date.now()}`,
              name: "IC Document",
              size: 0,
              type: 'unknown',
              data: user.icDocument
            });
          }
        }
        
        setFormInitialized(true);
      }
      
      // Then, update with full user data from API if available
      if (currentUser) {
        setFormData(prev => ({
          ...prev,
          firstName: currentUser.firstName || prev.firstName,
          lastName: currentUser.lastName || prev.lastName,
          email: currentUser.email || prev.email,
          phoneNumber: currentUser.phoneNumber || prev.phoneNumber,
          dateOfBirth: currentUser.dateOfBirth || prev.dateOfBirth,
          gender: currentUser.gender || prev.gender,
          profilePicture: currentUser.profilePicture || prev.profilePicture,
          icDocument: currentUser.icDocument || prev.icDocument,
        }));
        // Parse existing IC document from currentUser
        if (currentUser.icDocument && currentUser.icDocument.trim() !== "") {
          console.log("Parsing IC document from currentUser");
          try {
            const parsed = JSON.parse(currentUser.icDocument);
            if (parsed.name && parsed.data) {
              setIcDocumentFile(parsed as IcDocumentFile);
            }
          } catch {
            // Legacy format - create basic metadata
            setIcDocumentFile({
              id: `legacy-ic-${Date.now()}`,
              name: "IC Document",
              size: 0,
              type: 'unknown',
              data: currentUser.icDocument
            });
          }
        }
        setFormInitialized(true);
      }
    }
  }, [user, currentUser, formInitialized]);

  // Additional check for existing IC document after form is initialized
  useEffect(() => {
    if (formInitialized && formData.icDocument && formData.icDocument.trim() !== "" && !icDocumentFile) {
      console.log("Fallback: Parsing IC document from formData");
      try {
        const parsed = JSON.parse(formData.icDocument);
        if (parsed.name && parsed.data) {
          setIcDocumentFile(parsed as IcDocumentFile);
        }
      } catch {
        // Legacy format - create basic metadata
        setIcDocumentFile({
          id: `legacy-ic-${Date.now()}`,
          name: "IC Document",
          size: 0,
          type: 'unknown',
          data: formData.icDocument
        });
      }
    }
  }, [formInitialized, formData.icDocument, icDocumentFile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: any) => {
      const response = await fetch(`/api/users/${user!.id}/profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Profile form - Update successful, received data:', data);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      // Clear only password fields, keep other form data intact
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
      
      // Handle IC document states after successful update
      if (data.user && data.user.icDocument && data.user.icDocument.trim() !== "") {
        try {
          const parsed = JSON.parse(data.user.icDocument);
          if (parsed.name && parsed.data) {
            setIcDocumentFile(parsed as IcDocumentFile);
          }
        } catch {
          // Legacy format - create basic metadata
          setIcDocumentFile({
            id: `legacy-ic-${Date.now()}`,
            name: "IC Document",
            size: 0,
            type: 'unknown',
            data: data.user.icDocument
          });
        }
      }
      
      // Update auth manager with new user data
      if (data.user) {
        console.log('Profile form - Updating auth manager with:', data.user);
        authManager.setCurrentUser(data.user);
      }
      // Invalidate user queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/profile', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/user', user?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async (passwordData: any) => {
      const response = await fetch(`/api/users/${user!.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update password');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update password. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Store IC document with metadata if available
    const icDocumentToStore = icDocumentFile ? JSON.stringify(icDocumentFile) : formData.icDocument;
    
    const profileData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      profilePicture: formData.profilePicture,
      icDocument: icDocumentToStore,
    };

    console.log('Profile form - Submitting profile data:', profileData);
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password change
    if (!formData.currentPassword) {
      toast({
        title: "Current Password Required",
        description: "Please enter your current password to make changes.",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Passwords Don't Match",
        description: "New password and confirm password must match.",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: "Password Too Short",
        description: "New password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    const passwordData = {
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword,
    };

    updatePasswordMutation.mutate(passwordData);
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) return null;

  const isProfileLoading = updateProfileMutation.isPending;
  const isPasswordLoading = updatePasswordMutation.isPending;

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
          <p className="text-slate-600 mt-2">
            Manage your personal information and account security
          </p>
        </div>

        {/* Personal Information */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Personal Information</h2>
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Profile Picture */}
              <div className="space-y-2">
                <Label>Profile Picture</Label>
                <ProfilePictureUpload
                  currentImage={formData.profilePicture}
                  onImageChange={(imageData) => handleInputChange("profilePicture", imageData)}
                />
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-2">
                    First Name *
                  </Label>
                  <Input
                    type="text"
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                    className="focus:ring-[hsl(var(--asean-blue))] focus:border-[hsl(var(--asean-blue))]"
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-2">
                    Last Name *
                  </Label>
                  <Input
                    type="text"
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                    className="focus:ring-[hsl(var(--asean-blue))] focus:border-[hsl(var(--asean-blue))]"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address *
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    className="focus:ring-[hsl(var(--asean-blue))] focus:border-[hsl(var(--asean-blue))]"
                    placeholder="Enter your email address"
                  />
                </div>
                <div>
                  <Label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700 mb-2">
                    Phone Number
                  </Label>
                  <Input
                    type="tel"
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange("phoneNumber", e.target.value)}
                    className="focus:ring-[hsl(var(--asean-blue))] focus:border-[hsl(var(--asean-blue))]"
                    placeholder="Enter your phone number"
                  />
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="dateOfBirth" className="block text-sm font-medium text-slate-700 mb-2">
                    Date of Birth
                  </Label>
                  <Input
                    type="date"
                    id="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                    className="focus:ring-[hsl(var(--asean-blue))] focus:border-[hsl(var(--asean-blue))]"
                  />
                </div>
                <div>
                  <Label htmlFor="gender" className="block text-sm font-medium text-slate-700 mb-2">
                    Gender
                  </Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(value) => handleInputChange("gender", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                      <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* IC Document Upload */}
              <div className="space-y-2">
                <Label htmlFor="icDocument" className="block text-sm font-medium text-slate-700 mb-2">
                  Identity Card (IC) Document *
                </Label>
                <p className="text-xs text-slate-500 mb-3">
                  Upload a clear photo or PDF of your Identity Card. Accepted formats: PDF, JPG, PNG
                </p>
                
                {/* IC Document Display */}
                {icDocumentFile && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <span className="text-lg">{getFileIcon(icDocumentFile.type)}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-slate-700 truncate">
                              {icDocumentFile.name}
                            </span>
                            {icDocumentFile.size > 0 && (
                              <span className="text-xs text-slate-500">
                                ({formatFileSize(icDocumentFile.size)})
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-slate-500 capitalize">
                            {icDocumentFile.type || 'Unknown type'}
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIcDocumentFile(null);
                          handleInputChange("icDocument", "");
                        }}
                        className="h-8 w-8 p-0 text-slate-500 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                        title="Remove document"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* File Upload Input */}
                {!icDocumentFile && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      id="icDocument"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleIcDocumentUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2 cursor-pointer"
                      onClick={() => {
                        const input = document.getElementById('icDocument');
                        if (input) input.click();
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Choose IC Document</span>
                    </Button>
                  </div>
                )}

                {/* Replace Document Button */}
                {icDocumentFile && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="file"
                      id="icDocumentReplace"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleIcDocumentUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-2 cursor-pointer"
                      onClick={() => {
                        const input = document.getElementById('icDocumentReplace');
                        if (input) input.click();
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      <span>Replace Document</span>
                    </Button>
                  </div>
                )}
              </div>

              {/* Note: Chamber selection is now handled at the business level, not user level */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Chamber and affiliate selection is now managed when creating or editing businesses, 
                  not in your user profile. This allows you to have different chamber associations for different businesses.
                </p>
              </div>

              {/* Save Profile Button */}
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isProfileLoading}
                  className="asean-blue"
                >
                  {isProfileLoading ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Change Password</h2>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="currentPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  Current Password
                </Label>
                <Input
                  type="password"
                  id="currentPassword"
                  value={formData.currentPassword}
                  onChange={(e) => handleInputChange("currentPassword", e.target.value)}
                  className="focus:ring-[hsl(var(--asean-blue))] focus:border-[hsl(var(--asean-blue))]"
                  placeholder="Enter your current password"
                />
              </div>
              <div>
                <Label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  New Password
                </Label>
                <Input
                  type="password"
                  id="newPassword"
                  value={formData.newPassword}
                  onChange={(e) => handleInputChange("newPassword", e.target.value)}
                  className="focus:ring-[hsl(var(--asean-blue))] focus:border-[hsl(var(--asean-blue))]"
                  placeholder="Enter your new password"
                />
              </div>
              <div>
                <Label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                  Confirm New Password
                </Label>
                <Input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  className="focus:ring-[hsl(var(--asean-blue))] focus:border-[hsl(var(--asean-blue))]"
                  placeholder="Confirm your new password"
                />
              </div>

              {/* Save Password Button */}
              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={isPasswordLoading}
                  className="asean-green"
                >
                  {isPasswordLoading ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <Button 
            type="button" 
            variant="secondary"
            onClick={() => setLocation('/dashboard')}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
