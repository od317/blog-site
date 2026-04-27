// components/ui/SortSelector.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { usePostStore } from "@/lib/store/postStore";
import { ArrowUpDown } from "lucide-react";

interface SortSelectorProps {
  currentSort: string;
}

const sortOptions = [
  { value: "latest", label: "Latest" },
  { value: "oldest", label: "Oldest" },
  { value: "most_liked", label: "Most Liked" },
  { value: "most_commented", label: "Most Commented" },
];

export function SortSelector({ currentSort }: SortSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetPagination = usePostStore((state) => state.resetPagination);

  const handleSortChange = (sort: string) => {
    resetPagination();

    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4 text-primary-400" />
      <label className="text-sm text-muted-foreground hidden sm:inline">
        Sort by:
      </label>
      <select
        value={currentSort}
        onChange={(e) => handleSortChange(e.target.value)}
        className="appearance-none rounded-lg border border-primary-500/20 bg-card px-3 py-1.5 pr-8 text-sm text-foreground focus:border-primary-400 focus:outline-none focus:ring-1 focus:ring-primary-400/50 transition-all cursor-pointer hover:border-primary-400/50 bg-[length:16px] bg-[center_right_0.5rem] bg-no-repeat"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2306b6d4' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        }}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}