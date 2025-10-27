import { Mail, Linkedin, Twitter } from "lucide-react";

import { cn } from "@/lib/utils";

import { Logo } from "./logo";

interface SiteFooterProps {
  className?: string;
}

const navigation = {
  product: [
    { label: "Platform", href: "#product" },
    { label: "Workflow", href: "#workflow" },
    { label: "Automation", href: "#insights" },
  ],
  company: [
    { label: "About", href: "#about" },
    { label: "Careers", href: "#" },
    { label: "Press", href: "#" },
  ],
  resources: [
    { label: "Security", href: "#insights" },
    { label: "Support", href: "#" },
    { label: "Case Studies", href: "#insights" },
  ],
};

export function SiteFooter({ className }: SiteFooterProps) {
  const currentYear = new Date().getFullYear();
  return (
    <footer
      className={cn(
        "border-t border-border/70 bg-gradient-to-b from-background via-background/90 to-muted/80",
        className
      )}
    >
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="space-y-6">
            <Logo className="text-lg" />
            <p className="max-w-sm text-sm text-muted-foreground">
              Entrevisto automates interview screening with adaptive AI, giving
              your team richer candidate signals in minutes instead of days.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground">
              <a
                href="mailto:hello@entrevisto.ai"
                className="inline-flex items-center gap-2 text-sm transition-colors hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
                hello@entrevisto.ai
              </a>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform hover:-translate-y-1"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform hover:-translate-y-1"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Product
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {navigation.product.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Company
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {navigation.company.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Resources
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {navigation.resources.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-16 flex flex-col gap-4 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} Entrevisto. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-foreground">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-foreground">
              Terms of Service
            </a>
            <a href="#" className="hover:text-foreground">
              Data Processing Addendum
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
