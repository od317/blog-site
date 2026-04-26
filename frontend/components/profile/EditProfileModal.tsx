// components/profile/EditProfileModal.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateProfile } from "@/app/actions/profile.actions";
import { useAuthStore } from "@/lib/store/authStore";
import { X, Save } from "lucide-react";

interface EditFullNameModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  currentFullName: string | null;
  onSuccess: (fullName: string | null) => void;
}

export function EditFullNameModal({
  isOpen,
  onClose,
  username,
  currentFullName,
  onSuccess,
}: EditFullNameModalProps) {
  const { setUser } = useAuthStore();
  const [fullName, setFullName] = useState(currentFullName || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFullName(currentFullName || "");
      setError(null);
    }
  }, [isOpen, currentFullName]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const trimmedName = fullName.trim() || null;

    if (trimmedName === currentFullName) {
      onClose();
      setIsLoading(false);
      return;
    }

    try {
      const result = await updateProfile(username, {
        full_name: trimmedName,
        bio: null,
      });

      if (result.success && result.user) {
        setUser(result.user);
        onSuccess(trimmedName);
        onClose();
      } else {
        setError(result.error || "Failed to update profile");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2 }}
                className="relative w-full max-w-md rounded-xl border border-primary-500/20 bg-card shadow-[0_0_40px_rgba(6,182,212,0.15)]"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-primary-500/20 px-6 py-4">
                  <h2 className="text-xl font-semibold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
                    Edit Display Name
                  </h2>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-muted-foreground hover:text-accent-400 hover:bg-accent-500/10 transition-all"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-foreground">
                      Display Name
                    </label>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your display name"
                      disabled={isLoading}
                      maxLength={100}
                    />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      This name will appear on your posts and comments
                    </p>
                  </div>

                  {error && (
                    <div className="rounded-lg bg-accent-500/10 border border-accent-500/20 p-3 text-sm text-accent-400">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onClose}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button type="submit" isLoading={isLoading} className="flex-1">
                      <Save className="h-4 w-4 mr-1" />
                      Save Changes
                    </Button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}