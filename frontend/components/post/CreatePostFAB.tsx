// components/post/CreatePostFAB.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { CreatePostModal } from "./CreatePostModal";

export function CreatePostFAB() {
  const { isAuthenticated } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Only show FAB for logged-in users
  if (!isAuthenticated) return null;

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={`
          fixed bottom-8 right-8 z-40
          flex h-14 w-14 items-center justify-center
          rounded-full bg-blue-600 text-white
          shadow-lg transition-all
          hover:scale-110 hover:bg-blue-700 hover:shadow-xl
          focus:outline-none focus:ring-4 focus:ring-blue-300
          active:scale-95
          sm:h-16 sm:w-16
        `}
        aria-label="Create new post"
      >
        <svg
          className="h-6 w-6 sm:h-7 sm:w-7"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
      </button>

      {/* Modal with Create Form */}
      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
