// components/auth/RegisterForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { registerSchema, RegisterInput } from "@/lib/validations/auth";
import { useAuth } from "@/lib/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { UserPlus } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const { register: registerUser, isLoading, error } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError(null);
    setSuccessMessage(null);

    const result = await registerUser(data);

    if (result.success) {
        router.push("/");
        router.refresh();
    } else if (result.error) {
      setServerError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="rounded-lg bg-accent-500/10 border border-accent-500/20 p-3 text-sm text-accent-400">
          {serverError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg bg-primary-500/10 border border-primary-500/20 p-3 text-sm text-primary-400">
          {successMessage}
        </div>
      )}

      <Input
        label="Username"
        placeholder="johndoe"
        error={errors.username?.message}
        {...register("username")}
      />

      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        {...register("email")}
      />

      <Input
        label="Full Name (Optional)"
        placeholder="John Doe"
        error={errors.full_name?.message}
        {...register("full_name")}
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••"
        error={errors.password?.message}
        {...register("password")}
      />

      <Button type="submit" isLoading={isLoading} fullWidth>
        <UserPlus className="h-4 w-4 mr-2" />
        Sign Up
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary-400 hover:text-primary-300 transition-colors font-medium"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}