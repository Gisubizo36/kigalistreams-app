import React, { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Card from "./Card.jsx";
import CardPlaceholder from "./CardPlaceholder.jsx";

const Section = ({
  title,
  items,
  onCardClick,
  onWatchLaterToggle,
  watchLaterIds,
  viewAllPath = null,
  isLoading = false,
}) => {
  const scrollContainerRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.8;

      if (direction === "left") {
        scrollContainerRef.current.scrollBy({
          left: -scrollAmount,
          behavior: "smooth",
        });
      } else {
        scrollContainerRef.current.scrollBy({
          left: scrollAmount,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <section className="mb-8">
      <div className="flex justify-between items-center mb-4 px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-gray-100">{title}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => handleScroll("left")}
            className="p-2 border border-gray-600 rounded-md text-gray-400 hover:text-white hover:border-white transition"
            title="Scroll Left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => handleScroll("right")}
            className="p-2 border border-gray-600 rounded-md text-gray-400 hover:text-white hover:border-white transition"
            title="Scroll Right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto pb-4 px-4 sm:px-6 space-x-4 custom-scrollbar"
      >
        {isLoading ? (
          [...Array(6)].map((_, index) => <CardPlaceholder key={index} />)
        ) : items.length === 0 ? (
          <p className="text-gray-400">No content available.</p>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="min-w-[150px] w-[150px] sm:min-w-[180px] sm:w-[180px]"
            >
              <Card
                item={item}
                onClick={onCardClick}
                onWatchLaterToggle={onWatchLaterToggle}
                isWatchLater={watchLaterIds.includes(item.id)}
              />
              <div className="mt-3">
                <h3 className="text-white text-base font-semibold truncate">
                  {item.title}
                </h3>
                {/* --- CHANGE APPLIED HERE --- */}
                {item.translator && (
                  <p className="text-emerald-400 text-xs font-bold truncate mt-1">
                    BY {item.translator}
                  </p>
                )}
                <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                  {item.type === "TV Series" &&
                  item.latestSeason &&
                  item.latestEpisode > 0 ? (
                    <p className="font-medium truncate">
                      SS {item.latestSeason} • EP {item.latestEpisode}
                    </p>
                  ) : item.type === "Movie" && item.year && item.runtime ? (
                    <p className="font-medium truncate">
                      {item.year} • {item.runtime} min
                    </p>
                  ) : (
                    <p className="font-medium truncate">&nbsp;</p>
                  )}
                  <span className="font-medium border border-gray-600 px-1.5 py-0.5 rounded flex-shrink-0">
                    {item.type === "TV Series" ? "TV" : "Movie"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        {viewAllPath && items.length > 0 && (
          <div className="min-w-[150px] w-[150px] sm:min-w-[180px] sm:w-[180px] flex-shrink-0 flex flex-col items-center justify-center">
            <button
              onClick={() => onCardClick(viewAllPath)}
              className="bg-amber-500 text-gray-900 text-sm font-semibold py-2 px-5 rounded-full transition-colors hover:bg-amber-600"
              style={{ borderRadius: "9999px" }}
            >
              View All
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default Section;