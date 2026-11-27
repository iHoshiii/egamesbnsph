import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { getCurrentSessionUser } from "@/services/auth.service";
import { getUserTransactions } from "@/services/transaction.service";
import { formatPhpFromCentavos } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

async function TransactionsListContent() {
  const user = await getCurrentSessionUser();
  if (!user) redirect("/login?next=/transactions");

  const items = await getUserTransactions(user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Active and completed midman-coordinated transactions.
        </p>
      </div>

      {items.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No transactions yet. Agree on a verified midman in{" "}
            <Link href="/messages" className="font-medium text-primary hover:underline">Messages</Link>{" "}
            to open a transaction room.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((tx) => {
            const role =
              tx.midmanProfile.userId === user.id
                ? "Midman"
                : tx.sellerId === user.id
                  ? "Seller"
                  : "Buyer";

            return (
              <Link key={tx.id} href={`/transactions/${tx.id}`} className="block">
                <Card className="transition-colors hover:bg-accent/40">
                  <CardContent className="flex flex-wrap items-center justify-between gap-4 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <span className="font-semibold">{tx.listing.title}</span>
                        <Badge variant="outline">{role}</Badge>
                        {tx.queueEntry && (
                          <Badge variant="secondary">Queue #{tx.queueEntry.position}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Midman: {tx.midmanProfile.displayName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge>{tx.status}</Badge>
                      <span className="text-sm font-semibold text-primary">
                        {formatPhpFromCentavos(tx.agreedAmountCentavos ?? tx.listing.priceCentavos)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-8"><div className="h-72 animate-pulse rounded-xl bg-muted" /></div>}>
      <TransactionsListContent />
    </Suspense>
  );
}
