import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

interface ProfilePictureUploadProps {
  currentImage?: string;
  onImageChange: (imageData: string) => void;
}

export default function ProfilePictureUpload({ currentImage, onImageChange }: ProfilePictureUploadProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 100,
    height: 100,
    x: 0,
    y: 0,
  });
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageSrc(e.target?.result as string);
        setIsDialogOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = (image: HTMLImageElement, crop: Crop): Promise<string> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(blob);
        }
      }, 'image/jpeg', 0.9);
    });
  };

  const handleCropComplete = async () => {
    if (imgRef.current && crop.width && crop.height) {
      try {
        const croppedImageData = await getCroppedImg(imgRef.current, crop);
        onImageChange(croppedImageData);
        setIsDialogOpen(false);
        setSelectedFile(null);
        setImageSrc('');
      } catch (error) {
        console.error('Error cropping image:', error);
      }
    }
  };

  const handleRemoveImage = () => {
    onImageChange('');
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center border-2 border-dashed border-slate-300 hover:border-[hsl(var(--asean-blue))] transition-colors overflow-hidden">
        {currentImage ? (
          <img 
            src={currentImage} 
            alt="Company Logo" 
            className="w-full h-full object-cover rounded-full"
          />
        ) : (
          <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        )}
      </div>
      
      <div className="flex flex-col items-center space-y-2">
        <input
          type="file"
          id="profile-picture"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Button 
          type="button" 
          variant="outline"
          className="text-slate-600 hover:text-[hsl(var(--asean-blue))]"
          onClick={() => document.getElementById('profile-picture')?.click()}
        >
          {currentImage ? 'Change Logo' : 'Upload Logo'}
        </Button>
        {currentImage && (
          <Button 
            type="button" 
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={handleRemoveImage}
          >
            Remove Logo
          </Button>
        )}
      </div>

      {/* Image Cropping Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {imageSrc && (
              <div className="flex justify-center">
                <div className="w-96 h-96 flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    aspect={1}
                    circularCrop
                  >
                    <img
                      ref={imgRef}
                      src={imageSrc}
                      alt="Crop preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </ReactCrop>
                </div>
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleCropComplete}
                className="asean-blue"
              >
                Apply Crop
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
