import React, { useState } from "react";
import { BookOpen, Plus, Edit, Trash2 } from "lucide-react";

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

export default TranslatorManager;