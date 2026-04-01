"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function VerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const { verifyEmail, isLoading, error } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    const token = params.token as string;

    if (token) {
      verifyEmail(token).then((result) => {
        if (result.success) {
          setStatus("success");
          setTimeout(() => {
            router.push("/");
          }, 3000);
        } else {
          setStatus("error");
        }
      });
    }
  }, [params.token, verifyEmail, router]);

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
          <div className="rounded-full bg-green-100 p-3 text-green-600 mx-auto w-fit">
            ✓
          </div>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Email Verified!
          </h1>
          <p className="mt-2 text-gray-600">
            Your email has been successfully verified. Redirecting to
            homepage...
          </p>
          <Link href="/">
            <Button className="mt-6">Go to Homepage</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        <div className="rounded-full bg-red-100 p-3 text-red-600 mx-auto w-fit">
          !
        </div>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">
          Verification Failed
        </h1>
        <p className="mt-2 text-gray-600">
          {error || "Invalid or expired verification link."}
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
