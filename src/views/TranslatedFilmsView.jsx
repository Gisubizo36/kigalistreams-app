import React from "react";
import Card from "../components/Card.jsx";
import { BookOpen } from "lucide-react";

const TranslatedFilmsView = ({
  content,
  navigate,
  toggleWatchLater,
  watchLater,
  selectedTranslator,
  setSelectedTranslator,
  translators,
  isLoadingTranslators,
}) => {
  const translatedItems = content.filter((item) => {
    if (!item.translator) return false;
    if (selectedTranslator && item.translator !== selectedTranslator)
      return false;
    return true;
  });

  return (
    <div className="relative w-full min-h-screen pt-32 lg:pt-24">
      <div
        className="absolute inset-0 z-0 performant-bg"
        style={{ marginTop: "-4rem" }}
      ></div>
      <div className="relative z-10 container mx-auto py-8 px-4 sm:px-6">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center">
          <BookOpen size={28} className="mr-3 text-amber-500" />
          Translated Content
        </h1>

        <div className="mb-8 max-w-sm">
          <label className="block text-gray-300 mb-2 font-semibold">
            Filter by Translator
          </label>
          <select
            value={selectedTranslator || ""}
            onChange={(e) => setSelectedTranslator(e.target.value || null)}
            disabled={isLoadingTranslators}
            className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-teal-500 focus:ring-teal-500 disabled:opacity-50"
          >
            <option value="">
              {isLoadingTranslators
                ? "Loading..."
                : "-- Show All Translators --"}
            </option>
            {!isLoadingTranslators &&
              translators.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
          </select>
        </div>

        {translatedItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {translatedItems.map((item) => (
              <Card
                key={item.id}
                item={item}
                onClick={navigate}
                onWatchLaterToggle={toggleWatchLater}
                isWatchLater={watchLater.includes(item.id)}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-10">
            No translated content found
            {selectedTranslator ? ` for "${selectedTranslator}"` : ""}.
          </p>
        )}
      </div>
    </div>
  );
};

export default TranslatedFilmsView;