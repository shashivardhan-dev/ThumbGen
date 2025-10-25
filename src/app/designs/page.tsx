"use client";
import { useState, useEffect, useMemo } from "react";
import { useToggle } from "../../contexts/toggle";
import Image from "next/image";
import {
  Search,
  FilterIcon,
  ArrowUpWideNarrow,
  Edit,
  Copy,
  Download,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  useGetDesignsQuery,
  useAddFavouriteMutation,
  useRemoveFavouriteMutation,
} from "../../lib/store/features/designs/designsAPI";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Fuse from "fuse.js";
import { search } from "../../lib/utils/search";

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
  title: string; // Add title for display
  createdAt: string; // Add createdAt for display
}

export default function MyDesignsPage() {
  const { isToggled } = useToggle(); // for dark mode
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [currentVersions, setCurrentVersions] = useState<{
    [key: string]: number;
  }>({});

  const [filteredThumbnails, setFilteredThumbnails] = useState<Thumbnail[]>([]);
  const [sort, setSort] = useState(false);

  const router = useRouter();

  // Sample data - replace with your actual data fetching
  const [thumbnails, setThumbnails] = useState<Thumbnail[]>([]);

  const fuse = useMemo(() => {
    return new Fuse(thumbnails, {
      keys: ["title"],
      threshold: 0.3,
    });
  }, []);

  const { data: designsData, isLoading, isError } = useGetDesignsQuery();

  const [addFavourite] = useAddFavouriteMutation();
  const [removeFavourite] = useRemoveFavouriteMutation();

  useEffect(() => {
    if (designsData?.designs) {
      setThumbnails(designsData?.designs);
      setFilteredThumbnails(designsData?.designs);
    }
  }, [designsData?.designs]);

  useEffect(() => {
    if (!showFavoritesOnly) {
      setFilteredThumbnails(thumbnails);
      const handler = setTimeout(() => {
        const searchThumbnails = search(fuse, searchQuery, thumbnails);

        setFilteredThumbnails(searchThumbnails);
      }, 300);

      return () => {
        clearTimeout(handler);
      };
    }
  }, [searchQuery, fuse]);

  const handleFavourite =  () => {
       setShowFavoritesOnly(!showFavoritesOnly);

    if(!showFavoritesOnly) {
      console.log("showFavoritesOnly");
    const filteredFavThumbnails = thumbnails.filter((thumbnail) => {
      const matchesFavorites =  thumbnail.isFavourite
      return matchesFavorites;
    });
    console.log("filteredFavThumbnails", filteredFavThumbnails);

    setFilteredThumbnails(filteredFavThumbnails);
  } else{
    console.log("showAllThumbnails");
    setFilteredThumbnails(thumbnails);
  }
  };

  const handleSort = () => {
    console.log("sortedThumbnails");
    setSort(!sort);
    if (sort) {
      const sortedThumbnails = thumbnails.sort((a, b) => {
        const aDate = new Date(a.createdAt);
        const bDate = new Date(b.createdAt);
        return sort
          ? bDate.getTime() - aDate.getTime()
          : aDate.getTime() - bDate.getTime();
      });
      setFilteredThumbnails(sortedThumbnails);
    } else {
      setFilteredThumbnails(thumbnails);
    }
  };

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error</div>;

  const themeClasses = isToggled
    ? "bg-gray-900 text-white"
    : "bg-gray-50 text-gray-900";

  const inputClasses = isToggled
    ? "bg-gray-800 border-gray-700 text-white placeholder-gray-400"
    : "bg-white border-gray-300 text-gray-900 placeholder-gray-500";

  const buttonClasses = isToggled
    ? "bg-gray-800 border-gray-700 text-gray-300 hover:text-white"
    : "bg-white border-gray-300 text-gray-700 hover:text-gray-900";

  const favoritesButtonClasses = showFavoritesOnly
    ? "bg-red-500 border-red-500 text-white hover:bg-red-600"
    : buttonClasses;

  const sortButtonClasses = sort
    ? "bg-red-500 border-red-500 text-white hover:bg-red-600"
    : buttonClasses;
  const textColor = isToggled ? "text-white" : "text-gray-900";
  const subtitleColor = isToggled ? "text-gray-400" : "text-gray-500";

  const getCurrentVersion = (thumbnail: Thumbnail) => {
    const currentVersionIndex = currentVersions[thumbnail.id] || 0;
    return thumbnail.versions[currentVersionIndex] || thumbnail.versions[0];
  };

  const nextVersion = (thumbnailId: string, versionsLength: number) => {
    setCurrentVersions((prev) => ({
      ...prev,
      [thumbnailId]: ((prev[thumbnailId] || 0) + 1) % versionsLength,
    }));
  };

  const prevVersion = (thumbnailId: string, versionsLength: number) => {
    setCurrentVersions((prev) => ({
      ...prev,
      [thumbnailId]:
        ((prev[thumbnailId] || 0) - 1 + versionsLength) % versionsLength,
    }));
  };

  const handleEdit = (thumbnailId: string) => {
    router.push(`/edit/${thumbnailId}`);
  };

  const handleDownload = async (s3key: string) => {
    const fileUrl = `https://thumbnailgenai.s3.ap-south-1.amazonaws.com/${s3key}`;
    const response = await fetch(fileUrl);
    console.log("Response:", response);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    const title = "test";
    link.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}_thumbnail.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  };

  const toggleFavorite = (thumbnailId: string) => {
    setThumbnails((prev) =>
      prev.map((thumbnail) =>
        thumbnail.id === thumbnailId
          ? { ...thumbnail, isFavourite: !thumbnail.isFavourite }
          : thumbnail
      )
    );

    if (thumbnails.find((t) => t.id === thumbnailId)?.isFavourite) {
      removeFavourite(thumbnailId);
    } else {
      addFavourite(thumbnailId);
    }
  };

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${themeClasses}`}
    >
      <Navbar />
      <main className="px-4 md:px-10 lg:px-20 xl:px-40 flex flex-1 justify-center py-10">
        <div className="flex flex-col w-full max-w-7xl">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row flex-wrap justify-between items-center gap-4 p-4 mb-6">
            <h1 className={`text-4xl font-bold leading-tight ${textColor}`}>
              My Designs
            </h1>

            <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
              <div className="relative w-full md:w-96">
                <Search
                  className={`absolute left-4 top-1/2 -translate-y-1/2 ${subtitleColor}`}
                  size={20}
                />
                <input
                  className={`w-full rounded-full py-3 pl-12 pr-4 border focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors ${inputClasses}`}
                  placeholder="Search by keyword, title, or tag"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFavourite()}
                  className={`flex items-center gap-2 font-medium px-4 py-2 rounded-full transition-colors border focus:outline-none focus:ring-2 focus:ring-red-500 ${favoritesButtonClasses}`}
                >
                  <Star
                    size={18}
                    fill={showFavoritesOnly ? "currentColor" : "none"}
                  />
                  <span>Favorites</span>
                </button>

                {/* <button
                  className={`flex items-center gap-2 font-medium px-4 py-2 rounded-full transition-colors border focus:outline-none focus:ring-2 focus:ring-red-500 ${buttonClasses}`}
                >
                  <FilterIcon size={18} />
                  <span>Filter</span>
                </button> */}

                <button
                  onClick={() => handleSort()}
                  className={`flex items-center gap-2 font-medium px-4 py-2 rounded-full transition-colors border focus:outline-none focus:ring-2 focus:ring-red-500 ${sortButtonClasses}`}
                >
                  <ArrowUpWideNarrow size={18} />
                  <span>Sort</span>
                </button>
              </div>
            </div>
          </div>

          {/* Thumbnails Grid */}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-8 p-4">
            {filteredThumbnails.map((thumbnail) => {
              const currentVersion = getCurrentVersion(thumbnail);
              const currentVersionIndex = currentVersions[thumbnail.id] || 0;
              const hasMultipleVersions = thumbnail.versions.length > 1;
              console.log(hasMultipleVersions, thumbnail.versions.length);
              console.log(
                `https://thumbnailgenai.s3.ap-south-1.amazonaws.com/${currentVersion.s3Key}`
              );
              return (
                <div
                  key={thumbnail.id}
                  className="flex flex-col gap-4 group cursor-pointer"
                >
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-lg transition-transform duration-300 group-hover:scale-105">
                    <Image
                      src={`https://thumbnailgenai.s3.ap-south-1.amazonaws.com/${currentVersion.s3Key}`}
                      width={300}
                      height={300}
                      alt={thumbnail.title || "Untitled"}
                      className="w-full h-full object-contain"
                      onLoad={() =>
                        console.log("✅ Image loaded:", currentVersion.s3Key)
                      }
                      onError={(e) => {
                        console.error(
                          "❌ Image failed to load:",
                          currentVersion.s3Key
                        );
                        // Optional: Set a fallback image
                      }}
                    />

                    {hasMultipleVersions && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            prevVersion(
                              thumbnail.id,
                              thumbnail.versions.length
                            );
                          }}
                          className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full text-gray-800 transition-all duration-300 opacity-80 group-hover:opacity-100 shadow-lg z-10"
                          title="Previous version"
                        >
                          <ChevronLeft size={20} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            nextVersion(
                              thumbnail.id,
                              thumbnail.versions.length
                            );
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 bg-white/90 hover:bg-white backdrop-blur-sm rounded-full text-gray-800 transition-all duration-300 opacity-80 group-hover:opacity-100 shadow-lg z-10"
                          title="Next version"
                        >
                          <ChevronRight size={20} />
                        </button>

                        {/* Version Indicator */}
                        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-gray-800 text-sm font-medium opacity-80 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                          {currentVersionIndex + 1} /{" "}
                          {thumbnail.versions.length}
                        </div>
                      </>
                    )}

                    <div className="absolute inset-0 bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center p-4">
                      <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(thumbnail.id);
                          }}
                          className="flex items-center justify-center w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
                          title="Re-edit"
                        >
                          <Edit size={20} />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            await handleDownload(currentVersion.s3Key);
                          }}
                          className="flex items-center justify-center w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-colors"
                          title="Export"
                        >
                          <Download size={20} />
                        </button>
                      </div>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(thumbnail.id);
                      }}
                      className={`absolute top-3 right-3 flex items-center justify-center w-8 h-8 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full transition-colors ${
                        thumbnail.isFavourite ? "text-yellow-400" : "text-white"
                      }`}
                      title={
                        thumbnail.isFavourite
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                    >
                      <Star
                        size={18}
                        fill={thumbnail.isFavourite ? "currentColor" : "none"}
                      />
                    </button>
                  </div>

                  {/* Thumbnail Info */}
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-semibold text-lg ${textColor}`}>
                        {thumbnail.title || "Untitled"}
                      </p>
                      <p className={`text-sm ${subtitleColor}`}>
                        Created {thumbnail.createdAt}
                        {hasMultipleVersions && (
                          <span className="ml-2 text-xs opacity-70">
                            • {thumbnail.versions.length + 1} versions
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredThumbnails.length === 0 && (
            <div className={`text-center py-12 ${subtitleColor}`}>
              <p className="text-lg">No designs found</p>
              <p className="text-sm mt-2">
                {showFavoritesOnly
                  ? "No favorite designs match your search."
                  : "Try adjusting your search terms."}
              </p>
            </div>
          )}
        </div>
      </main>

    </div>
  );
}
