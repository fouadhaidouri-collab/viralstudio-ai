"use client";

import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext({
  user: null,
  login: () => {},
  signUp: () => {},
  logout: () => {},
  isAuthenticated: false,
  loading: true,
  loginError: "",
  setLoginError: () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    setLoginError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setLoginError(data.error || "Invalid credentials");
        return false;
      }
      setUser(data.user);
      return true;
    } catch (err) {
      setLoginError("Server error. Please try again.");
      return false;
    }
  };

  const signUp = async (name, email, password, refCode, code) => {
    setLoginError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, ref_code: refCode, code }),
      });
      if (!res.ok) {
        const data = await res.json();
        setLoginError(data.error || "Sign up failed");
        return false;
      }
      const loginOk = await login(email, password);
      return loginOk;
    } catch (err) {
      setLoginError("Server error. Please try again.");
      return false;
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, login, signUp, logout,
      isAuthenticated: !!user,
      loading,
      loginError, setLoginError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
