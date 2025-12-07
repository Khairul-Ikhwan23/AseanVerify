import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, X, Upload, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // base64 data
}

interface MultiDocumentUploadProps {
  label: string;
  description?: string;
  documents: string[]; // Keep for backward compatibility
  onDocumentsChange: (documents: string[]) => void;
  maxDocuments?: number;
  acceptedTypes?: string;
  className?: string;
}

export default function MultiDocumentUpload({
  label,
  description,
  documents,
  onDocumentsChange,
  maxDocuments = 5,
  acceptedTypes = ".pdf,.doc,.docx,.jpg,.jpeg,.png",
  className = ""
}: MultiDocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [fileMetadata, setFileMetadata] = useState<DocumentFile[]>([]);
  const { toast } = useToast();

  // Parse existing documents to extract metadata
  React.useEffect(() => {
    console.log('MultiDocumentUpload: Parsing documents for', label, ':', documents);
    if (documents && documents.length > 0) {
      const parsedFiles: DocumentFile[] = documents.map((doc, index) => {
        // Try to parse as JSON first (new format with metadata)
        try {
          const parsed = JSON.parse(doc);
          if (parsed.name && parsed.data) {
            console.log('MultiDocumentUpload: Parsed JSON document:', parsed.name);
            return parsed as DocumentFile;
          }
        } catch {
          // If not JSON, treat as legacy base64 string
        }
        
        // Legacy format - create basic metadata
        console.log('MultiDocumentUpload: Using legacy format for document', index);
        return {
          id: `legacy-${index}`,
          name: `Document ${index + 1}`,
          size: 0,
          type: 'unknown',
          data: doc
        };
      });
      console.log('MultiDocumentUpload: Final parsed files:', parsedFiles);
      setFileMetadata(parsedFiles);
    } else {
      console.log('MultiDocumentUpload: No documents found');
      setFileMetadata([]);
    }
  }, [documents, label]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    console.log('Files selected:', files.length);
    setIsUploading(true);
    
    try {
      const newFiles: DocumentFile[] = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log('Processing file:', file.name, 'Size:', file.size);
        
        // Check file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
          alert(`File ${file.name} is too large. Maximum size is 10MB.`);
          continue;
        }
        
        // Convert file to base64 for storage
        const base64 = await fileToBase64(file);
        
        // Create file metadata
        const fileData: DocumentFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64
        };
        
        newFiles.push(fileData);
      }
      
      if (newFiles.length > 0) {
        // Update local state
        const updatedFiles = [...fileMetadata, ...newFiles];
        setFileMetadata(updatedFiles);
        
        // Convert to JSON strings for storage (backward compatibility)
        const documentsToStore = updatedFiles.map(file => JSON.stringify(file));
        onDocumentsChange(documentsToStore);
        
        toast({
          title: "Documents Uploaded",
          description: `${newFiles.length} document(s) uploaded successfully for ${label}`,
        });
      }
      
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast({
        title: "Upload Failed",
        description: `Failed to upload documents for ${label}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
    
    // Reset input
    event.target.value = '';
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removeDocument = (index: number) => {
    console.log('MultiDocumentUpload: Removing document at index:', index);
    console.log('MultiDocumentUpload: Current fileMetadata:', fileMetadata);
    
    const updatedFiles = fileMetadata.filter((_, i) => i !== index);
    setFileMetadata(updatedFiles);
    
    // Convert to JSON strings for storage
    const documentsToStore = updatedFiles.map(file => JSON.stringify(file));
    onDocumentsChange(documentsToStore);
    
    toast({
      title: "Document Removed",
      description: `Document removed from ${label}`,
    });
  };

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

  const canAddMore = fileMetadata.length < maxDocuments;

  return (
    <div className={`space-y-3 ${className}`}>
      <div>
        <Label className="block text-sm font-medium text-slate-700 mb-2">
          {label}
        </Label>
        {description && (
          <p className="text-sm text-slate-600 mb-3">{description}</p>
        )}
      </div>

      {/* Document List */}
      {fileMetadata.length > 0 && (
        <div className="space-y-2">
          {fileMetadata.map((file, index) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <span className="text-lg">{getFileIcon(file.type)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-slate-700 truncate">
                      {file.name}
                    </span>
                    {file.size > 0 && (
                      <span className="text-xs text-slate-500">
                        ({formatFileSize(file.size)})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 capitalize">
                    {file.type || 'Unknown type'}
                  </div>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeDocument(index)}
                className="h-8 w-8 p-0 text-slate-500 hover:text-red-500 hover:bg-red-50 flex-shrink-0"
                title="Remove document"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Document Button */}
      {canAddMore && (
        <div className="flex items-center space-x-2">
          <input
            type="file"
            id={`file-upload-${label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`}
            multiple
            accept={acceptedTypes}
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            className="flex items-center space-x-2 cursor-pointer"
            onClick={() => {
              console.log('Add Document button clicked');
              const inputId = `file-upload-${label.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}`;
              console.log('Looking for input with ID:', inputId);
              const input = document.getElementById(inputId);
              if (input) {
                console.log('Input found, clicking...');
                input.click();
              } else {
                console.error('Input not found with ID:', inputId);
              }
            }}
          >
            {isUploading ? (
              <>
                <Upload className="h-4 w-4 animate-pulse" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                <span>Add Document</span>
              </>
            )}
          </Button>
          <span className="text-sm text-slate-500">
            {fileMetadata.length}/{maxDocuments} documents
          </span>
        </div>
      )}

      {/* Max Documents Warning */}
      {!canAddMore && (
        <p className="text-sm text-amber-600">
          Maximum number of documents ({maxDocuments}) reached. Remove some documents to add more.
        </p>
      )}
    </div>
  );
}
