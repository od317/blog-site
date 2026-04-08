"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { authApi } from "@/lib/api/auth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

function VerifyEmailContent() {
  const params = useParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const token = params.token as string;

    if (!token) {
      setStatus("error");
      setErrorMessage("Invalid verification link");
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await authApi.verifyEmail(token);

        if (response.message) {
          setStatus("success");
          // Redirect to login after 3 seconds
          setTimeout(() => {
            router.push("/login?verified=true");
          }, 3000);
        }
      } catch (error: any) {
        console.error("Verification error:", error);
        setStatus("error");
        setErrorMessage(
          error?.message || "Invalid or expired verification link",
        );
      }
    };

    verifyEmail();
  }, [params.token, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Verifying your email...</p>
        </Card>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-6 w-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Email Verified!
          </h1>
          <p className="mt-2 text-gray-600">
            Your email has been successfully verified. Redirecting to login...
          </p>
          <div className="mt-6">
            <Link href="/login">
              <Button variant="primary">Go to Login</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Verification Failed
        </h1>
        <p className="mt-2 text-gray-600">
          {errorMessage ||
            "Unable to verify your email. The link may have expired."}
        </p>
        <div className="mt-6 space-y-3">
          <Link href="/login">
            <Button variant="primary" fullWidth>
              Go to Login
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="outline" fullWidth>
              Create New Account
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
