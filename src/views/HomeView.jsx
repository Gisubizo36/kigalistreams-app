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

  // --- ITEMS FOR MOBILE SLIDER ---
  const baseHeroItems = useMemo(() => {
    const recentItems = sortedContent.slice(0, 10);
    const combined = [...trendingItems, ...recentItems];
    const uniqueItems = Array.from(new Map(combined.map(item => [item.id, item])).values());
    if (uniqueItems.length === 0) return [];
    let pool = [...uniqueItems];
    while (pool.length < 5) {
      pool = [...pool, ...uniqueItems];
    }
    return pool.slice(0, 15);
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

  // --- 5 SECOND INTERVAL ---
  useEffect(() => {
    if (baseHeroItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentCircleIndex((prev) => (prev + 1) % baseHeroItems.length);
    }, 5000);
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
    <div className="min-h-screen pt-20 lg:pt-24 relative">
      <div
        className="relative w-full h-auto lg:h-[500px] bg-cover bg-center -mt-16"
        style={{
          backgroundImage: "url(https://images.pexels.com/photos/109669/pexels-photo-109669.jpeg)",
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>

        {/* --- MOBILE HERO SECTION --- */}
        <div className="relative z-10 w-full pt-4 lg:hidden flex flex-col">
          <div className="container mx-auto px-4 relative h-64"> 
            
            {/* 1. Vertical Line Separator */}
            <div className="absolute right-[26%] top-2 bottom-2 w-px bg-gray-500/50 z-0"></div>

            {/* 2. Stylish KS Letters */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col items-center justify-center z-0 select-none">
              <span className="text-6xl font-serif font-black italic text-gray-600 leading-none -mb-4 drop-shadow-lg">K</span>
              <span className="text-6xl font-serif font-black italic text-amber-600 leading-none drop-shadow-lg">S</span>
            </div>

            {/* 3. Slider Items */}
            {baseHeroItems.length > 0 ? (
              baseHeroItems.map((item, index) => {
                const length = baseHeroItems.length;
                let offset = (index - currentCircleIndex + length) % length;
                
                if (offset > 2 && offset < length - 1) return null;

                // Base wrapper styles
                // Added 'bg-black' so letterboxed areas are black, not transparent
                let wrapperClass = "absolute rounded-xl overflow-hidden transition-all duration-700 ease-in-out shadow-2xl border border-gray-800 bg-black";
                
                // --- LOGIC: Use 'object-contain' to fit WHOLE image ---
                let contentClass = "w-full h-full object-contain";
                
                // --- STATE 1: BIG PICTURE (Left) ---
                if (offset === 0) {
                  wrapperClass += " top-0 left-0 w-[70%] h-full z-20 opacity-100 border-gray-600";
                } 
                // --- STATE 2: SMALL PICTURE (Right) ---
                else if (offset === 1) {
                  wrapperClass += " top-[25%] right-[28%] w-[18%] h-[50%] z-10 opacity-80 grayscale-[30%]";
                }
                // --- STATE 3: EXITING ---
                else {
                  wrapperClass += " top-[25%] -left-[20%] w-[10%] h-[50%] z-0 opacity-0";
                }

                // --- LOGIC: Prefer Backdrop Image (16:9), Fallback to Thumbnail ---
                const imageSrc = item.backdropImage || item.thumbnail || `https://placehold.co/400x600/1f2937/fff?text=${encodeURIComponent(item.title)}`;

                return (
                  <div
                    key={`${item.id}-${index}`}
                    className={wrapperClass}
                    onClick={() => offset === 0 && navigate("detail", item.id)}
                  >
                    <img
                      src={imageSrc}
                      alt={item.title}
                      className={contentClass}
                    />
                    {offset === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pointer-events-none">
                        <h3 className="text-white font-bold text-sm sm:text-base truncate">{item.title}</h3>
                        <p className="text-amber-400 text-xs font-semibold mt-0.5">Trending Now</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="w-[70%] h-full bg-gray-800 animate-pulse rounded-xl border border-gray-700"></div>
            )}
          </div>

          {/* 4. Text Below Slider */}
          <div className="container mx-auto px-4 mt-6 mb-4 text-center z-10">
            <h1 className="text-3xl font-extrabold text-white leading-tight mb-1 drop-shadow-md">
              Unlimited Movies.
            </h1>
            <p className="text-sm text-gray-300 font-medium">
              Watch anywhere. Interpreted for you.
            </p>
          </div>
        </div>

        {/* DESKTOP HERO SECTION (Hidden on mobile) */}
        <div className="hidden lg:block container mx-auto px-4 sm:px-6 pb-12 lg:pb-0 lg:h-full lg:flex lg:items-center">
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