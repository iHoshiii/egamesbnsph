import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, ShieldCheck } from "lucide-react";
import { getCurrentSessionUser } from "@/services/auth.service";
import { getTransactionDetail } from "@/services/transaction.service";
import { createSignedReceiptUrl } from "@/services/payment.service";
import { formatPhpFromCentavos } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatRoom } from "@/components/messaging/chat-room";
import { FulfillmentPanel } from "@/components/transaction/fulfillment-panel";
import { TermsPanel } from "@/components/transaction/terms-panel";
import { PaymentPanel } from "@/components/transaction/payment-panel";

async function TransactionRoomContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentSessionUser();
  if (!user) redirect(`/login?next=/transactions/${id}`);

  const tx = await getTransactionDetail(id, user.id);
  if (!tx) notFound();

  const isBuyer = tx.buyerId === user.id;
  const isSeller = tx.sellerId === user.id;
  const isMidman = tx.midmanProfile.userId === user.id;

  const paymentsWithUrls = await Promise.all(
    tx.payments.map(async (p) => {
      const firstReceipt = p.receipts[0];
      const signedReceiptUrl = firstReceipt
        ? await createSignedReceiptUrl(firstReceipt.storagePath)
        : null;
      return {
        id: p.id,
        amountCentavos: p.amountCentavos,
        status: p.status,
        referenceNumber: p.referenceNumber,
        signedReceiptUrl,
      };
    }),
  );

  const buyerApproved = tx.agreements.some((a) => a.userId === tx.buyerId);
  const sellerApproved = tx.agreements.some((a) => a.userId === tx.sellerId);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Link href="/transactions" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            All Transactions
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{tx.listing.title}</h1>
            <Badge>{tx.status}</Badge>
            {tx.queueEntry && (
              <Badge variant="secondary">Queue #{tx.queueEntry.position}</Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Buyer: {tx.buyer.profile?.displayName ?? "Buyer"} · Seller: {tx.seller.profile?.displayName ?? "Seller"} · Midman: {tx.midmanProfile.displayName} ({formatPhpFromCentavos(tx.agreedAmountCentavos ?? tx.listing.priceCentavos)})
          </p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          3-Party Transaction Room
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ChatRoom
            conversationId={tx.conversationId}
            currentUserId={user.id}
            initialMessages={tx.conversation.messages.map((m) => ({
              id: m.id,
              senderId: m.senderId,
              senderName: m.sender.profile?.displayName ?? m.sender.profile?.username ?? "User",
              body: m.body,
              createdAt: m.createdAt.toISOString(),
            }))}
          />

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Activity History
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              {tx.events.map((ev) => (
                <div key={ev.id} className="flex justify-between gap-2 border-b pb-1.5 last:border-0">
                  <span>{ev.summary}</span>
                  <span className="shrink-0 text-muted-foreground">
                    {ev.createdAt.toLocaleString()}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <FulfillmentPanel
            transactionId={tx.id}
            status={tx.status}
            isMidman={isMidman}
            isSeller={isSeller}
            isBuyer={isBuyer}
            fulfillmentNotes={tx.fulfillmentNotes}
          />
          <TermsPanel
            transactionId={tx.id}
            status={tx.status}
            isMidman={isMidman}
            isBuyer={isBuyer}
            isSeller={isSeller}
            agreedAmountCentavos={tx.agreedAmountCentavos}
            midmanFeeCentavos={tx.midmanFeeCentavos}
            termsNotes={tx.termsNotes}
            buyerApproved={buyerApproved}
            sellerApproved={sellerApproved}
          />
          <PaymentPanel
            transactionId={tx.id}
            currentUserId={user.id}
            status={tx.status}
            isBuyer={isBuyer}
            isMidman={isMidman}
            paymentMethods={tx.midmanProfile.paymentMethods}
            payments={paymentsWithUrls}
          />
        </div>
      </div>
    </div>
  );
}

export default function TransactionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-8"><div className="h-96 animate-pulse rounded-xl bg-muted" /></div>}>
      <TransactionRoomContent params={params} />
    </Suspense>
  );
}
