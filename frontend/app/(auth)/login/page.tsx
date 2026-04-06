"use client";

import { useSearchParams } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl");

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your account">
      <LoginForm returnUrl={returnUrl} />
    </AuthLayout>
  );
}
