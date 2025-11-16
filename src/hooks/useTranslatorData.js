import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { getTranslatorsDocRef, DEFAULT_TRANSLATORS } from "../utils.js";

export const useTranslatorData = (db) => {
  const [translators, setTranslators] = useState([]);
  const [isLoadingTranslators, setIsLoadingTranslators] = useState(true);

  useEffect(() => {
    if (!db) return;
    const docRef = getTranslatorsDocRef(db);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists() && Array.isArray(docSnap.data().list)) {
          setTranslators(docSnap.data().list);
        } else if (!docSnap.exists()) {
          setDoc(docRef, { list: DEFAULT_TRANSLATORS }, { merge: true }).catch(
            console.error
          );
          setTranslators(DEFAULT_TRANSLATORS);
        }
        setIsLoadingTranslators(false);
      },
      (error) => {
        console.error("Error fetching translator list:", error);
        setTranslators(DEFAULT_TRANSLATORS);
        setIsLoadingTranslators(false);
      }
    );
    return () => unsubscribe();
  }, [db]);

  const updateTranslatorsInFirestore = useCallback(
    async (newList) => {
      if (!db) return false;
      try {
        await updateDoc(getTranslatorsDocRef(db), { list: newList });
        return true;
      } catch (e) {
        console.error("Failed to update translators in Firestore:", e);
        return false;
      }
    },
    [db]
  );

  const addTranslator = useCallback(
    (newName) => {
      newName = newName.trim();
      if (
        !newName ||
        translators.find((t) => t.toLowerCase() === newName.toLowerCase())
      ) {
        return false;
      }
      const newList = [...translators, newName];
      updateTranslatorsInFirestore(newList);
      return true;
    },
    [translators, updateTranslatorsInFirestore]
  );

  const removeTranslator = useCallback(
    (nameToRemove) => {
      const newList = translators.filter((name) => name !== nameToRemove);
      updateTranslatorsInFirestore(newList);
    },
    [translators, updateTranslatorsInFirestore]
  );

  const editTranslator = useCallback(
    (originalName, newName) => {
      newName = newName.trim();
      if (
        !newName ||
        (translators.find((t) => t.toLowerCase() === newName.toLowerCase()) &&
          newName.toLowerCase() !== originalName.toLowerCase())
      ) {
        return false;
      }
      const newList = translators.map((name) =>
        name === originalName ? newName : name
      );
      updateTranslatorsInFirestore(newList);
      return true;
    },
    [translators, updateTranslatorsInFirestore]
  );

  return {
    translators,
    addTranslator,
    removeTranslator,
    editTranslator,
    isLoadingTranslators,
  };
};