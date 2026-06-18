"use client";

import { useState, useEffect } from "react";

export default function AppInit({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#030303",
          transition: "opacity 0.5s ease, visibility 0.5s ease",
          opacity: ready ? 0 : 1,
          visibility: ready ? "hidden" : "visible",
        }}
      >
        <div
          className="app-bolt-icon"
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background:
              "linear-gradient(135deg, #a855f7 0%, #7c3aed 50%, #3b0764 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 40px rgba(168,85,247,0.4)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14h9l-1 8l10-12h-9l1-8z" fill="white" />
          </svg>
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 20,
            fontWeight: 800,
            fontFamily: "Geist, sans-serif",
            background: "linear-gradient(135deg, #fff 30%, #a855f7 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}
        >
          ViralStudio AI
        </div>
        <div style={{ marginTop: 24, display: "flex", gap: 6 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="app-dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: "#a855f7",
              }}
            />
          ))}
        </div>
      </div>
      <div
        style={{
          height: "100%",
          opacity: ready ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      >
        {children}
      </div>
    </>
  );
}
