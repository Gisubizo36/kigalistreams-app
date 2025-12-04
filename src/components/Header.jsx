import React, { useState, useEffect, useRef } from "react";
import { Genres } from "../utils.js";
import {
  Clock,
  Search,
  Menu,
  X,
  BookOpen,
  ChevronDown,
  Download,
  MessageSquare,
  Film, // Icon for Rwandan Movies
} from "lucide-react";

function Header({
  view,
  // theme props removed
  navigate,
  authStatus,
  userProfile,
  firebaseLogout,
  searchQuery,
  setSearchQuery,
  setSelectedGenre,
  selectedGenre,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  const profileMenuRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    const checkIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    setIsIOS(checkIOS);
  }, []);

  useEffect(() => {
    if (isMenuOpen) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

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
        header.dataset.scrolled = "true";
      } else {
        header.dataset.scrolled = "false";
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
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
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-30 shadow-lg transition-colors duration-300 bg-black"
      >
        <div className="container mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <h1
            className="text-2xl font-black text-amber-500 cursor-pointer flex-shrink-0"
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
              className="w-full p-2 border-l border-y rounded-l-lg focus:outline-none transition-colors bg-white/10 border-white/20 backdrop-blur-sm text-white placeholder-gray-300"
            />
            <button
              type="submit"
              className="bg-amber-600 hover:bg-emerald-700 text-white p-2 rounded-r-lg transition"
            >
              <Search size={20} />
            </button>
          </form>
          <nav className="flex items-center space-x-4 flex-shrink-0">
            {/* NEW: Rwandan Movies Tab */}
            <button
              onClick={() => navigate("rwandan")}
              className={`hidden md:block p-2 rounded-lg transition-colors ${
                view === "rwandan"
                  ? "bg-amber-600"
                  : "hover:bg-gray-700"
              }`}
              title="Rwandan Movies"
            >
              <Film size={20} className="inline mr-1" /> Rwandan Movies
            </button>

            <button
              onClick={() => navigate("watchlater")}
              className={`hidden md:block p-2 rounded-lg transition-colors ${
                view === "watchlater"
                  ? "bg-amber-600"
                  : "hover:bg-gray-700"
              }`}
              title="Watch Later"
            >
              <Clock size={20} className="inline mr-1" /> Watch Later
            </button>
            <button
              onClick={() => navigate("translated")}
              className={`hidden md:block p-2 rounded-lg transition-colors ${
                view === "translated"
                  ? "bg-amber-600"
                  : "hover:bg-gray-700"
              }`}
              title="Interpreted Films"
            >
              <BookOpen size={20} className="inline mr-1" /> Interpreted
            </button>
            <button
              onClick={() => navigate("request")}
              className={`hidden md:block p-2 rounded-lg transition-colors ${
                view === "request"
                  ? "bg-amber-600"
                  : "hover:bg-gray-700"
              }`}
              title="Comments & Ideas"
            >
              <MessageSquare size={20} className="inline mr-1" /> Comments
            </button>

            {/* GENRES DROPDOWN FIX */}
            <div className="hidden lg:relative lg:block group">
              <button
                className="flex items-center p-2 rounded-lg transition-colors hover:bg-gray-700"
              >
                Genres <ChevronDown size={18} className="ml-1" />
              </button>
              {/* Added pt-2 (padding top) to bridge the gap so mouse doesn't lose focus */}
              <div className="absolute right-0 top-full pt-2 opacity-0 group-hover:opacity-100 group-hover:block pointer-events-none group-hover:pointer-events-auto transition-opacity duration-200">
                <div className="w-48 rounded-lg shadow-xl overflow-hidden bg-gray-700">
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
                          ? "bg-amber-600 text-white"
                          : "hover:bg-gray-600"
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative z-50" ref={profileMenuRef}>
              {authStatus.isAdmin ? (
                <button
                  onClick={() => navigate("admin")}
                  className="p-2 rounded-lg transition text-xs font-semibold border bg-teal-600/20 border-teal-500/50 backdrop-blur-sm text-teal-300 hover:bg-teal-600/50"
                  title="Admin Panel"
                >
                  ADMIN
                </button>
              ) : authStatus.user && !authStatus.user.isAnonymous ? (
                <>
                  <button
                    onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold border-2 cursor-pointer bg-emerald-800 border-emerald-500 text-white"
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
                    <div className="absolute right-0 mt-3 w-48 rounded-lg shadow-xl overflow-hidden bg-gray-700">
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
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-600"
                      >
                        Logout
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => navigate("admin")}
                  className="p-2 rounded-lg transition text-xs font-semibold border bg-white/10 border-white/20 backdrop-blur-sm text-white hover:bg-white/20"
                  title="Login / Sign Up"
                >
                  LOGIN
                </button>
              )}
            </div>

            {/* REMOVED: Theme Toggle Button */}

            <button
              className="lg:hidden p-2 rounded-lg transition-colors hover:bg-gray-700"
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
            className="w-full p-2 pl-8 border rounded-lg focus:outline-none transition-colors bg-white/10 border-white/20 backdrop-blur-sm text-white placeholder-gray-300"
          />
          <Search
            size={18}
            className="absolute left-6 top-1/2 -translate-y-1/2 transform pb-1 text-gray-300"
          />
        </form>
      </header>

      {/* MOBILE MENU */}
      <div
        className={`fixed top-0 right-0 h-full w-full max-w-xs z-50 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "translate-x-full"
        } bg-black border-l border-gray-700 lg:hidden`}
      >
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold bg-amber-600">Menu</h2>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="p-2 rounded-full hover:bg-gray-700"
            >
              <X size={24} />
            </button>
          </div>
          <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar">
            {[
              "home",
              "rwandan", // Added mobile link
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
                    ? "bg-amber-600 text-white"
                    : "hover:bg-gray-700"
                }`}
              >
                {item === "admin"
                  ? authStatus.isAdmin
                    ? "Admin Panel"
                    : "Login / Sign Up"
                  : item === "translated"
                  ? "Interpreted"
                  : item === "request"
                  ? "Comments"
                  : item === "rwandan"
                  ? "Rwandan Movies"
                  : item}
              </button>
            ))}

            {!isIOS && (
              <a
                href="https://github.com/gisaiconfii-boop/kigalistreams-appFILES-APK/releases/download/v1.0/KSTRMS.apk"
                download
                onClick={() => setIsMenuOpen(false)}
                className="block w-full text-left p-3 rounded-lg text-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700 flex items-center"
              >
                <Download size={20} className="inline mr-3" /> Download Android App
              </a>
            )}

            {authStatus.user && !authStatus.user.isAnonymous && (
              <button
                onClick={() => {
                  firebaseLogout();
                  setIsMenuOpen(false);
                }}
                className="block w-full text-left p-3 rounded-lg text-lg font-medium transition-colors bg-red-600 text-white hover:bg-red-700 flex items-center"
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
                        ? "bg-amber-600 text-white"
                        : "hover:bg-gray-700"
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

export default Header;