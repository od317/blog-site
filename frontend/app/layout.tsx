import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "@/components/providers";
import { AuthProvider } from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
  title: "Blog App",
  description: "A real-time blog platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ClientProviders>
            <main>{children}</main>
          </ClientProviders>
        </AuthProvider>
      </body>
    </html>
  );
}
