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
    </div>
  );
}