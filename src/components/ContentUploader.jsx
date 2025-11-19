import React, { useState, useCallback } from "react";
import { db } from "../firebase.js";
import { doc, setDoc } from "firebase/firestore";
import { Genres, emptyContent, generateId, getPublicCollectionRef } from "../utils.js";
import {
  List,
  Edit,
  X,
  Film,
  Download,
  Video,
  Tv,
  PlusCircle,
  Hash,
} from "lucide-react";

const ContentUploader = ({
  authStatus,
  translators,
  isLoadingTranslators,
  editingItem,
  onUploadComplete,
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
        downloadLink: "", // Changed from subtitleLink to downloadLink
      },
    ]);
  }, []);

  const removeEpisode = useCallback((index) => {
    setEpisodes((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);

      const dataToSave = {
        ...formData,
        rating: parseFloat(formData.rating) || 0,
        year:
          formData.type === "Movie" ? parseInt(formData.year) || null : null,
        runtime:
          formData.type === "Movie" ? parseInt(formData.runtime) || null : null,
        episodes: formData.type === "TV Series" ? episodes : [],
        isTopRated: formData.isTopRated || false,
        isTrending: formData.isTrending || false,
        movieLink: formData.type === "Movie" ? formData.movieLink || "" : "",
        downloadLink:
          formData.type === "Movie" ? formData.downloadLink || "" : "",
        trailerLink: formData.trailerLink || "",
        translator: formData.translator || "",
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
      </div>
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
            Assign Interpreter
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
                ? "Loading interpreters..."
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
            Manage interpreters in the **Interpreter** tab.
          </p>
        </div>
      </div>
      <div className="bg-gray-700 p-4 rounded-lg space-y-4 shadow-inner">
        <h3 className="text-lg font-semibold text-orange-400">
          Streaming Links
        </h3>
        {formData.type === "Movie" && (
          <>
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
                {/* --- CHANGED: Subtitle Link replaced with Download Link --- */}
                <label className="block text-xs text-gray-400 flex items-center">
                  <Download size={12} className="mr-1" /> Episode Download Link
                </label>
                <input
                  type="url"
                  name="downloadLink"
                  value={ep.downloadLink}
                  onChange={(e) => handleEpisodeChange(index, e)}
                  className="w-full p-2 text-sm bg-gray-700 border-gray-600 rounded-md text-white"
                  placeholder="https://externalsite.com/download/episode.mp4"
                />
                {/* ------------------------------------------------------- */}
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

export default ContentUploader;