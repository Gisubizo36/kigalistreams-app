import React, { useState, useMemo, useEffect } from "react";
import Section from "../components/Section.jsx";
import { Film } from "lucide-react";
// Import CardPlaceholder to make the initial load look smooth
import CardPlaceholder from "../components/CardPlaceholder.jsx"; 

const RwandanView = ({
  content,
  navigate,
  toggleWatchLater,
  watchLater,
  isContentLoading,
}) => {
  const [currentCircleIndex, setCurrentCircleIndex] = useState(0);
  // NEW: State to delay the rendering of heavy rows
  const [sectionsLoaded, setSectionsLoaded] = useState(false);
  const watchLaterIds = watchLater;

  // --- FILTER: ONLY RWANDAN MOVIES ---
  const rwandanContent = useMemo(() => {
    return content
      .filter((item) => item.category === "Rwandan")
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [content]);

  // --- LOGIC FOR SLIDERS ---
  const trendingRwandan = useMemo(
    () => rwandanContent.filter((item) => item.isTrending).slice(0, 10),
    [rwandanContent]
  );

  const baseHeroItems = useMemo(() => {
    const recentItems = rwandanContent.slice(0, 10);
    const combined = [...trendingRwandan, ...recentItems];
    const uniqueItems = Array.from(new Map(combined.map(item => [item.id, item])).values());
    if (uniqueItems.length === 0) return [];
    let pool = [...uniqueItems];
    // Optimize: Only duplicate if we really need to (saves memory)
    if (pool.length < 5) { 
        while (pool.length < 5) pool = [...pool, ...uniqueItems];
    }
    return pool.slice(0, 15);
  }, [trendingRwandan, rwandanContent]);

  const heroItems = useMemo(() => {
    const items = trendingRwandan.length > 0 ? trendingRwandan : rwandanContent;
    const baseItems = items.slice(0, 8);
    if (baseItems.length === 0) return [];
    
    // Optimize: Reduce heavy duplication for the desktop slider
    let duplicatedItems = [...baseItems];
    if (duplicatedItems.length < 16 && baseItems.length > 0) {
        // Just duplicate once or twice, don't overdo it
        while (duplicatedItems.length < 16) duplicatedItems = [...duplicatedItems, ...baseItems];
    }
    return duplicatedItems;
  }, [trendingRwandan, rwandanContent]);

  // --- EFFECTS ---
  
  // 1. Auto Slide
  useEffect(() => {
    if (baseHeroItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentCircleIndex((prev) => (prev + 1) % baseHeroItems.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [baseHeroItems.length]);

  // 2. NEW: Progressive Loading (Fixes the "Lag")
  useEffect(() => {
    // Wait just 10ms to let the page transition finish, then load the rows
    const timer = setTimeout(() => {
        setSectionsLoaded(true);
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  const newReleases = rwandanContent.slice(0, 10);
  const topRated = useMemo(
    () => [...rwandanContent].sort((a, b) => b.rating - a.rating).slice(0, 10),
    [rwandanContent]
  );

  return (
    <div className="min-h-screen pt-40 lg:pt-24 relative">
      {/* --- BACKGROUND IMAGE --- */}
      <div
        className="relative w-full h-auto lg:h-[500px] bg-cover bg-center -mt-16"
        style={{
          backgroundImage: "url(https://images.pexels.com/photos/109669/pexels-photo-109669.jpeg)",
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>

        {/* --- MOBILE HERO --- */}
        <div className="relative z-10 w-full pt-6 pb-4 lg:hidden">
          <div className="container mx-auto px-4 relative h-56 sm:h-64">
            <div className="absolute right-[28%] top-2 bottom-2 w-px bg-gray-500/50 z-0"></div>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center space-y-1 z-0 select-none">
              <span className="text-5xl font-bold text-white/20 leading-none" style={{fontFamily: 'Algerian, serif'}}>R</span>
              <span className="text-5xl font-bold text-white/20 leading-none" style={{fontFamily: 'Algerian, serif'}}>W</span>
            </div>

            {baseHeroItems.length > 0 ? (
              baseHeroItems.map((item, index) => {
                const length = baseHeroItems.length;
                let offset = (index - currentCircleIndex + length) % length;
                if (offset > 2 && offset < length - 1) return null;

                let wrapperClass = "absolute rounded-xl overflow-hidden transition-all duration-700 ease-in-out shadow-2xl";
                let contentClass = "w-full h-full object-cover object-[center_20%]";
                
                if (offset === 0) {
                  wrapperClass += " top-0 left-0 w-[68%] h-full z-20 opacity-100 border border-gray-600";
                } else if (offset === 1) {
                  wrapperClass += " top-[25%] right-[12%] w-[18%] h-[50%] z-10 opacity-80 grayscale-[30%] hover:grayscale-0";
                } else {
                  wrapperClass += " top-[25%] -left-[20%] w-[10%] h-[50%] z-0 opacity-0";
                }

                return (
                  <div
                    key={item.id}
                    className={wrapperClass}
                    onClick={() => offset === 0 && navigate("detail", item.id)}
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className={contentClass}
                    />
                    {offset === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3">
                        <h3 className="text-white font-bold text-sm sm:text-base truncate">{item.title}</h3>
                        <p className="text-amber-400 text-xs font-semibold mt-0.5">Rwandan Special</p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              // Simplified placeholder to reduce lag
              <div className="w-[68%] h-full bg-gray-800 rounded-xl border border-gray-700"></div>
            )}
          </div>
          <div className="container mx-auto px-4 mt-8 text-center z-10 relative">
            <h1 className="text-3xl font-extrabold text-white leading-tight mb-1 drop-shadow-md">
              Made in Rwanda.
            </h1>
            <p className="text-sm text-gray-300 font-medium">
              Support local creators. Watch everywhere.
            </p>
          </div>
        </div>

        {/* --- DESKTOP HERO --- */}
        <div className="hidden lg:block container mx-auto px-4 sm:px-6 pb-12 lg:pb-0 lg:h-full lg:flex lg:items-center relative z-10">
          <div className="flex-1 max-w-lg text-center lg:text-left pt-4 lg:pt-0">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight mb-4" style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.7)" }}>
              The Best of Rwandan Cinema.
            </h1>
            <p className="text-lg md:text-xl text-gray-200">
              Movies, Series, and Comedies from your favorite local stars.
            </p>
          </div>
          <div className="hidden lg:block flex-1 relative h-full">
            <div className="absolute -right-32 top-1/2 -translate-y-1/2 w-[740px] h-[380px] overflow-hidden" style={{ maskImage: "linear-gradient(to right, transparent, black 20%, black 80%, transparent 100%)" }}>
              <div className="absolute left-0 top-0 flex animate-scroll h-full py-4 items-center">
                {heroItems.map((item, index) => (
                  <div key={index} className="w-[200px] aspect-[2/3] mx-3 flex-shrink-0 transition-transform duration-500 hover:scale-110 cursor-pointer" onClick={() => navigate("detail", item.id)}>
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover rounded-lg shadow-2xl" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONTENT SECTIONS (PROGRESSIVE LOADING) --- */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute inset-0 z-0 performant-bg"></div>
        <main className="container mx-auto py-8 relative z-20 pb-8">
          
          {/* SHOW LOADING PLACEHOLDERS IF SECTIONS NOT READY */}
          {!sectionsLoaded ? (
             <div className="px-4 space-y-8">
                <div>
                   <div className="h-6 w-48 bg-gray-700 rounded mb-4 animate-pulse"></div>
                   <div className="flex space-x-4 overflow-hidden">
                      <CardPlaceholder />
                      <CardPlaceholder />
                      <CardPlaceholder />
                   </div>
                </div>
             </div>
          ) : (
             // RENDER REAL CONTENT ONLY AFTER HERO IS DONE
             rwandanContent.length === 0 ? (
                <div className="text-center py-20 bg-gray-800 rounded-xl border border-gray-700 mx-4">
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
             )
          )}
        </main>
        <footer className="container mx-auto relative z-20 w-full text-center pt-2 mt-2 border-t border-gray-700/30 text-xs text-gray-400 pb-24">
          &copy; {new Date().getFullYear()} KigaliStreams. All Rights Reserved.
        </footer>
      </div>
    </div>
  );
};

export default RwandanView;