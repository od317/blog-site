"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loginSchema, LoginInput } from "@/lib/validations/auth";
import { useAuth } from "@/lib/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { authApi } from "@/lib/api/auth";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading } = useAuth();

  // State management
  const [serverError, setServerError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [autoDismissTimer, setAutoDismissTimer] =
    useState<NodeJS.Timeout | null>(null);

  // Check for verification success query param
  useEffect(() => {
    const verified = searchParams.get("verified");
    if (verified === "true") {
      setSuccessMessage("Email verified successfully! You can now log in.");
      // Remove the query parameter from URL without refreshing
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      setAutoDismissTimer(timer);
    }

    // Cleanup timer on unmount
    return () => {
      if (autoDismissTimer) {
        clearTimeout(autoDismissTimer);
      }
    };
  }, [searchParams]);

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
    setNeedsVerification(false);
    setResendMessage(null);
    setSuccessMessage(null);

    const result = await login(data.email, data.password);

    if (result.success) {
      router.push("/");
      router.refresh();
    } else if (result.error?.toLowerCase().includes("verify")) {
      setNeedsVerification(true);
      setVerificationEmail(data.email);
      setServerError(result.error);
    } else if (result.error) {
      setServerError(result.error);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendMessage(null);

    try {
      await authApi.resendVerification(verificationEmail);
      setResendMessage("Verification email sent! Please check your inbox.");
      // Auto-dismiss resend message after 5 seconds
      setTimeout(() => {
        setResendMessage(null);
      }, 5000);
    } catch (error: any) {
      setResendMessage(error?.message || "Failed to send verification email");
    } finally {
      setIsResending(false);
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

      {/* Resend Verification Link */}
      {needsVerification && (
        <div className="text-center">
          <button
            type="button"
            onClick={handleResendVerification}
            disabled={isResending}
            className="text-sm text-blue-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? "Sending..." : "Resend verification email"}
          </button>
        </div>
      )}

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
