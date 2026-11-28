"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { createReviewAction } from "@/app/actions/trust";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReviewPanelProps {
  transactionId: string;
  isBuyer: boolean;
  existingVouchSlug: string | null;
  existingRating: number | null;
  existingComment: string | null;
}

export function ReviewPanel(props: ReviewPanelProps) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  if (props.existingVouchSlug) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5 text-base">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            Verified Review ({props.existingRating}/5)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <p className="text-muted-foreground">{props.existingComment}</p>
          <Link href={`/vouches/${props.existingVouchSlug}`} className="inline-block font-medium text-primary hover:underline">
            View Public Vouch Link
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (!props.isBuyer) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await createReviewAction({
      transactionId: props.transactionId,
      rating,
      comment,
    });
    setBusy(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success("Review submitted and vouch link generated.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Leave a Review &amp; Vouch</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => setRating(n)} className="p-1">
                <Star className={`h-5 w-5 ${n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your feedback on the midman and transaction."
            className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs"
            required
          />
          <Button type="submit" size="sm" className="w-full" disabled={busy}>
            Submit Review
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
