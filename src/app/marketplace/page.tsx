import { Suspense } from "react";
import Link from "next/link";
import { PlusCircle, Search } from "lucide-react";
import { getActiveListings, getListingCategories } from "@/services/listing.service";
import { HIGHEST_RANKS } from "@/lib/validations/listing";
import { pesosToCentavos } from "@/lib/utils/currency";
import { ListingCard } from "@/components/marketplace/listing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MarketplaceFilters } from "@/components/marketplace/marketplace-filters";

interface MarketplaceSearchParams { q?: string; category?: string; rank?: string; minSkins?: string; maxPrice?: string }

async function MarketplaceContent({ searchParams }: { searchParams: Promise<MarketplaceSearchParams> }) {
  const sp = await searchParams;
  const minSkins = sp.minSkins ? Number(sp.minSkins) : undefined;
  const maxPricePesos = sp.maxPrice ? Number(sp.maxPrice) : undefined;

  const [categories, listings] = await Promise.all([
    getListingCategories(),
    getActiveListings({
      query: sp.q, categorySlug: sp.category, highestRank: sp.rank,
      minSkins: Number.isFinite(minSkins) ? minSkins : undefined,
      maxPriceCentavos: maxPricePesos && Number.isFinite(maxPricePesos) ? pesosToCentavos(maxPricePesos) : undefined,
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Marketplace</h1>
          <p className="text-sm text-muted-foreground">Browse Mobile Legends listings and coordinate safely with verified midmen.</p>
        </div>
        <Link href="/listings/new"><Button className="gap-1.5"><PlusCircle className="h-4 w-4" />Post Listing</Button></Link>
      </div>

      <MarketplaceFilters categories={categories} searchParams={sp} />

      {listings.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center">
          <p className="text-lg font-medium">No active listings found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or be the first to post a listing.</p>
          <Link href="/listings/new" className="mt-4 inline-block"><Button>Post a Listing</Button></Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((item) => (
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
    </div>
  );
}

export default function MarketplacePage({ searchParams }: { searchParams: Promise<MarketplaceSearchParams> }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-8"><div className="h-96 animate-pulse rounded-xl bg-muted" /></div>}>
      <MarketplaceContent searchParams={searchParams} />
    </Suspense>
  );
}
