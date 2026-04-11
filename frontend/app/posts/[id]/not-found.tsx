import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function PostNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-gray-900">404</h1>
        <h2 className="mb-2 text-2xl font-semibold text-gray-700">
          Post Not Found
        </h2>
        <p className="mb-6 text-gray-500">
          The post youre looking for doesnt exist or has been removed.
        </p>
        <Link href="/">
          <Button>← Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}
