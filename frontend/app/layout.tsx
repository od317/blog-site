"use client";

import { useRealtime } from "@/lib/hooks/useRealtime";
import { useKeepAlive } from "@/lib/hooks/useKeepAlive";
import { NotificationContainer } from "@/components/ui/NotificationContainer";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useRealtime();
  useKeepAlive();

  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <NotificationContainer />
      </body>
    </html>
  );
}
