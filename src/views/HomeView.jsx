import React, { useState, useMemo, useEffect } from "react";
import Section from "../components/Section.jsx";
import AdBanner from "../components/AdBanner.jsx";

const HomeView = ({
  content,
  continueWatching,
  watchLater,
  navigate,
  toggleWatchLater,
  isContentLoading,
}) => {
  const [currentCircleIndex, setCurrentCircleIndex] = useState(0);
  const watchLaterIds = watchLater;

  const continueWatchingItems = useMemo(() => {
    return content
      .filter((item) => continueWatching[item.id])
      .sort((a, b) => continueWatching[b.id].time - continueWatching[a.id].time)
      .map((item) => ({
        ...item,
        progress: continueWatching[item.id].time,
      }));
  }, [content, continueWatching]);

  const sortedContent = useMemo(
    () => [...content].sort((a, b) => b.timestamp - a.timestamp),
    [content]
  );

  const trendingItems = useMemo(
    () => sortedContent.filter((item) => item.isTrending).slice(0, 10),
    [sortedContent]
  );

  // --- UPDATED: ITEMS FOR MOBILE CIRCULAR SLIDER ---
  const baseHeroItems = useMemo(() => {
    const recentItems = sortedContent.slice(0, 10);
    const combined = [...trendingItems, ...recentItems];
    const uniqueItems = Array.from(new Map(combined.map(item => [item.id, item])).values());
    const shuffled = uniqueItems.sort(() => 0.5 - Math.random());
    
    let pool = [...shuffled];
    if (pool.length === 0) return [];
    while (pool.length < 12) {
      pool = [...pool, ...shuffled];
    }
    return pool.slice(0, 24);
  }, [trendingItems, sortedContent]);

  const heroItems = useMemo(() => {
    const items = trendingItems.length > 0 ? trendingItems : sortedContent;
    const baseItems = items.slice(0, 8);
    if (baseItems.length === 0) return [];

    let duplicatedItems = [...baseItems];
    while (duplicatedItems.length < 16 && baseItems.length > 0) {
      duplicatedItems = [...duplicatedItems, ...baseItems];
    }
    return duplicatedItems;
  }, [trendingItems, sortedContent]);

  // --- UPDATED: 9 SECOND INTERVAL ---
  useEffect(() => {
    if (baseHeroItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentCircleIndex((prev) => (prev + 1) % baseHeroItems.length);
    }, 9000); // <--- CHANGED TO 9000 (9 Seconds)
    return () => clearInterval(interval);
  }, [baseHeroItems.length]);

  const topRatedItems = useMemo(
    () => sortedContent.filter((item) => item.isTopRated).sort((a, b) => b.rating - a.rating).slice(0, 10),
    [sortedContent]
  );
  const recentlyAddedItems = sortedContent.slice(0, 10);
  const moviesItems = useMemo(() => sortedContent.filter((item) => item.type === "Movie").slice(0, 10), [sortedContent]);
  const seriesItems = useMemo(() => sortedContent.filter((item) => item.type === "TV Series").slice(0, 10), [sortedContent]);
  const animeItems = useMemo(() => sortedContent.filter((item) => item.genre.includes("Anime")).slice(0, 10), [sortedContent]);

  return (
    <div className="min-h-screen pt-40 lg:pt-24 relative">
      <div
        className="relative w-full h-auto lg:h-[500px] bg-cover bg-center -mt-16"
        style={{
          backgroundImage: "url(https://images.pexels.com/photos/109669/pexels-photo-109669.jpeg)",
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>

        {/* --- MOBILE HERO SECTION (UPDATED "EGG" SLIDER) --- */}
        <div className="relative z-10 container mx-auto pt-8 lg:hidden">
          <div className="relative w-full h-80 flex items-center justify-center overflow-hidden">
            {baseHeroItems.length > 0 ? (
              baseHeroItems.map((item, index) => {
                const length = baseHeroItems.length;
                let position = (index - currentCircleIndex + length) % length;
                if (position > length / 2) position -= length;

                if (position < -1 || position > 1) return null;

                let itemClass = "z-10 scale-90 opacity-50 grayscale-[50%]";
                let translateClass = "";

                if (position === 0) {
                  // --- UPDATED CENTER STYLE: Multi-color Glow + Full Opacity ---
                  itemClass =
                    "z-20 scale-110 opacity-100 border-2 border-amber-400 grayscale-0 shadow-[0_0_20px_rgba(245,158,11,0.6),0_0_40px_rgba(168,85,247,0.5),0_0_60px_rgba(6,182,212,0.5)]";
                  translateClass = "translate-x-0";
                } else if (position === -1) {
                  translateClass = "-translate-x-[85%]";
                } else if (position === 1) {
                  translateClass = "translate-x-[85%]";
                }

                return (
                  <div
                    key={`${item.id}-${index}`}
                    // --- UPDATED SHAPE: w-52 h-64 + rounded-full = Vertical Oval ("Egg") ---
                    className={`absolute w-52 h-64 rounded-full overflow-hidden transition-all duration-1000 ease-in-out cursor-pointer bg-gray-900 ${itemClass} ${translateClass}`}
                    onClick={() => navigate("detail", item.id)}
                  >
                    <img
                      src={
                        item.thumbnail ||
                        `https://placehold.co/400x400/1f2937/fff?text=${encodeURIComponent(item.title)}`
                      }
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                );
              })
            ) : (
              // --- UPDATED "EGG" SKELETON ---
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="absolute w-52 h-64 rounded-full bg-gray-800 -translate-x-[85%] scale-90 opacity-50 animate-pulse"></div>
                <div className="absolute w-52 h-64 rounded-full bg-gray-700 z-20 scale-110 border-2 border-gray-600 animate-pulse shadow-xl"></div>
                <div className="absolute w-52 h-64 rounded-full bg-gray-800 translate-x-[85%] scale-90 opacity-50 animate-pulse"></div>
              </div>
            )}
          </div>
        </div>

        {/* DESKTOP HERO SECTION (UNCHANGED) */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 pb-12 lg:pb-0 lg:h-full lg:flex lg:items-center">
          <div className="flex-1 max-w-lg text-center lg:text-left pt-4 lg:pt-0">
            <h1
              className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4"
              style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.7)" }}
            >
              Unlimited Movies, TV Shows, and More.
            </h1>
            <p className="text-lg md:text-xl text-gray-200">
              Watch anywhere. Interpreted for you in Kinyarwanda.
            </p>
          </div>
          <div className="hidden lg:block flex-1 relative h-full">
            <div
              className="absolute -right-32 top-1/2 -translate-y-1/2 w-[740px] h-[380px] overflow-hidden"
              style={{
                maskImage:
                  "linear-gradient(to right, transparent, black 20%, black 80%, transparent 100%)",
              }}
            >
              <div className="absolute left-0 top-0 flex animate-scroll h-full py-4 items-center">
                {heroItems.length > 0
                  ? heroItems.map((item, index) => (
                      <div
                        key={index}
                        className="w-[200px] aspect-[2/3] mx-3 flex-shrink-0 transition-transform duration-500 hover:scale-110 cursor-pointer"
                        onClick={() => navigate("detail", item.id)}
                      >
                        <img
                          src={
                            item.thumbnail ||
                            `https://placehold.co/200x300/1f2937/fff?text=${encodeURIComponent(item.title)}`
                          }
                          alt={item.title}
                          className="w-full h-full object-cover rounded-lg shadow-2xl"
                        />
                      </div>
                    ))
                  : [1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="w-[200px] aspect-[2/3] mx-3 flex-shrink-0 bg-gray-700 rounded-lg"
                      ></div>
                    ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <AdBanner />
      <div className="relative w-full overflow-hidden">
        <div className="absolute inset-0 z-0 performant-bg"></div>
        <main className="container mx-auto py-8 relative z-20 pb-8">
          {continueWatchingItems.length > 0 && (
            <Section
              title="Continue Watching"
              items={continueWatchingItems}
              onCardClick={navigate}
              onWatchLaterToggle={toggleWatchLater}
              watchLaterIds={watchLaterIds}
            />
          )}
          <Section
            title="Trending Now"
            items={trendingItems}
            onCardClick={navigate}
            onWatchLaterToggle={toggleWatchLater}
            watchLaterIds={watchLaterIds}
            viewAllPath="allcontent"
            isLoading={isContentLoading}
          />
          <Section
            title="Recently Added"
            items={recentlyAddedItems}
            onCardClick={navigate}
            onWatchLaterToggle={toggleWatchLater}
            watchLaterIds={watchLaterIds}
            viewAllPath="allcontent"
            isLoading={isContentLoading}
          />
          <Section
            title="Top Rated"
            items={topRatedItems}
            onCardClick={navigate}
            onWatchLaterToggle={toggleWatchLater}
            watchLaterIds={watchLaterIds}
            viewAllPath="allcontent"
            isLoading={isContentLoading}
          />
          <Section
            title="Movies"
            items={moviesItems}
            onCardClick={navigate}
            onWatchLaterToggle={toggleWatchLater}
            watchLaterIds={watchLaterIds}
            viewAllPath="allcontent"
            isLoading={isContentLoading}
          />
          <Section
            title="TV Series"
            items={seriesItems}
            onCardClick={navigate}
            onWatchLaterToggle={toggleWatchLater}
            watchLaterIds={watchLaterIds}
            viewAllPath="allcontent"
            isLoading={isContentLoading}
          />
          <Section
            title="Anime"
            items={animeItems}
            onCardClick={navigate}
            onWatchLaterToggle={toggleWatchLater}
            watchLaterIds={watchLaterIds}
            viewAllPath="allcontent"
            isLoading={isContentLoading}
          />
        </main>
        <footer className="container mx-auto relative z-20 w-full text-center pt-2 mt-2 border-t border-gray-700/30 text-xs text-gray-400 pb-24">
          &copy; {new Date().getFullYear()} KigaliStreams. All Rights Reserved.
        </footer>
      </div>
    </div>
  );
};

export default HomeView;