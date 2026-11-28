"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ExternalLink, Upload, Wallet, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { submitPaymentAction, verifyPaymentAction } from "@/app/actions/transaction";
import { ALLOWED_RECEIPT_TYPES, MAX_RECEIPT_BYTES } from "@/lib/validations/transaction";
import { formatPhpFromCentavos } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PaymentMethodItem { id: string; methodName: string; accountName: string; accountNumberMasked: string }
interface PaymentItem { id: string; amountCentavos: number; status: string; referenceNumber: string | null; signedReceiptUrl: string | null }

interface PaymentPanelProps {
  transactionId: string;
  currentUserId: string;
  status: string;
  isBuyer: boolean;
  isMidman: boolean;
  paymentMethods: PaymentMethodItem[];
  payments: PaymentItem[];
}

export function PaymentPanel(props: PaymentPanelProps) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [refNo, setRefNo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { toast.error("Please attach a payment receipt."); return; }
    if (!ALLOWED_RECEIPT_TYPES.includes(file.type as (typeof ALLOWED_RECEIPT_TYPES)[number])) {
      toast.error("Only JPG, PNG, WebP, or PDF receipts are allowed."); return;
    }
    if (file.size > MAX_RECEIPT_BYTES) { toast.error("Receipt must be 5 MB or smaller."); return; }

    setBusy(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${props.currentUserId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("private-payments").upload(path, file, { contentType: file.type });
      if (error) throw new Error(error.message);

      const res = await submitPaymentAction({
        transactionId: props.transactionId,
        amountPesos: Number(amount),
        referenceNumber: refNo,
        storagePath: path,
        mimeType: file.type,
        fileSizeBytes: file.size,
      });
      if (res.error) throw new Error(res.error);
      toast.success("Payment receipt submitted for midman verification.");
      setFile(null); setRefNo("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(paymentId: string, decision: "VERIFIED" | "REJECTED") {
    setBusy(true);
    const res = await verifyPaymentAction({ paymentId, decision, notes: verifyNotes || undefined }, props.transactionId);
    setBusy(false);
    if (res.error) { toast.error(res.error); return; }
    toast.success(decision === "VERIFIED" ? "Payment verified." : "Payment rejected.");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Wallet className="h-4 w-4" />Manual Payment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        {props.paymentMethods.length > 0 && (
          <div className="space-y-1.5 rounded-lg bg-muted/40 p-3 text-xs">
            <p className="font-medium">Midman Payment Channels</p>
            {props.paymentMethods.map((pm) => (
              <p key={pm.id} className="text-muted-foreground">{pm.methodName}: {pm.accountName} ({pm.accountNumberMasked})</p>
            ))}
          </div>
        )}

        {props.payments.map((p) => (
          <div key={p.id} className="space-y-2 rounded-lg border p-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{formatPhpFromCentavos(p.amountCentavos)}</span>
              <Badge variant={p.status === "VERIFIED" ? "default" : "secondary"}>{p.status}</Badge>
            </div>
            <p className="text-muted-foreground">Ref: {p.referenceNumber ?? "None"}</p>
            {p.signedReceiptUrl && (
              <a href={p.signedReceiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                View Private Receipt <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {props.isMidman && p.status === "SUBMITTED" && (
              <div className="space-y-2 border-t pt-2">
                <Input placeholder="Optional verification notes" value={verifyNotes} onChange={(e) => setVerifyNotes(e.target.value)} className="h-8 text-xs" />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 gap-1" disabled={busy} onClick={() => handleVerify(p.id, "VERIFIED")}><Check className="h-3.5 w-3.5" />Verify</Button>
                  <Button size="sm" variant="destructive" className="flex-1 gap-1" disabled={busy} onClick={() => handleVerify(p.id, "REJECTED")}><X className="h-3.5 w-3.5" />Reject</Button>
                </div>
              </div>
            )}
          </div>
        ))}

        {props.isBuyer && props.status === "PAYMENT_PENDING" && (
          <form onSubmit={handleSubmitPayment} className="space-y-3 border-t pt-3">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1"><Label className="text-xs">Amount Sent (PHP)</Label><Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required /></div>
              <div className="space-y-1"><Label className="text-xs">Reference No.</Label><Input value={refNo} onChange={(e) => setRefNo(e.target.value)} placeholder="e.g. GCash Ref" required /></div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Receipt Image or PDF (max 5 MB)</Label>
              <Input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
            </div>
            <Button type="submit" className="w-full gap-1.5" disabled={busy}><Upload className="h-4 w-4" />I&apos;ve Paid (Submit Receipt)</Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
