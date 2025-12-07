import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  User as UserIcon, 
  FileText, 
  Shield,
  Upload, 
  X 
} from "lucide-react";
import { useLocation } from "wouter";
import type { User } from "@shared/schema";
import { 
  getUserVerificationStatus, 
  getUserNextActions, 
  getMissingUserRequiredFields 
} from "@/lib/verification-eligibility";
import { useToast } from "@/hooks/use-toast";

interface DocumentUploadProps {
  title: string;
  currentDocument?: string;
  onDocumentChange: (documentData: string) => void;
  onDocumentRemove: () => void;
  accept?: string;
  description?: string;
  required?: boolean;
}

export default function DocumentUpload({ 
  title, 
  currentDocument, 
  onDocumentChange, 
  onDocumentRemove,
  accept = "application/pdf,image/*",
  description = "Upload your document (PDF, JPG, PNG)",
  required = false
}: DocumentUploadProps) {
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log(`DocumentUpload: File selected for ${title}:`, file.name, file.size);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (result && typeof result === 'string') {
          console.log(`DocumentUpload: File read for ${title}, data length:`, result.length);
          onDocumentChange(result);
          console.log(`DocumentUpload: onDocumentChange called for ${title}`);
          toast({
            title: "Document Uploaded",
            description: `${title} has been uploaded successfully!`,
          });
        } else {
          console.error(`DocumentUpload: Failed to read file for ${title} - result is undefined or not a string`);
          toast({
            title: "Upload Failed",
            description: `Failed to upload ${title}. Please try again.`,
            variant: "destructive",
          });
        }
      };
      reader.onerror = () => {
        console.error(`DocumentUpload: FileReader error for ${title}`);
        toast({
          title: "Upload Failed",
          description: `Failed to upload ${title}. Please try again.`,
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveDocument = () => {
    onDocumentRemove();
    toast({
      title: "Document Removed",
      description: `${title} has been removed.`,
    });
  };

  return (
    <Card className={`border-2 border-dashed transition-colors ${
      currentDocument 
        ? 'border-green-300 bg-green-50 hover:border-green-400' 
        : required 
          ? 'border-red-300 bg-red-50 hover:border-red-400' 
          : 'border-slate-300 hover:border-[hsl(var(--asean-blue))]'
    }`}>
      <CardContent className="p-6">
        <div className="text-center">
          {currentDocument ? (
            <div className="space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center border-2 border-green-200">
                <FileText className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-slate-900 mb-2">
                  {title}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </h4>
                <p className="text-sm text-green-600 mb-4 font-medium">✓ Document uploaded successfully</p>
                <div className="flex justify-center space-x-2">
                  <Button 
                    type="button" 
                    variant="outline"
                    size="sm"
                    className="text-slate-600 hover:text-[hsl(var(--asean-blue))]"
                    onClick={() => document.getElementById(`${title.toLowerCase().replace(/\s+/g, '-')}-upload`)?.click()}
                  >
                    Change Document
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={handleRemoveDocument}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                required ? 'bg-red-100' : 'bg-slate-100'
              }`}>
                <Upload className={`w-8 h-8 ${
                  required ? 'text-red-400' : 'text-slate-400'
                }`} />
              </div>
              <div>
                <h4 className="font-medium text-slate-900 mb-2">
                  {title}
                  {required && <span className="text-red-500 ml-1">*</span>}
                </h4>
                <p className={`text-sm mb-4 ${
                  required ? 'text-red-600 font-medium' : 'text-slate-600'
                }`}>
                  {required ? 'Required document - ' : ''}{description}
                </p>
                <Button 
                  type="button" 
                  variant="outline"
                  className="text-slate-600 hover:text-[hsl(var(--asean-blue))]"
                  onClick={() => document.getElementById(`${title.toLowerCase().replace(/\s+/g, '-')}-upload`)?.click()}
                >
                  Upload Document
                </Button>
              </div>
            </div>
          )}
          
          <input
            type="file"
            id={`${title.toLowerCase().replace(/\s+/g, '-')}-upload`}
            accept={accept}
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Verification Status Component
interface VerificationStatusCardProps {
  user: User | null | undefined;
  onCompleteProfile?: () => void;
}

export function VerificationStatusCard({ user, onCompleteProfile }: VerificationStatusCardProps) {
  const [, setLocation] = useLocation();
  const verificationStatus = getUserVerificationStatus(user);
  const nextActions = getUserNextActions(user);
  const missingFields = getMissingUserRequiredFields(user);

  const handleCompleteProfile = () => {
    if (onCompleteProfile) {
      onCompleteProfile();
    } else {
      setLocation('/profile-form');
    }
  };

  const getStatusColor = () => {
    switch (verificationStatus.status) {
      case 'verified': return 'bg-green-50 border-green-200';
      case 'awaiting': return 'bg-blue-50 border-blue-200';
      case 'incomplete': return 'bg-orange-50 border-orange-200';
      default: return 'bg-red-50 border-red-200';
    }
  };

  const getStatusIcon = () => {
    switch (verificationStatus.status) {
      case 'verified': return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'awaiting': return <Clock className="w-6 h-6 text-blue-600" />;
      case 'incomplete': return <AlertCircle className="w-6 h-6 text-orange-600" />;
      default: return <AlertCircle className="w-6 h-6 text-red-600" />;
    }
  };

  return (
    <Card className={`${getStatusColor()} border-2`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Profile Verification
              </h3>
              <p className="text-sm text-slate-600">
                {verificationStatus.message}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-slate-700">
              Profile Completion
            </span>
            <span className="text-sm font-semibold text-slate-900">
              {verificationStatus.completionPercentage}%
            </span>
          </div>
          <Progress 
            value={verificationStatus.completionPercentage} 
            className="h-3"
          />
        </div>

        {/* Status-specific content */}
        {verificationStatus.status === 'incomplete' && missingFields.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">
              Missing Required Fields:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {missingFields.map((field, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-slate-600">
                  <FileText className="w-4 h-4" />
                  <span>{field}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Next Steps */}
        {verificationStatus.nextSteps.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2">
              Next Steps:
            </h4>
            <ul className="space-y-1">
              {verificationStatus.nextSteps.map((step, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm text-slate-600">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full mt-2 flex-shrink-0" />
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col space-y-2">
          {verificationStatus.status === 'incomplete' && (
            <Button 
              onClick={handleCompleteProfile}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              <UserIcon className="w-4 h-4 mr-2" />
              Complete Profile
            </Button>
          )}
          
          {verificationStatus.status === 'awaiting' && (
            <div className="text-center p-3 bg-blue-100 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-blue-700">
                <Clock className="w-5 h-5" />
                <span className="font-medium">Under Review</span>
              </div>
              <p className="text-xs text-blue-600 mt-1">
                Your profile is being reviewed by our admin team
              </p>
            </div>
          )}
          
          {verificationStatus.status === 'verified' && (
            <div className="text-center p-3 bg-green-100 rounded-lg">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Verified Account</span>
              </div>
              <p className="text-xs text-green-600 mt-1">
                You can now create and manage businesses
              </p>
            </div>
          )}
        </div>

        {/* Verification Timeline */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <h4 className="text-sm font-medium text-slate-700 mb-3">
            Verification Process:
          </h4>
          <div className="space-y-2">
            <div className={`flex items-center space-x-3 ${verificationStatus.completionPercentage > 0 ? 'text-green-600' : 'text-slate-400'}`}>
              <div className={`w-2 h-2 rounded-full ${verificationStatus.completionPercentage > 0 ? 'bg-green-600' : 'bg-slate-300'}`} />
              <span className="text-sm">Complete Profile</span>
              {verificationStatus.completionPercentage === 100 && <CheckCircle className="w-4 h-4" />}
            </div>
            <div className={`flex items-center space-x-3 ${verificationStatus.status === 'awaiting' || verificationStatus.status === 'verified' ? 'text-blue-600' : 'text-slate-400'}`}>
              <div className={`w-2 h-2 rounded-full ${verificationStatus.status === 'awaiting' || verificationStatus.status === 'verified' ? 'bg-blue-600' : 'bg-slate-300'}`} />
              <span className="text-sm">Admin Review</span>
              {verificationStatus.status === 'awaiting' && <Clock className="w-4 h-4" />}
              {verificationStatus.status === 'verified' && <CheckCircle className="w-4 h-4" />}
            </div>
            <div className={`flex items-center space-x-3 ${verificationStatus.status === 'verified' ? 'text-green-600' : 'text-slate-400'}`}>
              <div className={`w-2 h-2 rounded-full ${verificationStatus.status === 'verified' ? 'bg-green-600' : 'bg-slate-300'}`} />
              <span className="text-sm">Account Verified</span>
              {verificationStatus.status === 'verified' && <CheckCircle className="w-4 h-4" />}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
