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
              <Card
                key={item.id}
                item={item}
                onClick={navigate}
                onWatchLaterToggle={toggleWatchLater}
                isWatchLater={true} // It's always true on this page
              />
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