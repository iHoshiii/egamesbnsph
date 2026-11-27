import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PlusCircle, ExternalLink } from "lucide-react";
import { getCurrentSessionUser } from "@/services/auth.service";
import { getUserListings } from "@/services/listing.service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardListingRow } from "@/components/dashboard/listing-row";

async function DashboardContent() {
  const user = await getCurrentSessionUser();
  if (!user) redirect("/login?next=/dashboard");
  const listings = await getUserListings(user.id);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back,{" "}
            <span className="font-medium text-foreground">{user.profile?.displayName ?? user.email}</span>{" "}
            (@{user.profile?.username})
          </p>
        </div>
        <Link href="/listings/new">
          <Button className="gap-1.5"><PlusCircle className="h-4 w-4" />Post New Listing</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Account Roles</CardTitle>
          <CardDescription>Standard accounts can act as both Buyer and Seller. Midman and Admin roles are assigned only by platform administrators.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {user.roles.map((r) => (<Badge key={r.id} variant="secondary">{r.role}</Badge>))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Listings ({listings.length})</CardTitle>
          <CardDescription>Manage your active, paused, or sold marketplace listings.</CardDescription>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">You haven&apos;t posted any listings yet.</div>
          ) : (
            <div className="space-y-3">
              {listings.map((item) => (<DashboardListingRow key={item.id} listing={item} />))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-8"><div className="h-96 animate-pulse rounded-xl bg-muted" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
