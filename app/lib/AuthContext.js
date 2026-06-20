"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { auth } from "./firebase";

const IS_FIREBASE_READY = typeof window !== "undefined" &&
  !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY && process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "demo");

const AuthContext = createContext({
  user: null,
  login: () => {},
  signUp: () => {},
  googleLogin: () => {},
  logout: () => {},
  isAuthenticated: false,
  loading: true,
  loginError: "",
  setLoginError: () => {},
});

function lsUser() {
  if (typeof window === "undefined") return null;
  try { return JSON.parse(localStorage.getItem("app_user")); } catch { return null; }
}

function lsSave(u) { localStorage.setItem("app_user", JSON.stringify(u)); }
function lsRemove() { localStorage.removeItem("app_user"); }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    if (!IS_FIREBASE_READY) {
      setUser(lsUser());
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (fbUser) {
        const existing = lsUser() || {};
        setUser({
          uid: fbUser.uid,
          email: fbUser.email,
          name: fbUser.displayName || existing.name || fbUser.email?.split("@")[0],
          photoURL: fbUser.photoURL || null,
          credits: existing.credits ?? 1250,
          plan: existing.plan ?? "Pro Plan",
          memberSince: existing.memberSince || new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        });
      } else {
        setUser(lsUser());
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (user) lsSave(user);
  }, [user]);

  const signUp = async (name, email, password) => {
    setLoginError("");
    if (IS_FIREBASE_READY) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const u = {
          uid: cred.user.uid, email: cred.user.email, name, photoURL: null,
          credits: 1250, plan: "Pro Plan",
          memberSince: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        };
        setUser(u);
        try { await sendEmailVerification(cred.user); } catch {}
        return true;
      } catch (err) {
        if (err.code === "auth/email-already-in-use") setLoginError("This email is already registered. Please sign in.");
        else setLoginError(err.message);
        return false;
      }
    }
    const e = email.trim().toLowerCase();
    const stored = lsUser();
    if (stored && stored.email === e) {
      setLoginError("This email is already registered. Please sign in.");
      return false;
    }
    const u = { uid: "local_" + Date.now(), email: e, name, photoURL: null, credits: 1250, plan: "Pro Plan", memberSince: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }) };
    setUser(u);
    return true;
  };

  const login = async (email, password) => {
    setLoginError("");
    if (IS_FIREBASE_READY) {
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const existing = lsUser() || {};
        setUser({
          uid: cred.user.uid, email: cred.user.email, name: cred.user.displayName || existing.name || email.split("@")[0],
          photoURL: cred.user.photoURL || null, credits: existing.credits ?? 1250,
          plan: existing.plan ?? "Pro Plan",
          memberSince: existing.memberSince || new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        });
        return true;
      } catch (err) {
        if (err.code === "auth/user-not-found") setLoginError("Account not found. Please sign up.");
        else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") setLoginError("Wrong email or password.");
        else if (err.code === "auth/invalid-email") setLoginError("Invalid email address.");
        else setLoginError(err.message);
        return false;
      }
    }
    const e = email.trim().toLowerCase();
    const stored = lsUser();
    if (!stored || stored.email !== e) {
      setLoginError("Account not found. Please sign up.");
      return false;
    }
    setUser(stored);
    return true;
  };

  const googleLogin = async () => {
    setLoginError("");
    if (IS_FIREBASE_READY) {
      try {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth, provider);
        const fb = cred.user;
        setUser({
          uid: fb.uid, email: fb.email, name: fb.displayName, photoURL: fb.photoURL,
          credits: 1250, plan: "Pro Plan",
          memberSince: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        });
        return true;
      } catch (err) {
        setLoginError(err.message);
        return false;
      }
    }
    setLoginError("Firebase not configured. Add NEXT_PUBLIC_FIREBASE_* vars to .env.local");
    return false;
  };

  const logout = async () => {
    if (IS_FIREBASE_READY) await signOut(auth);
    setUser(null);
    lsRemove();
  };

  return (
    <AuthContext.Provider value={{
      user, login, signUp, googleLogin, logout,
      isAuthenticated: !!user,
      loading, loginError, setLoginError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
