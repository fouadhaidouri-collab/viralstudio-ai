"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "../lib/AuthContext";
import Icon from "./Icon";

export default function ProfileDropdown() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const photoURL = user?.photoURL;

  return (
    <button
      onClick={() => router.push("/profile")}
      className="w-10 h-10 rounded-full p-[1.5px] transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-primary/20 cursor-pointer overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #a855f7, #6366f1)' }}
    >
      {isAuthenticated && photoURL ? (
        <img
          src={photoURL}
          alt="Profile"
          className="w-full h-full rounded-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-surface flex items-center justify-center">
          <Icon name="person" className="text-primary/80" size={18} />
        </div>
      )}
    </button>
  );
}
