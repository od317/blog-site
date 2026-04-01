import { ReactNode } from "react";
import { Card } from "@/components/ui/Card";

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
        </div>
        <div className="mt-6">{children}</div>
      </Card>
    </div>
  );
}
