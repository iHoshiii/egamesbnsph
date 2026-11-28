"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { resolveDisputeAction } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminDisputeCardProps {
  dispute: {
    id: string;
    status: string;
    reason: string;
    listingTitle: string;
    buyerName: string;
    sellerName: string;
    evidence: { id: string; notes: string | null; signedUrl: string | null }[];
  };
}

export function AdminDisputeCard({ dispute }: AdminDisputeCardProps) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleResolve(outcome: "COMPLETED" | "CANCELLED") {
    if (notes.trim().length < 5) {
      toast.error("Please enter resolution notes (min 5 chars).");
      return;
    }
    setBusy(true);
    const res = await resolveDisputeAction({ disputeId: dispute.id, outcome, notes });
    setBusy(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success(`Dispute resolved as ${outcome}.`);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">{dispute.listingTitle}</CardTitle>
          <Badge variant="destructive">{dispute.status}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Buyer: {dispute.buyerName} · Seller: {dispute.sellerName}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <p className="rounded bg-muted p-2.5">{dispute.reason}</p>
        {dispute.evidence.map((ev, idx) => (
          <div key={ev.id} className="flex items-center justify-between border-b pb-1">
            <span>Evidence #{idx + 1}{ev.notes ? `: ${ev.notes}` : ""}</span>
            {ev.signedUrl && (
              <a href={ev.signedUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                View <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
        <Input
          placeholder="Admin resolution notes..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="h-8 text-xs"
        />
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" disabled={busy} onClick={() => handleResolve("COMPLETED")}>
            Resolve Completed
          </Button>
          <Button size="sm" variant="destructive" className="flex-1" disabled={busy} onClick={() => handleResolve("CANCELLED")}>
            Resolve Cancelled
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
