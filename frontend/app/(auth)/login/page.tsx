"use client";

import { LoginForm } from "@/components/auth/LoginForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your account">
      <LoginForm returnUrl={returnUrl} />
    </AuthLayout>
  );
}
