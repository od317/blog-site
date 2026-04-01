"use client";

import { useRealtime } from "@/lib/hooks/useRealtime";
import { DebugAuth } from "@/components/DebugAuth";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize realtime connection when authenticated
  useRealtime();

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <DebugAuth /> {/* Add this to see auth state */}
      </body>
    </html>
  );
}
