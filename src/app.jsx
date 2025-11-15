import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import * as ReactDOMClient from "react-dom/client";
import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  Eye,
  EyeOff,
  Clock,
  Search,
  Send,
  Menu,
  X,
  Upload,
  Video,
  Hash,
  Globe,
  Mail,
  Phone,
  Moon,
  Sun,
  ArrowLeft,
  Play,
  Film,
  Tv,
  ChevronDown,
  MessageSquare,
  PlusCircle,
  Pause,
  FastForward,
  Rewind,
  Key,
  BookOpen,
  User,
  Trash2,
  Edit,
  List,
  Plus,
  Download,
  ChevronLeft, // <-- ADD THIS
  ChevronRight, // <-- ADD THIS
} from "lucide-react";

// --- GLOBAL VARIABLES & FIREBASE SETUP ---

const appId = "1:1074002927631:web:8c1bb091ecbe80e9a4837a";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app, db, auth;

if (firebaseConfig) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

// --- UTILITIES ---

const DEFAULT_TRANSLATORS = [
  "Translator A",
  "Translator B",
  "Agasobanuye",
  "BY Rocky",
  "BY Junior",
];

const generateId = () => Math.random().toString(36).substring(2, 6);

const getYouTubeEmbedUrl = (url) => {
  if (!url) return null;
  let videoId = url.match(/[?&]v=([^&]+)/);
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId[1]}`;
  }
  videoId = url.match(/youtu\.be\/([^?]+)/);
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId[1]}`;
  }
  videoId = url.match(/youtube\.com\/embed\/([^?]+)/);
  if (videoId) {
    return url;
  }
  return null;
}; // --- NEW UTILITY ---
const getYouTubeVideoId = (url) => {
  if (!url) return null;
  let videoId = url.match(/[?&]v=([^&]+)/);
  if (videoId) return videoId[1];

  videoId = url.match(/youtu\.be\/([^?]+)/);
  if (videoId) return videoId[1];

  videoId = url.match(/youtube\.com\/embed\/([^?]+)/);
  if (videoId) return videoId[1];

  return null;
};

// --- NEW UTILITY ---
const getYouTubeThumbnailUrl = (url) => {
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    // Returns the high-quality (1280x720) thumbnail
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  // Fallback if no ID found
  return null;
};

// Firestore Paths
const getPublicCollectionRef = (db) =>
  collection(db, "artifacts", appId, "public", "data", "content");
const getUserDocRef = (db, userId) =>
  doc(db, "artifacts", appId, "users", userId, "config", "user_data");
const getTranslatorsDocRef = (db) =>
  doc(db, "artifacts", appId, "config", "translators_list");
const getUserProfileDocRef = (db, userId) => doc(db, "users", userId);
const getRequestsCollectionRef = (db) =>
  collection(db, "artifacts", appId, "public", "data", "movie_requests");
// URL Hash Utilities
const getInitialView = () => {
  const hash = window.location.hash.slice(1);
  const validViews = new Set([
    "detail",
    "contact",
    "admin",
    "watchlater",
    "translated",
    "search",
    "genre",
    "allcontent",
    "request",
  ]);
  const viewPart = hash.split("/")[0];
  if (validViews.has(viewPart)) {
    return viewPart;
  }
  return "home";
};

const getInitialId = () => {
  const parts = window.location.hash.slice(1).split("/");
  return parts.length > 1 ? parts[1] : null;
};

// --- DATA STRUCTURES ---
const Genres = [
  "Action",
  "Romance",
  "Comedy",
  "Horror",
  "Drama",
  "Sci-Fi",
  "Thriller",
  "Animation",
  "Documentary",
  "Anime",
];

const emptyContent = {
  id: "",
  title: "",
  genre: [],
  type: "Movie",
  thumbnail: "",
  backdropImage: "",
  description: "",
  movieLink: "",
  trailerLink: "",
  downloadLink: "", // <-- Field for movie download
  rating: 0,
  year: "", // <-- ADDED
  runtime: "", // <-- ADDED
  episodes: [],
  latestSeason: null,
  latestEpisode: null,
  isTopRated: false,
  isTrending: false,
  translator: "",
  timestamp: Date.now(),
};

const useAdminPassword = () => {
  const [adminPassword, setAdminPassword] = useState(() => {
    return localStorage.getItem("kigalistreams_admin_password") || "Minani@88";
  });
  const updateAdminPassword = useCallback((newPassword) => {
    localStorage.setItem("kigalistreams_admin_password", newPassword);
    setAdminPassword(newPassword);
  }, []);
  return [adminPassword, updateAdminPassword];
};

const useTranslatorData = (db) => {
  const [translators, setTranslators] = useState([]);
  const [isLoadingTranslators, setIsLoadingTranslators] = useState(true);

  useEffect(() => {
    if (!db) return;
    const docRef = getTranslatorsDocRef(db);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists() && Array.isArray(docSnap.data().list)) {
          setTranslators(docSnap.data().list);
        } else if (!docSnap.exists()) {
          setDoc(docRef, { list: DEFAULT_TRANSLATORS }, { merge: true }).catch(
            console.error
          );
          setTranslators(DEFAULT_TRANSLATORS);
        }
        setIsLoadingTranslators(false);
      },
      (error) => {
        console.error("Error fetching translator list:", error);
        setTranslators(DEFAULT_TRANSLATORS);
        setIsLoadingTranslators(false);
      }
    );
    return () => unsubscribe();
  }, [db]);

  const updateTranslatorsInFirestore = useCallback(
    async (newList) => {
      if (!db) return false;
      try {
        await updateDoc(getTranslatorsDocRef(db), { list: newList });
        return true;
      } catch (e) {
        console.error("Failed to update translators in Firestore:", e);
        return false;
      }
    },
    [db]
  );

  const addTranslator = useCallback(
    (newName) => {
      newName = newName.trim();
      if (
        !newName ||
        translators.find((t) => t.toLowerCase() === newName.toLowerCase())
      ) {
        return false;
      }
      const newList = [...translators, newName];
      updateTranslatorsInFirestore(newList);
      return true;
    },
    [translators, updateTranslatorsInFirestore]
  );

  const removeTranslator = useCallback(
    (nameToRemove) => {
      const newList = translators.filter((name) => name !== nameToRemove);
      updateTranslatorsInFirestore(newList);
    },
    [translators, updateTranslatorsInFirestore]
  );

  const editTranslator = useCallback(
    (originalName, newName) => {
      newName = newName.trim();
      if (
        !newName ||
        (translators.find((t) => t.toLowerCase() === newName.toLowerCase()) &&
          newName.toLowerCase() !== originalName.toLowerCase())
      ) {
        return false;
      }
      const newList = translators.map((name) =>
        name === originalName ? newName : name
      );
      updateTranslatorsInFirestore(newList);
      return true;
    },
    [translators, updateTranslatorsInFirestore]
  );

  return {
    translators,
    addTranslator,
    removeTranslator,
    editTranslator,
    isLoadingTranslators,
  };
};

// 1. Authentication and State Context
const useAppState = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("kigalistreams_theme") || "dark";
  });

  const [content, setContent] = useState([]);
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [continueWatching, setContinueWatching] = useState({});
  const [watchLater, setWatchLater] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  const {
    translators,
    addTranslator,
    removeTranslator,
    editTranslator,
    isLoadingTranslators,
  } = useTranslatorData(db);

  const [authStatus, setAuthStatus] = useState({
    userId: null,
    user: null,
    isAdmin: false,
    isLoading: true,
    isReady: false,
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("kigalistreams_theme", newTheme);
      return newTheme;
    });
  };

  const ADMIN_UIDS = [
    "SGxlEv4uHob8oc77Jukv0pzBG3y1",
    "W6UL6yjjEtcg14rgVS0iWrnBSf03",
  ];

  // A. Authentication Listener
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthStatus({
          userId: user.uid,
          user: user,
          isAdmin: ADMIN_UIDS.includes(user.uid),
          isLoading: false,
          isReady: true,
        });
      } else {
        try {
          const anonUser = await signInAnonymously(auth);
          setAuthStatus({
            userId: anonUser.user.uid,
            user: anonUser.user,
            isAdmin: false,
            isLoading: false,
            isReady: true,
          });
        } catch (e) {
          console.error("Firebase Anonymous Auth Error:", e);
          setAuthStatus({
            userId: crypto.randomUUID(),
            user: null,
            isAdmin: false,
            isLoading: false,
            isReady: true,
          });
        }
      }
    });

    return () => unsubscribe();
  }, [auth]);

  // B. Content Listener (Public Data)
  useEffect(() => {
    if (!db || !authStatus.isReady) return;

    setIsContentLoading(true);
    const q = query(getPublicCollectionRef(db));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setContent(items);
        setIsContentLoading(false);
      },
      (error) => {
        console.error("Error fetching content:", error);
        setIsContentLoading(false);
      }
    );
    return () => unsubscribe();
  }, [authStatus.isReady]);

  // C. User Data Listener
  useEffect(() => {
    if (!db || !authStatus.userId) {
      setContinueWatching({});
      setWatchLater([]);
      return;
    }
    const userDocRef = getUserDocRef(db, authStatus.userId);
    const unsubscribe = onSnapshot(
      userDocRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setContinueWatching(data.continueWatching || {});
          setWatchLater(data.watchLater || []);
        } else {
          setDoc(
            userDocRef,
            { continueWatching: {}, watchLater: [] },
            { merge: true }
          ).catch(console.error);
        }
      },
      (error) => console.error("Error fetching user data:", error)
    );
    return () => unsubscribe();
  }, [authStatus.userId]);

  // D. User Profile Listener
  useEffect(() => {
    if (!db || !authStatus.userId) {
      setUserProfile(null);
      return;
    }
    if (authStatus.user?.isAnonymous) {
      setUserProfile(null);
      return;
    }
    const profileDocRef = getUserProfileDocRef(db, authStatus.userId);
    const unsubscribe = onSnapshot(
      profileDocRef,
      (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data());
        } else {
          setUserProfile({ email: authStatus.user.email, username: null });
        }
      },
      (error) => {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
      }
    );
    return () => unsubscribe();
  }, [authStatus.userId, authStatus.user?.isAnonymous]);

  // E. Actions to update Firestore
  const saveUserProgress = useCallback(
    async (contentId, episode, time) => {
      if (!authStatus.userId || !db) return;
      const newContinueWatching = {
        ...continueWatching,
        [contentId]: { episode, time },
      };
      const userDocRef = getUserDocRef(db, authStatus.userId);
      await updateDoc(userDocRef, { continueWatching: newContinueWatching });
    },
    [authStatus.userId, continueWatching, db]
  );

  const toggleWatchLater = useCallback(
    async (contentId) => {
      if (!authStatus.userId || !db) return;
      let newWatchLater;
      if (watchLater.includes(contentId)) {
        newWatchLater = watchLater.filter((id) => id !== contentId);
      } else {
        newWatchLater = [...watchLater, contentId];
      }
      const userDocRef = getUserDocRef(db, authStatus.userId);
      await updateDoc(userDocRef, { watchLater: newWatchLater });
    },
    [watchLater, authStatus.userId, db]
  );

  return {
    theme,
    toggleTheme,
    content,
    isContentLoading,
    setContent,
    continueWatching,
    watchLater,
    translators,
    isLoadingTranslators,
    addTranslator,
    removeTranslator,
    editTranslator,
    authStatus,
    userProfile,
    saveUserProgress,
    toggleWatchLater,
  };
};

// 2. UI Elements

const Card = (
  { item, onClick, onWatchLaterToggle, isWatchLater } // 1. Added props back
) => (
  <div
  className="relative group rounded-lg border border-gray-700/50 overflow-hidden transform transition duration-300 hover:scale-[1.03] cursor-pointer hover:shadow-lg hover:shadow-amber-500/30 hover:border-amber-500/50"
    style={{ viewTransitionName: `card-${item.id}` }}
    onClick={() => onClick("detail", item.id)} // Click on whole card
  >
    <div
      className="relative aspect-[2/3]" // 2. Portrait aspect ratio
    >
      <img
        src={
          item.thumbnail ||
          `https://placehold.co/400x600/1f2937/fff?text=${encodeURIComponent(
            item.title
          )}`
        }
        alt={item.title}
        className="w-full h-full object-cover transition duration-300 opacity-90 group-hover:opacity-100"
        loading="lazy"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `https://placehold.co/400x600/1f2937/fff?text=${encodeURIComponent(
            item.title
          )}`;
        }}
      />

      {/* --- 3. TV/FILM ICON (TOP-RIGHT) --- */}
      <div className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-xs font-semibold text-white backdrop-blur-sm z-10">
        {item.type === "TV Series" ? <Tv size={16} /> : <Film size={16} />}
      </div>

      {/* --- 4. WATCH LATER BUTTON (TOP-LEFT) --- */}
      <button
        onClick={(e) => {
          e.stopPropagation(); // Stop click from going to detail page
          onWatchLaterToggle(item.id);
        }}
        className={`absolute top-2 left-2 p-1.5 rounded-full transition bg-black/50 z-10 ${
          isWatchLater
            ? `bg-amber-600 text-white hover:bg-amber-700 shadow-lg shadow-amber-600/30`
            : "bg-black/50 text-gray-300 hover:bg-black/70 hover:text-white"
        }`}
        title={isWatchLater ? "Remove from Watch Later" : "Add to Watch Later"}
      >
        <Clock size={16} />
      </button>

      {/* --- PLAY BUTTON OVERLAY (CENTER) --- */}
      <div
        className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        onClick={(e) => {
          e.stopPropagation(); // Stop click from bubbling to detail
          onClick("detail", item.id, "play");
        }}
        title="Play"
      >
        <Play size={48} className="text-white" fill="currentColor" />
      </div>
    </div>
  </div>
);
// --- START: REPLACE YOUR ENTIRE SECTION COMPONENT WITH THIS ---

