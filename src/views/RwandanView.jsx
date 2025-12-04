import React, { useMemo } from "react";
import Section from "../components/Section.jsx";
import { Film } from "lucide-react";

const RwandanView = ({
  content,
  navigate,
  toggleWatchLater,
  watchLater,
  isContentLoading,
}) => {
  const watchLaterIds = watchLater;

  // --- FILTER: ONLY RWANDAN MOVIES ---
  const rwandanContent = useMemo(() => {
    return content
      .filter((item) => item.category === "Rwandan")
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [content]);

  const trendingRwandan = useMemo(
    () => rwandanContent.filter((item) => item.isTrending).slice(0, 10),
    [rwandanContent]
  );

  const newReleases = rwandanContent.slice(0, 10);
  const topRated = useMemo(
    () => [...rwandanContent].sort((a, b) => b.rating - a.rating).slice(0, 10),
    [rwandanContent]
  );

  return (
    <div className="min-h-screen pt-20 relative bg-gray-900">
      {/* UNIQUE HERO FOR RWANDAN TAB */}
      <div className="bg-gradient-to-b from-amber-900/40 to-gray-900 pb-8 pt-4">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center mb-6 border-b border-amber-600/30 pb-4">
            <Film size={32} className="text-amber-500 mr-3" />
            <div>
              <h1 className="text-3xl font-bold text-white">Rwandan Movies</h1>
              <p className="text-amber-400 text-sm font-medium">
                Made in Rwanda. Watch Local. Support Local.
              </p>
            </div>
          </div>

          {/* FEATURED HIGHLIGHT (First Trending Item) */}
          {trendingRwandan.length > 0 && (
            <div 
              className="relative w-full aspect-video sm:aspect-[21/9] rounded-xl overflow-hidden shadow-2xl mb-10 cursor-pointer group"
              onClick={() => navigate("detail", trendingRwandan[0].id)}
            >
              <img 
                src={trendingRwandan[0].backdropImage || trendingRwandan[0].thumbnail} 
                alt={trendingRwandan[0].title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent">
                <div className="absolute bottom-0 left-0 p-6 sm:p-10">
                  <span className="bg-amber-600 text-white text-xs font-bold px-2 py-1 rounded mb-2 inline-block">
                    FEATURED
                  </span>
                  <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2 drop-shadow-md">
                    {trendingRwandan[0].title}
                  </h2>
                  <p className="text-gray-300 line-clamp-2 max-w-xl text-sm sm:text-base drop-shadow-md">
                    {trendingRwandan[0].description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto pb-24 relative z-10 px-4 sm:px-6">
        {rwandanContent.length === 0 ? (
          <div className="text-center py-20 bg-gray-800 rounded-xl border border-gray-700">
            <Film size={48} className="mx-auto text-gray-600 mb-4" />
            <h3 className="text-xl text-gray-300 font-semibold">No Content Yet</h3>
            <p className="text-gray-500 mt-2">Check back later for new Rwandan movies.</p>
          </div>
        ) : (
          <>
            <Section
              title="Trending in Rwanda"
              items={trendingRwandan}
              onCardClick={navigate}
              onWatchLaterToggle={toggleWatchLater}
              watchLaterIds={watchLaterIds}
              isLoading={isContentLoading}
            />
            <Section
              title="New Releases"
              items={newReleases}
              onCardClick={navigate}
              onWatchLaterToggle={toggleWatchLater}
              watchLaterIds={watchLaterIds}
              isLoading={isContentLoading}
            />
            <Section
              title="Top Rated Local"
              items={topRated}
              onCardClick={navigate}
              onWatchLaterToggle={toggleWatchLater}
              watchLaterIds={watchLaterIds}
              isLoading={isContentLoading}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default RwandanView;