// components/ui/SortSelector.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { usePostStore } from "@/lib/store/postStore";

interface SortSelectorProps {
  currentSort: string;
}

const sortOptions = [
  { value: "latest", label: "Latest" },
  { value: "popular", label: "Most Popular" },
  { value: "oldest", label: "Oldest" },
];

export function SortSelector({ currentSort }: SortSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetPagination = usePostStore((state) => state.resetPagination);

  const handleSortChange = (sort: string) => {
    // Reset pagination before changing sort
    resetPagination();

    // Update URL with new sort parameter
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", sort);
    router.push(`/?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-600">Sort by:</label>
      <select
        value={currentSort}
        onChange={(e) => handleSortChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
