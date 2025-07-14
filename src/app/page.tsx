"use client";

import { useState, useEffect } from "react";

export default function Home() {
  // Placeholder for Telegram login logic or minimal home page
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold">Welcome to GameHub (Telegram Auth Only)</h1>
    </div>
  );
}
