'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar from '../../../components/Navbar';
import ThumbnailPreview from '../../../components/Edit/ThumbnailPreview';
import ChatInterface from '../../../components/Edit/ChatInterface';
import { useToggle } from '../../../contexts/toggle';
import { useGetDesignsQuery } from "../../../lib/store/features/designs/designsAPI";

interface ThumbnailVersion {
  id: string;
  thumbnailId: string;
  input: [
    {
      type: 'user' | 'assistant';
      message: string;
      suggestions?: string[]
    }
  ]
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

interface ChatMessage {
  type: 'user' | 'assistant';
  message: string;
  suggestions?: string[];
}

const initialChatHistory: ChatMessage[] = [
  {
    type: 'assistant',
    message:"Here's your initial thumbnail. How would you like to refine it? Here are some suggestions:",
    suggestions: ['Change background', 'Make text bolder', 'Add an emoji']
  }
];

export default function EditPage() {
  const params = useParams();
  const thumbnailId = params?.id as string;
  const router = useRouter();

  const { isToggled } = useToggle();
  
  const [thumbnails, setThumbnails] = useState<Thumbnail | null>(null);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [progress, setProgress] = useState(null);
  const [partialPreview, setPartialPreview] = useState(null);
  const [chat, setChat] = useState<ChatMessage[]>(initialChatHistory);
  const [isLoading, setIsLoading] = useState(false);
  const [socket, setSocket] = useState<any>(null);

  const { data: designsData, isLoading: isDesignsLoading, isError, refetch } = useGetDesignsQuery();


  // Handle keyboard navigation
  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    if (!thumbnails?.versions) return;
    
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (currentVersionIndex > 0) {
        setCurrentVersionIndex(currentVersionIndex - 1);
      }
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (currentVersionIndex < thumbnails.versions.length - 1) {
        setCurrentVersionIndex(currentVersionIndex + 1);
      }
    }
  }, [currentVersionIndex, thumbnails?.versions]);

  // Add keyboard event listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  useEffect(() => {
    if (designsData?.designs) {
      const thumbnail = designsData.designs.find((t: Thumbnail) => t.id === thumbnailId);
      if (thumbnail) {
        setThumbnails(thumbnail);

        const chatHistory = thumbnail.versions.map((versions: ThumbnailVersion) => {
           let chats: ChatMessage[] = []
          for (let input of versions.input) {
           const inputChat = {
            type: input.type,
            message: input.message,
            suggestions: input.suggestions
           }
           chats.push(inputChat)
          }
          return chats
        });

        console.log('Chat History:', chatHistory);

        const flat = chatHistory.flat();
        console.log('Flat Chat History:', flat);
        const reverse = flat.reverse();

  

        setChat(reverse); // Set the chat history
        
        // Find the selected version or default to the first one
        const selectedVersionIndex = thumbnail.versions.findIndex(v => v.isSelected);
        if (selectedVersionIndex !== -1) {
          setCurrentVersionIndex(selectedVersionIndex);
        } else if (thumbnail.versions.length > 0) {
          setCurrentVersionIndex(thumbnail.versions.length - 1); // Default to latest version
        }
      }
    }
  }, [designsData?.designs, thumbnailId]);

  const handleVersionChange = (index: number) => {
    if (thumbnails?.versions && index >= 0 && index < thumbnails.versions.length) {
      setCurrentVersionIndex(index);
      
      // Optional: Update the backend about the selected version
      // axios.patch(`/api/thumbnail/${thumbnailId}/version/${thumbnails.versions[index].id}/select`)
      //   .catch(error => console.error('Error updating selected version:', error));
    } 
  };

  // Handle new version creation from chat
  const handleNewVersion = useCallback(async (newVersionData: any) => {
    try {
      // Refetch the designs to get the updated data with new version
      await refetch();
      
      // The refetch will trigger the useEffect above to update the thumbnails state
      // and the currentVersionIndex will automatically be set to the latest version
      
      console.log('New version added successfully');
    } catch (error) {
      console.error('Error handling new version:', error);
    }
  }, [refetch]);

  // Update currentVersionIndex when new versions are added
  useEffect(() => {
    if (thumbnails?.versions && thumbnails.versions.length > 0) {
      // Auto-select the latest version when new versions are added
      const latestIndex = thumbnails.versions.length - 1;
      if (currentVersionIndex !== latestIndex) {
        setCurrentVersionIndex(latestIndex);
      }
    }
  }, [thumbnails?.versions?.length]);

  const themeClasses = isToggled 
    ? 'bg-gray-900 text-white' 
    : 'bg-gray-50 text-gray-900';

  if (!thumbnails && isDesignsLoading) {
    return (
      <div className={`min-h-screen ${themeClasses} transition-colors duration-300`}>
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading thumbnail...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!thumbnails) {
    return (
      <div className={`min-h-screen ${themeClasses} transition-colors duration-300`}>
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-80px)]">
          <div className="text-center">
            <p className="text-xl mb-4">Thumbnail not found</p>
            <button 
              onClick={() => router.push('/create')}
              className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
            >
              Back to Create
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${themeClasses} transition-colors duration-300 overflow-hidden`}>
      <Navbar />
      
      <div className="flex h-[calc(100vh-80px)]">
        <ThumbnailPreview 
          thumb={thumbnails} 
          isLoading={isLoading}
          currentVersionIndex={currentVersionIndex}
          onVersionChange={handleVersionChange}
        />
        
        {/* Sidebar */}
        <div className={`w-100 border-r flex flex-col transition-colors duration-300 ${
          isToggled ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}>
          <ChatInterface 
            chat={chat} 
            setChat={setChat} 
            isLoading={isLoading}
            setIsLoading={setIsLoading}
            thumbnailId={thumbnailId}
            onNewVersion={handleNewVersion}
          />
        </div>
      </div>
    </div>
  );
}