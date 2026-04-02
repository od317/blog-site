"use client";

import { useRealtime } from "@/lib/hooks/useRealtime";
import { useKeepAlive } from "@/lib/hooks/useKeepAlive";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRealtime();
  useKeepAlive(); // Add this to keep service alive

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
