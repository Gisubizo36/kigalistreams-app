import React, { useState, useMemo, useEffect } from "react";
import { getYouTubeThumbnailUrl } from "../utils.js";
import VideoPlayer from "../components/VideoPlayer.jsx";
import {
  ArrowLeft,
  Clock,
  Play,
  Video,
  Download,
  BookOpen,
  Globe,
  ChevronDown,
} from "lucide-react";

const DetailView = ({
  contentId,
  content,
  continueWatching,
  navigate,
  saveUserProgress,
  toggleWatchLater,
  watchLater,
}) => {
  const item = content.find((i) => i.id === contentId);

  const initialProgress = continueWatching[contentId] || {
    episode: 1,
    time: 0,
  };
  const initialEpisode =
    item?.type === "TV Series" ? initialProgress.episode || 1 : 1;
  const initialTime = initialProgress.time || 0;

  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);
  const [currentPlaybackTime, setCurrentPlaybackTime] = useState(initialTime);
  const [message, setMessage] = useState("");

  // --- FIX 1: Start with NO video (shows the Image Thumbnail first) ---
  const initialVideo = useMemo(() => {
    return {
      link: null, // Kept null to ensure Image loads first
      title: "No Video Selected",
      isTrailer: false,
      subtitleUrl: null,
    };
  }, [item]);
  // ------------------------------------------------------------------

  const [currentVideo, setCurrentVideo] = useState(initialVideo);
  const watchLaterIds = watchLater;
  const isWatchLater = watchLaterIds.includes(contentId);

  const relatedContent = useMemo(() => {
    if (!item) return [];
    return content
      .filter(
        (i) => i.id !== contentId && i.genre.some((g) => item.genre.includes(g))
      )
      .slice(0, 5);
  }, [content, contentId, item]);

  const seasons = useMemo(() => {
    if (item?.type !== "TV Series" || !item?.episodes) return [];
    const seasonSet = new Set(
      item.episodes.map((ep) => Number(ep.seasonNumber) || 1)
    );
    return Array.from(seasonSet).sort((a, b) => a - b);
  }, [item?.type, item?.episodes]);

  const initialSeason = useMemo(() => {
    const ep = item?.episodes?.find((e) => e.episodeNumber === currentEpisode);
    return ep?.seasonNumber || (seasons.length > 0 ? seasons[0] : 1);
  }, [currentEpisode, item?.episodes, seasons]);

  const [selectedSeason, setSelectedSeason] = useState(initialSeason);

  const episodesForSelectedSeason = useMemo(() => {
    if (!item?.episodes) return [];
    return item.episodes
      .filter((ep) => Number(ep.seasonNumber) === selectedSeason)
      .sort(
        (a, b) =>
          (Number(a.episodeNumber) || 0) - (Number(b.episodeNumber) || 0)
      );
  }, [item?.episodes, selectedSeason]);

  useEffect(() => {
    const ep = item?.episodes?.find(
      (e) => Number(e.episodeNumber) === currentEpisode
    );
    if (ep && Number(ep.seasonNumber) !== selectedSeason) {
      setSelectedSeason(Number(ep.seasonNumber));
    }
  }, [currentEpisode, item?.episodes, selectedSeason]);

  if (!item)
    return (
      <div className="text-white p-8">
        Content not found.{" "}
        <button onClick={() => navigate("home")} className={`bg-amber-600`}>
          Go Home
        </button>
      </div>
    );

  const playMovie = (epNumber) => {
    setMessage("");
    let externalLink = null;
    if (item.type === "TV Series" && item.episodes.length > 0) {
      const ep = item.episodes.find(
        (e) => Number(e.episodeNumber) === epNumber
      );
      if (ep && ep.episodeLink) {
        externalLink = ep.episodeLink;
        setCurrentEpisode(epNumber);
      } else {
        setMessage("Error: Episode link not found.");
      }
    } else if (item.movieLink) {
      externalLink = item.movieLink;
    } else {
      setMessage("Error: Main movie link not found.");
    }

    if (
      externalLink &&
      (externalLink.startsWith("http://") ||
        externalLink.startsWith("https://"))
    ) {
      window.open(
        "https://otieu.com/4/10173729",
        "_blank",
        "noopener,noreferrer"
      );
      window.location.href = externalLink;
    } else {
      setMessage("Error: The provided link is not valid or was not found.");
    }
  };

  const playTrailer = () => {
    setMessage("");
    if (item.trailerLink) {
      setCurrentVideo({
        link: item.trailerLink,
        title: `${item.title} Trailer`,
        isTrailer: true,
        subtitleUrl: null,
        initialTime: 0,
      });
      setMessage("Now Playing: Trailer");
    } else {
      setMessage("Error: Trailer link not found.");
    }
  };

  const handleProgressUpdate = (time, duration) => {
    if (time > 0 && duration > 0 && time / duration < 0.95) {
      setCurrentPlaybackTime(time);
      saveUserProgress(contentId, currentEpisode, time);
    }
  };

  return (
    <div className="min-h-screen pt-16">
      <main className="container mx-auto py-8 px-4 sm:px-6">
        <button
          onClick={() => navigate("home")}
          className={`mb-6 flex items-center bg-amber-600 hover:text-emerald-400 transition`}
        >
          <ArrowLeft size={20} className="mr-1" /> Back to Home
        </button>
        
        {/* If link exists, load VideoPlayer. If not, load Thumbnail Image */}
        {currentVideo.link ? (
          <VideoPlayer
            key={currentVideo.link}
            url={currentVideo.link}
            title={currentVideo.title}
            isTrailer={currentVideo.isTrailer}
            onProgressUpdate={handleProgressUpdate}
            initialTime={currentVideo.initialTime}
            subtitleUrl={
              currentVideo.subtitleUrl ||
              item.episodes?.find((e) => e.episodeNumber === currentEpisode)
                ?.subtitleLink
            }
          />
        ) : (
          <div className="relative w-full aspect-video bg-gray-800 rounded-xl flex items-center justify-center text-gray-400 text-lg overflow-hidden">
            <img
              src={
                getYouTubeThumbnailUrl(item.trailerLink) ||
                item.thumbnail ||
                `https://placehold.co/1280x720/1f2937/fff?text=${encodeURIComponent(
                  item.title
                )}`
              }
              alt={item.title}
              className="w-full h-full object-cover"
            />
            {item.trailerLink && (
              <button
                onClick={playTrailer}
                className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-all duration-300 hover:bg-black/50"
                aria-label="Play Trailer"
              >
                <div className="w-20 h-14 bg-red-600/90 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 hover:bg-red-700 hover:scale-110 group">
                  <Play
                    size={40}
                    className="text-white transition-transform group-hover:scale-105"
                    fill="currentColor"
                  />
                </div>
              </button>
            )}
          </div>
        )}
        {message && (
          <p className="mt-4 text-center text-sm text-green-400">{message}</p>
        )}
        <div className="mt-8 flex flex-col lg:flex-row gap-8">
          <div className="lg:w-2/3">
            <div className="flex justify-between items-start mb-4">
              <h1 className="text-3xl font-bold text-white mb-1">
                {item.title}
              </h1>
              <button
                onClick={() => toggleWatchLater(contentId)}
                className={`flex items-center p-3 rounded-full transition text-sm ${
                  isWatchLater
                    ? `bg-emerald-700 text-white hover:bg-emerald-800`
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }`}
                title={
                  isWatchLater
                    ? "Remove from Watch Later"
                    : "Add to Watch Later"
                }
              >
                <Clock size={20} className="mr-1" />
                <span className="hidden sm:inline">
                  {isWatchLater ? "Watching Later" : "Watch Later"}
                </span>
              </button>
            </div>
            {item.translator && (
              <p
                className={`text-lg text-emerald-400 font-semibold mb-2 flex items-center`}
              >
                <BookOpen size={20} className="mr-2" /> Translated by:{" "}
                {item.translator}
              </p>
            )}

            {item.type === "Movie" ? (
              <div className="flex flex-wrap gap-4 my-6">
                <button
                  onClick={() => playMovie(currentEpisode)}
                  className={`flex items-center bg-amber-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition shadow-lg shadow-emerald-600/30`}
                >
                  <Play size={20} className="mr-2" />
                  Watch Movie
                </button>
                {item.trailerLink && (
                  <button
                    onClick={playTrailer}
                    className="flex items-center border border-gray-600 text-gray-300 hover:bg-gray-700 font-semibold py-3 px-6 rounded-xl transition"
                  >
                    <Video size={20} className="mr-2" />
                    Play Trailer
                  </button>
                )}
                {item.downloadLink && (
                  <a
                    href={item.downloadLink}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center border border-gray-600 text-gray-300 hover:bg-gray-700 font-semibold py-3 px-6 rounded-xl transition"
                  >
                    <Download size={20} className="mr-2" />
                    Download
                  </a>
                )}
              </div>
            ) : (
              <div className="my-6 space-y-4">
                <div className="relative inline-block w-full sm:w-auto">
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    className="appearance-none w-full sm:w-auto bg-gray-700 border border-gray-600 text-white font-semibold py-3 px-4 pr-8 rounded-lg focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {seasons.map((season) => (
                      <option key={season} value={season}>
                        Season {season}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={20}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>

                <h3 className="text-xl font-semibold text-white">Episodes</h3>
                <div className="flex flex-wrap gap-3">
                  {episodesForSelectedSeason.length > 0 ? (
                    episodesForSelectedSeason.map((ep) => (
                      <button
                        key={ep.episodeNumber}
                        onClick={() => playMovie(ep.episodeNumber)}
                        className={`flex items-center bg-gray-800 border border-gray-700 hover:border-emerald-500 text-gray-300 hover:text-white font-medium py-2 px-4 rounded-lg transition ${
                          currentEpisode === ep.episodeNumber
                            ? "border-emerald-500 text-emerald-400"
                            : ""
                        }`}
                        title={ep.episodeTitle}
                      >
                        <Play size={16} className="mr-2 flex-shrink-0" />
                        <span className="truncate">
                          E{ep.episodeNumber}: {ep.episodeTitle}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="text-gray-400">
                      No episodes found for this season.
                    </p>
                  )}
                </div>
              </div>
            )}

            <p className="text-gray-400 mb-4">{item.description}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {item.genre.map((g) => (
                <span
                  key={g}
                  className={`text-xs font-medium bg-amber-600/30 text-emerald-300 py-1 px-3 rounded-full`}
                >
                  {g}
                </span>
              ))}
              <span className="text-xs font-medium bg-gray-600/30 text-gray-300 py-1 px-3 rounded-full">
                {item.type}
              </span>
            </div>
          </div>
          <div className="lg:w-1/3">
            <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Globe size={20} className={`mr-2 bg-amber-600`} />
                More Like This
              </h3>
              <div className="space-y-4">
                {relatedContent.map((rc) => (
                  <div
                    key={rc.id}
                    className="flex items-center space-x-3 cursor-pointer hover:bg-gray-700 p-2 rounded-lg transition"
                    onClick={() => navigate("detail", rc.id)}
                  >
                    <img
                      src={
                        rc.thumbnail ||
                        `https://placehold.co/80x120/1f2937/fff?text=${encodeURIComponent(
                          rc.title
                        )}`
                      }
                      alt={rc.title}
                      className="w-12 h-16 object-cover rounded-md"
                      loading="lazy"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://placehold.co/80x120/1f2937/fff?text=${encodeURIComponent(
                          rc.title
                        )}`;
                      }}
                    />
                    <div>
                      <h4 className="text-white text-sm font-semibold truncate">
                        {rc.title}
                      </h4>
                      <p className="text-gray-400 text-xs">{rc.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DetailView;