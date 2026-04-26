// components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { useAuthStore } from "@/lib/store/authStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { setAuthTokens } from "@/app/actions/auth.actions";
import { X, LogIn } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
    setServerError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });
      console.log(response);
      const result = await response.json();

      if (response.ok) {
        await setAuthTokens(result.accessToken, result.refreshToken);

        useAuthStore.setState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        setSuccessMessage("Login successful! Redirecting...");

        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1000);
      } else {
        setServerError(result.error || "Invalid email or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Success Message */}
      {successMessage && (
        <div className="relative rounded-lg bg-primary-500/10 border border-primary-500/20 p-3 text-sm text-primary-400">
          <span>{successMessage}</span>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-400 hover:text-primary-300 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {serverError && (
        <div className="relative rounded-lg bg-accent-500/10 border border-accent-500/20 p-3 text-sm text-accent-400">
          <span>{serverError}</span>
          <button
            type="button"
            onClick={() => setServerError(null)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-accent-400 hover:text-accent-300 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
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
        <LogIn className="h-4 w-4 mr-2" />
        Sign In
      </Button>

      {/* Sign Up Link */}
      <p className="text-center text-sm text-muted-foreground">
        {"Don't"} have an account?{" "}
        <Link
          href="/register"
          className="text-primary-400 hover:text-primary-300 transition-colors font-medium"
        >
          Sign up
        </Link>
      </p>
    </form>
  );
}