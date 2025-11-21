import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase.js";
import { getRequestsCollectionRef } from "../utils.js";
import {
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { Hash, User, MessageSquare } from "lucide-react";

const RequestView = ({ navigate, authStatus, userProfile }) => {
  const [requests, setRequests] = useState([]);
  const [newRequest, setNewRequest] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    if (!db) return;
    setIsLoading(true);
    const q = query(getRequestsCollectionRef(db), orderBy("timestamp", "desc"));
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
        setMessage("Error: Could not load comments.");
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [db]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newRequest.trim()) {
      setMessage("Error: Please write a comment before submitting.");
      return;
    }
    if (authStatus.user.isAnonymous) {
      setMessage("Error: You must be logged in to post.");
      return;
    }

    setIsPosting(true);
    setMessage("");

    const usernameToPost =
      userProfile?.username || userProfile?.email || "User";

    const requestData = {
      userId: authStatus.userId,
      username: usernameToPost,
      requestText: newRequest.trim(),
      timestamp: Date.now(),
      status: "pending",
    };

    try {
      const newDocRef = doc(getRequestsCollectionRef(db));
      await setDoc(newDocRef, requestData);
      setNewRequest("");
      setMessage("Success! Your comment has been posted.");
    } catch (error) {
      console.error("Error posting comment:", error);
      setMessage(`Error: ${error.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (formRef.current) {
        formRef.current.dispatchEvent(
          new Event("submit", { cancelable: true, bubbles: true })
        );
      }
    }
  };

  const handleDeleteRequest = async (requestId) => {
    try {
      const docRef = doc(getRequestsCollectionRef(db), requestId);
      await deleteDoc(docRef);
      setMessage("Success: Comment deleted.");
    } catch (error) {
      console.error("Error deleting comment:", error);
      setMessage(`Error: Could not delete comment. ${error.message}`);
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
          No comments have been posted yet. Be the first!
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
              <div className="flex items-center space-x-3">
                <p className="text-gray-500 text-xs">
                  {new Date(req.timestamp).toLocaleString()}
                </p>

                {(authStatus.isAdmin || authStatus.userId === req.userId) && (
                  <button
                    onClick={() => handleDeleteRequest(req.id)}
                    className="text-red-500 hover:text-red-400 text-xs font-semibold"
                    title="Delete Comment"
                  >
                    Delete
                  </button>
                )}
              </div>
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
          <h1 className="text-3xl font-bold text-white mb-4 text-center flex items-center justify-center gap-3">
            <MessageSquare size={32} className="text-amber-500" />
            Comments & Ideas
          </h1>
          <p className="text-gray-400 mb-6 text-center">
            Share your feedback, suggest features, or request movies.
          </p>

          <div className="mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">
              Community Discussion
            </h2>
            {renderContent()}
          </div>

          <div className="border-t border-gray-700 pt-6">
            {authStatus.user && !authStatus.user.isAnonymous ? (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-semibold text-white">
                  Post a comment
                </h3>
                <div>
                  <textarea
                    value={newRequest}
                    onChange={(e) => setNewRequest(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows="4"
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:ring-emerald-500"
                    placeholder="What's on your mind? New movie request or app feedback..."
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
                    "Post Comment"
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center p-6 bg-gray-700/50 rounded-lg">
                <p className="text-lg text-gray-300 mb-4">
                  You must be logged in to post comments.
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

export default RequestView;