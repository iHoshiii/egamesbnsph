"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, FileText } from "lucide-react";
import { approveTermsAction, setTermsAction } from "@/app/actions/transaction";
import { formatPhpFromCentavos } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TermsPanelProps {
  transactionId: string;
  status: string;
  isMidman: boolean;
  isBuyer: boolean;
  isSeller: boolean;
  agreedAmountCentavos: number | null;
  midmanFeeCentavos: number | null;
  termsNotes: string | null;
  buyerApproved: boolean;
  sellerApproved: boolean;
}

export function TermsPanel(props: TermsPanelProps) {
  const router = useRouter();
  const [amount, setAmount] = useState(
    props.agreedAmountCentavos ? String(props.agreedAmountCentavos / 100) : "",
  );
  const [fee, setFee] = useState(
    props.midmanFeeCentavos ? String(props.midmanFeeCentavos / 100) : "50",
  );
  const [notes, setNotes] = useState(props.termsNotes ?? "");
  const [busy, setBusy] = useState(false);

  async function handleSaveTerms(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await setTermsAction({
      transactionId: props.transactionId,
      agreedAmountPesos: Number(amount),
      midmanFeePesos: Number(fee),
      termsNotes: notes,
    });
    setBusy(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success("Transaction terms published.");
    router.refresh();
  }

  async function handleApprove() {
    setBusy(true);
    const res = await approveTermsAction(props.transactionId);
    setBusy(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success("Terms approved.");
    router.refresh();
  }

  const canSetTerms = props.isMidman && ["QUEUED", "TERMS_PENDING"].includes(props.status);
  const needsMyApproval =
    props.status === "TERMS_PENDING" &&
    ((props.isBuyer && !props.buyerApproved) || (props.isSeller && !props.sellerApproved));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Transaction Terms
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {props.termsNotes && (
          <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Agreed Price</span>
              <span className="font-semibold">
                {props.agreedAmountCentavos ? formatPhpFromCentavos(props.agreedAmountCentavos) : "TBD"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Midman Fee</span>
              <span className="font-semibold">
                {props.midmanFeeCentavos !== null ? formatPhpFromCentavos(props.midmanFeeCentavos) : "TBD"}
              </span>
            </div>
            <p className="whitespace-pre-wrap border-t pt-2 text-xs text-muted-foreground">{props.termsNotes}</p>
            <div className="flex gap-2 pt-1">
              <Badge variant={props.buyerApproved ? "default" : "outline"}>Buyer {props.buyerApproved ? "Approved" : "Pending"}</Badge>
              <Badge variant={props.sellerApproved ? "default" : "outline"}>Seller {props.sellerApproved ? "Approved" : "Pending"}</Badge>
            </div>
          </div>
        )}

        {needsMyApproval && (
          <Button onClick={handleApprove} disabled={busy} className="w-full gap-1.5">
            <Check className="h-4 w-4" />
            Approve Transaction Terms
          </Button>
        )}

        {canSetTerms && (
          <form onSubmit={handleSaveTerms} className="space-y-3 border-t pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Item Price (PHP)</Label>
                <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Midman Fee (PHP)</Label>
                <Input type="number" step="0.01" value={fee} onChange={(e) => setFee(e.target.value)} required />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Terms &amp; Handoff Instructions</Label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="State agreed deliverables, fee split, and handoff steps."
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs"
                required
              />
            </div>
            <Button type="submit" size="sm" variant="secondary" className="w-full" disabled={busy}>
              Publish Terms for Approval
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
