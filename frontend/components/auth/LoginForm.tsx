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

const API_URL = "http://localhost:5000/api";

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
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
    setServerError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      // Call backend directly
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
        // Store tokens in HttpOnly cookies via Server Action
        await setAuthTokens(result.accessToken, result.refreshToken);

        // Update Zustand store
        useAuthStore.setState({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });

        setSuccessMessage("Login successful! Redirecting...");

        // Redirect after short delay
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
        Do not have an account?{" "}
        <Link href="/register" className="text-blue-600 hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
