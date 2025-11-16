import React, { useState } from "react";
import { db } from "../firebase.js";
import { getPublicCollectionRef } from "../utils.js";
import { doc, deleteDoc } from "firebase/firestore";
import AdminToolsManager from "../components/AdminToolsManager.jsx";
import TranslatorManager from "../components/TranslatorManager.jsx";
import ContentUploader from "../components/ContentUploader.jsx";
import { Upload, X, Plus, BookOpen, Edit, Search, Trash2 } from "lucide-react";

const AdminView = ({
  authStatus,
  adminPassword,
  updateAdminPassword,
  translators,
  isLoadingTranslators,
  addTranslator,
  removeTranslator,
  editTranslator,
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

export default AdminView;