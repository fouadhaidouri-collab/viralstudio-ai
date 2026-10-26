"use client";

import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

/**
 * Shows the credit balance from the session immediately, then refreshes it
 * once in the background so purchases/generations are reflected.
 */
export default function useLiveCredits() {
  const { user } = useAuth();
  const userId = user?.id;
  const [snapshot, setSnapshot] = useState({ userId: null, balance: null });

  useEffect(() => {
    if (!userId) return;

    const controller = new AbortController();

    fetch("/api/credits", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.balance != null) {
          setSnapshot({ userId, balance: data.balance });
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [userId]);

  const fetched = snapshot.userId === userId ? snapshot.balance : null;
  return fetched ?? user?.credits ?? 0;
}
