import React, { useRef, useState, useEffect } from "react";
import { getYouTubeEmbedUrl } from "../utils.js";
import { Pause, Play, Rewind, FastForward, ChevronDown } from "lucide-react";

const VideoPlayer = ({
  url,
  title,
  isTrailer = false,
  onProgressUpdate,
  initialTime = 0,
  subtitleUrl,
  autoPlay = false, // Checks if we should play immediately
}) => {
  const videoRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay); 
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [ccEnabled, setCcEnabled] = useState(true);

  const youtubeEmbedUrl = getYouTubeEmbedUrl(url);

  if (youtubeEmbedUrl) {
    // 1. Check if URL already has query params
    const separator = youtubeEmbedUrl.includes("?") ? "&" : "?";
    
    // 2. Construct source with MANDATORY autoplay=1 if autoPlay is true
    // allow="autoplay" is crucial in the iframe tag below
    const iframeSrc = `${youtubeEmbedUrl}${separator}autoplay=${autoPlay ? 1 : 0}&rel=0&modestbranding=1&playsinline=1&start=${Math.floor(initialTime)}`;

    return (
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
        <iframe
          src={iframeSrc}
          title={title}
          frameBorder="0"
          // CRITICAL: "autoplay" must be in this list
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>
    );
  }

  // --- NATIVE VIDEO PLAYER LOGIC ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const setLoadedDuration = () => {
      setDuration(video.duration);
      video.currentTime = initialTime;
      video.playbackRate = playbackRate;
      if (video.textTracks.length > 0) {
        const track = video.textTracks[0];
        track.mode = ccEnabled ? "showing" : "hidden";
      }
      // NATIVE AUTOPLAY LOGIC
      if (autoPlay) {
        video.play().catch(e => console.warn("Autoplay blocked by browser:", e));
        setIsPlaying(true);
      }
    };
    video.addEventListener("loadedmetadata", setLoadedDuration);
    return () => {
      video.removeEventListener("loadedmetadata", setLoadedDuration);
    };
  }, [url, initialTime, playbackRate, ccEnabled, autoPlay]);

  useEffect(() => {
    const video = videoRef.current;
    if (isTrailer || !onProgressUpdate || !video) return;
    const updateTime = () => setCurrentTime(video.currentTime);
    video.addEventListener("timeupdate", updateTime);
    const interval = setInterval(() => {
      if (!video.paused) {
        onProgressUpdate(video.currentTime, video.duration);
      }
    }, 5000);
    return () => {
      clearInterval(interval);
      video.removeEventListener("timeupdate", updateTime);
    };
  }, [isTrailer, onProgressUpdate]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (video.paused) {
      video.play().catch((e) => console.error("Play error:", e));
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const skip = (seconds) => {
    videoRef.current.currentTime += seconds;
    setCurrentTime(videoRef.current.currentTime);
  };

  const changeSpeed = (rate) => {
    setPlaybackRate(rate);
    videoRef.current.playbackRate = rate;
  };

  const toggleCaptions = () => {
    const video = videoRef.current;
    if (video.textTracks.length > 0) {
      const newCcEnabled = !ccEnabled;
      video.textTracks[0].mode = newCcEnabled ? "showing" : "hidden";
      setCcEnabled(newCcEnabled);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time) || time === Infinity) return "0:00";
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    let result = "";
    if (hours > 0) result += `${hours}:`;
    result += `${minutes.toString().padStart(hours > 0 ? 2 : 1, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
    return result;
  };

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none p-4 z-10 text-white bg-gradient-to-b from-black/50 to-transparent">
        <h2 className="text-xl font-bold">{title}</h2>
        {isTrailer && (
          <span className={`text-sm text-emerald-400 font-medium`}>
            TRAILER
          </span>
        )}
      </div>

      <video
        ref={videoRef}
        src={url}
        controls={false}
        className="w-full h-full object-cover transition duration-300 opacity-90 hover:opacity-100"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          if (onProgressUpdate) onProgressUpdate(0, duration);
        }}
      >
        <source src={url} type="application/x-mpegURL" />
        {subtitleUrl && (
          <track
            kind="captions"
            src={subtitleUrl}
            label="English"
            default={ccEnabled}
          />
        )}
        Your browser does not support the video tag.
      </video>

      <div className="absolute bottom-0 w-full p-4 bg-black/70 flex items-center space-x-4 text-white z-20">
        <button
          onClick={togglePlay}
          className={`p-2 bg-amber-600 hover:bg-emerald-700 text-white rounded-full transition`}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <span className="text-sm font-mono">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <button
          onClick={() => skip(-10)}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          title="Rewind 10s"
        >
          <Rewind size={20} />
        </button>
        <button
          onClick={() => skip(10)}
          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
          title="Forward 10s"
        >
          <FastForward size={20} />
        </button>
        <div className="hidden sm:block relative group">
          <button className="flex items-center p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
            {playbackRate}x Speed{" "}
            <ChevronDown size={16} className="inline ml-1" />
          </button>
          <div className="absolute bottom-full mb-2 right-0 bg-gray-800 rounded-lg shadow-xl overflow-hidden hidden group-hover:block w-24">
            {[2.0, 1.5, 1.0, 0.5].map((rate) => (
              <button
                key={rate}
                onClick={() => changeSpeed(rate)}
                className={`block w-full text-left p-2 hover:bg-gray-700 ${
                  playbackRate === rate ? `text-emerald-400 font-bold` : ""
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>
        </div>
        {subtitleUrl && (
          <button
            onClick={toggleCaptions}
            className={`p-2 rounded-lg transition hidden sm:block font-bold ${
              ccEnabled
                ? `bg-amber-600 hover:bg-emerald-700 text-white`
                : "bg-gray-700 hover:bg-gray-600"
            }`}
            title="Subtitles"
          >
            CC
          </button>
        )}
      </div>
    </div>
  );
};

export default VideoPlayer;