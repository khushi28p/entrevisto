import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

import { useMemo } from "react";
import { Menu, Sparkles } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

import { Logo } from "./logo";

interface SiteHeaderProps {
  className?: string;
}

type NavItem = {
  label: string;
  href: string;
};

export function SiteHeader({ className }: SiteHeaderProps) {
  const navItems = useMemo<NavItem[]>(
    () => [
      { label: "Product", href: "#product" },
      { label: "Workflow", href: "#workflow" },
      { label: "Insights", href: "#insights" },
      { label: "Testimonials", href: "#testimonials" },
    ],
    [],
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:h-20 sm:px-6">
        <Link href="/" className="transition-transform hover:scale-105"> {/* Changed to Link to homepage */}
          <Logo />
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              className="relative transition-colors hover:text-foreground"
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <nav className="flex items-center gap-3">
          <SignedOut>
            <SignInButton mode="modal">
              {/* Using Shadcn Button directly for consistent styling */}
              <Button variant="ghost" className="text-gray-700 hover:text-[#6c47ff] text-sm sm:text-base">
                Sign In
              </Button>
            </SignInButton>

            <SignUpButton mode="modal">
              {/* Using Shadcn Button directly with consistent styling via utility classes */}
              <Button className="bg-[#6c47ff] text-white rounded-full font-medium text-sm sm:text-base h-10 sm:h-11 px-5 cursor-pointer hover:bg-[#5a38e6] transition">
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </nav>
        <div className="flex items-center lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs">
              <div className="flex items-center justify-between">
                {/* Re-evaluate if 'text-lg' is still needed if 'compact' is defining size */}
                <Logo compact className="text-lg" /> 
                <Button variant="outline" size="sm" className="rounded-full">
                  Request a demo
                </Button>
              </div>
              <div className="mt-10 flex flex-col gap-6 text-lg font-medium text-foreground">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.href}>
                    <Link // Changed to Link for proper navigation
                      className="transition-colors hover:text-primary"
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </div>
              <div className="mt-8 rounded-2xl bg-muted/60 p-6 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">
                  Need a tailored rollout?
                </p>
                <p className="mt-2">
                  Our specialists can help you automate candidate screening for
                  your hiring playbook.
                </p>
                {/* Changed to SignUpButton for consistency */}
                <SignUpButton mode="modal">
                  <Button className="mt-6 w-full shadow-bold bg-primary-brand hover:bg-primary-brand-hover">
                    <Sparkles className="h-4 w-4 mr-2" /> {/* Added mr-2 for spacing */}
                    Start for free
                  </Button>
                </SignUpButton>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}


