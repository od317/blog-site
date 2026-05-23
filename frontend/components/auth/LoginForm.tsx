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
import { X, LogIn, Eye, Sparkles } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDemoLoading, setIsDemoLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const performLogin = async (email: string, password: string) => {
    setServerError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
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
        router.push("/");
        window.location.href = "/";
      } else {
        setServerError(result.error || "Invalid email or password");
      }
    } catch (error) {
      console.error("Login error:", error);
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      setIsDemoLoading(false);
    }
  };

  const onSubmit = async (data: LoginInput) => {
    await performLogin(data.email, data.password);
  };

  const handleDemoLogin = async () => {
    setIsDemoLoading(true);

    // Fill in the demo credentials
    setValue("email", "demo@example.com");
    setValue("password", "demo123");

    // Perform login with demo credentials
    await performLogin("demo@example.com", "demo123");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Demo Login Button */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Quick Access
          </span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        fullWidth
        onClick={handleDemoLogin}
        isLoading={isDemoLoading}
        disabled={isLoading || isSubmitting}
        className="relative overflow-hidden group border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 transition-all duration-300"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative flex items-center justify-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <span className="font-medium">Try Demo Account</span>
          <Sparkles className="h-3 w-3 text-primary/70" />
        </div>
      </Button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Or sign in with email
          </span>
        </div>
      </div>

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
        disabled={isSubmitting || isLoading || isDemoLoading}
        {...register("email")}
      />

      {/* Password Input */}
      <Input
        label="Password"
        type="password"
        placeholder="••••••"
        error={errors.password?.message}
        disabled={isSubmitting || isLoading || isDemoLoading}
        {...register("password")}
      />

      {/* Submit Button */}
      <Button
        type="submit"
        isLoading={isLoading || isSubmitting}
        disabled={isDemoLoading}
        fullWidth
      >
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
