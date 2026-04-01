import { Metadata } from "next";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthLayout } from "@/components/auth/AuthLayout";

export const metadata: Metadata = {
  title: "Sign Up - Blog App",
  description: "Create a new account",
};

export default function RegisterPage() {
  return (
    <AuthLayout title="Create Account" subtitle="Join our community">
      <RegisterForm />
    </AuthLayout>
  );
}
