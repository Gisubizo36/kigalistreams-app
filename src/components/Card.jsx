import React from "react";
import { Clock, Play, Film, Tv } from "lucide-react";

const Card = ({ item, onClick, onWatchLaterToggle, isWatchLater }) => (
  <div
    className="relative group rounded-lg border border-gray-700/50 overflow-hidden transform transition duration-300 hover:scale-[1.03] cursor-pointer hover:shadow-lg hover:shadow-amber-500/30 hover:border-amber-500/50"
    style={{ viewTransitionName: `card-${item.id}` }}
    onClick={() => onClick("detail", item.id)} // Click on whole card
  >
    <div
      className="relative aspect-[2/3]" // 2. Portrait aspect ratio
    >
      <img
        src={
          item.thumbnail ||
          `https://placehold.co/400x600/1f2937/fff?text=${encodeURIComponent(
            item.title
          )}`
        }
        alt={item.title}
        className="w-full h-full object-cover transition duration-300 opacity-90 group-hover:opacity-100"
        loading="lazy"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `https://placehold.co/400x600/1f2937/fff?text=${encodeURIComponent(
            item.title
          )}`;
        }}
      />

      {/* --- 3. TV/FILM ICON (TOP-RIGHT) --- */}
      <div className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-xs font-semibold text-white backdrop-blur-sm z-10">
        {item.type === "TV Series" ? <Tv size={16} /> : <Film size={16} />}
      </div>

      {/* --- 4. WATCH LATER BUTTON (TOP-LEFT) --- */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Stop click from going to detail page
          onWatchLaterToggle(item.id);
        }}
        className={`absolute top-2 left-2 p-1.5 rounded-full transition bg-black/50 z-10 ${
          isWatchLater
            ? `bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-600/30`
            : "bg-black/50 text-gray-300 hover:bg-black/70 hover:text-white"
        }`}
        title={isWatchLater ? "Remove from Watch Later" : "Add to Watch Later"}
      >
        <Clock size={16} />
      </button>

      {/* --- PLAY BUTTON OVERLAY (CENTER) --- */}
      <div
        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        onClick={(e) => {
          e.stopPropagation(); // Stop click from bubbling to detail
          onClick("detail", item.id, "play");
        }}
        title="Play"
      >
        <Play size={48} className="text-white" fill="currentColor" />
      </div>
    </div>
  </div>
);

export default Card;