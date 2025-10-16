'use client';
import { Edit, ArrowLeft, ArrowRight } from 'lucide-react';
import { useToggle } from "../../contexts/toggle";
import Image from 'next/image';

interface ThumbnailVersion {
  id: string;
  thumbnailId: string;
  input: Record<string, any>;
  s3Key: string;
  isSelected: boolean;
  createdAt: string;
}

interface Thumbnail {
  id: string;
  userId: string;
  isFavourite: boolean;
  versions: ThumbnailVersion[];
  title: string;
  createdAt: string;
}

interface ThumbnailPreviewProps {
  thumb: Thumbnail;
  isLoading: boolean;
  currentVersionIndex: number;
  onVersionChange: (index: number) => void;
}

export default function ThumbnailPreview({ 
  thumb, 
  isLoading, 
  currentVersionIndex,
  onVersionChange 
}: ThumbnailPreviewProps) {
  const { isToggled } = useToggle();
  const cardClasses = isToggled ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  
  // Get current version
  const reversedVersions = [...(thumb?.versions || [])].reverse();
  const currentVersion = reversedVersions[currentVersionIndex];
  const totalVersions = thumb?.versions?.length || 0;
  
  // Navigation handlers
  const goToPrevious = () => {
    if (currentVersionIndex > 0) {
      onVersionChange(currentVersionIndex - 1);
    }
  };
  
  const goToNext = () => {
    if (currentVersionIndex < totalVersions - 1) {
      onVersionChange(currentVersionIndex + 1);
    }
  };
  
  // Check if navigation buttons should be disabled
  const canGoToPrevious = currentVersionIndex > 0;
  const canGoToNext = currentVersionIndex < totalVersions - 1;

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-5xl space-y-4">
        {/* Navigation Buttons */}
        <div className="flex items-center justify-center gap-4">
          <button 
            onClick={goToPrevious}
            disabled={!canGoToPrevious}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${cardClasses} ${
              canGoToPrevious ? 'hover:scale-105' : ''
            }`}
          >
            <ArrowLeft size={16} />
            <span>Previous Version</span>
          </button>
          
          {/* Version Counter */}
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${cardClasses}`}>
            {totalVersions > 0 ? `${currentVersionIndex + 1} / ${totalVersions}` : '0 / 0'}
          </div>
          
          <button 
            onClick={goToNext}
            disabled={!canGoToNext}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold shadow-lg backdrop-blur-sm transition-all hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${cardClasses} ${
              canGoToNext ? 'hover:scale-105' : ''
            }`}
          >
            <span>Next Version</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Version Info */}
        {currentVersion && (
          <div className="text-center">
            <p className={`text-sm ${isToggled ? 'text-gray-400' : 'text-gray-600'}`}>
              Created: {new Date(currentVersion.createdAt).toLocaleString()}
            </p>
          </div>
        )}

        {/* Thumbnail Display */}
        <div className="relative group">
          <div className="w-11/12 aspect-video bg-gray-200 rounded-xl overflow-hidden shadow-2xl transition-all duration-300 group-hover:shadow-3xl mx-auto">
            {currentVersion?.s3Key ? (
              <Image 
                src={`https://thumbnailgenai.s3.ap-south-1.amazonaws.com/${currentVersion.s3Key}`}
                alt={`${thumb.title} - Version ${currentVersionIndex + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if S3 URL fails - you might want to use a signed URL service
                  console.error('Failed to load image from S3:', currentVersion.s3Key);
                }}
              />
            )  : (
              <div className={`w-full h-full flex items-center justify-center ${
                isToggled ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
              }`}>
                {isLoading ? (
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p>Generating...</p>
                  </div>
                ) : (
                  'No thumbnail available'
                )}
              </div>
            )}
          </div>
        </div>

        {/* Keyboard Navigation Hint */}
        <div className="text-center">
          <p className={`text-xs ${isToggled ? 'text-gray-500' : 'text-gray-400'}`}>
            Use ← → arrow keys to navigate between versions
          </p>
        </div>
      </div>
    </div>
  );
}