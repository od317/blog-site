// components/providers/AuthProvider.tsx
"use client";

import { useAuthStore } from "@/lib/store/authStore";
import { useEffect, useRef } from "react";

interface AuthProviderProps {
  children: React.ReactNode;
  // Optional: Skip auth check on certain pages
  skipAuthCheck?: boolean;
}

export function AuthProvider({
  children,
  skipAuthCheck = false,
}: AuthProviderProps) {
  const { checkAuth, isAuthenticated, isLoading } = useAuthStore();
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Only check auth once when component mounts
    if (!hasCheckedRef.current && !skipAuthCheck) {
      hasCheckedRef.current = true;

      // Don't await - let it happen in background
      // This prevents blocking page rendering
      checkAuth().catch(console.error);
    }
  }, [checkAuth, skipAuthCheck]);

  // Don't block rendering - let children render immediately
  // Auth state will update when check completes
  return <>{children}</>;
}
