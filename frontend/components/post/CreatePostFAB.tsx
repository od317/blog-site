// components/post/CreatePostFAB.tsx
"use client";

import { useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { CreatePostModal } from "./CreatePostModal";
import { Plus } from "lucide-react";

export function CreatePostFAB() {
  const { isAuthenticated } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isAuthenticated) return null;

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all hover:scale-110 hover:shadow-[0_0_30px_rgba(236,72,153,0.5)] focus:outline-none focus:ring-2 focus:ring-primary-400/50 active:scale-95 sm:h-16 sm:w-16"
        aria-label="Create new post"
      >
        <Plus className="h-6 w-6 sm:h-7 sm:w-7" />
      </button>

      <CreatePostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}