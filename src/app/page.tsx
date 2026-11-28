import { Suspense } from "react";
import Link from "next/link";
import { Store, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeListings } from "@/components/home/home-listings";
import { HomeMidmen } from "@/components/home/home-midmen";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-8 sm:px-6">
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            egamesbnsph
          </h1>
          <p className="text-sm text-muted-foreground">
            Buy and sell with verified midman coordination.
          </p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Link href="/marketplace">
            <Button className="gap-2">
              <Store className="h-4 w-4" />
              Marketplace
            </Button>
          </Link>
          <Link href="/midmen">
            <Button variant="outline" className="gap-2">
              <Users className="h-4 w-4" />
              Midmen
            </Button>
          </Link>
        </div>
      </section>

      <Suspense
        fallback={
          <div className="grid gap-6 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        }
      >
        <HomeListings />
      </Suspense>

      <Suspense
        fallback={
          <div className="grid gap-6 sm:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        }
      >
        <HomeMidmen />
      </Suspense>
    </div>
  );
}
