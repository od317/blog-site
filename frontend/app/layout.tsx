// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { cookies } from 'next/headers'
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
  // Read theme from cookie on server
  const cookieStore = await cookies()
  const theme = cookieStore.get('theme')?.value || 'system'
  
  // Resolve the theme (for system, we default to light on server)
  const resolvedTheme = theme === 'dark' ? 'dark' : 'light'

  return (
    <html lang="en" className={resolvedTheme} suppressHydrationWarning>
      <head>
        {/* This script runs BEFORE React loads, preventing any flicker */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = document.cookie
                    .split('; ')
                    .find(function(row) { return row.startsWith('theme=') })
                    ?.split('=')[1];
                  
                  if (theme === 'system' || !theme) {
                    theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  
                  document.documentElement.classList.add(theme);
                } catch (e) {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="bg-background text-foreground antialiased">
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