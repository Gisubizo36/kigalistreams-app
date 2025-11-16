import React, { useState } from "react";
import { auth, db } from "../firebase.js";
import { getUserProfileDocRef } from "../utils.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { setDoc } from "firebase/firestore";
import { Eye, EyeOff, Hash } from "lucide-react";

const LoginView = ({ navigate }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleAuthError = (error) => {
    setLoading(false);
    switch (error.code) {
      case "auth/invalid-email":
      case "auth/invalid-credential":
        setMessage("Error: Please enter a valid email address.");
        break;
      case "auth/user-not-found":
      case "auth/wrong-password":
        setMessage("Error: Invalid email or password.");
        break;
      case "auth/email-already-in-use":
        setMessage(
          "Error: An account already exists with this email. Please log in."
        );
        break;
      case "auth/weak-password":
        setMessage("Error: Password must be at least 6 characters long.");
        break;
      case "auth/operation-not-allowed":
        setMessage("Error: Email/Password sign-in is not enabled in Firebase.");
        break;
      default:
        setMessage(`Error: ${error.message} (${error.code})`);
    }
  };

  const handleLoginAttempt = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage("Error: Please enter both email and password.");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      setLoading(false);
      navigate("home");
    } catch (error) {
      handleAuthError(error);
    }
  };

  const handleSignUpAttempt = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setMessage("Error: Please enter a username.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Error: Passwords do not match.");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userProfileData = {
        username: username.trim(),
        email: email,
        createdAt: Date.now(),
        userId: user.uid,
      };
      await setDoc(getUserProfileDocRef(db, user.uid), userProfileData);

      setLoading(false);
      setMessage("Account created successfully! You are now logged in.");
      navigate("home");
    } catch (error) {
      handleAuthError(error);
    }
  };

  return (
    <div
      className="relative w-full min-h-screen pt-16 flex items-center justify-center"
      style={{ fontFamily: "monospace" }}
    >
      <div
        className="absolute inset-0 z-0 performant-bg"
        style={{ marginTop: "-4rem" }}
      ></div>
      <div className="relative z-10 bg-gray-800 p-10 rounded-2xl shadow-neon-lg w-full max-w-md border-4 border-teal-500/70">
        <h1 className="text-3xl font-extrabold text-teal-400 mb-6 text-center tracking-wider">
          {isLoginMode ? "Member Login" : "Create Account"}
        </h1>
        {message && (
          <div
            className={`p-3 rounded-lg text-sm mb-4 font-semibold ${
              message.includes("Error")
                ? "bg-orange-900/50 text-orange-300"
                : "bg-green-900/50 text-green-300"
            }`}
          >
            {message}
          </div>
        )}

        <form onSubmit={isLoginMode ? handleLoginAttempt : handleSignUpAttempt}>
          {!isLoginMode && (
            <>
              <label className="block text-gray-300 mb-1 font-mono">
                Username
              </label>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full p-3 mb-4 bg-gray-700 border border-teal-500/30 rounded-lg text-white placeholder-gray-500 font-mono focus:border-orange-500 focus:ring-0"
              />
            </>
          )}

          <label className="block text-gray-300 mb-1 font-mono">Email</label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 mb-4 bg-gray-700 border border-teal-500/30 rounded-lg text-white placeholder-gray-500 font-mono focus:border-orange-500 focus:ring-0"
          />

          <label className="block text-gray-300 mb-1 font-mono">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 mb-6 bg-gray-700 border border-teal-500/30 rounded-lg text-white placeholder-gray-500 font-mono focus:border-orange-500 focus:ring-0"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-white"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {!isLoginMode && (
            <>
              <label className="block text-gray-300 mb-1 font-mono">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full p-3 mb-6 bg-gray-700 border border-teal-500/30 rounded-lg text-white placeholder-gray-500 font-mono focus:border-orange-500 focus:ring-0"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-white"
                >
                  {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full font-bold py-3 rounded-lg transition tracking-wide ${
              isLoginMode
                ? "bg-orange-600 hover:bg-orange-700 shadow-md shadow-orange-600/50"
                : "bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/50"
            } text-white ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <Hash size={20} className="mx-auto animate-spin" />
            ) : isLoginMode ? (
              "INITIATE LOGIN"
            ) : (
              "CREATE ACCOUNT"
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-400">
            {isLoginMode
              ? "Don't have an account?"
              : "Already have an account?"}
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setMessage("");
              }}
              className="ml-2 font-semibold text-teal-400 hover:text-teal-300 transition"
            >
              {isLoginMode ? "Create Account" : "Log In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;