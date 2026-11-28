import "server-only";
import { prisma } from "@/lib/prisma";

export async function getOrCreateDirectConversation(
  buyerId: string,
  listingId: string,
) {
  const listing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { id: true, sellerId: true, status: true },
  });

  if (!listing || listing.status !== "ACTIVE") {
    throw new Error("Listing is not available for purchase requests.");
  }

  if (listing.sellerId === buyerId) {
    throw new Error("You cannot start a purchase chat on your own listing.");
  }

  const existing = await prisma.conversation.findFirst({
    where: {
      type: "DIRECT",
      listingId: listing.id,
      AND: [
        { members: { some: { userId: buyerId } } },
        { members: { some: { userId: listing.sellerId } } },
      ],
    },
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.conversation.create({
    data: {
      type: "DIRECT",
      listingId: listing.id,
      members: {
        createMany: {
          data: [{ userId: buyerId }, { userId: listing.sellerId }],
        },
      },
    },
    select: { id: true },
  });

  return created.id;
}

export async function getUserConversations(userId: string) {
  return prisma.conversation.findMany({
    where: { members: { some: { userId } } },
    include: {
      listing: {
        select: { id: true, title: true, priceCentavos: true, status: true },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              profile: { select: { username: true, displayName: true } },
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getConversationDetail(
  conversationId: string,
  userId: string,
) {
  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
  });

  if (!member) {
    return null;
  }

  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          priceCentavos: true,
          status: true,
          sellerId: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              profile: { select: { username: true, displayName: true } },
            },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: {
              id: true,
              profile: { select: { username: true, displayName: true } },
            },
          },
        },
      },
      proposals: {
        orderBy: { createdAt: "desc" },
        include: {
          transaction: { select: { id: true } },
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
      },
    },
  });
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
) {
  const member = await prisma.conversationMember.findUnique({
    where: {
      conversationId_userId: { conversationId, userId: senderId },
    },
  });

  if (!member) {
    throw new Error("You are not a member of this conversation.");
  }

  const [message] = await prisma.$transaction([
    prisma.message.create({
      data: { conversationId, senderId, body },
      include: {
        sender: {
          select: {
            id: true,
            profile: { select: { username: true, displayName: true } },
          },
        },
      },
    }),
    prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return message;
}
