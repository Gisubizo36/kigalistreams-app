import React from "react";
import Card from "../components/Card.jsx";
import { Clock } from "lucide-react";

const WatchLaterView = ({
  content,
  watchLater,
  navigate,
  toggleWatchLater,
}) => {
  const watchLaterItems = content.filter((item) =>
    watchLater.includes(item.id)
  );

  return (
    <div className="relative w-full min-h-screen pt-32 lg:pt-24">
      <div
        className="absolute inset-0 z-0 performant-bg"
        style={{ marginTop: "-4rem" }}
      ></div>
      <div className="relative z-10 container mx-auto py-8 px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
          <Clock size={28} className="mr-3 text-amber-500" />
          My Watch Later List
        </h1>
        {watchLaterItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {watchLaterItems.map((item) => (
              <div key={item.id}>
                <Card
                  item={item}
                  onClick={navigate}
                  onWatchLaterToggle={toggleWatchLater}
                  isWatchLater={true}
                />
                {/* --- ADDED: Text & Metadata below Card --- */}
                <div className="mt-3">
                  <h3 className="text-white text-base font-semibold truncate">
                    {item.title}
                  </h3>
                  {item.translator && (
                    <p className="text-emerald-400 text-xs font-bold truncate mt-1">
                      INTERPRETED BY {item.translator}
                    </p>
                  )}
                  <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                    <span className="font-medium border border-gray-600 px-1.5 py-0.5 rounded flex-shrink-0">
                      {item.type === "TV Series" ? "TV" : "Movie"}
                    </span>
                  </div>
                </div>
                {/* ----------------------------------------- */}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-10">
            You haven't added any movies or shows to your watch later list yet.
          </p>
        )}
      </div>
    </div>
  );
};

export default WatchLaterView;