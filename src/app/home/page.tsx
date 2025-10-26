"use client";

import Navbar from "../../components/Navbar";
import { redirect } from "next/navigation";
import { Sparkles, Lightbulb, Wand2, Edit } from "lucide-react";
import { useToggle } from "../../contexts/toggle";
import LoadingPage from "../../components/Loading";

export default function Home() {

  const { isToggled, isLoaded } = useToggle();


  // Don't render with theme styles until loaded
  if (!isLoaded) {
    return <div><LoadingPage isToggled={true} /></div>; // or a proper loading component
  }

  const handleClick = () => {
    redirect("/create");
  };

  return (
    <div className={`relative flex size-full min-h-screen flex-col group/design-root transition-colors duration-300 ${
      isToggled 
        ? 'bg-gray-900 text-white' 
        : 'bg-white text-gray-900'
    }`}>
      <Navbar />
      <main className={`flex-1 flex flex-col items-center justify-center px-10 py-12 text-center animated-bg ${isToggled ? 'dark' : 'light'}`}>
        <div className="flex-grow flex flex-col items-center justify-center w-full max-w-4xl">
          <h1 className={`text-6xl font-bold mb-4 leading-tight ${
            isToggled ? 'text-white' : 'text-gray-900'
          }`}>
            Create your next viral thumbnail.
          </h1>
          <p className={`text-xl mb-10 max-w-2xl ${
            isToggled ? 'text-blue-300' : 'text-blue-600'
          }`}>
            Effortlessly generate stunning, AI-powered YouTube thumbnails that
            grab attention and boost your clicks.
          </p>
          <button 
            className={`flex items-center justify-center gap-3 h-16 px-10 rounded-full text-white text-xl font-bold transition-all duration-200 hover:scale-105 shadow-lg ${
              isToggled 
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
            }`}
            onClick={() => redirect("/create")}
          >
            <Sparkles />
            <span>Generate New Thumbnail</span>
          </button>
        </div>

        {/* Getting Started Tips */}
        <div className="w-full max-w-7xl pt-16 mt-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-bold ${
              isToggled ? 'text-white' : 'text-gray-900'
            }`}>
              Getting Started Tips
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`rounded-lg p-6 flex flex-col items-start text-left transition-all duration-200 hover:scale-105 ${
              isToggled 
                ? 'bg-gray-800/50 hover:bg-gray-800 shadow-lg' 
                : 'bg-blue-50 hover:bg-blue-100 shadow-lg border border-blue-200'
            }`}>
              <div className={`p-3 rounded-full mb-4 ${
                isToggled 
                  ? 'bg-blue-600/20 text-blue-400' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                <Lightbulb />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${
                isToggled ? 'text-white' : 'text-gray-900'
              }`}>
                Tip 1: Define Your Style
              </h3>
              <p className={`text-sm ${
                isToggled ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Start by thinking about your channel&apos;s brand. Consistent
                colors, fonts, and layouts will make your videos instantly
                recognizable.
              </p>
            </div>

            <div className={`rounded-lg p-6 flex flex-col items-start text-left transition-all duration-200 hover:scale-105 ${
              isToggled 
                ? 'bg-gray-800/50 hover:bg-gray-800 shadow-lg' 
                : 'bg-blue-50 hover:bg-blue-100 shadow-lg border border-blue-200'
            }`}>
              <div className={`p-3 rounded-full mb-4 ${
                isToggled 
                  ? 'bg-blue-600/20 text-blue-400' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                <Wand2 />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${
                isToggled ? 'text-white' : 'text-gray-900'
              }`}>
                Tip 2: Leverage AI Suggestions
              </h3>
              <p className={`text-sm ${
                isToggled ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Don&apos;t know where to start? Let our AI give you some ideas.
                Describe your video, and we&apos;ll generate multiple thumbnail
                concepts for you.
              </p>
            </div>

            <div className={`rounded-lg p-6 flex flex-col items-start text-left transition-all duration-200 hover:scale-105 ${
              isToggled 
                ? 'bg-gray-800/50 hover:bg-gray-800 shadow-lg' 
                : 'bg-blue-50 hover:bg-blue-100 shadow-lg border border-blue-200'
            }`}>
              <div className={`p-3 rounded-full mb-4 ${
                isToggled 
                  ? 'bg-blue-600/20 text-blue-400' 
                  : 'bg-blue-100 text-blue-600'
              }`}>
                <Edit />
              </div>
              <h3 className={`text-lg font-bold mb-2 ${
                isToggled ? 'text-white' : 'text-gray-900'
              }`}>
                Tip 3: Customize and Iterate
              </h3>
              <p className={`text-sm ${
                isToggled ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Our editor is powerful. Tweak the AI&apos;s suggestions or start
                from scratch. Experiment with different elements until you have
                the perfect thumbnail.
              </p>
            </div>
          </div>
        </div>
        </main>
    </div>
  );
}