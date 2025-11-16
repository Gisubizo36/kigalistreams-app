import { useState, useCallback } from "react";

export const useAdminPassword = () => {
  const [adminPassword, setAdminPassword] = useState(() => {
    return localStorage.getItem("kigalistreams_admin_password") || "Minani@88";
  });
  const updateAdminPassword = useCallback((newPassword) => {
    localStorage.setItem("kigalistreams_admin_password", newPassword);
    setAdminPassword(newPassword);
  }, []);
  return [adminPassword, updateAdminPassword];
};