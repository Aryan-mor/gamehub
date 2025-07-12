"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect } from "react";

export default function TestAuthPage() {
  const { data: session, status } = useSession();

  useEffect(() => {
    console.log("Session status:", status);
    console.log("Session data:", session);
  }, [session, status]);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <strong>Status:</strong> {status}
        </div>
        
        <div>
          <strong>Session:</strong> {session ? "Logged in" : "Not logged in"}
        </div>
        
        {session?.user && (
          <div>
            <strong>User:</strong> {session.user.name} ({session.user.email})
          </div>
        )}
        
        <div className="space-x-4">
          {!session ? (
            <button
              onClick={() => signIn("google")}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Sign In
            </button>
          ) : (
            <button
              onClick={() => signOut()}
              className="bg-red-500 text-white px-4 py-2 rounded"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
} 