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
            <main>{children}</main>
          </ClientProviders>
        </AuthProvider>
      </body>
    </html>
  );
}
