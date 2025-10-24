'use client';
// src/app/create/page.tsx
import { useState } from 'react';
import { redirect, useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useToggle } from '../../contexts/toggle';
import { useAppDispatch, useAppSelector } from '../../lib/store/hooks';
import { useGetChannelsQuery } from '../../lib/store/features/channels/channelsAPI';
import { setSelectedChannel } from '../../lib/store/features/channels/channelsSlice';

export default function CreatePage() {
  const { data: session, status } = useSession();
  const { isToggled } = useToggle();
  const dispatch = useAppDispatch();
  const { selectedChannel } = useAppSelector((state) => state.channels);

  const [title, setTitle] = useState('');
  const [thumbnailText, setThumbnailText] = useState('');
  const [description, setDescription] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('bold');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  
  // RTK Query hook to fetch channels
  const {
    data: dataChannels,
    isLoading: channelsLoading,
    error: channelsError,
  } = useGetChannelsQuery();

   if (status === 'loading') return <div>Loading...</div>;
  if (session === null) return redirect('/');

  const channels = dataChannels?.channels || [];

  interface Progress {
    meta: {
      preview: string;
    };
    status: string;
    pct: number;
  }

  const styles = [
    { 
      id: 'vibrant', 
      name: 'Vibrant', 
      description: 'Bright, energetic colors with dynamic gradients',
      bgClass: 'bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400',
      accent: 'bg-white/20 backdrop-blur-sm'
    },
    { 
      id: 'minimalist', 
      name: 'Minimalist', 
      description: 'Clean, simple design with subtle elements',
      bgClass: 'bg-gradient-to-b from-gray-50 to-white',
      accent: 'bg-gray-800/80'
    },
    { 
      id: 'bold', 
      name: 'Bold', 
      description: 'Strong contrasts and impactful visuals',
      bgClass: 'bg-gradient-to-br from-black via-gray-900 to-black',
      accent: 'bg-red-500'
    },
    { 
      id: 'cinematic', 
      name: 'Cinematic', 
      description: 'Dramatic lighting and atmospheric effects',
      bgClass: 'bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900',
      accent: 'bg-yellow-400/60'
    }
  ];

  // Handle channel selection change
  const handleChannelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    dispatch(setSelectedChannel(value || null));
  };

  // Get selected channel data
  const selectedChannelData = channels.find((channel) => channel.id === selectedChannel);

  // Style preview component
  const StylePreview = ({ style, isSelected, isDark }: { style: typeof styles[0], isSelected: boolean, isDark: boolean }) => {
    return (
      <div className={`aspect-video rounded-lg overflow-hidden border-2 transition-all relative ${
        isSelected 
          ? 'border-blue-500 shadow-md' 
          : (isDark ? 'border-gray-600 group-hover:border-blue-400' : 'border-transparent group-hover:border-blue-500')
      }`}>
        <div className={`w-full h-full ${style.bgClass} relative`}>
          {/* Style-specific elements */}
          {style.id === 'vibrant' && (
            <>
              <div className="absolute top-4 left-4 w-6 h-6 bg-white/90 rounded-full shadow-lg"></div>
              <div className="absolute bottom-4 right-4 w-4 h-4 bg-white/80 rounded-full"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-yellow-300/70 rounded-full animate-pulse"></div>
            </>
          )}
          
          {style.id === 'minimalist' && (
            <>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-0.5 bg-gray-800"></div>
              <div className="absolute top-6 left-6 w-3 h-3 border-2 border-gray-600 rounded-full"></div>
            </>
          )}
          
          {style.id === 'bold' && (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform rotate-45"></div>
              <div className="absolute bottom-4 right-4 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-b-6 border-b-red-500"></div>
              <div className="absolute top-4 left-4 w-6 h-1 bg-white/60"></div>
            </>
          )}
          
          {style.id === 'cinematic' && (
            <>
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/80 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/80 to-transparent"></div>
              <div className="absolute top-6 right-8 w-12 h-0.5 bg-yellow-400/80 transform rotate-12 shadow-lg"></div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      // Validate file type
      if (file.type.startsWith('image/')) {
        handleImageFile(file);
      } else {
        alert('Please upload an image file (PNG, JPG, etc.)');
      }
    }
  };

  // Handle image file processing
  const handleImageFile = (file: File) => {
    setUploadedImage(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setImagePreview(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Handle file input change
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  // Remove uploaded image
  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  async function submit(e: any) {
    e.preventDefault();
    setIsGenerating(true);
    
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('thumbnailText', thumbnailText);
      formData.append('description', description);

      formData.append('style', selectedStyle);
      if (selectedChannel) {
        formData.append('channelId', selectedChannel);
      }
      if (uploadedImage) {
        formData.append('image', uploadedImage);
      }

      const res = await fetch('/api/thumbnail/generate',{
        method: 'POST', 
        body: formData,
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to start generation');
      }

      const { thumbnailId, thumbnailVersionId } = await res.json();
      console.log(`Started generation with ID: ${thumbnailVersionId}`);
      
      // Navigate to preview page with thumbnail data
      router.push(`/generated-thumbnail-preview/${thumbnailVersionId}?thumbnailId=${thumbnailId}`);
      
    } catch (error: any) {
      console.error('Generation failed:', error);
      setIsGenerating(false);
    }
  }

  const containerClasses = `relative flex size-full min-h-screen flex-col transition-colors duration-200 ${
    isToggled ? 'bg-gray-900' : 'bg-gray-100'
  }`;

  const mainClasses = `flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 p-8`;

  const cardClasses = `rounded-2xl shadow-sm p-8 transition-colors duration-200 ${
    isToggled ? 'bg-gray-800 border border-gray-700' : 'bg-white'
  }`;

  const titleClasses = `text-2xl font-bold mb-2 ${
    isToggled ? 'text-white' : 'text-gray-900'
  }`;

  const subtitleClasses = `mb-6 ${
    isToggled ? 'text-gray-300' : 'text-gray-600'
  }`;

  const labelClasses = `block text-sm font-medium mb-1 ${
    isToggled ? 'text-gray-300' : 'text-gray-700'
  }`;

  const inputClasses = `form-input block w-full rounded-lg border pl-4 focus:ring-2 h-12 text-base transition-colors duration-200 ${
    isToggled 
      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20' 
      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
  }`;

  const textareaClasses = `form-textarea block w-full rounded-lg border pl-4 h-28 resize-none text-base transition-colors duration-200 ${
    isToggled 
      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20' 
      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
  }`;

  const selectClasses = `form-select block w-full rounded-lg border pl-4 pr-10 h-12 text-base transition-colors duration-200 ${
    isToggled 
      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-blue-500/20' 
      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500/20'
  }`;

  const uploadAreaClasses = `relative flex items-center justify-center px-6 py-10 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
    isDragOver 
      ? 'border-blue-500 bg-blue-50' 
      : isToggled 
        ? 'border-gray-600 bg-gray-700/50 hover:bg-gray-700' 
        : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
  }`;

  const buttonClasses = `w-full flex justify-center py-3 px-4 border border-transparent text-lg font-bold rounded-full text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all shadow-lg ${
    isGenerating 
      ? 'bg-gray-400 cursor-not-allowed' 
      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
  }`;

  const secondaryButtonClasses = `w-full flex justify-center py-3 px-4 border text-lg font-bold rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all ${
    isToggled 
      ? 'border-gray-600 text-gray-300 bg-gray-700 hover:bg-gray-600 focus:ring-gray-500' 
      : 'border-gray-300 text-gray-800 bg-white hover:bg-gray-100 focus:ring-gray-300'
  }`;

  return (
    <div className={containerClasses}>
      <Navbar />
      
      <main className={mainClasses}>
        <div className="lg:col-span-2 space-y-6">
          <div className={cardClasses}>
            <h1 className={titleClasses}>Create Your Next Viral Thumbnail</h1>
            <p className={subtitleClasses}>Let our AI craft the perfect thumbnail for your video.</p>
            
            <form onSubmit={submit} className="space-y-6">
              <div>
                <label className={labelClasses} htmlFor="video-title">Video Title</label>
                <input
                  className={inputClasses}
                  id="video-title"
                  placeholder="e.g., How to Bake the Perfect Sourdough"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

               <div>
                <label className={labelClasses} htmlFor="thumbnail-text">Thumbnail Text</label>
                <input
                  className={inputClasses}
                  id="thumbnail-text"
                  placeholder="e.g., Restaurant type Sourdough"
                  value={thumbnailText}
                  onChange={(e) => setThumbnailText(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className={labelClasses} htmlFor="video-description">Video Description (optional)</label>
                <textarea
                  className={textareaClasses}
                  id="video-description"
                  placeholder="Briefly describe your video content to help the AI."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className={labelClasses}>Upload Image</label>
                
                {/* Upload Area or Image Preview */}
                {!uploadedImage ? (
                  <div 
                    className={uploadAreaClasses}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="text-center">
                      <svg className={`mx-auto h-12 w-12 ${isDragOver ? 'text-blue-500' : isToggled ? 'text-gray-400' : 'text-gray-400'}`} stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className={`mt-2 flex text-sm ${isDragOver ? 'text-blue-500' : isToggled ? 'text-gray-300' : 'text-gray-600'}`}>
                        <label className={`relative cursor-pointer rounded-md font-medium hover:underline focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 ${isToggled ? 'text-blue-400 focus-within:ring-blue-500' : 'text-blue-600 focus-within:ring-blue-500'}`}>
                          <span>Upload a file</span>
                          <input className="sr-only" type="file" accept="image/*" onChange={handleFileUpload} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className={`text-xs mt-1 ${isDragOver ? 'text-blue-500' : isToggled ? 'text-gray-400' : 'text-gray-500'}`}>
                        PNG, JPG up to 10MB. High-res recommended.
                      </p>
                      {isDragOver && (
                        <p className="text-blue-500 text-sm font-medium mt-2">
                          Drop your image here!
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    {/* Image Preview with Remove Button */}
                    <div className={`relative rounded-lg overflow-hidden border ${isToggled ? 'border-gray-600' : 'border-gray-200'}`}>
                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors shadow-lg"
                        title="Remove image"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                      
                      {/* Image */}
                      {imagePreview && (
                        <div className="aspect-video relative bg-black">
                          <Image 
                            src={imagePreview} 
                            alt="Uploaded image preview" 
                            // width={100}
                            // height={100}
                            fill
                            className="object-contain"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Filename Display */}
                    <div className="mt-3 text-center">
                      <p className={`text-sm font-medium ${isToggled ? 'text-white' : 'text-gray-900'}`}>
                        {uploadedImage.name}
                      </p>
                      <p className={`text-xs mt-1 ${isToggled ? 'text-gray-400' : 'text-gray-500'}`}>
                        {(uploadedImage.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>

          <div className={cardClasses}>
            <h2 className={`text-xl font-bold mb-4 ${isToggled ? 'text-white' : 'text-gray-900'}`}>Select a Style</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {styles.map((style) => (
                <div 
                  key={style.id}
                  className="cursor-pointer group"
                  onClick={() => setSelectedStyle(style.id)}
                >
                  <StylePreview 
                    style={style} 
                    isSelected={selectedStyle === style.id}
                    isDark={isToggled}
                  />
                  <p className={`text-center text-sm font-medium mt-2 ${
                    selectedStyle === style.id 
                      ? (isToggled ? 'text-blue-400' : 'text-blue-600')
                      : (isToggled ? 'text-gray-300' : 'text-gray-700')
                  }`}>
                    {style.name}
                  </p>
                  <p className={`text-center text-xs mt-1 ${
                    isToggled ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {style.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className={cardClasses}>
            <h2 className={`text-xl font-bold mb-4 flex items-center gap-2 ${isToggled ? 'text-white' : 'text-gray-900'}`}>
              <span className="text-blue-500">🎯</span> Select Channel
            </h2>
            
            {channelsLoading ? (
              <div className={`p-4 rounded-lg ${isToggled ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <p className={`text-sm ${isToggled ? 'text-gray-300' : 'text-gray-600'}`}>
                  Loading channels...
                </p>
              </div>
            ) : channelsError ? (
              <div className={`p-4 rounded-lg ${isToggled ? 'bg-red-900/20' : 'bg-red-50'}`}>
                <p className={`text-sm ${isToggled ? 'text-red-400' : 'text-red-600'}`}>
                  Error loading channels
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className={labelClasses} htmlFor="channel-select">
                    Choose Channel Profile
                  </label>
                  <select
                    id="channel-select"
                    value={selectedChannel || ''}
                    onChange={handleChannelChange}
                    className={selectClasses}
                  >
                    <option value="">Select channel</option>
                    {channels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        {channel.name} - {channel.category}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedChannelData && (
                  <div className={`p-4 rounded-lg border ${isToggled ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex items-start gap-3">
                      {selectedChannelData.logoUrl && (
                        <div className="flex-shrink-0">
                          <Image
                            src={`https://thumbnailgenai.s3.ap-south-1.amazonaws.com/${selectedChannelData.logoUrl}`}
                            alt={`${selectedChannelData.name} logo`}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className={`font-medium ${isToggled ? 'text-white' : 'text-gray-900'}`}>
                           Name: {selectedChannelData.name}
                        </h4>
                        <p className={`text-sm ${isToggled ? 'text-gray-400' : 'text-gray-600'}`}>
                         Category: {selectedChannelData.category}
                        </p>
                        {selectedChannelData.brandGuidelines && (
                          <p className={`text-xs mt-2 ${isToggled ? 'text-gray-400' : 'text-gray-600'}`}>
                            Brand: {selectedChannelData.brandGuidelines.substring(0, 100)}{selectedChannelData.brandGuidelines.length > 100 && '...'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {channels.length === 0 && (
                  <div className={`p-4 rounded-lg ${isToggled ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${isToggled ? 'text-gray-300' : 'text-gray-600'}`}>
                      No channels found. Create a channel profile to get personalized thumbnails.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push('/channels')}
                      className={`mt-2 text-sm font-medium ${isToggled ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'}`}
                    >
                      Create Channel Profile →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={cardClasses}>
            <div className="mt-6 flex flex-col gap-4">
              <button
                className={buttonClasses}
                type="button"
                onClick={submit}
                disabled={isGenerating || !title}
              >
                {isGenerating ? 'Generating...' : 'Generate Thumbnail'}
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}