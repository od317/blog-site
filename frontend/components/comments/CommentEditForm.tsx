"use client";

import { useState } from "react";

interface CommentEditFormProps {
  initialContent: string;
  isUpdating: boolean;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
}

export function CommentEditForm({
  initialContent,
  isUpdating,
  onSave,
  onCancel,
}: CommentEditFormProps) {
  const [content, setContent] = useState(initialContent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    await onSave(content.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={2}
        autoFocus
        disabled={isUpdating}
      />
      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={isUpdating || !content.trim()}
          className="text-xs text-green-600 hover:text-green-700 disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
