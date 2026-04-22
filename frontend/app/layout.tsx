import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "@/components/providers";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Blog App",
  description: "A real-time blog platform",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ClientProviders>
            <NotificationBell />
            <Link href="/saved" className="text-gray-600 hover:text-gray-900">
              Saved
            </Link>
            <Link href="/search" className="text-gray-600 hover:text-gray-900">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </Link>
            <main>{children}</main>
          </ClientProviders>
        </AuthProvider>
      </body>
    </html>
  );
}
