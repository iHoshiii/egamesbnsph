"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ShieldCheck, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  proposeMidmanAction,
  respondProposalAction,
} from "@/app/actions/messaging";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface VerifiedMidmanOption {
  id: string;
  displayName: string;
  feeDescription: string;
  availabilityStatus: string;
}

export interface ActiveProposalView {
  id: string;
  status: string;
  midmanName: string;
  midmanFee: string;
  buyerAccepted: boolean;
  sellerAccepted: boolean;
  proposedById: string;
}

interface MidmanProposalPanelProps {
  conversationId: string;
  currentUserId: string;
  isBuyer: boolean;
  midmen: VerifiedMidmanOption[];
  latestProposal: ActiveProposalView | null;
}

export function MidmanProposalPanel({
  conversationId,
  currentUserId,
  isBuyer,
  midmen,
  latestProposal,
}: MidmanProposalPanelProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(midmen[0]?.id ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`proposals:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transaction_proposals",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, router]);

  async function handlePropose(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || busy) return;
    setBusy(true);
    const res = await proposeMidmanAction(conversationId, selectedId);
    setBusy(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success("Midman proposed. Waiting for the other party.");
    router.refresh();
  }

  async function handleRespond(decision: "ACCEPT" | "REJECT") {
    if (!latestProposal || busy) return;
    setBusy(true);
    const res = await respondProposalAction(
      latestProposal.id,
      decision,
      conversationId,
    );
    setBusy(false);
    if (res.error) {
      toast.error(res.error);
      return;
    }
    toast.success(
      decision === "ACCEPT" ? "Midman proposal accepted." : "Proposal rejected.",
    );
    router.refresh();
  }

  const userAlreadyAccepted = latestProposal
    ? isBuyer
      ? latestProposal.buyerAccepted
      : latestProposal.sellerAccepted
    : false;
  const canRespond =
    latestProposal?.status === "PENDING" &&
    latestProposal.proposedById !== currentUserId &&
    !userAlreadyAccepted;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Midman Selection
        </CardTitle>
        <CardDescription>
          Both buyer and seller must agree on the same verified midman.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {latestProposal && (
          <div className="space-y-3 rounded-lg border bg-muted/40 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{latestProposal.midmanName}</span>
              <Badge
                variant={
                  latestProposal.status === "ACCEPTED" ? "default" : "secondary"
                }
              >
                {latestProposal.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {latestProposal.midmanFee}
            </p>
            <div className="flex gap-2 text-xs">
              <Badge variant={latestProposal.buyerAccepted ? "default" : "outline"}>
                Buyer {latestProposal.buyerAccepted ? "Accepted" : "Pending"}
              </Badge>
              <Badge variant={latestProposal.sellerAccepted ? "default" : "outline"}>
                Seller {latestProposal.sellerAccepted ? "Accepted" : "Pending"}
              </Badge>
            </div>
            {canRespond && (
              <div className="flex gap-2 pt-1">
                <Button size="sm" className="flex-1 gap-1" disabled={busy} onClick={() => handleRespond("ACCEPT")}>
                  <Check className="h-3.5 w-3.5" />
                  Accept
                </Button>
                <Button size="sm" variant="outline" className="flex-1 gap-1" disabled={busy} onClick={() => handleRespond("REJECT")}>
                  <X className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </div>
            )}
            {latestProposal.status === "ACCEPTED" && (
              <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                Mutual agreement complete. Transaction room creation arrives in Phase 4.
              </p>
            )}
          </div>
        )}

        {latestProposal?.status !== "ACCEPTED" && (
          <form onSubmit={handlePropose} className="space-y-3">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
            >
              {midmen.map((mm) => (
                <option key={mm.id} value={mm.id}>
                  {mm.displayName} ({mm.availabilityStatus})
                </option>
              ))}
            </select>
            <Button type="submit" className="w-full" variant="secondary" disabled={busy || !selectedId}>
              {latestProposal?.status === "PENDING"
                ? "Propose Different Midman"
                : "Propose Midman"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
