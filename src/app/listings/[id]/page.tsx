import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MessageSquare, ShieldCheck, Sparkles, Trophy, User } from "lucide-react";
import { getListingById } from "@/services/listing.service";
import { startConversationAction } from "@/app/actions/messaging";
import { ReportListingButton } from "@/components/marketplace/report-listing-button";
import { formatPhpFromCentavos } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function ListingDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing || listing.status === "REMOVED") {
    notFound();
  }

  const images = listing.media.filter((m) => m.mediaType === "IMAGE");
  const video = listing.media.find((m) => m.mediaType === "VIDEO");
  const sellerName =
    listing.seller.profile?.displayName ??
    listing.seller.profile?.username ??
    "Seller";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Link
        href="/marketplace"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Marketplace
      </Link>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {video && (
            <div className="overflow-hidden rounded-xl border bg-black">
              <video
                src={video.publicUrl}
                controls
                className="max-h-96 w-full"
              />
            </div>
          )}

          {images.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {images.map((img, idx) => (
                <a
                  key={img.id}
                  href={img.publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`overflow-hidden rounded-xl border bg-muted ${
                    idx === 0 && images.length % 2 === 1 ? "sm:col-span-2" : ""
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.publicUrl}
                    alt={`${listing.title} photo ${idx + 1}`}
                    className="h-64 w-full object-cover transition-transform hover:scale-105"
                  />
                </a>
              ))}
            </div>
          ) : (
            !video && (
              <div className="flex h-56 items-center justify-center rounded-xl border bg-muted text-sm text-muted-foreground">
                No photos or video uploaded for this listing.
              </div>
            )
          )}

          <Card>
            <CardHeader>
              <CardTitle>Other Info &amp; Account Details</CardTitle>
            </CardHeader>
            <CardContent className="whitespace-pre-wrap text-sm leading-relaxed">
              {listing.description}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{listing.category.name}</Badge>
                <Badge
                  variant={listing.status === "ACTIVE" ? "default" : "outline"}
                >
                  {listing.status}
                </Badge>
              </div>
              <CardTitle className="pt-2 text-2xl">{listing.title}</CardTitle>
              <p className="text-2xl font-bold text-primary">
                {formatPhpFromCentavos(listing.priceCentavos)}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between border-b pb-2">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Sparkles className="h-4 w-4" />
                    Number of Skins
                  </dt>
                  <dd className="font-medium">
                    {listing.skinsCount !== null ? listing.skinsCount : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <dt className="text-muted-foreground">Collector Level</dt>
                  <dd className="font-medium">
                    {listing.collectorLevel ?? "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between border-b pb-2">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    Highest Rank
                  </dt>
                  <dd className="font-medium">{listing.highestRank ?? "—"}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                    Midman Preference
                  </dt>
                  <dd className="text-right font-medium">
                    {listing.midmanPreference ?? "Verified Midman"}
                  </dd>
                </div>
              </dl>

              <div className="space-y-2 pt-2">
                {listing.status === "ACTIVE" && (
                  <form action={startConversationAction.bind(null, listing.id)}>
                    <Button className="w-full gap-2" type="submit">
                      <MessageSquare className="h-4 w-4" />
                      Message Seller / Request Purchase
                    </Button>
                  </form>
                )}
                <Link href="/midmen" className="block">
                  <Button className="w-full" variant="outline">
                    View Verified Midmen
                  </Button>
                </Link>
                <ReportListingButton listingId={listing.id} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Seller
              </CardTitle>
              <CardDescription>{sellerName}</CardDescription>
            </CardHeader>
            {listing.seller.profile?.bio && (
              <CardContent className="text-xs text-muted-foreground">
                {listing.seller.profile.bio}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-4 py-8">
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <ListingDetailContent params={params} />
    </Suspense>
  );
}
