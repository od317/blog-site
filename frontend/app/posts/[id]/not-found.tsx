// app/posts/[id]/not-found.tsx
import Link from "next/link";
import { FileQuestion, ArrowLeft } from "lucide-react";

export default function PostNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center">
        <div className="mb-6 flex justify-center">
          <div className="rounded-full border-2 border-primary-500/30 p-4">
            <FileQuestion className="h-16 w-16 text-primary-400" />
          </div>
        </div>
        
        <h1 className="mb-2 text-6xl font-bold bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
          404
        </h1>
        
        <h2 className="mb-2 text-2xl font-semibold text-foreground">
          Post Not Found
        </h2>
        
        <p className="mb-8 text-muted-foreground max-w-md">
          The post you are looking for does not exist or has been removed.
        </p>
        
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-primary-500 px-6 py-3 text-sm font-medium text-white hover:bg-primary-400 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}