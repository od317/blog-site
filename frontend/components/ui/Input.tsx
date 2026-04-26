// components/ui/Input.tsx
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full rounded-lg border bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground transition-all
            focus:outline-none focus:ring-1 focus:ring-offset-0
            ${
              error
                ? "border-accent-500/50 focus:border-accent-400 focus:ring-accent-400/50"
                : "border-primary-500/20 focus:border-primary-400 focus:ring-primary-400/50 hover:border-primary-400/50"
            }
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-sm text-accent-400 flex items-center gap-1">
            <span className="inline-block h-1 w-1 rounded-full bg-accent-400" />
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";