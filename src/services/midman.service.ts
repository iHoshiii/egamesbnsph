import "server-only";
import { prisma } from "@/lib/prisma";

export async function getVerifiedMidmen() {
  return prisma.midmanProfile.findMany({
    where: { verificationStatus: "VERIFIED" },
    include: {
      user: {
        select: {
          profile: {
            select: {
              username: true,
              avatarUrl: true,
            },
          },
        },
      },
      socials: true,
      paymentMethods: {
        where: { isActive: true },
      },
    },
    orderBy: [{ completedCount: "desc" }, { createdAt: "asc" }],
  });
}

export async function getMidmanById(id: string) {
  return prisma.midmanProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          profile: {
            select: {
              username: true,
              avatarUrl: true,
            },
          },
        },
      },
      socials: true,
      paymentMethods: {
        where: { isActive: true },
      },
    },
  });
}
