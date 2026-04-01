import { Metadata } from "next";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export const metadata: Metadata = {
  title: "Sign In - Blog App",
  description: "Sign in to your account",
};

export default function LoginPage() {
  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your account">
      <LoginForm />
    </AuthLayout>
  );
}
