import "server-only";
import { prisma } from "@/lib/prisma";

export async function proposeMidman(
  conversationId: string,
  proposedById: string,
  midmanProfileId: string,
) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      listing: { select: { id: true, sellerId: true } },
      members: { select: { userId: true } },
    },
  });

  if (!conversation || !conversation.listing) {
    throw new Error("Listing conversation not found.");
  }

  const memberIds = conversation.members.map((m) => m.userId);
  if (!memberIds.includes(proposedById)) {
    throw new Error("You are not a participant in this conversation.");
  }

  const sellerId = conversation.listing.sellerId;
  const buyerId = memberIds.find((id) => id !== sellerId);
  if (!buyerId) {
    throw new Error("Both buyer and seller must be in the conversation.");
  }

  const midman = await prisma.midmanProfile.findUnique({
    where: { id: midmanProfileId },
    select: { id: true, verificationStatus: true },
  });

  if (!midman || midman.verificationStatus !== "VERIFIED") {
    throw new Error("Selected midman is not currently verified.");
  }

  const now = new Date();
  const isBuyerProposing = proposedById === buyerId;

  return prisma.$transaction(async (tx) => {
    await tx.transactionProposal.updateMany({
      where: { conversationId, status: "PENDING" },
      data: { status: "SUPERSEDED" },
    });

    return tx.transactionProposal.create({
      data: {
        conversationId,
        listingId: conversation.listing!.id,
        buyerId,
        sellerId,
        proposedById,
        midmanProfileId,
        status: "PENDING",
        buyerAcceptedAt: isBuyerProposing ? now : null,
        sellerAcceptedAt: isBuyerProposing ? null : now,
      },
      include: {
        midmanProfile: {
          select: {
            id: true,
            displayName: true,
            feeDescription: true,
            availabilityStatus: true,
            verificationStatus: true,
          },
        },
      },
    });
  });
}

export async function respondToProposal(
  proposalId: string,
  userId: string,
  decision: "ACCEPT" | "REJECT",
) {
  const proposal = await prisma.transactionProposal.findUnique({
    where: { id: proposalId },
    include: {
      midmanProfile: { select: { verificationStatus: true } },
    },
  });

  if (!proposal) {
    throw new Error("Midman proposal not found.");
  }

  if (proposal.status !== "PENDING") {
    throw new Error("This proposal is no longer pending.");
  }

  const isBuyer = proposal.buyerId === userId;
  const isSeller = proposal.sellerId === userId;
  if (!isBuyer && !isSeller) {
    throw new Error("Only the buyer or seller can respond to this proposal.");
  }

  if (decision === "REJECT") {
    return prisma.transactionProposal.update({
      where: { id: proposalId },
      data: { status: "REJECTED" },
    });
  }

  if (proposal.midmanProfile.verificationStatus !== "VERIFIED") {
    throw new Error("Selected midman is no longer verified.");
  }

  const now = new Date();
  const buyerAcceptedAt = isBuyer ? (proposal.buyerAcceptedAt ?? now) : proposal.buyerAcceptedAt;
  const sellerAcceptedAt = isSeller ? (proposal.sellerAcceptedAt ?? now) : proposal.sellerAcceptedAt;
  const bothAccepted = Boolean(buyerAcceptedAt && sellerAcceptedAt);

  return prisma.transactionProposal.update({
    where: { id: proposalId },
    data: {
      buyerAcceptedAt,
      sellerAcceptedAt,
      status: bothAccepted ? "ACCEPTED" : "PENDING",
    },
  });
}
