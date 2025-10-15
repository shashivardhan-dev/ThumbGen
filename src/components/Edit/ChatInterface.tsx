"use client";
import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { useToggle } from "../../contexts/toggle";
import { useThumbnailEditSocket } from "../sockets/SocketProvider";
import { toast } from "react-toastify";

interface ChatMessage {
  type: "user" | "assistant";
  message: string;
  suggestions?: string[];
}

interface ChatInterfaceProps {
  chat: ChatMessage[];
  setChat: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  thumbnailId: string;
  onNewVersion: (newVersion: any) => void;
}

export default function ChatInterface({
  chat,
  setChat,
  isLoading,
  setIsLoading,
  thumbnailId,
  onNewVersion,
}: ChatInterfaceProps) {
  const { isToggled } = useToggle();
  const [msg, setMsg] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [newVersionThumbnailId, setNewVersionThumbnailId] = useState(null);
 
  const { isConnected, progress, status, isInRoom, requestStatus } = useThumbnailEditSocket(newVersionThumbnailId || undefined);
    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chat, isLoading, isThinking])
const getSuggestions = async () => {
    try {
      if ( isThinking) return;
      setIsThinking(true);
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(chat),
      });
      const response = await res.json();
      const suggestions = response.suggestions;
      const message = response.message;
      const suggestionMessage: ChatMessage = {
        type: "assistant",
        message: message,
        suggestions: suggestions,
      };
      setChat((prev) => [...prev, suggestionMessage]);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast.error("Error fetching suggestions");
    } finally {
      setIsThinking(false);
    }
  };

  // Initial load - get suggestions when component mounts
  useEffect(() => {
    if (thumbnailId) {
      const chatLength = chat.length;
      if (chat[chatLength - 1].type === "user") {
        console.log(chat[chatLength - 1].type, "chat[chatLength-1].type");
        getSuggestions();
      }
    }
  }, []);

  useEffect(() =>{
   
    if(progress?.status === "completed") {
      setIsGenerating(false);
      setIsLoading(false);
      toast.success("Thumbnail generated successfully");
       onNewVersion(progress);
          getSuggestions();
    }

  },[progress?.status])


  const inputClasses = isToggled
    ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
    : "bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500";

  const handleSend = async () => {
    if (!msg.trim() || isLoading || isGenerating || isThinking) return;
    const userMessage: ChatMessage = {
      type: "user",
      message: msg,
    };

    setChat((prev) => [...prev, userMessage]);

    const lastOneMessages = chat.slice(-1);
    const lastTwoMessages = [userMessage, ...lastOneMessages]

    console.log("Last two messages:", lastTwoMessages);
  
    setMsg("");
    setIsLoading(true);
    setIsGenerating(true);
    try {
      // Call backend API to start new version generation
      const response = await fetch("/api/thumbnail/generate-version", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ thumbnailId, messages: lastTwoMessages }),
      });

      const data = await response.json();
      const thumbnailVersionId = data.thumbnailVersionId;
      toast.success("Started generation");
      setNewVersionThumbnailId(thumbnailVersionId);
    } catch (error) {
      console.error("Error starting generation:", error);
      setIsLoading(false);
      setIsGenerating(false);
      toast.error("Error starting generation");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (isProcessing || isThinking) return;
    setMsg(suggestion);
  };

  const isProcessing = isLoading || isGenerating || isThinking;

  // Component for thinking animation
  const ThinkingIndicator = () => (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
      <div
        className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
        style={{ animationDelay: "0.2s" }}
      ></div>
      <div
        className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
        style={{ animationDelay: "0.4s" }}
      ></div>
      <span className="ml-2 text-sm">Thinking...</span>
    </div>
  );

  // Component for generating animation
  const GeneratingIndicator = () => (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
      <div
        className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
        style={{ animationDelay: "0.1s" }}
      ></div>
      <div
        className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      ></div>
      <span className="ml-2 text-sm">
        {isGenerating ? "Generating new version..." : "Processing..."}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-50px)] ">
      {/* Chat Area with Fixed Height and Scrolling */}
      <div
        className={`flex-1 p-4 space-y-6 overflow-y-auto min-h-0 ${
          isToggled ? "scrollbar-dark" : "scrollbar-light"
        }`}
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: isToggled ? "#4B5563 #374151" : "#D1D5DB #F3F4F6",
        }}
      >
        {chat.map((item, index) => (
          <div
            key={`${item.type}-${index}`}
            className={`flex items-start gap-3 ${
              item.type === "user" ? "justify-end" : ""
            }`}
          >
            {item.type === "assistant" && (
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0 mt-1"></div>
            )}

            <div
              className={`flex flex-col gap-2 ${
                item.type === "user" ? "items-end" : "items-start"
              }`}
            >
              <p
                className={`text-xs font-medium ${
                  isToggled ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {item.type === "user" ? "You" : "AI Assistant"}
              </p>
              <div className="space-y-2">
                <p
                  className={`text-sm rounded-lg p-3 max-w-sm break-words ${
                    item.type === "user"
                      ? "bg-red-500 text-white"
                      : isToggled
                      ? "bg-gray-700 border border-gray-600"
                      : "bg-white border border-gray-200"
                  }`}
                >
                  {item.message}
                </p>

                {item.suggestions && (
                  <div className="flex flex-wrap gap-2 max-w-sm">
                    {item.suggestions.map((suggestion, sugIndex) => (
                      <button
                        key={sugIndex}
                        onClick={() => handleSuggestionClick(suggestion)}
                        disabled={isProcessing}
                        className={`text-sm border rounded-full px-3 py-1 transition-colors hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                          isToggled
                            ? "border-gray-600 text-gray-300 hover:bg-gray-700"
                            : "border-gray-300 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {item.type === "user" && (
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex-shrink-0 mt-1"></div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex-shrink-0 mt-1"></div>
            <div className="flex flex-col gap-2 items-start">
              <p
                className={`text-xs font-medium ${
                  isToggled ? "text-gray-400" : "text-gray-500"
                }`}
              >
                AI Assistant
              </p>
              <div
                className={`text-sm rounded-lg p-3 max-w-sm ${
                  isToggled
                    ? "bg-gray-700 border border-gray-600"
                    : "bg-white border border-gray-200"
                }`}
              >
                {isThinking ? <ThinkingIndicator /> : <GeneratingIndicator />}
              </div>
            </div>
          </div>
        )}

        {/* Invisible div to scroll to */}
        <div ref={chatEndRef} />
      </div>

      {/* Fixed Input Area */}
      <div
        className={`flex-shrink-0 p-2 border-t transition-colors duration-300 ${
          isToggled ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
        }`}
      >
        <div className="relative">
          <input
            type="text"
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              isProcessing ? "Please wait..." : "Describe your changes..."
            }
            disabled={isProcessing}
            className={`w-full h-12 pl-6 pr-14 rounded-full border text-base transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${inputClasses} ${
              isToggled
                ? "focus:ring-offset-gray-800"
                : "focus:ring-offset-white"
            }`}
          />
          <button
            onClick={handleSend}
            disabled={!msg.trim() || isProcessing}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
