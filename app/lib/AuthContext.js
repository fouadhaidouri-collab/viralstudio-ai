"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

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
  const { data: session, status } = useSession();
  const [loginError, setLoginError] = useState("");

  const user = session?.user
    ? {
        uid: session.user.id || session.user.email,
        email: session.user.email,
        name: session.user.name || session.user.email?.split("@")[0],
        photoURL: session.user.image || null,
        credits: session.user.credits ?? 0,
        plan: session.user.plan || "Free",
        memberSince: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        provider: session.user.provider || "credentials",
      }
    : null;

  const login = async (email, password) => {
    setLoginError("");
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setLoginError("This account does not exist. Please sign up.");
      return false;
    }
    return true;
  };

  const signUp = async (name, email, password) => {
    setLoginError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const data = await res.json();
      setLoginError(data.error || "Sign up failed");
      return false;
    }
    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) {
      setLoginError(result.error);
      return false;
    }
    return true;
  };

  const logout = async () => {
    await signOut({ redirect: false });
  };

  return (
    <AuthContext.Provider value={{
      user, login, signUp, logout,
      isAuthenticated: status === "authenticated",
      loading: status === "loading",
      loginError, setLoginError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
