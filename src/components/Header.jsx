import React, { useState, useEffect, useRef } from "react";
import { Genres } from "../utils.js";
import {
  Clock,
  Search,
  Menu,
  X,
  Moon,
  Sun,
  BookOpen,
  ChevronDown,
  Download,
  PlusCircle,
} from "lucide-react";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const headerRef = useRef(null);

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
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate("search");
    else navigate("home");
  };

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed top-0 left-0 right-0 z-30 shadow-lg transition-colors duration-300 ${
          theme === "dark" ? "bg-black" : "bg-white"
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
              placeholder="Search movies..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim() !== "" && view !== "search") navigate("search");
              }}
              onFocus={() => { if (view !== "search") navigate("search"); }}
              className={`w-full p-2 border-l border-y rounded-l-lg focus:outline-none transition-colors ${
                theme === "dark"
                  ? "bg-white/10 border-white/20 backdrop-blur-sm text-white placeholder-gray-300"
                  : "bg-white/50 border-gray-300/50 backdrop-blur-sm text-gray-900 placeholder-gray-600"
              }`}
            />
            <button type="submit" className={`bg-amber-600 hover:bg-emerald-700 text-white p-2 rounded-r-lg transition`}>
              <Search size={20} />
            </button>
          </form>
          <nav className="flex items-center space-x-4 flex-shrink-0">
            <button onClick={() => navigate("watchlater")} className={`hidden md:block p-2 rounded-lg transition-colors ${view === "watchlater" ? `bg-amber-600` : theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`} title="Watch Later">
              <Clock size={20} className="inline mr-1" /> Watch Later
            </button>
            <div className="relative z-50" ref={profileMenuRef}>
              {authStatus.isAdmin ? (
                <button onClick={() => navigate("admin")} className={`p-2 rounded-lg transition text-xs font-semibold border ${theme === "dark" ? "bg-teal-600/20 border-teal-500/50 backdrop-blur-sm text-teal-300 hover:bg-teal-600/50" : "bg-teal-100 border-teal-300 backdrop-blur-sm text-teal-800 hover:bg-teal-200"}`}>ADMIN</button>
              ) : authStatus.user && !authStatus.user.isAnonymous ? (
                <>
                  <button onClick={() => setIsProfileMenuOpen((prev) => !prev)} className={`w-9 h-9 rounded-full flex items-center justify-center text-lg font-bold border-2 cursor-pointer ${theme === "dark" ? "bg-emerald-800 border-emerald-500 text-white" : "bg-emerald-100 border-emerald-300 text-emerald-800"}`}>
                    {userProfile?.username ? userProfile.username.charAt(0).toUpperCase() : "U"}
                  </button>
                  {isProfileMenuOpen && (
                    <div className={`absolute right-0 mt-3 w-48 rounded-lg shadow-xl overflow-hidden ${theme === "dark" ? "bg-gray-700" : "bg-white"}`}>
                       <button onClick={() => { firebaseLogout(); setIsProfileMenuOpen(false); }} className={`block w-full text-left px-4 py-2 text-sm ${theme === "dark" ? "text-red-400 hover:bg-gray-600" : "text-red-600 hover:bg-gray-200"}`}>Logout</button>
                    </div>
                  )}
                </>
              ) : (
                <button onClick={() => navigate("admin")} className={`p-2 rounded-lg transition text-xs font-semibold border ${theme === "dark" ? "bg-white/10 border-white/20 backdrop-blur-sm text-white hover:bg-white/20" : "bg-white/50 border-gray-300/50 backdrop-blur-sm text-gray-900 hover:bg-white/70"}`}>LOGIN</button>
              )}
            </div>
            <button className={`lg:hidden p-2 rounded-lg transition-colors ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`} onClick={() => setIsMenuOpen(true)}><Menu size={24} /></button>
          </nav>
        </div>
      </header>
      <div className={`fixed top-0 right-0 h-full w-full max-w-xs z-50 transform transition-transform duration-300 ease-in-out ${isMenuOpen ? "translate-x-0" : "translate-x-full"} ${theme === "dark" ? "bg-black border-l border-gray-700" : "bg-white border-l border-gray-200"} lg:hidden`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-between items-center mb-8">
            <h2 className={`text-xl font-bold bg-amber-600`}>Menu</h2>
            <button onClick={() => setIsMenuOpen(false)} className={`p-2 rounded-full ${theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}><X size={24} /></button>
          </div>
          <div className="space-y-4 flex-grow overflow-y-auto custom-scrollbar">
             {["home", "watchlater", "translated", "contact", "request"].map((item) => (
              <button key={item} onClick={() => { navigate(item); setIsMenuOpen(false); }} className={`block w-full text-left p-3 rounded-lg text-lg font-medium transition-colors capitalize ${view === item ? `bg-amber-600 text-white` : theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-200"}`}>{item}</button>
            ))}
            {/* --- FIX: NEW LINK --- */}
            <a href="https://github.com/gisaiconfii-boop/kigalistreams-appFILES-APK/releases/download/v1.0/Kstreams.apk" download onClick={() => setIsMenuOpen(false)} className={`block w-full text-left p-3 rounded-lg text-lg font-medium transition-colors bg-green-600 text-white hover:bg-green-700 flex items-center`}>
              <Download size={20} className="inline mr-3" /> Download APK
            </a>
          </div>
        </div>
      </div>
      {isMenuOpen && <div onClick={() => setIsMenuOpen(false)} className="fixed inset-0 bg-black/50 z-40 lg:hidden"></div>}
    </>
  );
}
export default Header;