import { Suspense } from "react";
import Link from "next/link";
import { ShieldCheck, Store, PlusCircle, LayoutDashboard, LogOut, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/actions/auth";

async function NavbarAuthActions() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login">
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
        </Link>
        <Link href="/register">
          <Button size="sm">Get Started</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href="/messages">
        <Button variant="ghost" size="sm" className="gap-1.5">
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Messages</span>
        </Button>
      </Link>
      <Link href="/listings/new">
        <Button size="sm" className="gap-1.5">
          <PlusCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Post Listing</span>
        </Button>
      </Link>
      <Link href="/dashboard">
        <Button variant="outline" size="sm" className="gap-1.5">
          <LayoutDashboard className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Button>
      </Link>
      <form action={signOutAction}>
        <Button variant="ghost" size="sm" type="submit" title="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-bold tracking-tight">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="text-lg">MLBNSPH.com</span>
          </Link>
          <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-muted-foreground">
            <Link
              href="/marketplace"
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Store className="h-4 w-4" />
              Marketplace
            </Link>
            <Link
              href="/midmen"
              className="flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <ShieldCheck className="h-4 w-4" />
              Verified Midmen
            </Link>
          </nav>
        </div>

        <Suspense
          fallback={
            <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
          }
        >
          <NavbarAuthActions />
        </Suspense>
      </div>
    </header>
  );
}
