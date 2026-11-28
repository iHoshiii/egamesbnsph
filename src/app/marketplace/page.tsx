import { Suspense } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { getActiveListings, getListingCategories } from "@/services/listing.service";
import { pesosToCentavos } from "@/lib/utils/currency";
import { ListingCard } from "@/components/marketplace/listing-card";
import { Button } from "@/components/ui/button";
import { MarketplaceFilters } from "@/components/marketplace/marketplace-filters";

interface MarketplaceSearchParams {
  q?: string;
  category?: string;
  rank?: string;
  minSkins?: string;
  maxPrice?: string;
}

async function MarketplaceContent({
  searchParams,
}: {
  searchParams: Promise<MarketplaceSearchParams>;
}) {
  const sp = await searchParams;
  const minSkins = sp.minSkins ? Number(sp.minSkins) : undefined;
  const maxPricePesos = sp.maxPrice ? Number(sp.maxPrice) : undefined;

  const [categories, listings] = await Promise.all([
    getListingCategories(),
    getActiveListings({
      query: sp.q,
      categorySlug: sp.category,
      highestRank: sp.rank,
      minSkins: Number.isFinite(minSkins) ? minSkins : undefined,
      maxPriceCentavos:
        maxPricePesos && Number.isFinite(maxPricePesos)
          ? pesosToCentavos(maxPricePesos)
          : undefined,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Marketplace</h1>
        <Link href="/listings/new">
          <Button className="gap-1.5">
            <PlusCircle className="h-4 w-4" />
            Post Listing
          </Button>
        </Link>
      </div>

      <MarketplaceFilters categories={categories} searchParams={sp} />

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
          No active listings found.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((item) => (
            <ListingCard
              key={item.id}
              id={item.id}
              title={item.title}
              priceCentavos={item.priceCentavos}
              skinsCount={item.skinsCount}
              collectorLevel={item.collectorLevel}
              highestRank={item.highestRank}
              midmanPreference={item.midmanPreference}
              categoryName={item.category.name}
              sellerName={
                item.seller.profile?.displayName ??
                item.seller.profile?.username ??
                "Seller"
              }
              media={item.media.map((m) => ({
                id: m.id,
                mediaType: m.mediaType,
                publicUrl: m.publicUrl,
              }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<MarketplaceSearchParams>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <MarketplaceContent searchParams={searchParams} />
    </Suspense>
  );
}
