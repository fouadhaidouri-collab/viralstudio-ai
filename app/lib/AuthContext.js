"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext({
  user: null,
  login: () => {},
  signUp: () => {},
  googleLogin: () => {},
  logout: () => {},
  verifyEmail: () => {},
  isAuthenticated: false,
  isVerified: false,
  loading: true,
  verificationEmail: null,
  pendingVerification: false,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        setUser(u);
        if (u.verified === false) {
          setPendingVerification(true);
          setVerificationEmail(u.email);
        }
      } catch {}
    }
    setLoading(false);
  }, []);

  const signUp = (name, email, password) => {
    const u = { name, email, password, plan: "Pro Plan", credits: 1250, verified: false };
    setUser(u);
    setPendingVerification(true);
    setVerificationEmail(email);
    localStorage.setItem("auth_user", JSON.stringify(u));
    localStorage.setItem("verification_code", "123456");
  };

  const login = (email, password) => {
    const stored = localStorage.getItem("auth_user");
    if (stored) {
      try {
        const u = JSON.parse(stored);
        if (u.email === email && u.password === password) {
          setUser(u);
          localStorage.setItem("auth_user", JSON.stringify(u));
          return true;
        }
      } catch {}
    }
    const u = { name: email.split("@")[0], email, password, plan: "Pro Plan", credits: 1250, verified: true };
    setUser(u);
    localStorage.setItem("auth_user", JSON.stringify(u));
    return true;
  };

  const googleLogin = () => {
    const u = { name: "Google User", email: "google.user@gmail.com", plan: "Pro Plan", credits: 1250, verified: true };
    setUser(u);
    setPendingVerification(false);
    setVerificationEmail(null);
    localStorage.setItem("auth_user", JSON.stringify(u));
  };

  const verifyEmail = (code) => {
    const stored = localStorage.getItem("verification_code");
    if (code === stored || code === "123456") {
      if (user) {
        const u = { ...user, verified: true };
        setUser(u);
        localStorage.setItem("auth_user", JSON.stringify(u));
      }
      setPendingVerification(false);
      setVerificationEmail(null);
      localStorage.removeItem("verification_code");
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setPendingVerification(false);
    setVerificationEmail(null);
    localStorage.removeItem("auth_user");
  };

  return (
    <AuthContext.Provider value={{
      user, login, signUp, googleLogin, logout, verifyEmail,
      isAuthenticated: !!user,
      isVerified: user?.verified !== false,
      loading,
      pendingVerification,
      verificationEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
