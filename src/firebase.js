import { initializeApp } from "firebase/app";
// We add 'enableIndexedDbPersistence' to save data on the phone
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app, db, auth;

if (firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig);
    
    // Initialize Database
    db = getFirestore(app);
    
    // ENABLE OFFLINE PERSISTENCE (The Magic Glue)
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code == 'failed-precondition') {
        console.log('Persistence failed: Multiple tabs open');
      } else if (err.code == 'unimplemented') {
        console.log('Persistence not supported by browser');
      }
    });

    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

export { app, db, auth };