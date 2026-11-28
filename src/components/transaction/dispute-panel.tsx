"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, ExternalLink, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { addEvidenceAction, openDisputeAction } from "@/app/actions/trust";
import { ALLOWED_EVIDENCE_TYPES, MAX_EVIDENCE_BYTES } from "@/lib/validations/trust";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EvidenceItem { id: string; notes: string | null; signedUrl: string | null }

interface DisputePanelProps {
  transactionId: string;
  currentUserId: string;
  txStatus: string;
  isBuyerOrSeller: boolean;
  dispute: { id: string; status: string; reason: string; evidence: EvidenceItem[] } | null;
}

export function DisputePanel(props: DisputePanelProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleOpen(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await openDisputeAction({ transactionId: props.transactionId, reason });
    setBusy(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success("Dispute opened. Normal progression is paused for admin review.");
    router.refresh();
  }

  async function handleUploadEvidence(e: React.FormEvent) {
    e.preventDefault();
    if (!props.dispute || !file) return;
    if (!ALLOWED_EVIDENCE_TYPES.includes(file.type as (typeof ALLOWED_EVIDENCE_TYPES)[number])) {
      toast.error("Only JPG, PNG, WebP, or PDF files allowed."); return;
    }
    if (file.size > MAX_EVIDENCE_BYTES) { toast.error("Max file size is 5 MB."); return; }

    setBusy(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${props.currentUserId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("private-disputes").upload(path, file, { contentType: file.type });
      if (error) throw new Error(error.message);

      const res = await addEvidenceAction(
        { disputeId: props.dispute.id, storagePath: path, mimeType: file.type, fileSizeBytes: file.size, notes: notes || undefined },
        props.transactionId,
      );
      if (res.error) throw new Error(res.error);
      toast.success("Evidence uploaded.");
      setFile(null); setNotes("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!props.dispute) {
    if (!props.isBuyerOrSeller || ["COMPLETED", "CANCELLED"].includes(props.txStatus)) return null;
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-1.5 text-base text-destructive">
            <AlertTriangle className="h-4 w-4" />
            Open Dispute
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOpen} className="space-y-3 text-xs">
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the issue clearly for admin review."
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs"
              required
            />
            <Button type="submit" variant="destructive" size="sm" className="w-full" disabled={busy}>
              Open Dispute &amp; Pause Transaction
            </Button>
          </form>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/40">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-destructive">Dispute</CardTitle>
          <Badge variant="destructive">{props.dispute.status}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-xs">
        <p className="rounded-md bg-muted p-2.5">{props.dispute.reason}</p>
        {props.dispute.evidence.map((ev, i) => (
          <div key={ev.id} className="flex items-center justify-between rounded border px-2.5 py-1.5">
            <span>Evidence #{i + 1}{ev.notes ? `: ${ev.notes}` : ""}</span>
            {ev.signedUrl && (
              <a href={ev.signedUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                View <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
        {["OPEN", "UNDER_REVIEW"].includes(props.dispute.status) && (
          <form onSubmit={handleUploadEvidence} className="space-y-2 border-t pt-2">
            <Input placeholder="Evidence note (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="h-8 text-xs" />
            <Input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
            <Button type="submit" size="sm" variant="outline" className="w-full gap-1" disabled={busy}>
              <Upload className="h-3.5 w-3.5" />
              Upload Evidence
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
