"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Session } from "next-auth";
import { YearSwitcher } from "./year-switcher";

export default function Navbar({
  session: serverSession,
}: {
  session: Session | null;
}) {
  const { data: session } = useSession();

  // Use server session for initial render, then client session
  const activeSession = session ?? serverSession;

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/" className="text-xl font-bold text-gray-900 shrink-0">
              ChronoMind
            </Link>
            {activeSession && (
              <>
                {/* Desktop: show text links */}
                <Link
                  href="/"
                  className="hidden sm:block text-sm text-gray-700 hover:text-gray-900"
                >
                  Years
                </Link>
                <YearSwitcher userId={activeSession.user?.id || ""} />
                <Link
                  href="/tags"
                  className="hidden sm:block text-sm text-gray-700 hover:text-gray-900"
                >
                  🏷️ Tags
                </Link>
                {/* Mobile: show only tags icon */}
                <Link
                  href="/tags"
                  className="sm:hidden text-gray-700 hover:text-gray-900"
                  aria-label="Tags"
                >
                  🏷️
                </Link>
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2 sm:gap-3">
            {activeSession ? (
              <>
                {/* Hide welcome text on small and medium screens */}
                <span className="hidden lg:inline text-sm text-gray-700 truncate max-w-[150px]">
                  Welcome,{" "}
                  {activeSession.user?.name || activeSession.user?.email}
                </span>
                <Button
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="flex gap-2">
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
