"use client";

import { useAuthStore } from "@/lib/store/authStore";

export function DebugAuth() {
  const { user, token, isAuthenticated } = useAuthStore();

  const checkLocalStorage = () => {
    const stored = localStorage.getItem("auth-storage");
    console.log("Raw localStorage:", stored);
    if (stored) {
      const parsed = JSON.parse(stored);
      console.log("Parsed localStorage:", parsed);
      console.log("Token:", parsed.state?.token);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg text-xs z-50">
      <div>
        Auth Status: {isAuthenticated ? "✅ Logged in" : "❌ Not logged in"}
      </div>
      <div>User: {user?.username || "None"}</div>
      <div>Token: {token ? `${token.substring(0, 20)}...` : "No token"}</div>
      <button
        onClick={checkLocalStorage}
        className="mt-2 bg-blue-500 px-2 py-1 rounded"
      >
        Debug LocalStorage
      </button>
    </div>
  );
}
