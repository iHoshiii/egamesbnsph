import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle } from "lucide-react";
import { getCurrentSessionUser } from "@/services/auth.service";
import { getUserListings } from "@/services/listing.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardListingRow } from "@/components/dashboard/listing-row";

async function DashboardContent() {
  const user = await getCurrentSessionUser();
  if (!user) redirect("/login?next=/dashboard");
  const listings = await getUserListings(user.id);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              {user.profile?.displayName ?? user.email}
            </span>
            <span>@{user.profile?.username}</span>
            {user.roles.map((r) => (
              <Badge key={r.id} variant="secondary" className="text-xs">
                {r.role}
              </Badge>
            ))}
          </div>
        </div>
        <Link href="/listings/new">
          <Button className="gap-1.5">
            <PlusCircle className="h-4 w-4" />
            Post Listing
          </Button>
        </Link>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">My Listings ({listings.length})</h2>
        {listings.length === 0 ? (
          <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
            No listings yet.
          </div>
        ) : (
          <div className="space-y-3">
            {listings.map((item) => (
              <DashboardListingRow key={item.id} listing={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="h-72 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
