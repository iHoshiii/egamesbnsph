import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getActiveListings } from "@/services/listing.service";
import { ListingCard } from "@/components/marketplace/listing-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export async function HomeListings() {
  const listings = await getActiveListings();
  const recent = listings.slice(0, 3);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Latest Listings</h2>
          <p className="text-sm text-muted-foreground">Fresh Mobile Legends accounts and items on the marketplace.</p>
        </div>
        <Link href="/marketplace"><Button variant="ghost" className="gap-1.5">Browse all<ArrowRight className="h-4 w-4" /></Button></Link>
      </div>

      {recent.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No active listings yet. <Link href="/listings/new" className="font-medium text-primary hover:underline">Post the first listing</Link>.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recent.map((item) => (
            <ListingCard
              key={item.id} id={item.id} title={item.title} priceCentavos={item.priceCentavos}
              skinsCount={item.skinsCount} collectorLevel={item.collectorLevel} highestRank={item.highestRank}
              midmanPreference={item.midmanPreference} categoryName={item.category.name}
              sellerName={item.seller.profile?.displayName ?? item.seller.profile?.username ?? "Seller"}
              media={item.media.map((m) => ({ id: m.id, mediaType: m.mediaType, publicUrl: m.publicUrl }))}
            />
          ))}
        </div>
      )}
    </section>
  );
}
