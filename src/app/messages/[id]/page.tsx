import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentSessionUser } from "@/services/auth.service";
import { getConversationDetail } from "@/services/messaging.service";
import { getVerifiedMidmen } from "@/services/midman.service";
import { formatPhpFromCentavos } from "@/lib/utils/currency";
import { ChatRoom } from "@/components/messaging/chat-room";
import { MidmanProposalPanel } from "@/components/messaging/midman-proposal-panel";

async function ConversationDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentSessionUser();
  if (!user) redirect(`/login?next=/messages/${id}`);

  const [conversation, midmen] = await Promise.all([
    getConversationDetail(id, user.id),
    getVerifiedMidmen(),
  ]);

  if (!conversation) notFound();

  const other = conversation.members.find((m) => m.userId !== user.id);
  const otherName =
    other?.user.profile?.displayName ??
    other?.user.profile?.username ??
    "Participant";
  const latest = conversation.proposals[0] ?? null;
  const isBuyer = conversation.listing
    ? conversation.listing.sellerId !== user.id
    : true;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/messages"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            All Messages
          </Link>
          <h1 className="text-2xl font-bold">Chat with {otherName}</h1>
          {conversation.listing && (
            <p className="text-sm text-muted-foreground">
              Listing:{" "}
              <Link
                href={`/listings/${conversation.listing.id}`}
                className="font-medium text-primary hover:underline"
              >
                {conversation.listing.title}
              </Link>{" "}
              ({formatPhpFromCentavos(conversation.listing.priceCentavos)})
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ChatRoom
            conversationId={conversation.id}
            currentUserId={user.id}
            initialMessages={conversation.messages.map((m) => ({
              id: m.id,
              senderId: m.senderId,
              senderName:
                m.sender.profile?.displayName ??
                m.sender.profile?.username ??
                "User",
              body: m.body,
              createdAt: m.createdAt.toISOString(),
            }))}
          />
        </div>

        <div>
          <MidmanProposalPanel
            conversationId={conversation.id}
            currentUserId={user.id}
            isBuyer={isBuyer}
            midmen={midmen.map((mm) => ({
              id: mm.id,
              displayName: mm.displayName,
              feeDescription: mm.feeDescription,
              availabilityStatus: mm.availabilityStatus,
            }))}
            latestProposal={
              latest
                ? {
                    id: latest.id,
                    status: latest.status,
                    midmanName: latest.midmanProfile.displayName,
                    midmanFee: latest.midmanProfile.feeDescription,
                    buyerAccepted: Boolean(latest.buyerAcceptedAt),
                    sellerAccepted: Boolean(latest.sellerAcceptedAt),
                    proposedById: latest.proposedById,
                    transactionId: latest.transaction?.id ?? null,
                  }
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}

export default function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-8"><div className="h-96 animate-pulse rounded-xl bg-muted" /></div>}>
      <ConversationDetailContent params={params} />
    </Suspense>
  );
}
