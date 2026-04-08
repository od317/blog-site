"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { useAuth } from "@/lib/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const router = useRouter();
  const { login, isLoading } = useAuth();

  // State management
  const [serverError, setServerError] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [autoDismissTimer, setAutoDismissTimer] =
    useState<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginInput) => {
    // Clear all messages
    setServerError(null);
    setResendMessage(null);
    setSuccessMessage(null);

    const result = await login(data.email, data.password);

    if (result.success) {
      router.push("/");
      router.refresh();
    } else if (result.error) {
      setServerError(result.error);
    }
  };

  const dismissSuccessMessage = () => {
    setSuccessMessage(null);
    if (autoDismissTimer) {
      clearTimeout(autoDismissTimer);
      setAutoDismissTimer(null);
    }
  };

  const dismissErrorMessage = () => {
    setServerError(null);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Success Message */}
      {successMessage && (
        <div className="relative rounded-lg bg-green-50 p-3 text-sm text-green-600">
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={dismissSuccessMessage}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-800"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      {/* Error Message */}
      {serverError && (
        <div className="relative rounded-lg bg-red-50 p-3 text-sm text-red-600">
          <span>{serverError}</span>
          <button
            type="button"
            onClick={dismissErrorMessage}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-800"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      {/* Resend Message */}
      {resendMessage && (
        <div className="relative rounded-lg bg-green-50 p-3 text-sm text-green-600">
          <span>{resendMessage}</span>
          <button
            type="button"
            onClick={() => setResendMessage(null)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-green-600 hover:text-green-800"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}

      {/* Email Input */}
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        error={errors.email?.message}
        disabled={isSubmitting || isLoading}
        {...register("email")}
      />

      {/* Password Input */}
      <Input
        label="Password"
        type="password"
        placeholder="••••••"
        error={errors.password?.message}
        disabled={isSubmitting || isLoading}
        {...register("password")}
      />

      {/* Submit Button */}
      <Button type="submit" isLoading={isLoading || isSubmitting} fullWidth>
        Sign In
      </Button>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-gray-600">
        Dont have an account?{" "}
        <Link href="/register" className="text-blue-600 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
