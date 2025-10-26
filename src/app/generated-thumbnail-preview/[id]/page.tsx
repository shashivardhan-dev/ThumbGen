 "use client"
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { useToggle } from '../../../contexts/toggle';
import { useThumbnailGenerateSocket } from '../../../components/sockets/SocketProvider';

interface GenerationStep {
  id: string;
  name: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

export default function GeneratedThumbnailPreviewPage() {
  const { isToggled } = useToggle();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  
  // Get URL parameters
  const thumbnailVersionId = params?.id as string;
  const thumbnailId = searchParams?.get('thumbnailId') as string;
  

  const {  isConnected, progress, status, isInRoom, requestStatus } = useThumbnailGenerateSocket(thumbnailVersionId || undefined);

  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [isGenerationComplete, setIsGenerationComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  

  // Generation steps
  const [steps, setSteps] = useState<GenerationStep[]>([
    { id: 'analyzing', name: 'Analyzing Input', description: 'Processing your title and description', isCompleted: false, isActive: true },
    { id: 'generating', name: 'AI Generation', description: 'Creating your thumbnail design', isCompleted: false, isActive: false },
    { id: 'enhancing', name: 'Enhancing Quality', description: 'Applying style and optimizations', isCompleted: false, isActive: false },
    { id: 'finalizing', name: 'Final Touches', description: 'Preparing your thumbnail', isCompleted: false, isActive: false },
    { id: 'uploading', name: 'Uploading', description: 'Saving to your library', isCompleted: false, isActive: false }
  ]);

  // Redirect if no thumbnail ID
  useEffect(() => {
    if (!thumbnailVersionId) {
      router.push('/create');
    }
  }, [thumbnailVersionId, router]);

  // Update steps based on progress
  useEffect(() => {
    console.log(`Progress update for ${thumbnailVersionId}:`, progress, status);
    if (progress || status) {
      const currentProgress = progress?.pct || status?.progress || 0;
      const currentStatus = progress?.status || status?.status || '';

      setSteps(prevSteps => {
        const newSteps = [...prevSteps];

        // Reset all steps
        newSteps.forEach(step => {
          step.isActive = false;
          step.isCompleted = false;
        });

        // Update based on progress percentage and status
        if (currentProgress >= 20 || currentStatus.includes('analyzing')) {
          newSteps[0].isCompleted = true;
        }
        if (currentProgress >= 40 || currentStatus.includes('generating')) {
          newSteps[0].isCompleted = true;
          newSteps[1].isCompleted = true;
        }
        if (currentProgress >= 60 || currentStatus.includes('enhancing')) {
          newSteps[0].isCompleted = true;
          newSteps[1].isCompleted = true;
          newSteps[2].isCompleted = true;
        }
        if (currentProgress >= 80 || currentStatus.includes('finalizing')) {
          newSteps[0].isCompleted = true;
          newSteps[1].isCompleted = true;
          newSteps[2].isCompleted = true;
          newSteps[3].isCompleted = true;
        }
        if (currentProgress >= 95 || currentStatus.includes('uploading') || currentStatus.includes('completed')) {
          newSteps.forEach(step => step.isCompleted = true);
        }

        // Set active step
        if (currentProgress < 20) {
          newSteps[0].isActive = true;
        } else if (currentProgress < 40) {
          newSteps[1].isActive = true;
        } else if (currentProgress < 60) {
          newSteps[2].isActive = true;
        } else if (currentProgress < 80) {
          newSteps[3].isActive = true;
        } else if (currentProgress < 95) {
          newSteps[4].isActive = true;
        }

        return newSteps;
      });
    }
  }, [progress, status]);

  // Handle generation completion
  useEffect(() => {
    if (progress?.status === 'completed' && progress?.meta?.s3Key) {
      setIsGenerationComplete(true);
      const imageUrl = `${progress?.meta?.s3Key}`;
      console.log('Image URL:', imageUrl);
      setPreviewSrc(imageUrl);
      console.log('Generation completed! S3 Key:', progress.meta.s3Key);
    } else if (progress?.status === 'failed') {
      setError('Generation failed. Please try again.');
    } 
  }, [progress?.status]);

  // Request status when socket connects
  useEffect(() => {
    if (thumbnailVersionId && isConnected && isInRoom) {
      requestStatus();
    }
  }, [thumbnailVersionId, isConnected, isInRoom, requestStatus]);

 const handleDownload = async () => {
  if (!previewSrc) return;

  try {
    const response = await fetch(previewSrc);
    console.log('Response:', response);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    const title = "test"
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}_thumbnail.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download failed:", error);
  }
};

  const handleEdit = () => {
    router.push(`/edit/${thumbnailId}`);
  };

  const handleCreateAnother = () => {
    router.push('/create');
  };

  // Styling classes
  const containerClasses = `relative flex size-full min-h-screen flex-col transition-colors duration-200 ${
    isToggled ? 'bg-gray-900' : 'bg-gray-100'
  }`;

  const mainClasses = `flex-1 p-8`;

  const cardClasses = `rounded-2xl shadow-lg p-8 transition-colors duration-200 ${
    isToggled ? 'bg-gray-800 border border-gray-700' : 'bg-white'
  }`;

  const titleClasses = `text-3xl font-bold mb-2 ${
    isToggled ? 'text-white' : 'text-gray-900'
  }`;

  const subtitleClasses = `mb-8 ${
    isToggled ? 'text-gray-300' : 'text-gray-600'
  }`;

  if (!thumbnailVersionId) {
    return <div>Loading...</div>;
  }

  return (
    <div className={containerClasses}>
      <Navbar />
      
      <main className={mainClasses}>
        <div className={cardClasses}>
          {/* Header */}
          <div className="mb-8">
            <h1 className={titleClasses}>Generating Your Thumbnail</h1>
            <p className={subtitleClasses}>
              Creating thumbnail for:
               {/* <span className="font-semibold">"{title}"</span> in {style} style */}
            </p>
            
            {/* Error Display */}
            {error && (
              <div className={`mb-6 p-4 rounded-lg ${
                isToggled ? 'bg-red-900/20 text-red-300 border border-red-700' : 'bg-red-100 text-red-800 border border-red-200'
              }`}>
                <p className="font-medium">Error</p>
                <p className="text-sm">{error}</p>
                <button
                  onClick={() => router.push('/create')}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Left Side - Thumbnail Preview */}
            <div className="space-y-6">
              <h2 className={`text-xl font-bold ${isToggled ? 'text-white' : 'text-gray-900'}`}>
                Thumbnail Preview
              </h2>
              
              <div className={`aspect-video rounded-xl overflow-hidden shadow-lg transition-all duration-500 ${
                isToggled ? 'bg-gray-700 border border-gray-600' : 'bg-gray-200 border border-gray-300'
              }`}>
                {previewSrc ? (
                  <Image
                    src={previewSrc}
                    alt="Generated Thumbnail"
                    className="w-full h-full object-cover"
                    width={800}
                    height={450}
                    unoptimized = {true}
                    onError={(e) => {
                      console.error('Failed to load thumbnail image');
                      setError('Failed to load thumbnail image');
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className={`mx-auto mb-4 ${isToggled ? 'text-gray-400' : 'text-gray-500'}`}>
                        <svg className="w-16 h-16 mx-auto animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className={`text-lg font-medium ${isToggled ? 'text-gray-300' : 'text-gray-600'}`}>
                        {isGenerationComplete ? 'Loading thumbnail...' : 'Generating your thumbnail...'}
                      </p>
                      <p className={`text-sm mt-2 ${isToggled ? 'text-gray-400' : 'text-gray-500'}`}>
                        This may take a few moments
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleDownload}
                  disabled={!isGenerationComplete}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-full font-semibold text-white transition-all ${
                    isGenerationComplete
                      ? 'bg-blue-600 hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/20'
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </button>

                <button
                  onClick={handleEdit}
                  disabled={!isGenerationComplete}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-full font-semibold transition-all border-2 ${
                    isGenerationComplete
                      ? (isToggled 
                          ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600 focus:ring-4 focus:ring-gray-500/20' 
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-4 focus:ring-gray-300/20')
                      : 'border-gray-400 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </button>
              </div>

              {/* Create Another Button */}
              <div className="pt-4">
                <button
                  onClick={handleCreateAnother}
                  className={`w-full py-2 px-4 rounded-lg font-medium transition-all ${
                    isToggled 
                      ? 'text-blue-400 hover:bg-gray-700 border border-gray-600' 
                      : 'text-blue-600 hover:bg-blue-50 border border-blue-200'
                  }`}
                >
                  Create Another Thumbnail
                </button>
              </div>
            </div>

            {/* Right Side - Generation Steps */}
            <div className="space-y-6">
              <h2 className={`text-xl font-bold ${isToggled ? 'text-white' : 'text-gray-900'}`}>
                Generation Progress
              </h2>

              {/* Overall Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className={`text-sm font-medium ${isToggled ? 'text-gray-300' : 'text-gray-700'}`}>
                    Overall Progress
                  </span>
                  <span className={`text-sm ${isToggled ? 'text-gray-400' : 'text-gray-600'}`}>
                    {progress?.pct || status?.progress || 0}%
                  </span>
                </div>
                <div className={`h-3 rounded-full ${isToggled ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div 
                    className="h-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${progress?.pct || status?.progress || 0}%` }}
                  />
                </div>
              </div>

              {/* Generation Steps */}
              <div className="space-y-4">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`flex items-start gap-4 p-4 rounded-xl transition-all duration-300 ${
                      step.isActive
                        ? (isToggled ? 'bg-blue-900/20 border border-blue-700' : 'bg-blue-50 border border-blue-200')
                        : (isToggled ? 'bg-gray-700/50' : 'bg-gray-50')
                    }`}
                  >
                    {/* Step Icon */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                      step.isCompleted
                        ? 'bg-green-500 text-white'
                        : step.isActive
                        ? (isToggled ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                        : (isToggled ? 'bg-gray-600 text-gray-400' : 'bg-gray-300 text-gray-500')
                    }`}>
                      {step.isCompleted ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : step.isActive ? (
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                      ) : (
                        <span className="text-sm font-semibold">{index + 1}</span>
                      )}
                    </div>

                    {/* Step Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold ${
                        step.isActive
                          ? (isToggled ? 'text-blue-300' : 'text-blue-700')
                          : step.isCompleted
                          ? (isToggled ? 'text-green-400' : 'text-green-700')
                          : (isToggled ? 'text-gray-400' : 'text-gray-600')
                      }`}>
                        {step.name}
                        {step.isActive && (
                          <span className="ml-2 inline-flex items-center">
                            <div className="flex space-x-1">
                              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                              <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                          </span>
                        )}
                      </h3>
                      <p className={`text-sm mt-1 ${
                        step.isActive
                          ? (isToggled ? 'text-blue-200' : 'text-blue-600')
                          : (isToggled ? 'text-gray-500' : 'text-gray-600')
                      }`}>
                        {step.description}
                      </p>
                    </div>

                    {/* Step Status Badge */}
                    {step.isCompleted && (
                      <div className="flex-shrink-0">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Complete
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Current Status Message */}
              {(progress?.message || status?.status) && (
                <div className={`p-4 rounded-lg ${
                  isToggled ? 'bg-gray-700 border border-gray-600' : 'bg-gray-100 border border-gray-200'
                }`}>
                  <h4 className={`font-medium mb-2 ${isToggled ? 'text-gray-200' : 'text-gray-800'}`}>
                    Current Status
                  </h4>
                  <p className={`text-sm ${isToggled ? 'text-gray-400' : 'text-gray-600'}`}>
                    {progress?.message || `Status: ${status?.status}`}
                  </p>
                </div>
              )}

              {/* Completion Message */}
              {isGenerationComplete && (
                <div className={`p-6 rounded-xl text-center ${
                  isToggled ? 'bg-green-900/20 border border-green-700' : 'bg-green-50 border border-green-200'
                }`}>
                  <div className="mb-4">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${
                      isToggled ? 'bg-green-600' : 'bg-green-500'
                    } text-white mb-3`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <h3 className={`text-lg font-bold mb-2 ${
                    isToggled ? 'text-green-400' : 'text-green-800'
                  }`}>
                    Thumbnail Generated Successfully!
                  </h3>
                  <p className={`text-sm ${
                    isToggled ? 'text-green-300' : 'text-green-700'
                  }`}>
                    Your thumbnail is ready for download and use. You can now download it or create another one.
                  </p>
                </div>
              )}

              {/* Tips Section */}
              <div className={`p-4 rounded-lg ${
                isToggled ? 'bg-yellow-900/20 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'
              }`}>
                <h4 className={`font-medium mb-2 flex items-center gap-2 ${
                  isToggled ? 'text-yellow-300' : 'text-yellow-800'
                }`}>
                  <span className="text-yellow-500">💡</span>
                  Pro Tips
                </h4>
                <ul className={`text-sm space-y-1 ${
                  isToggled ? 'text-yellow-200' : 'text-yellow-700'
                }`}>
                  <li>• Download in high resolution for best quality</li>
                  <li>• Test different titles for A/B testing</li>
                  <li>• Keep text readable on mobile devices</li>
                  <li>• Use contrasting colors for better visibility</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}