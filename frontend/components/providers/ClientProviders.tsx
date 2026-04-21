"use client";

import { ReactNode } from "react";
import { useRealtime } from "@/lib/hooks/useRealtime";
import { useKeepAlive } from "@/lib/hooks/useKeepAlive";
import { useNotificationRealtime } from "@/lib/hooks/useNotificationRealtime";

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  // All client-side hooks go here
  useRealtime();
  useKeepAlive();
  useNotificationRealtime();
  return <>{children}</>;
}