const Section = ({
  title,
  items,
  onCardClick, // This is the navigate function
  onWatchLaterToggle,
  watchLaterIds,
  viewAllPath = null, // This will be "allcontent"
  isLoading = false, // <-- Prop is included
}) => {
  // --- 1. SCROLL LOGIC ---
  const scrollContainerRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollContainerRef.current) {
      const { clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.8; // Scroll by 80% of visible width

      if (direction === "left") {
        scrollContainerRef.current.scrollBy({
          left: -scrollAmount,
          behavior: "smooth",
        });
      } else {
        scrollContainerRef.current.scrollBy({
          left: scrollAmount,
          behavior: "smooth",
        });
      }
    }
  };
  // --- END OF SCROLL LOGIC ---

  return (
    <section className="mb-8">
      {/* --- 2. HEADER WITH ARROWS --- */}
      <div className="flex justify-between items-center mb-4 px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-gray-100">{title}</h2>

        <div className="flex space-x-2">
          <button
            onClick={() => handleScroll("left")}
            className="p-2 border border-gray-600 rounded-md text-gray-400 hover:text-white hover:border-white transition"
            title="Scroll Left"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => handleScroll("right")}
            className="p-2 border border-gray-600 rounded-md text-gray-400 hover:text-white hover:border-white transition"
            title="Scroll Right"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* --- 3. SCROLLING CONTAINER --- */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto pb-4 px-4 sm:px-6 space-x-4 custom-scrollbar"
      >
        {/* --- START: CORRECTED LOGIC BLOCK --- */}
        {isLoading ? (
          // 1. Show 6 placeholders while loading
          [...Array(6)].map((_, index) => <CardPlaceholder key={index} />)
        ) : items.length === 0 ? (
          // 2. Show "No content" message if not loading and no items
          <p className="text-gray-400">
            No content available in this section yet.
          </p>
        ) : (
          // 3. Show the actual content cards
          items.map((item) => (
            <div
              key={item.id}
              className="min-w-[150px] w-[150px] sm:min-w-[180px] sm:w-[180px]"
            >
              <Card
                item={item}
                onClick={onCardClick}
                onWatchLaterToggle={onWatchLaterToggle}
                isWatchLater={watchLaterIds.includes(item.id)}
              />

              <div className="mt-3">
                <h3 className="text-white text-base font-semibold truncate">
                  {item.title}
                </h3>
                {item.translator && (
                  <p className="text-emerald-400 text-xs font-medium truncate mt-1">
                    By: {item.translator}
                  </p>
                )}
                <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
                  {item.type === "TV Series" &&
                  item.latestSeason &&
                  item.latestEpisode > 0 ? (
                    <p className="font-medium truncate">
                      SS {item.latestSeason} • EP {item.latestEpisode}
                    </p>
                  ) : item.type === "Movie" && item.year && item.runtime ? (
                    <p className="font-medium truncate">
                      {item.year} • {item.runtime} min
                    </p>
                  ) : (
                    <p className="font-medium truncate">&nbsp;</p>
                  )}

                  <span className="font-medium border border-gray-600 px-1.5 py-0.5 rounded flex-shrink-0">
                    {item.type === "TV Series" ? "TV" : "Movie"}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        {/* --- END: CORRECTED LOGIC BLOCK --- */}

        {/* --- 4. "VIEW ALL" BUTTON AT THE END OF THE LIST --- */}
        {viewAllPath && items.length > 0 && (
          <div className="min-w-[150px] w-[150px] sm:min-w-[180px] sm:w-[180px] flex-shrink-0 flex flex-col items-center justify-center">
            <button
              onClick={() => onCardClick(viewAllPath)}
              className="bg-amber-500 text-gray-900 text-sm font-semibold py-2 px-5 rounded-full transition-colors hover:bg-amber-600"
              style={{ borderRadius: "9999px" }}
            >
              View All
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

// --- END: REPLACE YOUR ENTIRE SECTION COMPONENT WITH THIS ---
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
          src={`${youtubeEmbedUrl}?autoplay=1`}
          title={title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full"
        ></iframe>
      </div>
    );
  }

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
    };
    video.addEventListener("loadedmetadata", setLoadedDuration);
    return () => {
      video.removeEventListener("loadedmetadata", setLoadedDuration);
    };
  }, [url, initialTime, playbackRate, ccEnabled]);

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

      {isTrailer && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-900/50 text-yellow-300 p-2 rounded-lg text-sm z-20">
          Future Pre-roll Ad Slot (5s)
        </div>
      )}

      <video
        ref={videoRef}
        src={url}
        controls={false}
        autoPlay
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
// --- START: NEW AD COMPONENT ---
// Paste this code into app.jsx, right before the HomeView component

const AdBanner = () => {
  const adContainerRef = useRef(null);
  // This ref prevents the ad from loading twice in React's StrictMode
  const adLoadedRef = useRef(false);

  useEffect(() => {
    // Only run this effect once
    if (adLoadedRef.current) {
      return;
    }

    const container = adContainerRef.current;
    if (container) {
      try {
        // 1. Create the configuration script
        const configScript = document.createElement("script");
        configScript.type = "text/javascript";
        // We set the global 'atOptions' variable
        configScript.innerHTML = `
          window.atOptions = {
            'key' : '9aec1d7290de563d4016cdc8dd7dec41',
            'format' : 'iframe',
            'height' : 50,
            'width' : 320,
            'params' : {}
          };
        `;

        // 2. Create the invocation script
        const invokeScript = document.createElement("script");
        invokeScript.type = "text/javascript";
        invokeScript.src =
          "//www.highperformanceformat.com/9aec1d7290de563d4016cdc8dd7dec41/invoke.js";
        invokeScript.async = true;

        // 3. Append the scripts to our container div
        // The invoke.js script will run and place the
        // 320x50 iframe inside this div.
        container.appendChild(configScript);
        container.appendChild(invokeScript);

        // 4. Mark the ad as loaded
        adLoadedRef.current = true;
      } catch (e) {
        console.error("Ad script injection failed:", e);
      }
    }

    // We don't return a cleanup function because
    // ad scripts are difficult to remove cleanly.
  }, []); // The empty array ensures this runs only once on mount

  // This is the container that holds the ad.
  // We center the 320x50 ad within the fixed banner space.
  return (
    <div
      className="fixed bottom-0 left-0 right-0 p-2 bg-yellow-900/20 z-40 flex justify-center items-center lg:hidden"
      style={{ height: "66px" }}
    >
      <div ref={adContainerRef} style={{ width: "320px", height: "50px" }}>
        {/* The ad script will inject the 320x50 iframe here */}
      </div>
    </div>
  );
};

// --- END: NEW AD COMPONENT ---
// --- START: NEW SKELETON COMPONENT ---
// Paste this code after your AdBanner component (around line 1030)

const CardPlaceholder = () => (
  <div className="min-w-[150px] w-[150px] sm:min-w-[180px] sm:w-[180px] animate-pulse">
    <div className="relative aspect-[2/3] bg-gray-700 rounded-lg">
      {/* Skeleton for Portrait Card */}
    </div>
    <div className="mt-3 space-y-2">
      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
      <div className="flex justify-between items-center pt-1">
        <div className="h-3 bg-gray-700 rounded w-1/3"></div>
        <div className="h-4 bg-gray-700 rounded w-1/4"></div>
      </div>
    </div>
  </div>
);
// --- END: NEW SKELETON COMPONENT ---
const HomeView = ({
  content,
  continueWatching,
  watchLater,
  navigate,
  toggleWatchLater,
  isContentLoading,
}) => {
  // --- STATE FOR CAROUSEL ---
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [transitionDuration, setTransitionDuration] = useState(700); // 700ms for smooth slide

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
  ); // --- DESKTOP HERO LOGIC --- // This variable is for the *desktop* hero's CSS animation

  const heroItems = useMemo(() => {
    const items = trendingItems.length > 0 ? trendingItems : sortedContent;
    const baseItems = items.slice(0, 8);
    if (baseItems.length === 0) return [];

    let duplicatedItems = [...baseItems]; // Keep duplicating the list until it's at least 16 items long
    while (duplicatedItems.length < 16 && baseItems.length > 0) {
      duplicatedItems = [...duplicatedItems, ...baseItems];
    }
    return duplicatedItems;
  }, [trendingItems, sortedContent]); // --- STATE FOR NEW CARD STACK ---

  const [currentCardIndex, setCurrentCardIndex] = useState(0); // --- MOBILE HERO LOGIC (NEW TIMERS) --- // 1. Get the base 8 items (Same as before)

  const baseHeroItems = useMemo(() => {
    const items = trendingItems.length > 0 ? trendingItems : sortedContent;
    const baseItems = items.slice(0, 8);
    if (baseItems.length === 0) return [];

    let duplicatedItems = [...baseItems];
    while (duplicatedItems.length < 8 && baseItems.length > 0) {
      duplicatedItems = [...duplicatedItems, ...baseItems];
    }
    return duplicatedItems.slice(0, 8); // Ensure we only have 8 base items
  }, [trendingItems, sortedContent]); // 2. State for the 15-MINUTE group change
  const [currentCardGroupIndex, setCurrentCardGroupIndex] = useState(0); // 3. NEW State for the 1-MINUTE internal rotation (0, 1, or 2)
  const [internalRotationIndex, setInternalRotationIndex] = useState(0); // 4. State for fade animation
  const [isFading, setIsFading] = useState(false); // 5. Calculate total number of groups (e.g., 8 items / 3 per group = 3 groups)
  const totalGroups = Math.ceil(baseHeroItems.length / 3); // 6. Get the 3 items for the CURRENT group, AND apply the internal rotation

  const heroItemsForStack = useMemo(() => {
    if (baseHeroItems.length === 0) return [];

    let baseStack = [];
    if (baseHeroItems.length === 1) {
      baseStack = [baseHeroItems[0], baseHeroItems[0], baseHeroItems[0]];
    } else if (baseHeroItems.length === 2) {
      baseStack = [baseHeroItems[1], baseHeroItems[0], baseHeroItems[1]];
    } else {
      const baseIndex = currentCardGroupIndex * 3;
      const centerItem = baseHeroItems[(baseIndex + 0) % baseHeroItems.length];
      const leftItem = baseHeroItems[(baseIndex + 1) % baseHeroItems.length];
      const rightItem = baseHeroItems[(baseIndex + 2) % baseHeroItems.length];
      baseStack = [leftItem, centerItem, rightItem]; // [Display Left, Display Center, Display Right]
    }

    // Now, apply the internal rotation based on the 1-minute timer
    if (internalRotationIndex === 0) {
      return baseStack; // [Left, Center, Right]
    } else if (internalRotationIndex === 1) {
      return [baseStack[2], baseStack[0], baseStack[1]]; // [Right, Left, Center]
    } else {
      // internalRotationIndex === 2
      return [baseStack[1], baseStack[2], baseStack[0]]; // [Center, Right, Left]
    }
  }, [currentCardGroupIndex, baseHeroItems, internalRotationIndex]); // <-- Added internalRotationIndex dependency // 7. The 1-MINUTE (Internal Shift) Timer
  console.log("HERO ITEMS FOR STACK:", heroItemsForStack);
  useEffect(() => {
    if (baseHeroItems.length <= 1) return; // Don't run timer if not enough items

    const internalInterval = setInterval(() => {
      // This just cycles the internalRotationIndex (0, 1, 2, 0, 1, 2...)
      setInternalRotationIndex((prevIndex) => (prevIndex + 1) % 3);
    }, 60 * 1000); // 1 minute (WAS 20 * 1000)

    return () => clearInterval(internalInterval);
  }, [baseHeroItems.length]); // 8. The 15-MINUTE (New Group) Timer
  useEffect(() => {
    if (totalGroups <= 1) return; // Don't run timer if there's only 1 group

    const groupInterval = setInterval(() => {
      // 1. Start fading out
      setIsFading(true);
      // 2. Wait for fade-out to finish (500ms)
      setTimeout(() => {
        // 3. Change the content (go to next group of 3)
        setCurrentCardGroupIndex((prevIndex) => (prevIndex + 1) % totalGroups);
        // 4. RESET the 1-minute timer's position for the new group
        setInternalRotationIndex(0);
        // 5. Start fading back in
        setIsFading(false);
      }, 500); // This 500ms MUST match the duration in the JSX
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(groupInterval);
  }, [totalGroups]); // --- END 15-MINUTE LOGIC ---
  const topRatedItems = useMemo(
    () =>
      sortedContent
        .filter((item) => item.isTopRated)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 10),
    [sortedContent]
  );
  const recentlyAddedItems = sortedContent.slice(0, 10);
  const moviesItems = useMemo(
    () => sortedContent.filter((item) => item.type === "Movie").slice(0, 10),
    [sortedContent]
  );
  const seriesItems = useMemo(
    () =>
      sortedContent.filter((item) => item.type === "TV Series").slice(0, 10),
    [sortedContent]
  );
  const animeItems = useMemo(
    () =>
      sortedContent.filter((item) => item.genre.includes("Anime")).slice(0, 10),
    [sortedContent]
  );

  return (
    <div className="min-h-screen pt-32 lg:pt-24 relative">
      <div
        className="relative w-full h-auto lg:h-[500px] bg-cover bg-center -mt-16"
        style={{
          backgroundImage:
            "url(https://images.pexels.com/photos/109669/pexels-photo-109669.jpeg)",
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>

        {/* --- NEW MOBILE HERO STACK (FINAL) --- */}
        <div className="relative z-10 container mx-auto pt-8 lg:hidden">
          {/* Container for the stacked cards */}
          <div
            className={`relative w-full h-80 flex items-end justify-center overflow-hidden transition-opacity duration-500 ease-in-out ${
              // <-- ALIGN TO BOTTOM
              isFading ? "opacity-0" : "opacity-100"
            }`}
          >
            {heroItemsForStack.length > 0 ? (
              heroItemsForStack.map((item, index) => {
                let itemClass = "";
                let cornerClass = "rounded-xl";
                let glowClass = "";
                let heightClass = "";

                if (index === 0) {
                  // Left Card
                  itemClass = "z-10 -mr-28";
                  heightClass = "h-5/6";
                  glowClass =
                    "border border-pink-500/50 shadow-md shadow-pink-500/20"; // <-- NARROWER glow
                } else if (index === 1) {
                  // Center Card
                  itemClass = "z-20";
                  heightClass = "h-full";
                  cornerClass = "rounded-2xl";
                  glowClass =
                    "border border-amber-500/50 shadow-md shadow-amber-500/20"; // <-- NARROWER glow
                } else {
                  // Right Card
                  itemClass = "z-10 -ml-28";
                  heightClass = "h-5/6";
                  glowClass =
                    "border border-blue-500/50 shadow-md shadow-blue-500/20"; // <-- NARROWER glow
                }

                return (
                  <div
                    key={`${item.id}-${index}-${currentCardIndex}`}
                    className={`w-1/2 aspect-[2/3] transition-all duration-700 ease-in-out ${itemClass} ${heightClass}`}
                    onClick={() => navigate("detail", item.id)} // Click on whole card
                  >
                    <div className="relative w-full h-full">
                      <img
                        src={
                          item.thumbnail ||
                          `https://placehold.co/400x600/1f2937/fff?text=${encodeURIComponent(
                            item.title
                          )}`
                        }
                        alt={item.title}
                        className={`w-full h-full object-cover ${cornerClass} ${glowClass}`} // <-- Added glow
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://placehold.co/400x600/1f2937/fff?text=${encodeURIComponent(
                            item.title
                          )}`;
                        }}
                      />
                      {/* --- PLAY BUTTON REMOVED --- */}
                    </div>
                  </div>
                );
              })
            ) : (
              // Loading/Fallback state
              <div className="flex items-center justify-center w-1/2 h-5/6 aspect-[2/3] bg-gray-700 rounded-xl">
                <p className="text-gray-400">Loading...</p>
              </div>
            )}
          </div>
        </div>
        {/* --- END NEW MOBILE HERO STACK (FINAL) --- */}

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
          {/* --- DESKTOP HERO (FIXED) --- */}
          <div className="hidden lg:block flex-1 relative h-full">
            <div
              className="absolute -right-32 top-1/2 -translate-y-1/2 w-[740px] h-[380px] overflow-hidden"
              style={{
                maskImage:
                  "linear-gradient(to right, transparent, black 20%, black 80%, transparent 100%)",
              }}
            >
              <div className="absolute left-0 top-0 flex animate-scroll h-full py-4 items-center">
                {/* THIS NOW USES "heroItems" AS INTENDED */}
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
                            `https://placehold.co/200x300/1f2937/fff?text=${encodeURIComponent(
                              item.title
                            )}`
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
          {/* --- END DESKTOP HERO --- */}
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
          {/* --- "Trending Now" is now first --- */}
          <Section
            title="Trending Now"
            items={trendingItems}
            onCardClick={navigate}
            onWatchLaterToggle={toggleWatchLater}
            watchLaterIds={watchLaterIds}
            viewAllPath="allcontent"
            isLoading={isContentLoading}
         />
          {/* --- "Recently Added" is second --- */}
          <Section
            title="Recently Added"
            items={recentlyAddedItems}
            onCardClick={navigate}
            onWatchLaterToggle={toggleWatchLater}
            watchLaterIds={watchLaterIds}
            viewAllPath="allcontent"
            isLoading={isContentLoading}
          />
          {/* --- ALL OTHER SECTIONS STAY HERE --- */}
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
        {/* This is the correct footer with the padding to stay above the ad */}
        <footer className="container mx-auto relative z-20 w-full text-center pt-2 mt-2 border-t border-gray-700/30 text-xs text-gray-400 pb-24">
          &copy; {new Date().getFullYear()} KigaliStreams. All Rights Reserved.
        </footer>
      </div>
    </div>
  );
};

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

  const initialVideo = useMemo(() => {
    // On load, no video is selected.
    return {
      link: null,
      title: "No Video Selected",
      isTrailer: false,
      subtitleUrl: null,
    };
  }, [item]); // Keep 'item' dependency

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

  // === Logic for Seasons and Episodes ===
  const seasons = useMemo(() => {
    if (item?.type !== "TV Series" || !item?.episodes) return [];
    const seasonSet = new Set(
      item.episodes.map((ep) => Number(ep.seasonNumber) || 1)
    );
    return Array.from(seasonSet).sort((a, b) => a - b);
  }, [item?.type, item?.episodes]);

  // Get the season of the episode we were last watching, or default
  const initialSeason = useMemo(() => {
    const ep = item?.episodes?.find((e) => e.episodeNumber === currentEpisode);
    return ep?.seasonNumber || (seasons.length > 0 ? seasons[0] : 1);
  }, [currentEpisode, item?.episodes, seasons]);

  const [selectedSeason, setSelectedSeason] = useState(initialSeason);

  // Filter episodes for the selected season
  const episodesForSelectedSeason = useMemo(() => {
    if (!item?.episodes) return [];
    return item.episodes
      .filter((ep) => Number(ep.seasonNumber) === selectedSeason)
      .sort(
        (a, b) =>
          (Number(a.episodeNumber) || 0) - (Number(b.episodeNumber) || 0)
      );
  }, [item?.episodes, selectedSeason]);

  // Update selectedSeason if currentEpisode changes (e.g., from 'Continue Watching')
  useEffect(() => {
    const ep = item?.episodes?.find(
      (e) => Number(e.episodeNumber) === currentEpisode
    );
    if (ep && Number(ep.seasonNumber) !== selectedSeason) {
      setSelectedSeason(Number(ep.seasonNumber));
    }
  }, [currentEpisode, item?.episodes, selectedSeason]);
  // === END: Logic ===

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
        setCurrentEpisode(epNumber); // Update the current episode state
      } else {
        setMessage("Error: Episode link not found.");
      }
    } else if (item.movieLink) {
      externalLink = item.movieLink;
    } else {
      setMessage("Error: Main movie link not found.");
    }

    // --- START OF THE FIX ---
    if (
      externalLink && // <-- FIX 1: Checks if the link exists (prevents crash)
      (externalLink.startsWith("http://") ||
        externalLink.startsWith("https://"))
    ) {
      // This opens the ad in a new tab
      window.open(
        "https://otieu.com/4/10173729",
        "_blank",
        "noopener,noreferrer"
      );

      // FIX 2: This changes your *current tab* to the movie link.
      // This avoids the pop-up blocker.
      window.location.href = externalLink;
    } else {
      // This message will show if the link is missing or not a valid URL
      setMessage("Error: The provided link is not valid or was not found.");
    }
    // --- END OF THE FIX ---
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

  // This is the CORRECT code:
  const handleProgressUpdate = (time, duration) => {
    if (time > 0 && duration > 0 && time / duration < 0.95) {
      setCurrentPlaybackTime(time);
      saveUserProgress(contentId, currentEpisode, time);
    }
  }; // <-- ADD THIS LINE (closing brace and semicolon)

  return (
    <div className="min-h-screen pt-16">
      <main className="container mx-auto py-8 px-4 sm:px-6">
        <button
          onClick={() => navigate("home")}
          className={`mb-6 flex items-center bg-amber-600 hover:text-emerald-400 transition`}
        >
          <ArrowLeft size={20} className="mr-1" /> Back to Home
        </button>
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
                getYouTubeThumbnailUrl(item.trailerLink) || // 1. Try to get YT thumb
                item.thumbnail || // 2. Fallback to poster
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
              {/* --- START: YOUTUBE-STYLE BUTTON --- */}
              <div className="w-20 h-14 bg-red-600/90 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300 hover:bg-red-700 hover:scale-110 group">
                  <Play
                    size={40}
                    className="text-white transition-transform group-hover:scale-105"
                    fill="currentColor"
                  />
                </div>
                {/* --- END: YOUTUBE-STYLE BUTTON --- */}
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

            {/* === Conditional UI for Movie vs TV Series === */}
            {item.type === "Movie" ? (
              // 1. MOVIE BUTTONS
              <div className="flex flex-wrap gap-4 my-6">
                <button
                  onClick={() => playMovie(currentEpisode)} // currentEpisode is 1 for movies
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
                {/* === Download Button === */}
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
                {/* === END: Download Button === */}
              </div>
            ) : (
              // 2. TV SERIES UI
              <div className="my-6 space-y-4">
                {/* Season Selector */}
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

                {/* Episode List */}
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
            {/* === END: Conditional UI === */}

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
                        )}`; // <-- FIXED TYPO HERE
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

const ContactView = ({ navigate }) => (
  <div className="relative w-full min-h-screen pt-16 flex items-center justify-center">
    <div
      className="absolute inset-0 z-0 performant-bg"
      // (if the old div had marginTop, add it to the style prop like this)
      style={{ marginTop: "-4rem" }}
    ></div>
    <div className="relative z-10 container mx-auto py-8 px-4 sm:px-6 max-w-lg">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Contact KigaliStreams Support
        </h1>
        <p className="text-gray-400 mb-8 text-center">
          Have questions, feedback, or content requests? We'd love to hear from
          you!
        </p>
        <div className="space-y-6">
          <a
            href="mailto:kigalistream.s@gmai.com"
            className={`flex items-center justify-center bg-amber-600 hover:bg-emerald-700 text-white font-semibold py-4 rounded-xl transition shadow-lg shadow-emerald-600/30`}
          >
            <Mail size={24} className="mr-3" />
            Email Us: kigalistream.s@gmai.com
          </a>
          <a
            href="https://wa.me/250787852414"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl transition shadow-lg shadow-green-600/30"
          >
            <Phone size={24} className="mr-3" />
            Message on WhatsApp (+250787852414)
          </a>
        </div>
      </div>
    </div>
  </div>
);
// --- START: NEW REQUEST VIEW ---
// Paste this after the ContactView component (around line 1610)

// --- START: NEW REQUEST VIEW ---
// Paste this after the ContactView component (around line 1610)

const RequestView = ({ navigate, authStatus, userProfile }) => {
  const [requests, setRequests] = useState([]);
  const [newRequest, setNewRequest] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isPosting, setIsPosting] = useState(false);

  // 1. Get all existing requests from Firestore
  useEffect(() => {
    if (!db) return;
    setIsLoading(true);
    const q = query(
      getRequestsCollectionRef(db),
      orderBy("timestamp", "desc")
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRequests(items);
        setIsLoading(false);
      },
      (error) => {
        console.error("Error fetching requests:", error);
        setMessage("Error: Could not load requests.");
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [db]);

  // 2. Handle the form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newRequest.trim()) {
      setMessage("Error: Please write a request before submitting.");
      return;
    }
    if (authStatus.user.isAnonymous) {
      setMessage("Error: You must be logged in to make a request.");
      return;
    }
    if (!userProfile?.username) {
      setMessage(
        "Error: You must have a username to post. Please update your profile (feature coming soon)."
      );
      return;
    }

    setIsPosting(true);
    setMessage("");

    const requestData = {
      userId: authStatus.userId,
      username: userProfile.username,
      requestText: newRequest.trim(),
      timestamp: Date.now(),
      status: "pending", // Admin can see this
    };

    try {
      // Use a generated ID
      const newDocRef = doc(collection(db, "movie_requests"));
      await setDoc(newDocRef, requestData);
      setNewRequest("");
      setMessage("Success! Your request has been posted.");
    } catch (error) {
      console.error("Error posting request:", error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-40">
          <Hash size={32} className="animate-spin text-teal-400" />
        </div>
      );
    }

    if (requests.length === 0) {
      return (
        <p className="text-gray-400 text-center py-8">
          No requests have been made yet. Be the first!
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {requests.map((req) => (
          <div
            key={req.id}
            className="bg-gray-700/50 p-4 rounded-lg border border-gray-600"
          >
            <div className="flex justify-between items-center mb-2">
              <p className="flex items-center text-emerald-400 font-semibold text-sm">
                <User size={14} className="mr-2" />
                {req.username}
              </p>
              <p className="text-gray-500 text-xs">
                {new Date(req.timestamp).toLocaleString()}
              </p>
            </div>
            <p className="text-gray-200">{req.requestText}</p>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative w-full min-h-screen pt-32 lg:pt-24">
      <div
        className="absolute inset-0 z-0 performant-bg"
        style={{ marginTop: "-4rem" }}
      ></div>
      <div className="relative z-10 container mx-auto py-8 px-4 sm:px-6 max-w-2xl">
        <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-4 text-center">
            Movie & TV Show Requests
          </h1>
          <p className="text-gray-400 mb-6 text-center">
            See what others have requested or add your own.
          </p>

          {/* --- REQUEST LIST --- */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Community Requests
            </h2>
            {renderContent()}
          </div>

          {/* --- POSTING FORM --- */}
          <div className="border-t border-gray-700 pt-6">
            {authStatus.user && !authStatus.user.isAnonymous ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  Post a new request
                </h3>
                <div>
                  <textarea
                    value={newRequest}
                    onChange={(e) => setNewRequest(e.target.value)}
                    rows="4"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
                    placeholder="I'd love to see 'The Matrix' translated by Rocky..."
                  />
                </div>
                {message && (
                  <p
                    className={`text-sm font-semibold ${
                      message.includes("Error")
                        ? "text-red-400"
                        : "text-green-400"
                    }`}
                  >
                    {message}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isPosting}
                  className={`w-full flex items-center justify-center bg-amber-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-emerald-600/30 ${
                    isPosting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isPosting ? (
                    <Hash size={20} className="animate-spin" />
                  ) : (
                    "Submit Request"
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center p-6 bg-gray-700/50 rounded-lg">
                <p className="text-lg text-gray-300 mb-4">
                  You must be logged in to post a request.
                </p>
                <button
                  onClick={() => navigate("admin")}
                  className={`bg-amber-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition`}
                >
                  Login or Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
// --- END: NEW REQUEST VIEW ---

const LoginView = ({ navigate }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleAuthError = (error) => {
    setLoading(false);
    switch (error.code) {
      case "auth/invalid-email":
      case "auth/invalid-credential":
        setMessage("Error: Please enter a valid email address.");
        break;
      case "auth/user-not-found":
      case "auth/wrong-password":
        setMessage("Error: Invalid email or password.");
        break;
      case "auth/email-already-in-use":
        setMessage(
          "Error: An account already exists with this email. Please log in."
        );
        break;
      case "auth/weak-password":
        setMessage("Error: Password must be at least 6 characters long.");
        break;
      case "auth/operation-not-allowed":
        setMessage("Error: Email/Password sign-in is not enabled in Firebase.");
        break;
      default:
        setMessage(`Error: ${error.message} (${error.code})`);
    }
  };

  const handleLoginAttempt = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage("Error: Please enter both email and password.");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoading(false);
      navigate("home");
    } catch (error) {
      handleAuthError(error);
    }
  };

  const handleSignUpAttempt = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setMessage("Error: Please enter a username.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Error: Passwords do not match.");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userProfileData = {
        username: username.trim(),
        email: email,
        createdAt: Date.now(),
        userId: user.uid,
      };
      await setDoc(getUserProfileDocRef(db, user.uid), userProfileData);

      setLoading(false);
      setMessage("Account created successfully! You are now logged in.");
      navigate("home");
    } catch (error) {
      handleAuthError(error);
    }
  };

  return (
    <div
      className="relative w-full min-h-screen pt-16 flex items-center justify-center"
      style={{ fontFamily: "monospace" }}
    >
      <div
        className="absolute inset-0 z-0 performant-bg"
        // (if the old div had marginTop, add it to the style prop like this)
        style={{ marginTop: "-4rem" }}
      ></div>
      <div className="relative z-10 bg-gray-800 p-10 rounded-2xl shadow-neon-lg w-full max-w-md border-4 border-teal-500/70">
        <h1 className="text-3xl font-extrabold text-teal-400 mb-6 text-center tracking-wider">
          {isLoginMode ? "Member Login" : "Create Account"}
        </h1>
        {message && (
          <div
            className={`p-3 rounded-lg text-sm mb-4 font-semibold ${
              message.includes("Error")
                ? "bg-orange-900/50 text-orange-300"
                : "bg-green-900/50 text-green-300"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={isLoginMode ? handleLoginAttempt : handleSignUpAttempt}>
          {!isLoginMode && (
            <>
              <label className="block text-gray-300 mb-1 font-mono">
                Username
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full p-3 mb-4 bg-gray-700 border border-teal-500/30 rounded-lg text-white placeholder-gray-500 font-mono focus:border-orange-500 focus:ring-0"
              />
            </>
          )}

          <label className="block text-gray-300 mb-1 font-mono">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 mb-4 bg-gray-700 border border-teal-500/30 rounded-lg text-white placeholder-gray-500 font-mono focus:border-orange-500 focus:ring-0"
          />

          <label className="block text-gray-300 mb-1 font-mono">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 mb-6 bg-gray-700 border border-teal-500/30 rounded-lg text-white placeholder-gray-500 font-mono focus:border-orange-500 focus:ring-0"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {!isLoginMode && (
            <>
              <label className="block text-gray-300 mb-1 font-mono">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full p-3 mb-6 bg-gray-700 border border-teal-500/30 rounded-lg text-white placeholder-gray-500 font-mono focus:border-orange-500 focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white"
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-bold py-3 rounded-lg transition tracking-wide ${
              isLoginMode
                ? "bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-600/50"
                : "bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/50"
            } text-white ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <Hash size={20} className="mx-auto animate-spin" />
            ) : isLoginMode ? (
              "INITIATE LOGIN"
            ) : (
              "CREATE ACCOUNT"
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-400">
            {isLoginMode
              ? "Don't have an account?"
              : "Already have an account?"}
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setMessage("");
              }}
              className="ml-2 font-semibold text-teal-400 hover:text-teal-300 transition"
            >
              {isLoginMode ? "Create Account" : "Log In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const AdminToolsManager = ({
  adminPassword,
  updateAdminPassword,
  firebaseLogout,
}) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChangeSubmit = (e) => {
    e.preventDefault();
    setPasswordMessage("");
    if (oldPassword !== adminPassword) {
      setPasswordMessage("Error: Current local password incorrect.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage("Error: New password must be at least 8 characters.");
      return;
    }
    updateAdminPassword(newPassword);
    setPasswordMessage("Success: Local password updated successfully!");
    setOldPassword("");
    setNewPassword("");
    setIsChangingPassword(false);
  };

  if (isChangingPassword) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl mb-6 shadow-2xl border-2 border-orange-500">
        <h3 className="text-xl font-semibold text-orange-400 mb-4 flex items-center">
          <Key size={20} className="mr-2" /> Update Local Admin Password
        </h3>
        {passwordMessage && (
          <div
            className={`p-3 rounded-lg text-sm mb-4 font-semibold ${
              passwordMessage.includes("Error")
                ? "text-red-400 bg-red-900/30"
                : "text-green-400 bg-green-900/30"
            }`}
          >
            {passwordMessage}
          </div>
        )}
        <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1 font-mono">
              Current Password
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1 font-mono">
              New Password (Min 8 chars)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-teal-500 focus:ring-teal-500"
            />
          </div>
          <div className="flex justify-between space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsChangingPassword(false)}
              className="w-1/3 bg-gray-600 text-white hover:bg-gray-700 font-semibold py-3 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition shadow-md shadow-teal-600/40"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-xl mb-6 shadow-2xl border-2 border-orange-500/50">
      <h3 className="text-xl font-semibold text-orange-400 mb-4 flex items-center">
        <Key size={20} className="mr-2" /> General Tools
      </h3>
      <button
        onClick={() => setIsChangingPassword(true)}
        className="flex items-center text-sm bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition font-semibold shadow-md shadow-orange-600/50"
      >
        Change Local Password
      </button>
      <p className="text-xs text-gray-400 mt-2">
        Note: This is separate from your Firebase account password.
      </p>
    </div>
  );
};

const TranslatorManager = ({
  translators,
  addTranslator,
  removeTranslator,
  editTranslator,
  isLoadingTranslators,
}) => {
  const [translatorName, setTranslatorName] = useState("");
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [originalName, setOriginalName] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage("");
    if (addTranslator(translatorName.trim())) {
      setMessage(
        `Success: Translator "${translatorName.trim()}" added. (Synced to DB)`
      );
      setTranslatorName("");
    } else {
      if (translatorName.trim() === "") {
        setMessage(`Error: Translator name cannot be empty.`);
      } else {
        setMessage(
          `Error: Translator "${translatorName.trim()}" already exists or DB update failed.`
        );
      }
    }
  };

  const startEdit = (name) => {
    setOriginalName(name);
    setEditName(name);
    setIsEditing(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setMessage("");
    const success = editTranslator(originalName, editName.trim());
    if (success) {
      setMessage(
        `Success: Translator updated from "${originalName}" to "${editName.trim()}". (Synced to DB)`
      );
      setIsEditing(false);
    } else {
      setMessage(
        "Error: Update failed (name already exists or new name is invalid/DB error)."
      );
    }
  };

  if (isEditing) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl mb-6 shadow-2xl border-2 border-orange-500">
        <h3 className="text-xl font-semibold text-orange-400 mb-4 flex items-center">
          <Edit size={20} className="mr-2" /> Edit Translator: {originalName}
        </h3>
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500"
          />
          <div className="flex justify-between space-x-3">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="w-1/3 bg-gray-600 text-white hover:bg-gray-700 font-semibold py-3 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition shadow-md shadow-orange-600/40"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border-2 border-teal-500">
      <h3 className="text-xl font-semibold text-teal-400 mb-4 flex items-center">
        <BookOpen size={20} className="mr-2" /> Manage Interpreters
      </h3>
      <form onSubmit={handleSubmit} className="flex space-x-2 mb-4">
        <input
          type="text"
          value={translatorName}
          onChange={(e) => setTranslatorName(e.target.value)}
          placeholder="Add New Translator"
          className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-teal-500 focus:ring-teal-500"
        />
        <button
          type="submit"
          className="bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition shadow-md shadow-teal-600/40"
        >
          <Plus size={18} />
        </button>
      </form>
      {message && (
        <p
          className={`text-sm mb-4 font-semibold ${
            message.includes("Error")
              ? "text-red-400 bg-red-900/30"
              : "text-green-400 bg-green-900/30"
          } p-2 rounded-md`}
        >
          {message}
        </p>
      )}
      <div className="pt-4 border-t border-gray-700 space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-2">
        {isLoadingTranslators ? (
          <p className="text-gray-400 text-center p-4">
            Loading translators...
          </p>
        ) : (
          <>
            <span className="text-gray-400 text-sm block font-medium">
              Existing Translators ({translators.length}):
            </span>
            {translators.map((t) => (
              <div
                key={t}
                className="flex justify-between items-center bg-gray-700/50 p-2 rounded-lg transition hover:bg-gray-700 border-l-2 border-orange-500"
              >
                <span className="text-white text-base">{t}</span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => startEdit(t)}
                    className="text-orange-500 hover:text-orange-400 p-1 rounded-full hover:bg-gray-600 transition"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeTranslator(t)}
                    className="text-red-500 hover:text-red-400 p-1 rounded-full hover:bg-gray-600 transition"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

const ContentUploader = ({
  authStatus,
  translators,
  isLoadingTranslators,
  editingItem,
  onUploadComplete,
  ...props
}) => {
  const [formData, setFormData] = useState(() => {
    if (editingItem) {
      return { ...editingItem };
    }
    return { ...emptyContent, id: generateId() };
  });

  const [episodes, setEpisodes] = useState(() => {
    if (editingItem && editingItem.episodes) {
      return [...editingItem.episodes];
    }
    return [];
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    if (name === "genre") {
      const isChecked = checked;
      setFormData((prev) => ({
        ...prev,
        genre: isChecked
          ? [...prev.genre, value]
          : prev.genre.filter((g) => g !== value),
      }));
    } else if (type === "checkbox") {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleEpisodeChange = useCallback(
    (index, e) => {
      const { name, value } = e.target;
      const newEpisodes = [...episodes];
      newEpisodes[index] = { ...newEpisodes[index], [name]: value };
      setEpisodes(newEpisodes);
    },
    [episodes]
  );

  const addEpisode = useCallback(() => {
    setEpisodes((prev) => [
      ...prev,
      {
        seasonNumber: prev.length > 0 ? prev[prev.length - 1].seasonNumber : 1,
        episodeNumber:
          prev.length > 0 ? prev[prev.length - 1].episodeNumber + 1 : 1,
        episodeTitle: `Episode ${prev.length + 1}`,
        episodeLink: "",
        subtitleLink: "",
      },
    ]);
  }, []);

  const removeEpisode = useCallback((index) => {
    setEpisodes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // --- REPLACE THIS ENTIRE FUNCTION ---
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);

      // This object fixes the 'undefined' error
      const dataToSave = {
        ...formData,
        // Convert to numbers, default to 0 or null
        rating: parseFloat(formData.rating) || 0,
        year:
          formData.type === "Movie" ? parseInt(formData.year) || null : null,
        runtime:
          formData.type === "Movie" ? parseInt(formData.runtime) || null : null,

        // Ensure lists/objects are correct
        episodes: formData.type === "TV Series" ? episodes : [],

        // Force 'undefined' to 'false'
        isTopRated: formData.isTopRated || false,
        isTrending: formData.isTrending || false,

        // Force 'undefined' to '""' (empty string)
        movieLink: formData.type === "Movie" ? formData.movieLink || "" : "",
        downloadLink:
          formData.type === "Movie" ? formData.downloadLink || "" : "",
        trailerLink: formData.trailerLink || "",
        translator: formData.translator || "",

        // Admin/system fields
        timestamp: Date.now(),
        uploadedBy: authStatus.userId || "unknown_admin",
      };

      if (dataToSave.type === "TV Series" && dataToSave.episodes.length > 0) {
        const latestEp = dataToSave.episodes.reduce(
          (latest, ep) => {
            const epSeason = Number(ep.seasonNumber) || 0;
            const epNum = Number(ep.episodeNumber) || 0;

            if (epSeason > latest.seasonNumber) {
              return { seasonNumber: epSeason, episodeNumber: epNum };
            }
            if (
              epSeason === latest.seasonNumber &&
              epNum > latest.episodeNumber
            ) {
              return { seasonNumber: epSeason, episodeNumber: epNum };
            }
            return latest;
          },
          { seasonNumber: 0, episodeNumber: 0 }
        );
        dataToSave.latestSeason = latestEp.seasonNumber;
        dataToSave.latestEpisode = latestEp.episodeNumber;
      } else {
        dataToSave.latestSeason = null;
        dataToSave.latestEpisode = null;
      }

      // Delete fields that are only for TV Series if it's a Movie
      if (dataToSave.type === "Movie") {
        delete dataToSave.latestSeason;
        delete dataToSave.latestEpisode;
      }

      try {
        const docRef = doc(getPublicCollectionRef(db), dataToSave.id);
        await setDoc(docRef, dataToSave);
        setMessage(
          `Success! Content "${dataToSave.title}" ${
            editingItem ? "updated" : "uploaded"
          }! (Synced to DB)`
        );
        setFormData({ ...emptyContent, id: generateId() });
        setEpisodes([]);
        if (onUploadComplete) onUploadComplete();
      } catch (error) {
        console.error("Error uploading document:", error);
        setMessage(`Upload failed: ${error.message}`);
      } finally {
        setLoading(false);
      }
    },
    [formData, episodes, authStatus.userId, editingItem, onUploadComplete]
  );
  // --- END OF FUNCTION TO REPLACE ---

  return (
    <form
      id="content-uploader-form"
      onSubmit={handleSubmit}
      className={`bg-gray-800 p-8 rounded-xl shadow-2xl space-y-8 border-2 ${
        editingItem ? "border-orange-500" : "border-emerald-500"
      }`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3
          className={`text-2xl font-bold flex items-center ${
            editingItem ? "text-orange-400" : "text-emerald-400"
          }`}
        >
          {editingItem ? (
            <Edit size={24} className="mr-2" />
          ) : (
            <List size={24} className="mr-2" />
          )}
          {editingItem
            ? `Editing: ${editingItem.title}`
            : "New Content Details"}
        </h3>
        {editingItem && (
          <button
            type="button"
            onClick={onUploadComplete}
            className="flex items-center text-sm bg-gray-600 hover:bg-gray-700 text-white py-2 px-3 rounded-lg transition font-semibold"
          >
            <X size={16} className="mr-1" /> Cancel Edit
          </button>
        )}
      </div>
      {message && (
        <div
          className={`p-3 rounded-lg text-sm font-semibold ${
            message.includes("failed")
              ? "bg-red-900 text-red-300"
              : "bg-green-900 text-green-300"
          }`}
        >
          {message}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-300 mb-2 font-semibold">
            Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            disabled={!!editingItem}
            className={`w-full p-3 border rounded-lg text-white placeholder-gray-400 focus:ring-emerald-500 ${
              !!editingItem
                ? "bg-gray-600 opacity-70 border-gray-500"
                : "bg-gray-700 border-gray-600 focus:border-emerald-500"
            }`}
            placeholder="The Last Starfighter"
          />
        </div>
        <div>
          <label className="block text-gray-300 mb-2 font-semibold">
            Content Type
          </label>
          <div
            className={`flex space-x-6 mt-3 ${
              !!editingItem ? "opacity-70" : ""
            }`}
          >
            <label className="text-white flex items-center">
              <input
                type="radio"
                name="type"
                value="Movie"
                checked={formData.type === "Movie"}
                onChange={handleChange}
                disabled={!!editingItem}
                className={`mr-2 text-emerald-600 bg-gray-700 border-gray-600 focus:ring-emerald-500`}
              />
              Movie
            </label>
            <label className="text-white flex items-center">
              <input
                type="radio"
                name="type"
                value="TV Series"
                checked={formData.type === "TV Series"}
                onChange={handleChange}
                disabled={!!editingItem}
                className={`mr-2 text-emerald-600 bg-gray-700 border-gray-600 focus:ring-emerald-500`}
              />
              TV Series
            </label>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-gray-300 mb-2 font-semibold">
          Thumbnail URL (Poster)
        </label>
        <input
          type="url"
          name="thumbnail"
          value={formData.thumbnail}
          onChange={handleChange}
          required
          className={`w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500`}
          placeholder="https://example.com/image.jpg"
        />
      </div>
      {/* --- START: NEW CODE TO PASTE --- */}
      <div>
        <label className="block text-gray-300 mb-2 font-semibold">
          Backdrop URL (16:9 - for Hero Slider)
        </label>
        <input
          type="url"
          name="backdropImage"
          value={formData.backdropImage}
          onChange={handleChange}
          className={`w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500`}
          placeholder="https://example.com/widescreen_image.jpg"
        />
        <p className="text-xs text-gray-400 mt-1">
          Optional: A high-quality widescreen (16:9) image for the mobile hero
          slider.
        </p>
      </div>
      {/* --- END: NEW CODE TO PASTE --- */}
      <div>
        <label className="block text-gray-300 mb-2 font-semibold">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="4"
          className={`w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500`}
          placeholder="A brief summary of the plot and themes."
        ></textarea>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-300 mb-2 font-semibold">
            Genres
          </label>
          <div className="flex flex-wrap gap-2 p-3 bg-gray-700 rounded-lg max-h-40 overflow-y-auto custom-scrollbar">
            {Genres.map((genre) => (
              <label
                key={genre}
                className="text-sm text-white flex items-center bg-gray-600/50 hover:bg-gray-600 py-1 px-3 rounded-full cursor-pointer transition"
              >
                <input
                  type="checkbox"
                  name="genre"
                  value={genre}
                  checked={formData.genre.includes(genre)}
                  onChange={handleChange}
                  className={`mr-2 text-emerald-600 bg-gray-800 border-gray-600 rounded focus:ring-emerald-500`}
                />
                {genre}
              </label>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-gray-300 mb-2 font-semibold">
            Assign Translator
          </label>
          <select
            name="translator"
            value={formData.translator}
            onChange={handleChange}
            disabled={isLoadingTranslators}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-teal-500 focus:ring-teal-500 disabled:opacity-50"
          >
            <option value="">
              {isLoadingTranslators
                ? "Loading translators..."
                : "-- None Selected --"}
            </option>
            {!isLoadingTranslators &&
              translators.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
          </select>
          <p className="text-xs text-gray-400 mt-2">
            Manage translators in the **Translator** tab.
          </p>
        </div>
      </div>
      // ... inside ContentUploader ...
      {/* --- REPLACE THIS ENTIRE BLOCK --- */}
      <div className="bg-gray-700 p-4 rounded-lg space-y-4 shadow-inner">
        <h3 className="text-lg font-semibold text-orange-400">
          Streaming Links
        </h3>
        {formData.type === "Movie" && (
          <>
            {/* Year and Runtime */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-300 mb-1 flex items-center">
                  Year
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  className={`w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-emerald-500 focus:ring-emerald-500`}
                  placeholder="2025"
                />
              </div>
              <div>
                <label className="block text-gray-300 mb-1 flex items-center">
                  Runtime (in Min)
                </label>
                <input
                  type="number"
                  name="runtime"
                  value={formData.runtime}
                  onChange={handleChange}
                  className={`w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-emerald-500 focus:ring-emerald-500`}
                  placeholder="114"
                />
              </div>
            </div>

            {/* External Watch Link (RESTORED) */}
            <div>
              <label className="block text-gray-300 mb-1 flex items-center">
                <Film size={16} className={`mr-2 text-emerald-400`} /> External
                Watch Link (Website URL)
              </label>
              <input
                type="url"
                name="movieLink"
                value={formData.movieLink}
                onChange={handleChange}
                required={!editingItem}
                className={`w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-emerald-500 focus:ring-emerald-500`}
                placeholder="https://externalsite.com/watch/movie-title"
              />
            </div>

            {/* Movie Download Link (RESTORED) */}
            <div>
              <label className="block text-gray-300 mb-1 flex items-center">
                <Download size={16} className={`mr-2 text-emerald-400`} /> Movie
                Download Link (Optional)
              </label>
              <input
                type="url"
                name="downloadLink"
                value={formData.downloadLink}
                onChange={handleChange}
                className={`w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-emerald-500 focus:ring-emerald-500`}
                placeholder="https://externalsite.com/download/movie.mp4"
              />
            </div>
          </>
        )}

        {/* YouTube Trailer Link */}
        <div>
          <label className="block text-gray-300 mb-1 flex items-center">
            <Video size={16} className={`mr-2 text-emerald-400`} /> YouTube
            Trailer Link (Optional)
          </label>
          <input
            type="url"
            name="trailerLink"
            value={formData.trailerLink}
            onChange={handleChange}
            className={`w-full p-3 bg-gray-600 border border-gray-500 rounded-lg text-white focus:border-emerald-500 focus:ring-emerald-500`}
            placeholder="https://www.youtube.com/watch?v=..."
          />
        </div>
      </div>
      {/* --- END OF BLOCK TO REPLACE --- */}
      {formData.type === "TV Series" && (
        <div
          className={`bg-gray-700 p-4 rounded-lg space-y-4 shadow-inner border border-emerald-500/50`}
        >
          <h3
            className={`lg:text-lg font-semibold text-emerald-400 flex items-center justify-between`}
          >
            <Tv size={18} className="mr-2" />
            Episodes Management
            <button
              type="button"
              onClick={addEpisode}
              className={`flex items-center text-sm bg-amber-600 hover:bg-emerald-700 text-white py-2 px-3 rounded-lg transition shadow-md`}
            >
              <PlusCircle size={16} className="mr-1" /> Add Episode
            </button>
          </h3>
          <div className="space-y-4 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
            {episodes.map((ep, index) => (
              <div
                key={index}
                className="p-4 border border-gray-600 rounded-lg bg-gray-800 relative shadow-md"
              >
                <button
                  type="button"
                  onClick={() => removeEpisode(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-400 transition"
                  title="Remove Episode"
                >
                  <X size={16} />
                </button>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="block text-xs text-gray-400">
                      Season
                    </label>
                    <input
                      type="number"
                      name="seasonNumber"
                      value={ep.seasonNumber}
                      onChange={(e) => handleEpisodeChange(index, e)}
                      required
                      className="w-full p-2 text-sm bg-gray-700 border-gray-600 rounded-md text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400">
                      Episode #
                    </label>
                    <input
                      type="number"
                      name="episodeNumber"
                      value={ep.episodeNumber}
                      onChange={(e) => handleEpisodeChange(index, e)}
                      required
                      className="w-full p-2 text-sm bg-gray-700 border-gray-600 rounded-md text-white"
                    />
                  </div>
                </div>
                <label className="block text-xs text-gray-400">
                  Episode Title
                </label>
                <input
                  type="text"
                  name="episodeTitle"
                  value={ep.episodeTitle}
                  onChange={(e) => handleEpisodeChange(index, e)}
                  required
                  className="w-full p-2 text-sm bg-gray-700 border-gray-600 rounded-md text-white mb-2"
                />
                <label className="block text-xs text-gray-400">
                  External Episode Link (Website URL)
                </label>
                <input
                  type="url"
                  name="episodeLink"
                  value={ep.episodeLink}
                  onChange={(e) => handleEpisodeChange(index, e)}
                  required
                  className="w-full p-2 text-sm bg-gray-700 border-gray-600 rounded-md text-white mb-2"
                  placeholder="https://externalsite.com/watch/series/s1/ep1"
                />
                <label className="block text-xs text-gray-400">
                  Subtitle Link (VTT/SRT)
                </label>
                <input
                  type="url"
                  name="subtitleLink"
                  value={ep.subtitleLink}
                  onChange={(e) => handleEpisodeChange(index, e)}
                  className="w-full p-2 text-sm bg-gray-700 border-gray-600 rounded-md text-white"
                  placeholder="https://streaming.com/subtitles.vtt"
                />
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-700 items-center">
        <label className="text-white flex items-center">
          <input
            type="checkbox"
            name="isTrending"
            checked={formData.isTrending}
            onChange={handleChange}
            className={`mr-2 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500`}
          />
          Trending Now
        </label>
        <label className="text-white flex items-center">
          <input
            type="checkbox"
            name="isTopRated"
            checked={formData.isTopRated}
            onChange={handleChange}
            className={`mr-2 text-emerald-600 bg-gray-700 border-gray-600 rounded focus:ring-emerald-500`}
          />
          Top Rated
        </label>
        <div className="ml-auto">
          <label className="text-gray-300 mr-2">Rating (0-10)</label>
          <input
            type="number"
            name="rating"
            value={formData.rating}
            onChange={handleChange}
            min="0"
            max="10"
            step="0.1"
            className="p-1 bg-gray-700 border border-gray-600 rounded-md text-white w-20 text-center"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className={`w-full flex items-center justify-center font-semibold py-3 rounded-lg transition ${
          loading
            ? "bg-gray-600 cursor-not-allowed"
            : editingItem
            ? "bg-orange-600 hover:bg-orange-700 shadow-xl shadow-orange-600/50"
            : "bg-amber-600 hover:bg-emerald-700 shadow-xl shadow-emerald-600/50"
        }`}
      >
        {loading ? (
          <>
            <Hash size={20} className="mr-2 animate-spin" /> Publishing...
          </>
        ) : editingItem ? (
          "Publish Update"
        ) : (
          "Publish Content"
        )}
      </button>
    </form>
  );
};

const AdminView = ({
  authStatus,
  adminPassword,
  updateAdminPassword,
  translators,
  isLoadingTranslators,
  addTranslator,
  removeTranslator,
  editTranslator,
  setContent,
  firebaseLogout,
  activeTab,
  setActiveTab,
  content,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [message, setMessage] = useState("");

  const [editSearchQuery, setEditSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const handleSearchContent = (e) => {
    e.preventDefault();
    if (!editSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const queryLower = editSearchQuery.toLowerCase();
    const results = content
      .filter((item) => item.title.toLowerCase().includes(queryLower))
      .slice(0, 10);
    setSearchResults(results);
  };

  const loadItemForEdit = (item) => {
    setEditingItem(item);
    setSearchResults([]);
    setEditSearchQuery("");
    setMessage("");
    document
      .getElementById("content-uploader-form")
      .scrollIntoView({ behavior: "smooth" });
  };

  const clearEditing = () => {
    setEditingItem(null);
    setMessage("");
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      await deleteDoc(doc(getPublicCollectionRef(db), itemToDelete.id));
      setMessage(`Success: "${itemToDelete.title}" has been deleted.`);
      setItemToDelete(null);
      setSearchResults((prev) => prev.filter((i) => i.id !== itemToDelete.id));
    } catch (e) {
      console.error("Error deleting document:", e);
      setMessage(`Error: Failed to delete. ${e.message}`);
      setItemToDelete(null);
    }
  };

  return (
    <div
      className="min-h-screen pt-16 bg-gray-900"
      style={{ fontFamily: "monospace" }}
    >
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
        .shadow-neon-lg { box-shadow: 0 0 10px rgba(0, 255, 255, 0.5), 0 0 20px rgba(0, 255, 255, 0.3); }
      `}</style>
      <main className="container mx-auto py-8 px-4 sm:px-6">
        <div className="flex justify-between items-center mb-6 p-4 bg-gray-800 rounded-lg border border-teal-500/50">
          <h1
            className={`text-3xl font-extrabold bg-amber-600 flex items-center`}
          >
            <Upload size={28} className="mr-3 text-teal-400" /> ADMIN DASHBOARD
          </h1>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <p className="text-sm text-gray-400 hidden sm:block">
              User:{" "}
              <span className="text-white font-semibold">
                {authStatus.user?.email || authStatus.userId}
              </span>
            </p>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="text-xs sm:text-sm bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg transition font-semibold shadow-md shadow-red-600/50"
            >
              <X size={16} className="inline mr-1" /> Logout
            </button>
          </div>
        </div>
        <div className="flex space-x-2 mb-6 bg-gray-800 p-2 rounded-lg shadow-inner border border-teal-500/30">
          <button
            onClick={() => setActiveTab("upload")}
            className={`flex items-center py-3 px-5 text-lg font-bold transition-colors rounded-lg shadow-md ${
              activeTab === "upload"
                ? "bg-teal-600 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            <Plus size={18} className="mr-2" /> CONTENT UPLOAD
          </button>
          <button
            onClick={() => setActiveTab("translators")}
            className={`flex items-center py-3 px-5 text-lg font-bold transition-colors rounded-lg shadow-md ${
              activeTab === "translators"
                ? "bg-teal-600 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            <BookOpen size={18} className="mr-2" /> TRANSLATOR MANAGER
          </button>
        </div>
        {activeTab === "upload" ? (
          <>
            <div className="bg-gray-800 p-6 rounded-xl mb-6 shadow-2xl border-2 border-orange-500">
              <h3 className="text-xl font-semibold text-orange-400 mb-4 flex items-center">
                <Edit size={20} className="mr-2" /> Edit/Delete Existing Content
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Search for any Movie or TV Series by title to edit or delete it.
              </p>
              <form
                onSubmit={handleSearchContent}
                className="flex space-x-2 mb-4"
              >
                <input
                  type="text"
                  value={editSearchQuery}
                  onChange={(e) => setEditSearchQuery(e.target.value)}
                  placeholder="Search by title (e.g., Outer Banks, Dune)"
                  className="flex-1 p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500"
                />
                <button
                  type="submit"
                  className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-6 rounded-lg transition shadow-md shadow-orange-600/40"
                >
                  <Search size={18} />
                </button>
              </form>
              {message && (
                <p
                  className={`text-sm mb-4 font-semibold ${
                    message.includes("Error")
                      ? "text-red-400 bg-red-900/30"
                      : "text-green-400 bg-green-900/30"
                  } p-2 rounded-md`}
                >
                  {message}
                </p>
              )}
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row justify-between sm:items-center bg-gray-700 p-3 rounded-lg"
                  >
                    <span className="text-white mb-2 sm:mb-0">
                      {item.title}{" "}
                      <span className="text-xs text-gray-400">
                        ({item.type})
                      </span>
                    </span>
                    <div className="flex space-x-2 flex-shrink-0">
                      <button
                        onClick={() => loadItemForEdit(item)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition shadow-md"
                      >
                        <Edit size={16} className="inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => setItemToDelete(item)}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2 px-3 rounded-lg transition shadow-md"
                      >
                        <Trash2 size={16} className="inline mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ContentUploader
              key={editingItem ? editingItem.id : "new"}
              authStatus={authStatus}
              translators={translators}
              isLoadingTranslators={isLoadingTranslators}
              editingItem={editingItem}
              onUploadComplete={clearEditing}
            />
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TranslatorManager
              translators={translators}
              addTranslator={addTranslator}
              removeTranslator={removeTranslator}
              editTranslator={editTranslator}
              isLoadingTranslators={isLoadingTranslators}
            />
            <AdminToolsManager
              adminPassword={adminPassword}
              updateAdminPassword={updateAdminPassword}
              firebaseLogout={firebaseLogout}
            />
          </div>
        )}
      </main>

      {itemToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-sm border-2 border-red-500">
            <h2 className="text-2xl font-bold text-white mb-4">
              Confirm Deletion
            </h2>
            <p className="text-gray-300 mb-8">
              Are you sure you want to permanently delete: <br />
              <strong className="text-red-400">{itemToDelete.title}</strong>?
              <br />
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setItemToDelete(null)}
                className="text-sm bg-gray-600 hover:bg-gray-700 text-white py-2 px-5 rounded-lg transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="text-sm bg-red-600 hover:bg-red-700 text-white py-2 px-5 rounded-lg transition font-semibold shadow-md shadow-red-600/50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-sm border-2 border-red-500">
            <h2 className="text-2xl font-bold text-white mb-4">
              Are you sure?
            </h2>
            <p className="text-gray-300 mb-8">
              You will be logged out and your session will be terminated.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="text-sm bg-gray-600 hover:bg-gray-700 text-white py-2 px-5 rounded-lg transition font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(false);
                  firebaseLogout();
                }}
                className="text-sm bg-red-600 hover:bg-red-700 text-white py-2 px-5 rounded-lg transition font-semibold shadow-md shadow-red-600/50"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 4. Main App & Router
// --- NEW HEADER COMPONENT (FUNCTION DECLARATION) ---
// This MUST be defined *before* the App component uses it.
function Header({
  view,
  theme,
  toggleTheme,
  navigate,
  authStatus,
  userProfile,
  firebaseLogout,
  searchQuery,
  setSearchQuery,
  setSelectedGenre,
  selectedGenre,
}) {
  // --- ALL HEADER STATE AND SCROLL LOGIC MOVED HERE ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate("search");
    } else {
      navigate("home");
    }
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 shadow-lg transition-colors duration-300 ${
          view === "home" && !isScrolled
            ? "bg-transparent"
            : theme === "dark"
            ? "bg-gray-800"
            : "bg-white"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <h1
          className={`text-2xl font-black text-amber-500 cursor-pointer flex-shrink-0`}
            onClick={() => navigate("home")}
          >
            KIGALISTREAMS
          </h1>
          <form
            onSubmit={handleSearchSubmit}
            className="hidden lg:flex flex-grow max-w-xl mx-8 min-w-0"
          >
            <input
              type="text"
              placeholder="Search movies, series, or genres..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim() !== "") {
                  if (view !== "search") navigate("search");
                }
              }}
              onFocus={() => {
                if (view !== "search") navigate("search");
              }}
              className={`w-full p-2 border-l border-y rounded-l-lg focus:outline-none transition-colors ${
                theme === "dark"
                  ? "bg-white/10 border-white/20 backdrop-blur-sm text-white placeholder-gray-300"
                  : "bg-white/50 border-gray-300/50 backdrop-blur-sm text-gray-900 placeholder-gray-600"
              }`}
            />
            <button
              type="submit"
              className={`bg-amber-600 hover:bg-emerald-700 text-white p-2 rounded-r-lg transition`}
            >
              <Search size={20} />
            </button>
          </form>
          <nav className="flex items-center space-x-4 flex-shrink-0">
            <button
              onClick={() => navigate("watchlater")}
              className={`hidden md:block p-2 rounded-lg transition-colors ${
                view === "home" && !isScrolled
                  ? "text-white hover:bg-white/20"
                  : view === "watchlater"
                  ? `bg-amber-600`
                  : theme === "dark"
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-200"
              }`}
              title="Watch Later"
            >
              <Clock size={20} className="inline mr-1" /> Watch Later
            </button>
            <button
              onClick={() => navigate("translated")}
              className={`hidden md:block p-2 rounded-lg transition-colors ${
                view === "home" && !isScrolled
                  ? "text-white hover:bg-white/20"
                  : view === "translated"
                  ? `bg-amber-600`
                  : theme === "dark"
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-200"
              }`}
              title="Translated Films"
            >
              <BookOpen size={20} className="inline mr-1" /> Translated
            </button>

            <div className="hidden lg:relative lg:block group">
              <button
                className={`flex items-center p-2 rounded-lg transition-colors ${
                  view === "home" && !isScrolled
                    ? "text-white hover:bg-white/20"
                    : theme === "dark"
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-200"
                }`}
              >
                Genres <ChevronDown size={18} className="ml-1" />
              </button>
              <div
                className={`absolute right-0 mt-3 w-48 rounded-lg shadow-xl overflow-hidden transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:block pointer-events-none group-hover:pointer-events-auto ${
                  theme === "dark" ? "bg-gray-700" : "bg-white"
                }`}
              >
                {Genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => {
                      setSelectedGenre(genre);
                      setSearchQuery("");
                      navigate("genre");
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      selectedGenre === genre
                        ? `bg-amber-600 text-white`
                        : theme === "dark"
                        ? "hover:bg-gray-600"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative z-50" ref={profileMenuRef}>
              {authStatus.isAdmin ? (
                <button
                  onClick={() => navigate("admin")}
                  className={`p-2 rounded-lg transition text-xs font-semibold border ${
                    theme === "dark"
                      ? "bg-teal-600/20 border-teal-500/50 backdrop-blur-sm text-teal-300 hover:bg-teal-600/50"
                      : "bg-teal-100 border-teal-300 backdrop-blur-sm text-teal-800 hover:bg-teal-200"
                  }`}
                  title="Admin Panel"
                >
                  ADMIN
                </button>
              ) : authStatus.user && !authStatus.user.isAnonymous ? (
                <>
                  <button
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold border-2 cursor-pointer ${
                      theme === "dark"
                        ? "bg-emerald-800 border-emerald-500 text-white"
                        : "bg-emerald-100 border-emerald-300 text-emerald-800"
                    }`}
                    title={`Logged in as ${
                      userProfile?.username || userProfile?.email
                    }`}
                  >
                    {userProfile?.username
                      ? userProfile.username.charAt(0).toUpperCase()
                      : userProfile?.email
                      ? userProfile.email.charAt(0).toUpperCase()
                      : "U"}
                  </button>

                  {isProfileMenuOpen && (
                    <div
                      className={`absolute right-0 mt-3 w-48 rounded-lg shadow-xl overflow-hidden ${
                        theme === "dark" ? "bg-gray-700" : "bg-white"
                      }`}
                    >
                      <div className="p-3 border-b border-gray-600">
                        <p className="text-sm font-semibold truncate">
                          {userProfile?.username || "User"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {userProfile?.email || "No email"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          firebaseLogout();
                          setIsProfileMenuOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          theme === "dark"
                            ? "text-red-400 hover:bg-gray-600"
                            : "text-red-600 hover:bg-gray-200"
                        }`}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => navigate("admin")}
                  className={`p-2 rounded-lg transition text-xs font-semibold border ${
                    theme === "dark"
                      ? "bg-white/10 border-white/20 backdrop-blur-sm text-white hover:bg-white/20"
                      : "bg-white/50 border-gray-300/50 backdrop-blur-sm text-gray-900 hover:bg-white/70"
                  }`}
                  title="Login / Sign Up"
                >
                  LOGIN
                </button>
              )}
            </div>

            <button
              onClick={() => navigate("contact")}
              className={`hidden sm:block p-2 rounded-lg transition-colors ${
                view === "home" && !isScrolled
                  ? "text-white hover:bg-white/20"
                  : theme === "dark"
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-200"
              }`}
            >
              Contact Us
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors border ${
                theme === "dark"
                  ? "bg-white/10 border-white/20 backdrop-blur-sm text-yellow-400 hover:bg-white/20"
                  : "bg-white/50 border-gray-300/50 backdrop-blur-sm text-gray-700 hover:bg-white/70"
              }`}
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                view === "home" && !isScrolled
                  ? "text-white hover:bg-white/20"
                  : theme === "dark"
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => setIsMenuOpen(true)}
              title="Open Menu"
            >
              <Menu size={24} />
            </button>
          </nav>
        </div>
        <form
          onSubmit={handleSearchSubmit}
          className="lg:hidden px-4 pb-2 relative"
        >
          <input
            type="text"
            placeholder="Search movies, series, or genres..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim() !== "") {
                if (view !== "search") navigate("search");
              }
            }}
            onFocus={() => {
              if (view !== "search") navigate("search");
            }}
            className={`w-full p-2 pl-8 border rounded-lg focus:outline-none transition-colors ${
              theme === "dark"
                ? "bg-white/10 border-white/20 backdrop-blur-sm text-white placeholder-gray-300"
                : "bg-white/50 border-gray-300/50 backdrop-blur-sm text-gray-900 placeholder-gray-600"
            }`}
          />
          <Search
            size={18}
            className={`absolute left-6 top-1/2 -translate-y-1/2 transform pb-1 ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          />
        </form>
      </header>

      {/* --- MOBILE MENU (copied from your app) --- */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xs z-50 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        } ${
          theme === "dark"
            ? "bg-gray-900 border-l border-gray-700"
            : "bg-white border-l border-gray-200"
        } lg:hidden`}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-8">
            <h2 className={`text-xl font-bold bg-amber-600`}>Menu</h2>
            <button
              onClick={() => setIsMenuOpen(false)}
              className={`p-2 rounded-full ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
            >
              <X size={24} />
            </button>
          </div>
          <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar">
            {[
              "home",
              "watchlater",
              "translated",
              "contact",
              ...(!authStatus.user || authStatus.user.isAnonymous
                ? ["admin"]
                : []),
              ...(authStatus.isAdmin ? ["admin"] : []),
            ].map((item) => (
              <button
                key={item}
                onClick={() => {
                  navigate(item);
                  setIsMenuOpen(false);
                }}
                className={`block w-full text-left p-3 rounded-lg text-lg font-medium transition-colors capitalize ${
                  view === item
                    ? `bg-amber-600 text-white`
                    : theme === "dark"
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-200"
                }`}
              >
                {item === "admin"
                  ? authStatus.isAdmin
                    ? "Admin Panel"
                    : "Login / Sign Up"
                  : item}
              </button>
            ))}

            <a
              href="/kigalistreams.apk"
              download
              onClick={() => setIsMenuOpen(false)}
              className={`block w-full text-left p-3 rounded-lg text-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700 flex items-center`}
            >
              <Download size={20} className="inline mr-3" /> Download APK
            </a>

            {authStatus.user && !authStatus.user.isAnonymous && (
              <button
                onClick={() => {
                  firebaseLogout();
                  setIsMenuOpen(false);
                }}
                className={`block w-full text-left p-3 rounded-lg text-lg font-medium transition-colors bg-red-600 text-white hover:bg-red-700 flex items-center`}
              >
                <X size={20} className="inline mr-3" />
                {authStatus.isAdmin ? "Admin Logout" : "Logout"}
              </button>
            )}
            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-gray-400 mb-2">Genres</h3>
              <div className="space-y-2">
                {Genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => {
                      setSelectedGenre(genre);
                      setSearchQuery("");
                      navigate("genre");
                      setIsMenuOpen(false);
                    }}
                    className={`block w-full text-left p-3 rounded-lg transition-colors text-base ${
                      selectedGenre === genre
                        ? `bg-amber-600 text-white`
                        : theme === "dark"
                        ? "hover:bg-gray-700"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        ></div>
      )}
    </>
  );
}

// 4. Main App & Router
export default function App() {
  const [adminPassword, updateAdminPassword] = useAdminPassword();

  const {
    theme,
    toggleTheme,
    content,
    isContentLoading,
    setContent,
    continueWatching,
    watchLater,
    saveUserProgress,
    toggleWatchLater,
    translators,
    isLoadingTranslators,
    addTranslator,
    removeTranslator,
    editTranslator,
    authStatus,
    userProfile,
  } = useAppState();

  const isAdmin = authStatus.isAdmin;

  const [view, setView] = useState(getInitialView());
  const [currentId, setCurrentId] = useState(getInitialId());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedTranslator, setSelectedTranslator] = useState(null);

  const [adminTab, setAdminTab] = useState(() => {
    return localStorage.getItem("kigalistreams_admin_tab") || "upload";
  });
  const setPersistentAdminTab = useCallback((tab) => {
    localStorage.setItem("kigalistreams_admin_tab", tab);
    setAdminTab(tab);
  }, []);

  const navigate = useCallback((newView, id = null) => {
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setView(newView);
        setCurrentId(id);
      });
    } else {
      setView(newView);
      setCurrentId(id);
    }
    const newHash = id ? `#${newView}/${id}` : `#${newView}`;
    window.history.pushState(null, "", newHash);
    if (newView !== "search" && newView !== "genre") setSearchQuery("");
    if (newView !== "genre") setSelectedGenre(null);
    if (newView !== "translated") setSelectedTranslator(null);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setView(getInitialView());
      setCurrentId(getInitialId());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const firebaseLogout = useCallback(() => {
    if (auth) {
      signOut(auth)
        .then(() => {
          navigate("home");
        })
        .catch(console.error);
    }
  }, [auth, navigate]);

  const filteredContent = useMemo(() => {
    let results = content;
    if (selectedGenre) {
      results = results.filter((item) => item.genre.includes(selectedGenre));
    }
    if (searchQuery) {
      const queryLower = searchQuery.toLowerCase();
      results = results.filter(
        (item) =>
          item.title.toLowerCase().includes(queryLower) ||
          item.genre.some((g) => g.toLowerCase().includes(queryLower)) ||
          item.description.toLowerCase().includes(queryLower)
      );
    }
    return results;
  }, [content, searchQuery, selectedGenre]);

  const currentViewElement = useMemo(() => {
    if (authStatus.isLoading || isContentLoading) {
      return (
        <div className="w-full h-screen flex items-center justify-center">
          <h1 className="text-5xl font-black text-amber-500 animate-pulse">
            KSTREAMS
          </h1>
        </div>
      );
    }

    if (view === "detail" && currentId) {
      return (
        <DetailView
          contentId={currentId}
          content={content}
          continueWatching={continueWatching}
          navigate={navigate}
          saveUserProgress={saveUserProgress}
          toggleWatchLater={toggleWatchLater}
          watchLater={watchLater}
        />
      );
    }
    if (view === "contact") return <ContactView navigate={navigate} />;
    if (view === "request") {
      return (
        <RequestView
          navigate={navigate}
          authStatus={authStatus}
          userProfile={userProfile}
        />
      );
    }
    if (view === "admin") {
      if (isAdmin) {
        return (
          <AdminView
            authStatus={authStatus}
            adminPassword={adminPassword}
            updateAdminPassword={updateAdminPassword}
            translators={translators}
            isLoadingTranslators={isLoadingTranslators}
            addTranslator={addTranslator}
            removeTranslator={removeTranslator}
            editTranslator={editTranslator}
            setContent={setContent}
            firebaseLogout={firebaseLogout}
            activeTab={adminTab}
            setActiveTab={setPersistentAdminTab}
            content={content}
          />
        );
      } else {
        return <LoginView navigate={navigate} />;
      }
    }
    if (view === "watchlater")
      return (
        <WatchLaterView
          content={content}
          watchLater={watchLater}
          navigate={navigate}
          toggleWatchLater={toggleWatchLater}
        />
      );
    if (view === "translated") {
      return (
        <TranslatedFilmsView
          content={content}
          navigate={navigate}
          toggleWatchLater={toggleWatchLater}
          watchLater={watchLater}
          selectedTranslator={selectedTranslator}
          setSelectedTranslator={setSelectedTranslator}
          translators={translators}
          isLoadingTranslators={isLoadingTranslators}
        />
      );
    }
    if (view === "allcontent") {
      return (
        <AllContentView
          content={content}
          watchLater={watchLater}
          navigate={navigate}
          toggleWatchLater={toggleWatchLater}
        />
      );
    }
    if (view === "search" || view === "genre") {
      const title = selectedGenre
        ? `Genre: ${selectedGenre}`
        : `Search Results for "${searchQuery}"`;
      return (
        <div className="relative w-full min-h-screen pt-32">
          <div
            className="absolute inset-0 z-0 performant-bg"
            // (if the old div had marginTop, add it to the style prop like this)
            style={{ marginTop: "-4rem" }}
          ></div>
          <div className="relative z-10 container mx-auto py-8 px-4 sm:px-6">
            <h1 className="text-3xl font-bold text-white mb-6">{title}</h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {filteredContent.map((item) => (
                <Card
                  key={item.id}
                  item={item}
                  onClick={navigate}
                  onWatchLaterToggle={toggleWatchLater}
                  isWatchLater={watchLater.includes(item.id)}
                />
              ))}
            </div>
            {filteredContent.length === 0 && (
              <p className="text-gray-400 text-center py-10">
                No results found.
              </p>
            )}
          </div>
        </div>
      );
    }
    return (
      <HomeView
        content={content}
        continueWatching={continueWatching}
        watchLater={watchLater}
        navigate={navigate}
        toggleWatchLater={toggleWatchLater}
        isContentLoading={isContentLoading}
      />
    );
  }, [
    view,
    currentId,
    content,
    continueWatching,
    watchLater,
    saveUserProgress,
    toggleWatchLater,
    authStatus,
    isContentLoading,
    adminPassword,
    updateAdminPassword,
    translators,
    isLoadingTranslators,
    addTranslator,
    removeTranslator,
    editTranslator,
    setContent,
    firebaseLogout,
    adminTab,
    setPersistentAdminTab,
    selectedTranslator,
    filteredContent,
    searchQuery,
    selectedGenre,
    navigate,
    isAdmin,
  ]);

  useEffect(() => {
    document.body.className =
      theme === "dark" ? "bg-neutral-900 font-inter" : "bg-gray-100 font-inter";
    document.body.style.color = theme === "dark" ? "#f3f4f6" : "#1f2937";

    // --- ADD THIS LOGIC ---
    if (view === "home") {
      document.body.classList.add("view-home");
    } else {
      document.body.classList.remove("view-home");
    }
    // --- END ADD ---
  }, [theme, view]); // <-- ADD 'view' TO DEPENDENCY ARRAY

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // const [isScrolled, setIsScrolled] = useState(false); // <-- DELETE THIS LINE

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const headerRef = useRef(null); // <-- ADD THIS LINE
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileMenuRef]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const handleScroll = () => {
      if (window.scrollY > 10) {
        // This is a direct DOM change, NOT a React re-render. It's instant.
        header.dataset.scrolled = "true";
      } else {
        header.dataset.scrolled = "false";
      }
    };

    // { passive: true } is a small performance boost for scroll listeners
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Run once on load

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []); // Empty dependency array is correct, it runs once

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate("search");
    } else {
      navigate("home");
    }
  };

  return (
    <div
      className={`min-h-screen ${
        theme === "dark"
          ? "bg-neutral-900 text-gray-100"
          : "bg-gray-100 text-gray-900"
      }`}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
        .font-inter { font-family: 'Inter', sans-serif; }

        /* --- ADD THIS NEW RULE --- */
        body.view-home header[data-scrolled="false"] {
          background-color: transparent;
        }
        /* --- END OF NEW RULE --- */

        /* --- HIDE THE MAIN SCROLLBAR --- */
        body {
          /* Hide scrollbar for Firefox */
          scrollbar-width: none;
          /* Hide scrollbar for IE, Edge */
          -ms-overflow-style: none;
        }
        
        body::-webkit-scrollbar {
          /* Hide scrollbar for Chrome, Safari and Opera */
          display: none;
          width: 0;
          height: 0;
        }
        /* --- END HIDE SCROLLBAR --- */
        /* --- HIDE SECTION SCROLLBARS --- */
          .custom-scrollbar {
            /* Hide scrollbar for Firefox */
            scrollbar-width: none;
            /* Hide scrollbar for IE, Edge */
            -ms-overflow-style: none;
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            /* Hide scrollbar for Chrome, Safari and Opera */
            display: none;
            width: 0;
            height: 0;
          }
          /* --- END HIDE SECTION SCROLLBARS --- */
        body { transition: background-color 0.3s, color 0.3s; }
        
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }

        /* --- ADD THIS NEW CLASS --- */
        .performant-bg {
          /* 1. This is the solid color for mobile (matches bg-neutral-900) */
          background-color: #000000;
          transform: scale(1.05);
        }

        /* 2. This applies the fancy background ONLY on large screens (desktop) */
        @media (min-width: 1024px) {
          .performant-bg {
            background-image: url(https://images.pexels.com/photos/65437/pexels-photo-65437.jpeg);
            background-size: cover;
            background-position: center;
            filter: blur(15px) brightness(20%);
          }
        }
        /* --- END OF NEW CLASS --- */
     
      `}</style>
      <header
        ref={headerRef} // <-- ADD THIS
        className={`fixed top-0 left-0 right-0 z-30 shadow-lg transition-colors duration-300 ${
          // ALL THIS LOGIC IS REMOVED and handled by CSS now
          "" // <-- REMOVED the theme-based background colors
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <h1
          className={`text-2xl font-black text-amber-500 cursor-pointer flex-shrink-0`}
            onClick={() => navigate("home")}
          >
            KIGALISTREAMS
          </h1>
          <form
            onSubmit={handleSearchSubmit}
            className="hidden lg:flex flex-grow max-w-xl mx-8 min-w-0"
          >
            <input
              type="text"
              placeholder="Search movies, series, or genres..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim() !== "") {
                  if (view !== "search") navigate("search");
                }
              }}
              onFocus={() => {
                if (view !== "search") navigate("search");
              }}
              className={`w-full p-2 border-l border-y rounded-l-lg focus:outline-none transition-colors ${
                theme === "dark"
                  ? "bg-white/10 border-white/20 backdrop-blur-sm text-white placeholder-gray-300"
                  : "bg-white/50 border-gray-300/50 backdrop-blur-sm text-gray-900 placeholder-gray-600"
              }`}
            />
            <button
              type="submit"
              className={`bg-amber-600 hover:bg-emerald-700 text-white p-2 rounded-r-lg transition`}
            >
              <Search size={20} />
            </button>
          </form>
          <nav className="flex items-center space-x-4 flex-shrink-0">
            <button
              onClick={() => navigate("watchlater")}
              className={`hidden md:block p-2 rounded-lg transition-colors ${
                view === "watchlater"
                  ? `bg-amber-600`
                  : theme === "dark"
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-200"
              }`}
              title="Watch Later"
            >
              <Clock size={20} className="inline mr-1" /> Watch Later
            </button>
            <button
              onClick={() => navigate("translated")}
              className={`hidden md:block p-2 rounded-lg transition-colors ${
                view === "translated"
                  ? `bg-amber-600`
                  : theme === "dark"
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-200"
              }`}
              title="Translated Films"
            >
              <BookOpen size={20} className="inline mr-1" /> Translated
            </button>
            {/* --- NEW REQUEST BUTTON --- */}
            <button
              onClick={() => navigate("request")}
              className={`hidden md:block p-2 rounded-lg transition-colors ${
                view === "request"
                  ? `bg-amber-600`
                  : theme === "dark"
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-200"
              }`}
              title="Request a Movie"
            >
              <PlusCircle size={20} className="inline mr-1" /> Request Movie
            </button>
            {/* --- END NEW BUTTON --- */}

            {/* === APK Download Button REMOVED from desktop view === */}

            <div className="hidden lg:relative lg:block group">
              <button
                className={`flex items-center p-2 rounded-lg transition-colors ${
                  theme === "dark"
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-200"
                }`}
              >
                Genres <ChevronDown size={18} className="ml-1" />
              </button>
              <div
                className={`absolute right-0 mt-3 w-48 rounded-lg shadow-xl overflow-hidden transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:block pointer-events-none group-hover:pointer-events-auto ${
                  theme === "dark" ? "bg-gray-700" : "bg-white"
                }`}
              >
                {Genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => {
                      setSelectedGenre(genre);
                      setSearchQuery("");
                      navigate("genre");
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      selectedGenre === genre
                        ? `bg-amber-600 text-white`
                        : theme === "dark"
                        ? "hover:bg-gray-600"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative z-50" ref={profileMenuRef}>
              {authStatus.isAdmin ? (
                // 1. User is ADMIN
                <button
                  onClick={() => navigate("admin")}
                  className={`p-2 rounded-lg transition text-xs font-semibold border ${
                    theme === "dark"
                      ? "bg-teal-600/20 border-teal-500/50 backdrop-blur-sm text-teal-300 hover:bg-teal-600/50"
                      : "bg-teal-100 border-teal-300 backdrop-blur-sm text-teal-800 hover:bg-teal-200"
                  }`}
                  title="Admin Panel"
                >
                  ADMIN
                </button>
              ) : authStatus.user && !authStatus.user.isAnonymous ? (
                // 2. User is a LOGGED-IN (non-admin)
                <>
                  <button
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold border-2 cursor-pointer ${
                      theme === "dark"
                        ? "bg-emerald-800 border-emerald-500 text-white"
                        : "bg-emerald-100 border-emerald-300 text-emerald-800"
                    }`}
                    title={`Logged in as ${
                      userProfile?.username || userProfile?.email
                    }`}
                  >
                    {userProfile?.username
                      ? userProfile.username.charAt(0).toUpperCase()
                      : userProfile?.email
                      ? userProfile.email.charAt(0).toUpperCase()
                      : "U"}
                  </button>

                  {isProfileMenuOpen && (
                    <div
                      className={`absolute right-0 mt-3 w-48 rounded-lg shadow-xl overflow-hidden ${
                        theme === "dark" ? "bg-gray-700" : "bg-white"
                      }`}
                    >
                      <div className="p-3 border-b border-gray-600">
                        <p className="text-sm font-semibold truncate">
                          {userProfile?.username || "User"}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {userProfile?.email || "No email"}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          firebaseLogout();
                          setIsProfileMenuOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          theme === "dark"
                            ? "text-red-400 hover:bg-gray-600"
                            : "text-red-600 hover:bg-gray-200"
                        }`}
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                // 3. User is ANONYMOUS or LOGGED OUT
                <button
                  onClick={() => navigate("admin")}
                  className={`p-2 rounded-lg transition text-xs font-semibold border ${
                    theme === "dark"
                      ? "bg-white/10 border-white/20 backdrop-blur-sm text-white hover:bg-white/20"
                      : "bg-white/50 border-gray-300/50 backdrop-blur-sm text-gray-900 hover:bg-white/70"
                  }`}
                  title="Login / Sign Up"
                >
                  LOGIN
                </button>
              )}
            </div>

            <button
              onClick={() => navigate("contact")}
              className={`hidden sm:block p-2 rounded-lg transition-colors ${
                theme === "dark"
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-200"
              }`}
            >
              Contact Us
            </button>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-colors border ${
                theme === "dark"
                  ? "bg-white/10 border-white/20 backdrop-blur-sm text-yellow-400 hover:bg-white/20"
                  : "bg-white/50 border-gray-300/50 backdrop-blur-sm text-gray-700 hover:bg-white/70"
              }`}
              title="Toggle Theme"
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              className={`lg:hidden p-2 rounded-lg transition-colors ${
                theme === "dark"
                  ? "hover:bg-gray-700"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => setIsMenuOpen(true)}
              title="Open Menu"
            >
              <Menu size={24} />
            </button>
          </nav>
        </div>
        <form
          onSubmit={handleSearchSubmit}
          className="lg:hidden px-4 pb-2 relative"
        >
          <input
            type="text"
            placeholder="Search movies, series, or genres..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (e.target.value.trim() !== "") {
                if (view !== "search") navigate("search");
              }
            }}
            onFocus={() => {
              if (view !== "search") navigate("search");
            }}
            className={`w-full p-2 pl-8 border rounded-lg focus:outline-none transition-colors ${
              theme === "dark"
                ? "bg-white/10 border-white/20 backdrop-blur-sm text-white placeholder-gray-300"
                : "bg-white/50 border-gray-300/50 backdrop-blur-sm text-gray-900 placeholder-gray-600"
            }`}
          />
          <Search
            size={18}
            className={`absolute left-6 top-1/2 -translate-y-1/2 transform pb-1 ${
              theme === "dark" ? "text-gray-300" : "text-gray-600"
            }`}
          />
        </form>
      </header>

      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xs z-50 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        } ${
          theme === "dark"
            ? "bg-gray-900 border-l border-gray-700"
            : "bg-white border-l border-gray-200"
        } lg:hidden`}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-8">
            <h2 className={`text-xl font-bold bg-amber-600`}>Menu</h2>
            <button
              onClick={() => setIsMenuOpen(false)}
              className={`p-2 rounded-full ${
                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"
              }`}
            >
              <X size={24} />
            </button>
          </div>
          <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar">
            {[
              "home",
              "watchlater",
              "translated",
              "contact",
              "request",
              ...(!authStatus.user || authStatus.user.isAnonymous
                ? ["admin"]
                : []),
              ...(authStatus.isAdmin ? ["admin"] : []),
            ].map((item) => (
              <button
                key={item}
                onClick={() => {
                  navigate(item);
                  setIsMenuOpen(false);
                }}
                className={`block w-full text-left p-3 rounded-lg text-lg font-medium transition-colors capitalize ${
                  view === item
                    ? `bg-amber-600 text-white`
                    : theme === "dark"
                    ? "hover:bg-gray-700"
                    : "hover:bg-gray-200"
                }`}
              >
                {item === "admin"
                  ? authStatus.isAdmin
                    ? "Admin Panel"
                    : "Login / Sign Up"
                  : item}
              </button>
            ))}

            <a
              href="/kigalistreams.apk"
              download
              onClick={() => setIsMenuOpen(false)}
              className={`block w-full text-left p-3 rounded-lg text-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700 flex items-center`}
            >
              <Download size={20} className="inline mr-3" /> Download APK
            </a>

            {authStatus.user && !authStatus.user.isAnonymous && (
              <button
                onClick={() => {
                  firebaseLogout();
                  setIsMenuOpen(false);
                }}
                className={`block w-full text-left p-3 rounded-lg text-lg font-medium transition-colors bg-red-600 text-white hover:bg-red-700 flex items-center`}
              >
                <X size={20} className="inline mr-3" />
                {authStatus.isAdmin ? "Admin Logout" : "Logout"}
              </button>
            )}
            <div className="pt-4 border-t border-gray-700">
              <h3 className="text-gray-400 mb-2">Genres</h3>
              <div className="space-y-2">
                {Genres.map((genre) => (
                  <button
                    key={genre}
                    onClick={() => {
                      setSelectedGenre(genre);
                      setSearchQuery("");
                      navigate("genre");
                      setIsMenuOpen(false);
                    }}
                    className={`block w-full text-left p-3 rounded-lg transition-colors text-base ${
                      selectedGenre === genre
                        ? `bg-amber-600 text-white`
                        : theme === "dark"
                        ? "hover:bg-gray-700"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        ></div>
      )}
      {currentViewElement}
    </div>
  );
}

try {
  const container = document.getElementById("root");
  const root = ReactDOMClient.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (e) {
  console.error("Failed to start React app:", e);
}