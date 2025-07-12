"use client";

import { useSession, signOut } from "next-auth/react";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function Header() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">GameHub</h1>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-6">
            <Link href="/lobby" className="text-xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
              GameHub
            </Link>
            {session?.user && (
              <Link 
                href="/lobby" 
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Game Lobby
              </Link>
            )}
          </div>
          
          {session?.user && (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {session.user.name}
              </span>
              <div className="relative">
                {session.user.image ? (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 