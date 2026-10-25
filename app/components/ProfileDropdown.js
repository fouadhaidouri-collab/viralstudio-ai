"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../lib/AuthContext";
import Icon from "./Icon";
import UserAvatar from "./UserAvatar";

export default function ProfileDropdown() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  return (
    <button
      onClick={() => router.push("/profile")}
      className="rounded-full transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
      aria-label="Open profile"
    >
      {isAuthenticated ? (
        <UserAvatar name={user?.name} email={user?.email} size={40} ring />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-surface-border/60 bg-surface-container-low text-primary/80">
          <Icon name="person" size={18} />
        </span>
      )}
    </button>
  );
}
