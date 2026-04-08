import { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign In - Blog App",
  description: "Sign in to your account",
};

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your account">
      <Suspense fallback={<div className="text-center">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
