import React, { useState } from "react";
import { Key } from "lucide-react";

const AdminToolsManager = ({
  adminPassword,
  updateAdminPassword,
  firebaseLogout,
}) => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handlePasswordChangeSubmit = (e) => {
    e.preventDefault();
    setPasswordMessage("");
    if (oldPassword !== adminPassword) {
      setPasswordMessage("Error: Current local password incorrect.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMessage("Error: New password must be at least 8 characters.");
      return;
    }
    updateAdminPassword(newPassword);
    setPasswordMessage("Success: Local password updated successfully!");
    setOldPassword("");
    setNewPassword("");
    setIsChangingPassword(false);
  };

  if (isChangingPassword) {
    return (
      <div className="bg-gray-800 p-6 rounded-xl mb-6 shadow-2xl border-2 border-orange-500">
        <h3 className="text-xl font-semibold text-orange-400 mb-4 flex items-center">
          <Key size={20} className="mr-2" /> Update Local Admin Password
        </h3>
        {passwordMessage && (
          <div
            className={`p-3 rounded-lg text-sm mb-4 font-semibold ${
              passwordMessage.includes("Error")
                ? "text-red-400 bg-red-900/30"
                : "text-green-400 bg-green-900/30"
            }`}
          >
            {passwordMessage}
          </div>
        )}
        <form onSubmit={handlePasswordChangeSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-1 font-mono">
              Current Password
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-orange-500 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1 font-mono">
              New Password (Min 8 chars)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-teal-500 focus:ring-teal-500"
            />
          </div>
          <div className="flex justify-between space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsChangingPassword(false)}
              className="w-1/3 bg-gray-600 text-white hover:bg-gray-700 font-semibold py-3 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-lg transition shadow-md shadow-teal-600/40"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-xl mb-6 shadow-2xl border-2 border-orange-500/50">
      <h3 className="text-xl font-semibold text-orange-400 mb-4 flex items-center">
        <Key size={20} className="mr-2" /> General Tools
      </h3>
      <button
        onClick={() => setIsChangingPassword(true)}
        className="flex items-center text-sm bg-orange-600 hover:bg-orange-700 text-white py-2 px-4 rounded-lg transition font-semibold shadow-md shadow-orange-600/50"
      >
        Change Local Password
      </button>
      <p className="text-xs text-gray-400 mt-2">
        Note: This is separate from your Firebase account password.
      </p>
    </div>
  );
};

export default AdminToolsManager;