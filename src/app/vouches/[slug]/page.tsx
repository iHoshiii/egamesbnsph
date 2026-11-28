import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, Star } from "lucide-react";
import { getReviewByVouchSlug } from "@/services/review.service";
import { formatPhpFromCentavos } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function VouchContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const review = await getReviewByVouchSlug(slug);
  if (!review) notFound();

  const buyerName =
    review.reviewer.profile?.displayName ??
    review.reviewer.profile?.username ??
    "Verified Buyer";

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge className="gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified Transaction Vouch
            </Badge>
            <span className="flex items-center gap-1 text-sm font-semibold">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              {review.rating}/5
            </span>
          </div>
          <CardTitle className="pt-2 text-xl">
            Midman: {review.midmanProfile.displayName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="rounded-lg bg-muted/50 p-4 italic">&ldquo;{review.comment}&rdquo;</p>
          <dl className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <dt>Buyer</dt>
              <dd className="font-medium text-foreground">{buyerName}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Listing</dt>
              <dd className="font-medium text-foreground">{review.transaction.listing.title}</dd>
            </div>
            {review.transaction.agreedAmountCentavos && (
              <div className="flex justify-between">
                <dt>Amount</dt>
                <dd className="font-medium text-foreground">
                  {formatPhpFromCentavos(review.transaction.agreedAmountCentavos)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt>Date</dt>
              <dd>{review.createdAt.toLocaleDateString()}</dd>
            </div>
          </dl>
          <div className="pt-2 text-center">
            <Link href="/midmen" className="text-xs font-medium text-primary hover:underline">
              View All Verified Midmen
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VouchPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-xl px-4 py-12"><div className="h-64 animate-pulse rounded-xl bg-muted" /></div>}>
      <VouchContent params={params} />
    </Suspense>
  );
}
