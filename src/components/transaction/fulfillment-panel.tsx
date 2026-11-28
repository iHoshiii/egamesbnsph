"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CheckCircle2, PackageCheck, XCircle } from "lucide-react";
import {
  confirmReceiptAction,
  respondAssignmentAction,
  submitFulfillmentAction,
} from "@/app/actions/transaction";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FulfillmentPanelProps {
  transactionId: string;
  status: string;
  isMidman: boolean;
  isSeller: boolean;
  isBuyer: boolean;
  fulfillmentNotes: string | null;
}

export function FulfillmentPanel(props: FulfillmentPanelProps) {
  const router = useRouter();
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAssignment(accept: boolean) {
    setBusy(true);
    const res = await respondAssignmentAction(props.transactionId, accept);
    setBusy(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success(accept ? "Assignment accepted and queued." : "Assignment declined.");
    router.refresh();
  }

  async function handleFulfill(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await submitFulfillmentAction({
      transactionId: props.transactionId,
      fulfillmentNotes: notes,
    });
    setBusy(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success("Fulfillment submitted. Waiting for buyer confirmation.");
    router.refresh();
  }

  async function handleConfirm() {
    setBusy(true);
    const res = await confirmReceiptAction(props.transactionId);
    setBusy(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success("Transaction completed!");
    router.refresh();
  }

  if (props.isMidman && props.status === "MIDMAN_ASSIGNED") {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Midman Assignment</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Button className="flex-1 gap-1" disabled={busy} onClick={() => handleAssignment(true)}><CheckCircle2 className="h-4 w-4" />Accept &amp; Queue</Button>
          <Button variant="outline" className="flex-1 gap-1" disabled={busy} onClick={() => handleAssignment(false)}><XCircle className="h-4 w-4" />Decline</Button>
        </CardContent>
      </Card>
    );
  }

  if (props.isSeller && props.status === "PAYMENT_VERIFIED") {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><PackageCheck className="h-4 w-4" />Fulfillment</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleFulfill} className="space-y-3">
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Summarize fulfillment completed (never include passwords or OTPs)."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs"
              required
            />
            <Button type="submit" className="w-full" disabled={busy}>Mark Fulfillment Completed</Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  if (props.status === "FULFILLMENT_PENDING") {
    return (
      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><PackageCheck className="h-4 w-4" />Buyer Confirmation</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-xs">
          {props.fulfillmentNotes && <p className="rounded-md bg-muted p-2.5">{props.fulfillmentNotes}</p>}
          {props.isBuyer ? (
            <Button onClick={handleConfirm} disabled={busy} className="w-full">Confirm Receipt &amp; Complete</Button>
          ) : (
            <p className="text-muted-foreground">Waiting for buyer to confirm successful receipt.</p>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
