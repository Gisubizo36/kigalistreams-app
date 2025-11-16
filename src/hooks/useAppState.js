import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { query, onSnapshot, doc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase.js";
import { useTranslatorData } from "./useTranslatorData.js";
import {
  getPublicCollectionRef,
  getUserDocRef,
  getUserProfileDocRef,
} from "../utils.js";

export const useAppState = () => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("kigalistreams_theme") || "dark";
  });

  const [content, setContent] = useState([]);
  const [isContentLoading, setIsContentLoading] = useState(true);
  const [continueWatching, setContinueWatching] = useState({});
  const [watchLater, setWatchLater] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  const {
    translators,
    addTranslator,
    removeTranslator,
    editTranslator,
    isLoadingTranslators,
  } = useTranslatorData(db);

  const [authStatus, setAuthStatus] = useState({
    userId: null,
    user: null,
    isAdmin: false,
    isLoading: true,
    isReady: false,
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "dark" ? "light" : "dark";
      localStorage.setItem("kigalistreams_theme", newTheme);
      return newTheme;
    });
  };

  const ADMIN_UIDS = [
    "SGxlEv4uHob8oc77Jukv0pzBG3y1",
    "W6UL6yjjEtcg14rgVS0iWrnBSf03",
  ];

  // A. Authentication Listener
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthStatus({
          userId: user.uid,
          user: user,
          isAdmin: ADMIN_UIDS.includes(user.uid),
          isLoading: false,
          isReady: true,
        });
      } else {
        try {
          const anonUser = await signInAnonymously(auth);
          setAuthStatus({
            userId: anonUser.user.uid,
            user: anonUser.user,
            isAdmin: false,
            isLoading: false,
            isReady: true,
          });
        } catch (e) {
          console.error("Firebase Anonymous Auth Error:", e);
          setAuthStatus({
            userId: crypto.randomUUID(),
            user: null,
            isAdmin: false,
            isLoading: false,
            isReady: true,
          });
        }
      }
    });

    return () => unsubscribe();
  }, [auth]);

  // B. Content Listener (Public Data)
  useEffect(() => {
    if (!db || !authStatus.isReady) return;

    setIsContentLoading(true);
    const q = query(getPublicCollectionRef(db));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setContent(items);
        setIsContentLoading(false);
      },
      (error) => {
        console.error("Error fetching content:", error);
        setIsContentLoading(false);
      }
    );
    return () => unsubscribe();
  }, [authStatus.isReady]);

  // C. User Data Listener
  useEffect(() => {
    if (!db || !authStatus.userId) {
      setContinueWatching({});
      setWatchLater([]);
      return;
    }
    const userDocRef = getUserDocRef(db, authStatus.userId);
    const unsubscribe = onSnapshot(
      userDocRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setContinueWatching(data.continueWatching || {});
          setWatchLater(data.watchLater || []);
        } else {
          setDoc(
            userDocRef,
            { continueWatching: {}, watchLater: [] },
            { merge: true }
          ).catch(console.error);
        }
      },
      (error) => console.error("Error fetching user data:", error)
    );
    return () => unsubscribe();
  }, [authStatus.userId]);

  // D. User Profile Listener
  useEffect(() => {
    if (!db || !authStatus.userId) {
      setUserProfile(null);
      return;
    }
    if (authStatus.user?.isAnonymous) {
      setUserProfile(null);
      return;
    }
    const profileDocRef = getUserProfileDocRef(db, authStatus.userId);
    const unsubscribe = onSnapshot(
      profileDocRef,
      (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data());
        } else {
          setUserProfile({ email: authStatus.user.email, username: null });
        }
      },
      (error) => {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
      }
    );
    return () => unsubscribe();
  }, [authStatus.userId, authStatus.user?.isAnonymous]);

  // E. Actions to update Firestore
  const saveUserProgress = useCallback(
    async (contentId, episode, time) => {
      if (!authStatus.userId || !db) return;
      const newContinueWatching = {
        ...continueWatching,
        [contentId]: { episode, time },
      };
      const userDocRef = getUserDocRef(db, authStatus.userId);
      await updateDoc(userDocRef, { continueWatching: newContinueWatching });
    },
    [authStatus.userId, continueWatching, db]
  );

  const toggleWatchLater = useCallback(
    async (contentId) => {
      if (!authStatus.userId || !db) return;
      let newWatchLater;
      if (watchLater.includes(contentId)) {
        newWatchLater = watchLater.filter((id) => id !== contentId);
      } else {
        newWatchLater = [...watchLater, contentId];
      }
      const userDocRef = getUserDocRef(db, authStatus.userId);
      await updateDoc(userDocRef, { watchLater: newWatchLater });
    },
    [watchLater, authStatus.userId, db]
  );

  return {
    theme,
    toggleTheme,
    content,
    isContentLoading,
    setContent,
    continueWatching,
    watchLater,
    translators,
    isLoadingTranslators,
    addTranslator,
    removeTranslator,
    editTranslator,
    authStatus,
    userProfile,
    saveUserProgress,
    toggleWatchLater,
  };
};