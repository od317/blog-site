"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { updateProfile } from "@/app/actions/profile.actions";
import { useAuthStore } from "@/lib/store/authStore";

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

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFullName(currentFullName || "");
      setError(null);
    }
  }, [isOpen, currentFullName]);

  // Handle escape key
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
        bio: null, // Don't change bio
      });

      if (result.success && result.user) {
        // Update user in auth store
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative w-full max-w-md rounded-lg bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-xl font-semibold">Edit Display Name</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1 hover:bg-gray-100"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
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
                <p className="mt-1 text-xs text-gray-500">
                  This name will appear on your posts and comments
                </p>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
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
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
