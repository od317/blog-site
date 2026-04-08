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
      setSuccessMessage("Registration successful! You are now logged in.");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 2000);
    } else if (result.error) {
      setServerError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {serverError}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
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
        Sign Up
      </Button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
