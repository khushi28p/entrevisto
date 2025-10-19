"use client";

import { UserButton } from "@clerk/nextjs";
import { Logo } from "./logo";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between sm:h-20 sm:px-6">
        <a
          href="/dashboard"
          className="flex items-center gap-2 transition-transform hover:scale-105"
        >
          <Logo />
        </a>

        <div className="flex items-center gap-3">
          <UserButton />
        </div>
      </div>
    </nav>
  );
}
