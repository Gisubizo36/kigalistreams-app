import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { signOut } from "firebase/auth";
import { auth } from "./firebase.js";
import { getInitialView, getInitialId, Genres } from "./utils.js";
import { useAdminPassword } from "./hooks/useAdminPassword.js";
import { useAppState } from "./hooks/useAppState.js";
import { Capacitor } from "@capacitor/core"; // Make sure this is imported!

// Import Icons
import { Download, X } from "lucide-react";

// Import Components
import Header from "./components/Header.jsx";
import Card from "./components/Card.jsx";

// Import Views
import HomeView from "./views/HomeView.jsx";
import DetailView from "./views/DetailView.jsx";
import ContactView from "./views/ContactView.jsx";
import RequestView from "./views/RequestView.jsx";
import AdminView from "./views/AdminView.jsx";
import LoginView from "./views/LoginView.jsx";
import WatchLaterView from "./views/WatchLaterView.jsx";
import TranslatedFilmsView from "./views/TranslatedFilmsView.jsx";

// --- CONFIGURATION ---
const APK_DOWNLOAD_URL = "https://github.com/gisaiconfii-boop/kigalistreams-appFILES-APK/releases/download/v1.0/KStreams.apk";

// --- COMPONENT: APK PROMO TOAST (Smart Version) ---
const ApkPromoToast = ({ onClose }) => {
  // Check if user is on a mobile screen (width < 768px)
  const isMobileScreen = window.innerWidth < 768;

  return (
    <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:w-96 z-50 bg-gray-900 border border-amber-500/50 p-4 rounded-xl shadow-2xl shadow-black/50 flex items-start space-x-4 animate-bounce-in">
      <div className="bg-amber-600/20 p-2 rounded-full shrink-0">
        <Download size={24} className="text-amber-500" />
      </div>
      <div className="flex-1">
        <h4 className="text-white font-bold text-sm">
          {isMobileScreen ? "Get the Android App!" : "Mobile App Available"}
        </h4>
        
        {isMobileScreen ? (
          // --- MOBILE VERSION (Button) ---
          <>
            <p className="text-gray-400 text-xs mt-1">
              Watch offline with better performance. Download the APK now.
            </p>
            <a 
              href={APK_DOWNLOAD_URL}
              className="mt-3 block w-full bg-amber-600 hover:bg-amber-700 text-white text-center text-xs font-bold py-2 rounded-lg transition"
            >
              DOWNLOAD APK
            </a>
          </>
        ) : (
          // --- DESKTOP VERSION (Info Only) ---
          <>
            <p className="text-gray-400 text-xs mt-1">
              Experience KigaliStreams on the go! 
            </p>
            <p className="text-emerald-400 text-xs font-bold mt-2 border-l-2 border-emerald-500 pl-2">
              Open this site on your Android phone to download the app.
            </p>
          </>
        )}
      </div>
      <button onClick={onClose} className="text-gray-500 hover:text-white">
        <X size={18} />
      </button>
    </div>
  );
};

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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // --- SMART PROMO LOGIC ---
  const [showApkPromo, setShowApkPromo] = useState(false);

  useEffect(() => {
    // 1. Check if running on Web (Not Native App)
    const isWeb = !Capacitor.isNativePlatform();
    // 2. Check if user previously closed it
    const hasClosedPromo = localStorage.getItem("kigalistreams_promo_closed");
    
    if (isWeb && !hasClosedPromo) {
      // Delay slightly so it doesn't pop up instantly
      const timer = setTimeout(() => setShowApkPromo(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  const closePromo = () => {
    setShowApkPromo(false);
    localStorage.setItem("kigalistreams_promo_closed", "true");
  };

  // --- NEW: PREVENT PWA INSTALL PROMPT ---
  useEffect(() => {
    const handler = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      console.log("PWA Install prompt suppressed");
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);
  // ---------------------------------------

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

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

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
      // --- CHANGED: SEARCH LOGIC (TITLE & INTERPRETER ONLY) ---
      results = results.filter((item) => {
        const matchesTitle = item.title.toLowerCase().includes(queryLower);
        const matchesTranslator =
          item.translator && item.translator.toLowerCase().includes(queryLower);
        return matchesTitle || matchesTranslator;
      });
      // --------------------------------------------------------
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

    // Fallback for allcontent, search, and genre
    if (view === "search" || view === "genre" || view === "allcontent") {
      const title =
        view === "allcontent"
          ? "All Content"
          : selectedGenre
          ? `Genre: ${selectedGenre}`
          : `Search Results for "${searchQuery}"`;
      return (
        <div className="relative w-full min-h-screen pt-32">
          <div
            className="absolute inset-0 z-0 performant-bg"
            style={{ marginTop: "-4rem" }}
          ></div>
          <div className="relative z-10 container mx-auto py-8 px-4 sm:px-6">
            <h1 className="text-3xl font-bold text-white mb-6">{title}</h1>

            {view === "search" ? (
              <div className="space-y-3">
                {filteredContent.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => navigate("detail", item.id)}
                    className="flex items-center bg-gray-900 border border-gray-800 p-3 rounded-lg cursor-pointer active:bg-gray-800 transition"
                  >
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      className="w-16 h-24 object-cover rounded-md flex-shrink-0 bg-gray-800"
                    />
                    <div className="ml-4 flex-1 min-w-0">
                      <h3 className="text-white font-bold text-lg truncate">
                        {item.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-400 mt-1">
                        <span className="bg-gray-800 px-2 py-0.5 rounded text-xs mr-2 border border-gray-700">
                          {item.type}
                        </span>
                        {item.year && <span>{item.year}</span>}
                      </div>
                      {item.translator && (
                        <p className="text-emerald-500 text-xs font-bold mt-1">
                          BY {item.translator}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Grid View for Genre and AllContent */
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
            )}

            {filteredContent.length === 0 && (
              <p className="text-gray-400 text-center py-10">
                No results found.
              </p>
            )}
          </div>
        </div>
      );
    }

    // Default to HomeView
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

    if (view === "home") {
      document.body.classList.add("view-home");
    } else {
      document.body.classList.remove("view-home");
    }
  }, [theme, view]);

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
        
        body.view-home header[data-scrolled="false"] {
          background-color: transparent;
        }

        body {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        body::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
        
        .custom-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          display: none;
          width: 0;
          height: 0;
        }
        
        body { transition: background-color 0.3s, color 0.3s; }
        
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }

        .performant-bg {
          background-color: #000000;
          transform: scale(1.05);
        }

        @media (min-width: 1024px) {
          .performant-bg {
            background-image: url(https://images.pexels.com/photos/65437/pexels-photo-65437.jpeg);
            background-size: cover;
            background-position: center;
            filter: blur(15px) brightness(20%);
          }
        }
      `}</style>

      <Header
        view={view}
        theme={theme}
        toggleTheme={toggleTheme}
        navigate={navigate}
        authStatus={authStatus}
        userProfile={userProfile}
        firebaseLogout={firebaseLogout}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        setSelectedGenre={setSelectedGenre}
        selectedGenre={selectedGenre}
      />

      {currentViewElement}

      {/* SHOW PROMO IF WEB USER (Mobile gets button, Desktop gets text) */}
      {showApkPromo && <ApkPromoToast onClose={closePromo} />}

    </div>
  );
}