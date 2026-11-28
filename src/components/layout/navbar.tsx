import { Suspense } from "react";
import Link from "next/link";
import { LogOut, PlusCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { signOutAction } from "@/app/actions/auth";
import { NavLinks } from "./nav-links";

async function NavbarSessionArea() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-1 items-center justify-between gap-3">
      <div className="hidden md:block">
        <NavLinks isAuthenticated={Boolean(user)} />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {user ? (
          <>
            <Link href="/listings/new">
              <Button size="sm" className="gap-1.5">
                <PlusCircle className="h-4 w-4" />
                <span>Sell</span>
              </Button>
            </Link>
            <form action={signOutAction}>
              <Button variant="ghost" size="sm" type="submit" title="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Register</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

async function MobileNavBar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="border-t px-4 py-1.5 md:hidden">
      <NavLinks isAuthenticated={Boolean(user)} />
    </div>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold tracking-tight">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="text-base sm:text-lg">egamesbnsph</span>
        </Link>

        <Suspense fallback={<div className="ml-auto h-8 w-28 animate-pulse rounded-md bg-muted" />}>
          <NavbarSessionArea />
        </Suspense>
      </div>

      <Suspense fallback={null}>
        <MobileNavBar />
      </Suspense>
    </header>
  );
}
