import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { updateListingStatusAction } from "@/app/actions/listing";
import { formatPhpFromCentavos } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ListingData {
  id: string;
  title: string;
  priceCentavos: number;
  status: string;
  skinsCount: number | null;
  highestRank: string | null;
  category: { name: string };
}

export function DashboardListingRow({ listing }: { listing: ListingData }) {
  return (
    <div className="flex flex-col justify-between gap-4 rounded-lg border p-4 sm:flex-row sm:items-center">
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/listings/${listing.id}`} className="font-semibold hover:text-primary hover:underline">{listing.title}</Link>
          <Badge variant={listing.status === "ACTIVE" ? "default" : "secondary"}>{listing.status}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatPhpFromCentavos(listing.priceCentavos)} · {listing.category.name}
          {listing.skinsCount !== null ? ` · ${listing.skinsCount} Skins` : ""}
          {listing.highestRank ? ` · ${listing.highestRank}` : ""}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/listings/${listing.id}`}>
          <Button variant="outline" size="sm" className="gap-1">View<ExternalLink className="h-3.5 w-3.5" /></Button>
        </Link>
        {listing.status === "ACTIVE" && (
          <form action={updateListingStatusAction.bind(null, listing.id, "PAUSED")}>
            <Button variant="secondary" size="sm" type="submit">Pause</Button>
          </form>
        )}
        {listing.status === "PAUSED" && (
          <form action={updateListingStatusAction.bind(null, listing.id, "ACTIVE")}>
            <Button variant="secondary" size="sm" type="submit">Activate</Button>
          </form>
        )}
        {listing.status !== "SOLD" && (
          <form action={updateListingStatusAction.bind(null, listing.id, "SOLD")}>
            <Button variant="outline" size="sm" type="submit">Mark Sold</Button>
          </form>
        )}
        <form action={updateListingStatusAction.bind(null, listing.id, "REMOVED")}>
          <Button variant="destructive" size="sm" type="submit">Remove</Button>
        </form>
      </div>
    </div>
  );
}
