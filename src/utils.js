import { collection, doc } from "firebase/firestore";

const appId = "1:1074002927631:web:8c1bb091ecbe80e9a4837a";

export const DEFAULT_TRANSLATORS = [
  "Translator A",
  "Translator B",
  "Agasobanuye",
  "BY Rocky",
  "BY Junior",
];

export const generateId = () => Math.random().toString(36).substring(2, 6);

export const getYouTubeEmbedUrl = (url) => {
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
};

export const getYouTubeVideoId = (url) => {
  if (!url) return null;
  let videoId = url.match(/[?&]v=([^&]+)/);
  if (videoId) return videoId[1];

  videoId = url.match(/youtu\.be\/([^?]+)/);
  if (videoId) return videoId[1];

  videoId = url.match(/youtube\.com\/embed\/([^?]+)/);
  if (videoId) return videoId[1];

  return null;
};

export const getYouTubeThumbnailUrl = (url) => {
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  }
  return null;
};

// Firestore Paths
export const getPublicCollectionRef = (db) =>
  collection(db, "artifacts", appId, "public", "data", "content");
export const getUserDocRef = (db, userId) =>
  doc(db, "artifacts", appId, "users", userId, "config", "user_data");
export const getTranslatorsDocRef = (db) =>
  doc(db, "artifacts", appId, "config", "translators_list");
export const getUserProfileDocRef = (db, userId) => doc(db, "users", userId);
export const getRequestsCollectionRef = (db) =>
  collection(db, "artifacts", appId, "public", "data", "movie_requests");

// URL Hash Utilities
export const getInitialView = () => {
  const hash = window.location.hash.slice(1);
  // Added "rwandan" to valid views
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
    "rwandan", 
  ]);
  const viewPart = hash.split("/")[0];
  if (validViews.has(viewPart)) {
    return viewPart;
  }
  return "home";
};

export const getInitialId = () => {
  const parts = window.location.hash.slice(1).split("/");
  return parts.length > 1 ? parts[1] : null;
};

// Data Structures
export const Genres = [
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

export const emptyContent = {
  id: "",
  title: "",
  genre: [],
  type: "Movie",
  // New field for category (International [Default] or Rwandan)
  category: "International", 
  thumbnail: "",
  backdropImage: "",
  description: "",
  movieLink: "",
  trailerLink: "",
  downloadLink: "",
  rating: 0,
  year: "",
  runtime: "",
  episodes: [],
  latestSeason: null,
  latestEpisode: null,
  isTopRated: false,
  isTrending: false,
  translator: "",
  timestamp: Date.now(),
};