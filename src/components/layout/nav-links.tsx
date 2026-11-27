"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageSquare, ShieldCheck, Store, ArrowLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PUBLIC_LINKS = [
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/midmen", label: "Midmen", icon: ShieldCheck },
];

const AUTH_LINKS = [
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export function NavLinks({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();
  const links = isAuthenticated ? [...PUBLIC_LINKS, ...AUTH_LINKS] : PUBLIC_LINKS;

  return (
    <nav className="flex items-center gap-1 overflow-x-auto">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
