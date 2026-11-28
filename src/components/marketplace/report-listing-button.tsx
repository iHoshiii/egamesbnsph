"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Flag } from "lucide-react";
import { createReportAction } from "@/app/actions/trust";
import { Button } from "@/components/ui/button";

export function ReportListingButton({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await createReportAction({
      targetType: "LISTING",
      targetId: listingId,
      reason,
    });
    setBusy(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success("Listing reported for admin review.");
    setOpen(false);
    setReason("");
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" className="w-full gap-1.5 text-xs text-muted-foreground" onClick={() => setOpen(true)}>
        <Flag className="h-3.5 w-3.5" />
        Report Listing
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-lg border p-3 text-xs">
      <textarea
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason for reporting..."
        className="flex w-full rounded-md border border-input bg-transparent px-2.5 py-1.5 text-xs"
        required
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" variant="destructive" className="flex-1" disabled={busy}>Submit</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
      </div>
    </form>
  );
}
