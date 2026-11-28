import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { getCurrentSessionUser } from "@/services/auth.service";
import { getUserConversations } from "@/services/messaging.service";
import { formatPhpFromCentavos } from "@/lib/utils/currency";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

async function MessagesListContent() {
  const user = await getCurrentSessionUser();
  if (!user) redirect("/login?next=/messages");

  const conversations = await getUserConversations(user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight">Messages</h1>

      {conversations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No conversations yet. Browse the{" "}
            <Link href="/marketplace" className="font-medium text-primary hover:underline">
              Marketplace
            </Link>{" "}
            to message a seller.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            const other = conv.members.find((m) => m.userId !== user.id);
            const otherName =
              other?.user.profile?.displayName ??
              other?.user.profile?.username ??
              "User";
            const lastMsg = conv.messages[0];

            return (
              <Link key={conv.id} href={`/messages/${conv.id}`} className="block">
                <Card className="transition-colors hover:bg-accent/40">
                  <CardContent className="flex items-center justify-between gap-4 py-4">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <span className="font-semibold">{otherName}</span>
                        {conv.listing && (
                          <Badge variant="outline" className="truncate font-normal">
                            {conv.listing.title}
                          </Badge>
                        )}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {lastMsg ? lastMsg.body : "No messages yet."}
                      </p>
                    </div>
                    {conv.listing && (
                      <span className="shrink-0 text-sm font-semibold text-primary">
                        {formatPhpFromCentavos(conv.listing.priceCentavos)}
                      </span>
                    )}
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

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl px-4 py-8"><div className="h-72 animate-pulse rounded-xl bg-muted" /></div>}>
      <MessagesListContent />
    </Suspense>
  );
}
