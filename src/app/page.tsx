import { Suspense } from "react";
import Link from "next/link";
import { ShieldCheck, Store, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HomeListings } from "@/components/home/home-listings";
import { HomeMidmen } from "@/components/home/home-midmen";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6">
      <section className="rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-background p-8 sm:p-12">
        <div className="max-w-2xl space-y-5">
          <Badge variant="secondary" className="gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            Philippine Gaming Marketplace and Midman Coordination
          </Badge>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Buy and sell with verified midman coordination.
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            MLBNSPH.com connects buyers and sellers with admin-verified midmen,
            clear listing specs, and structured step-by-step transaction tracking.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/marketplace">
              <Button size="lg" className="gap-2"><Store className="h-4 w-4" />Explore Marketplace</Button>
            </Link>
            <Link href="/midmen">
              <Button size="lg" variant="outline" className="gap-2"><Users className="h-4 w-4" />Meet Verified Midmen</Button>
            </Link>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="grid gap-6 sm:grid-cols-3">{[1, 2, 3].map((i) => (<div key={i} className="h-56 animate-pulse rounded-xl bg-muted" />))}</div>}>
        <HomeListings />
      </Suspense>

      <Suspense fallback={<div className="grid gap-6 sm:grid-cols-3">{[1, 2, 3].map((i) => (<div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />))}</div>}>
        <HomeMidmen />
      </Suspense>
    </div>
  );
}
