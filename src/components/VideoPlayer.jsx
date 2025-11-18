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
}) => {
  const videoRef = React.useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(initialTime);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [ccEnabled, setCcEnabled] = useState(true);

  const youtubeEmbedUrl = getYouTubeEmbedUrl(url);

  if (youtubeEmbedUrl) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
        <iframe
          // --- FIX: Autoplay is ON because we load this on user click ---
          src={`${youtubeEmbedUrl}?autoplay=1`}
          // -------------------------------------------------------------
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>
    );
  }
  // ... (Rest of standard video player logic remains same)
  
  // Standard Player implementation below (abbreviated for standard HTML5 player)
  return (<div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl"><div className="absolute top-0 left-0 w-full h-full pointer-events-none p-4 z-10 text-white bg-gradient-to-b from-black/50 to-transparent"><h2 className="text-xl font-bold">{title}</h2>{isTrailer && (<span className={`text-sm text-emerald-400 font-medium`}>TRAILER</span>)}</div>{isTrailer && (<div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-900/50 text-yellow-300 p-2 rounded-lg text-sm z-20">Future Pre-roll Ad Slot (5s)</div>)}<video ref={videoRef} src={url} controls={false} autoPlay className="w-full h-full object-cover transition duration-300 opacity-90 hover:opacity-100" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => { setIsPlaying(false); if (onProgressUpdate) onProgressUpdate(0, duration); }}><source src={url} type="application/x-mpegURL" />{subtitleUrl && (<track kind="captions" src={subtitleUrl} label="English" default={ccEnabled} />)}Your browser does not support the video tag.</video><div className="absolute bottom-0 w-full p-4 bg-black/70 flex items-center space-x-4 text-white z-20"><button onClick={togglePlay} className={`p-2 bg-amber-600 hover:bg-emerald-700 text-white rounded-full transition`}>{isPlaying ? <Pause size={24} /> : <Play size={24} />}</button><span className="text-sm font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span><button onClick={() => skip(-10)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition" title="Rewind 10s"><Rewind size={20} /></button><button onClick={() => skip(10)} className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition" title="Forward 10s"><FastForward size={20} /></button><div className="hidden sm:block relative group"><button className="flex items-center p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">{playbackRate}x Speed <ChevronDown size={16} className="inline ml-1" /></button><div className="absolute bottom-full mb-2 right-0 bg-gray-800 rounded-lg shadow-xl overflow-hidden hidden group-hover:block w-24">{[2.0, 1.5, 1.0, 0.5].map((rate) => (<button key={rate} onClick={() => changeSpeed(rate)} className={`block w-full text-left p-2 hover:bg-gray-700 ${playbackRate === rate ? `text-emerald-400 font-bold` : ""}`}>{rate}x</button>))}</div></div>{subtitleUrl && (<button onClick={toggleCaptions} className={`p-2 rounded-lg transition hidden sm:block font-bold ${ccEnabled ? `bg-amber-600 hover:bg-emerald-700 text-white` : "bg-gray-700 hover:bg-gray-600"}`} title="Subtitles">CC</button>)}</div></div>);
};

export default VideoPlayer;