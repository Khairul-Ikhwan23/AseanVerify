import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { X, Building2, Loader2, Check, ChevronsUpDown } from "lucide-react";
import { authManager } from "@/lib/auth";
import ProfilePictureUpload from "@/components/profile-picture-upload";
import MultiDocumentUpload from "@/components/multi-document-upload";
import type { CreateBusinessData } from "@shared/schema";

interface AddBusinessFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const businessCategories = [
  "Retail & E-commerce",
  "Food & Beverage",
  "Technology & Software",
  "Healthcare & Wellness",
  "Professional Services",
  "Manufacturing",
  "Construction",
  "Education & Training",
  "Entertainment & Media",
  "Transportation & Logistics",
  "Real Estate",
  "Financial Services",
  "Other"
];

const employeeRanges = [
  "1 - 5",
  "6 - 20",
  "21 - 50",
  "51 - 100",
  "100+"
];

export default function AddBusinessForm({ onClose, onSuccess }: AddBusinessFormProps) {
  const user = authManager.getCurrentUser();
  const queryClient = useQueryClient();

  // Fetch primary affiliates (chambers)
  const { data: primaryAffiliatesData } = useQuery({
    queryKey: ['/api/affiliates/main'],
    queryFn: async () => {
      const response = await fetch('/api/affiliates/main');
      if (!response.ok) throw new Error('Failed to fetch primary affiliates');
      return response.json();
    },
  });

  // Fetch secondary affiliates
  const { data: secondaryAffiliatesData } = useQuery({
    queryKey: ['/api/affiliates/secondary'],
    queryFn: async () => {
      const response = await fetch('/api/affiliates/secondary');
      if (!response.ok) throw new Error('Failed to fetch secondary affiliates');
      return response.json();
    },
  });

  const primaryAffiliates = primaryAffiliatesData?.mainAffiliates || [];
  const secondaryAffiliates = secondaryAffiliatesData?.secondaryAffiliates || [];
  const [formData, setFormData] = useState({
    businessName: "",
    businessEmail: "",
    category: "",
    address: "",
    phone: "",
    website: "",
    tagline: "",
    businessRegistrationNumber: "",
    yearEstablished: "",
    numberOfEmployees: "6 - 20",
    primaryAffiliateId: "", // Required primary chamber
    secondaryAffiliateIds: [] as string[], // Optional multiple secondary chambers
    profilePicture: "",
    businessLicense: "",
    businessLicenseDocuments: [] as string[], // Array of base64 documents
    registrationCertificate: "",
    registrationCertificateDocuments: [] as string[], // Array of base64 documents
    proofOfOperations: "",
    proofOfOperationsDocuments: [] as string[], // Array of base64 documents
    ownerNames: [""] as string[], // New state for multiple owner names
  });

  const createBusinessMutation = useMutation({
    mutationFn: async (businessData: any) => {
      const requestData = {
        ...businessData,
        userId: user?.id,
      };
      console.log('Sending business data:', requestData);
      
      const response = await fetch("/api/businesses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const error = await response.json();
        console.log('Server error response:', error);
        throw new Error(error.message || "Failed to create business");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user', user?.id, 'all-businesses'] });
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Error creating business:", error);
      
      // Handle enhanced verification error responses
      if (error.message && error.message.includes("Complete your profile")) {
        const message = error.message + "\n\nWould you like to complete your profile now?";
        if (confirm(message)) {
          window.location.href = "/profile-form";
        }
      } else if (error.message && error.message.includes("awaiting admin verification")) {
        alert(error.message + "\n\nYou will receive an email notification once your profile is verified.");
      } else {
        alert(error.message || "Failed to create business");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName.trim()) {
      alert("Business name is required");
      return;
    }
    if (!formData.primaryAffiliateId) {
      alert("Primary chamber is required");
      return;
    }
    
    // Filter out empty owner names and join them
    const validOwnerNames = formData.ownerNames.filter(name => name.trim() !== "");
    if (validOwnerNames.length === 0) {
      alert("At least one owner name is required");
      return;
    }
    
    const { ownerNames, ...restFormData } = formData;
    const businessData = {
      ...restFormData,
      ownerName: validOwnerNames.join(", "), // Convert array to comma-separated string for backend
    };
    
    createBusinessMutation.mutate(businessData);
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-blue-600" />
            <CardTitle>Add New Business</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Logo */}
            <div className="space-y-2">
              <Label>Business Logo</Label>
              <ProfilePictureUpload
                currentImage={formData.profilePicture}
                onImageChange={(imageData) => handleInputChange("profilePicture", imageData)}
              />
            </div>

            {/* Basic Business Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={formData.businessName}
                  onChange={(e) => handleInputChange("businessName", e.target.value)}
                  placeholder="Enter your business name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessEmail">Business Email</Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={formData.businessEmail}
                  onChange={(e) => handleInputChange("businessEmail", e.target.value)}
                  placeholder="business@example.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessRegistrationNumber">Business Registration Number (ROC)</Label>
                <Input
                  id="businessRegistrationNumber"
                  value={formData.businessRegistrationNumber}
                  onChange={(e) => handleInputChange("businessRegistrationNumber", e.target.value)}
                  placeholder="Enter registration number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearEstablished">Year Established</Label>
                <Input
                  id="yearEstablished"
                  type="number"
                  value={formData.yearEstablished}
                  onChange={(e) => handleInputChange("yearEstablished", e.target.value)}
                  placeholder="e.g., 2020"
                />
              </div>
            </div>

            {/* Owner Names - Multi-input */}
            <div className="space-y-2">
              <Label>Owner / Representative Names</Label>
              <div className="space-y-2">
                {formData.ownerNames.map((ownerName, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={ownerName}
                      onChange={(e) => {
                        const newOwnerNames = [...formData.ownerNames];
                        newOwnerNames[index] = e.target.value;
                        handleInputChange("ownerNames", newOwnerNames);
                      }}
                      placeholder={`Owner ${index + 1} name`}
                    />
                    {formData.ownerNames.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newOwnerNames = formData.ownerNames.filter((_, i) => i !== index);
                          handleInputChange("ownerNames", newOwnerNames);
                        }}
                        className="px-3"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    handleInputChange("ownerNames", [...formData.ownerNames, ""]);
                  }}
                  className="w-full"
                >
                  + Add Another Owner
                </Button>
              </div>
              <p className="text-sm text-slate-600">
                Add all owners or representatives for this business
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Business Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange("category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numberOfEmployees">Number of Employees</Label>
                <Select
                  value={formData.numberOfEmployees}
                  onValueChange={(value) => handleInputChange("numberOfEmployees", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {employeeRanges.map((range) => (
                      <SelectItem key={range} value={range}>
                        {range}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Chamber/Affiliate Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="primaryAffiliateId">Primary Chamber *</Label>
                <Select
                  value={formData.primaryAffiliateId}
                  onValueChange={(value) => handleInputChange("primaryAffiliateId", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your primary chamber" />
                  </SelectTrigger>
                  <SelectContent>
                    {primaryAffiliates.map((affiliate: any) => (
                      <SelectItem key={affiliate.id} value={affiliate.id}>
                        {affiliate.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-slate-600">
                  Select your primary business chamber or affiliate organization
                </p>
              </div>

              <div className="space-y-2">
                <Label>Secondary Chambers (Optional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {formData.secondaryAffiliateIds.length > 0
                        ? `${formData.secondaryAffiliateIds.length} selected`
                        : "Select secondary chambers..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search secondary chambers..." />
                      <CommandList>
                        <CommandEmpty>No secondary chamber found.</CommandEmpty>
                        <CommandGroup>
                          {secondaryAffiliates.map((affiliate: any) => (
                            <CommandItem
                              key={affiliate.id}
                              onSelect={() => {
                                const isSelected = formData.secondaryAffiliateIds.includes(affiliate.id);
                                if (isSelected) {
                                  handleInputChange("secondaryAffiliateIds", 
                                    formData.secondaryAffiliateIds.filter(id => id !== affiliate.id)
                                  );
                                } else {
                                  handleInputChange("secondaryAffiliateIds", 
                                    [...formData.secondaryAffiliateIds, affiliate.id]
                                  );
                                }
                              }}
                            >
                              <Check
                                className={`mr-2 h-4 w-4 ${
                                  formData.secondaryAffiliateIds.includes(affiliate.id) ? "opacity-100" : "opacity-0"
                                }`}
                              />
                              {affiliate.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                
                {/* Display selected secondary chambers */}
                {formData.secondaryAffiliateIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.secondaryAffiliateIds.map((affiliateId) => {
                      const affiliate = secondaryAffiliates.find((a: any) => a.id === affiliateId);
                      return (
                        <Badge
                          key={affiliateId}
                          variant="secondary"
                          className="flex items-center gap-1"
                        >
                          {affiliate?.name || 'Unknown'}
                          <X
                            className="h-3 w-3 cursor-pointer"
                            onClick={() => {
                              handleInputChange("secondaryAffiliateIds", 
                                formData.secondaryAffiliateIds.filter(id => id !== affiliateId)
                              );
                            }}
                          />
                        </Badge>
                      );
                    })}
                  </div>
                )}
                
                <p className="text-sm text-slate-600">
                  You can select multiple secondary chambers or affiliate organizations
                </p>
              </div>
            </div>

            {/* Tagline */}
            <div className="space-y-2">
              <Label htmlFor="tagline">Business Tagline</Label>
              <Textarea
                id="tagline"
                value={formData.tagline}
                onChange={(e) => handleInputChange("tagline", e.target.value)}
                placeholder="A brief description of your business"
                rows={2}
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Business Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Enter your business address"
                rows={3}
              />
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                  type="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange("website", e.target.value)}
                  placeholder="https://yourwebsite.com"
                  type="url"
                />
              </div>
            </div>

            {/* Document Uploads */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Required Documents</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Registration Certificate and Company Owner's Identification Card are compulsory for business verification.
                </p>
              </div>
              <div className="space-y-6">
                <MultiDocumentUpload
                  label="Company Owner's Identification Card"
                  description="Upload your identification card (PDF, JPG, PNG) - Required for verification"
                  documents={formData.businessLicenseDocuments}
                  onDocumentsChange={(documents) => handleInputChange("businessLicenseDocuments", documents)}
                  maxDocuments={3}
                  acceptedTypes=".pdf,.jpg,.jpeg,.png"
                />
                <MultiDocumentUpload
                  label="Registration Certificate"
                  description="Upload your registration certificate (PDF, JPG, PNG) - Required for verification"
                  documents={formData.registrationCertificateDocuments}
                  onDocumentsChange={(documents) => handleInputChange("registrationCertificateDocuments", documents)}
                  maxDocuments={3}
                  acceptedTypes=".pdf,.jpg,.jpeg,.png"
                />
                <MultiDocumentUpload
                  label="Proof of Operations"
                  description="Upload proof of operations (PDF, JPG, PNG) - Optional but recommended"
                  documents={formData.proofOfOperationsDocuments}
                  onDocumentsChange={(documents) => handleInputChange("proofOfOperationsDocuments", documents)}
                  maxDocuments={5}
                  acceptedTypes=".pdf,.jpg,.jpeg,.png"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={createBusinessMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createBusinessMutation.isPending || !formData.businessName.trim()}
              >
                {createBusinessMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Business"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
