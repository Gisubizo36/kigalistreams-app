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
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [transitionDuration, setTransitionDuration] = useState(700);
  const watchLaterIds = watchLater;

  const continueWatchingItems = useMemo(() => {
    return content.filter((item) => continueWatching[item.id]).sort((a, b) => continueWatching[b.id].time - continueWatching[a.id].time).map((item) => ({...item, progress: continueWatching[item.id].time}));
  }, [content, continueWatching]);

  const sortedContent = useMemo(() => [...content].sort((a, b) => b.timestamp - a.timestamp), [content]);
  const trendingItems = useMemo(() => sortedContent.filter((item) => item.isTrending).slice(0, 10), [sortedContent]);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // --- FIX: SHUFFLE CARDS SO THEY CHANGE ---
  const baseHeroItems = useMemo(() => {
    const items = [...trendingItems, ...sortedContent];
    const shuffled = items.sort(() => 0.5 - Math.random());
    const baseItems = shuffled.slice(0, 24); // Grab 24 random items
    if (baseItems.length === 0) return [];
    return baseItems;
  }, [trendingItems, sortedContent]);
  // ---------------------------------------

  const [currentCardGroupIndex, setCurrentCardGroupIndex] = useState(0);
  const [internalRotationIndex, setInternalRotationIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const totalGroups = Math.ceil(baseHeroItems.length / 3);

  const heroItemsForStack = useMemo(() => {
    if (baseHeroItems.length === 0) return [];
    let baseStack = [];
    if (baseHeroItems.length === 1) { baseStack = [baseHeroItems[0], baseHeroItems[0], baseHeroItems[0]]; } 
    else if (baseHeroItems.length === 2) { baseStack = [baseHeroItems[1], baseHeroItems[0], baseHeroItems[1]]; } 
    else {
      const baseIndex = currentCardGroupIndex * 3;
      baseStack = [
        baseHeroItems[(baseIndex + 1) % baseHeroItems.length],
        baseHeroItems[(baseIndex + 0) % baseHeroItems.length],
        baseHeroItems[(baseIndex + 2) % baseHeroItems.length]
      ];
    }
    if (internalRotationIndex === 0) return baseStack;
    else if (internalRotationIndex === 1) return [baseStack[2], baseStack[0], baseStack[1]];
    else return [baseStack[1], baseStack[2], baseStack[0]];
  }, [currentCardGroupIndex, baseHeroItems, internalRotationIndex]);

  useEffect(() => {
    if (baseHeroItems.length <= 1) return;
    const internalInterval = setInterval(() => { setInternalRotationIndex((prevIndex) => (prevIndex + 1) % 3); }, 60 * 1000);
    return () => clearInterval(internalInterval);
  }, [baseHeroItems.length]);

  useEffect(() => {
    if (totalGroups <= 1) return;
    const groupInterval = setInterval(() => {
      setIsFading(true);
      setTimeout(() => {
        setCurrentCardGroupIndex((prevIndex) => (prevIndex + 1) % totalGroups);
        setInternalRotationIndex(0);
        setIsFading(false);
      }, 500);
    }, 15 * 60 * 1000);
    return () => clearInterval(groupInterval);
  }, [totalGroups]);

  const topRatedItems = useMemo(() => sortedContent.filter((item) => item.isTopRated).sort((a, b) => b.rating - a.rating).slice(0, 10), [sortedContent]);
  const recentlyAddedItems = sortedContent.slice(0, 10);
  const moviesItems = useMemo(() => sortedContent.filter((item) => item.type === "Movie").slice(0, 10), [sortedContent]);
  const seriesItems = useMemo(() => sortedContent.filter((item) => item.type === "TV Series").slice(0, 10), [sortedContent]);
  const animeItems = useMemo(() => sortedContent.filter((item) => item.genre.includes("Anime")).slice(0, 10), [sortedContent]);

  return (
    <div className="min-h-screen pt-40 lg:pt-24 relative">
      <div className="relative w-full h-auto lg:h-[500px] bg-cover bg-center -mt-16" style={{ backgroundImage: "url(https://images.pexels.com/photos/109669/pexels-photo-109669.jpeg)" }}>
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 container mx-auto pt-8 lg:hidden">
          <div className={`relative w-full h-80 flex items-end justify-center overflow-hidden transition-opacity duration-500 ease-in-out ${isFading ? "opacity-0" : "opacity-100"}`}>
            {heroItemsForStack.length > 0 ? (
              heroItemsForStack.map((item, index) => {
                let itemClass = "";
                let cornerClass = "rounded-xl";
                let glowClass = "";
                let heightClass = "";
                if (index === 0) { itemClass = "z-10 -mr-28"; heightClass = "h-5/6"; glowClass = "border border-pink-500/50 shadow-md shadow-pink-500/20"; } 
                else if (index === 1) { itemClass = "z-20"; heightClass = "h-full"; cornerClass = "rounded-2xl"; glowClass = "border border-amber-500/50 shadow-md shadow-amber-500/20"; } 
                else { itemClass = "z-10 -ml-28"; heightClass = "h-5/6"; glowClass = "border border-blue-500/50 shadow-md shadow-blue-500/20"; }
                return (
                  <div key={`${item.id}-${index}-${currentCardIndex}`} className={`w-1/2 aspect-[2/3] transition-all duration-700 ease-in-out ${itemClass} ${heightClass}`} onClick={() => navigate("detail", item.id)}>
                    <div className="relative w-full h-full">
                      <img src={item.thumbnail || `https://placehold.co/400x600/1f2937/fff?text=${encodeURIComponent(item.title)}`} alt={item.title} className={`w-full h-full object-cover ${cornerClass} ${glowClass}`} onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x600/1f2937/fff?text=${encodeURIComponent(item.title)}`; }} />
                    </div>
                  </div>
                );
              })
            ) : (<div className="flex items-center justify-center w-1/2 h-5/6 aspect-[2/3] bg-gray-700 rounded-xl"><p className="text-gray-400">Loading...</p></div>)}
          </div>
        </div>
      </div>
      <AdBanner />
      <div className="relative w-full overflow-hidden">
        <div className="absolute inset-0 z-0 performant-bg"></div>
        <main className="container mx-auto py-8 relative z-20 pb-8">
          {continueWatchingItems.length > 0 && <Section title="Continue Watching" items={continueWatchingItems} onCardClick={navigate} onWatchLaterToggle={toggleWatchLater} watchLaterIds={watchLaterIds} />}
          <Section title="Trending Now" items={trendingItems} onCardClick={navigate} onWatchLaterToggle={toggleWatchLater} watchLaterIds={watchLaterIds} viewAllPath="allcontent" isLoading={isContentLoading} />
          <Section title="Recently Added" items={recentlyAddedItems} onCardClick={navigate} onWatchLaterToggle={toggleWatchLater} watchLaterIds={watchLaterIds} viewAllPath="allcontent" isLoading={isContentLoading} />
          <Section title="Top Rated" items={topRatedItems} onCardClick={navigate} onWatchLaterToggle={toggleWatchLater} watchLaterIds={watchLaterIds} viewAllPath="allcontent" isLoading={isContentLoading} />
          <Section title="Movies" items={moviesItems} onCardClick={navigate} onWatchLaterToggle={toggleWatchLater} watchLaterIds={watchLaterIds} viewAllPath="allcontent" isLoading={isContentLoading} />
          <Section title="TV Series" items={seriesItems} onCardClick={navigate} onWatchLaterToggle={toggleWatchLater} watchLaterIds={watchLaterIds} viewAllPath="allcontent" isLoading={isContentLoading} />
          <Section title="Anime" items={animeItems} onCardClick={navigate} onWatchLaterToggle={toggleWatchLater} watchLaterIds={watchLaterIds} viewAllPath="allcontent" isLoading={isContentLoading} />
        </main>
        <footer className="container mx-auto relative z-20 w-full text-center pt-2 mt-2 border-t border-gray-700/30 text-xs text-gray-400 pb-24">&copy; {new Date().getFullYear()} KigaliStreams. All Rights Reserved.</footer>
      </div>
    </div>
  );
};
export default HomeView;