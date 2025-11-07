"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Navbar() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                ChronoMind
              </Link>
            </div>
            <div className="flex items-center">
              <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-xl font-bold text-gray-900">
              ChronoMind
            </Link>
            {session && (
              <div className="flex items-center space-x-4">
                <Link
                  href="/"
                  className="text-sm text-gray-700 hover:text-gray-900"
                >
                  Years
                </Link>
                <Link
                  href="/tags"
                  className="text-sm text-gray-700 hover:text-gray-900"
                >
                  🏷️ Tags
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {session ? (
              <>
                <span className="text-sm text-gray-700">
                  Welcome, {session.user?.name || session.user?.email}
                </span>
                <Button
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  variant="outline"
                  size="sm"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="space-x-2">
                <Link href="/auth/signin">
                  <Button variant="outline" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
