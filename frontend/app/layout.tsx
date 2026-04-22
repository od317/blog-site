// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { ClientProviders } from "@/components/providers/ClientProviders";
import { AppHeader } from "@/components/layout/AppHeader";

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
      <body className="bg-gray-50">
        <AuthProvider>
          <ClientProviders>
            <div className="min-h-screen">
              <AppHeader />
              <main>{children}</main>
            </div>
          </ClientProviders>
        </AuthProvider>
      </body>
    </html>
  );
}
