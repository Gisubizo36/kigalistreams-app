import React, { useState } from "react";
import { Clock, Play, Film, Tv } from "lucide-react";

const Card = ({ item, onClick, onWatchLaterToggle, isWatchLater }) => {
  // NEW: State to track if image is ready
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className="relative group rounded-lg border border-gray-700/50 overflow-hidden transform transition duration-300 hover:scale-[1.03] cursor-pointer hover:shadow-lg hover:shadow-amber-500/30"
      onClick={() => onClick("detail", item.id)}
    >
      {/* 1. Background color keeps the card shape solid while loading */}
      <div className="relative aspect-[2/3] bg-gray-800 w-full h-full">
        
        {/* 2. Image with Opacity Transition */}
        <img
          src={item.thumbnail}
          alt={item.title}
          loading="lazy"
          onLoad={() => setIsLoaded(true)} // <--- Trigger fade-in here
          className={`w-full h-full object-cover transition-opacity duration-500 ease-in-out ${
            isLoaded ? "opacity-90 group-hover:opacity-100" : "opacity-0"
          }`}
          onError={(e) => {
            e.target.onerror = null;
            // Optional: set a fallback image here
          }}
        />

        {/* 3. Keep your existing buttons/icons */}
        <div className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-xs font-semibold text-white backdrop-blur-sm z-10">
          {item.type === "TV Series" ? <Tv size={16} /> : <Film size={16} />}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onWatchLaterToggle(item.id);
          }}
          className={`absolute top-2 left-2 p-1.5 rounded-full transition bg-black/50 z-10 ${
            isWatchLater
              ? "bg-amber-600 text-white shadow-lg shadow-amber-600/30"
              : "text-gray-300 hover:text-white"
          }`}
        >
          <Clock size={16} />
        </button>

        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Play size={48} className="text-white" fill="currentColor" />
        </div>
      </div>
    </div>
  );
};

export default Card;