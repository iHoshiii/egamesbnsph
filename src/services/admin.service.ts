import "server-only";
import { prisma } from "@/lib/prisma";
import type { ListingStatus, ReportStatus, ReportTargetType } from "@/generated/prisma/enums";

export async function isAdminUser(userId: string): Promise<boolean> {
  const role = await prisma.userRole.findUnique({
    where: { userId_role: { userId, role: "ADMIN" } },
    select: { id: true },
  });
  return Boolean(role);
}

export async function requireAdmin(userId: string) {
  const ok = await isAdminUser(userId);
  if (!ok) throw new Error("Admin privileges required.");
}

export async function getAdminDashboardData() {
  const [disputes, reports, auditLogs] = await Promise.all([
    prisma.dispute.findMany({
      where: { status: { in: ["OPEN", "UNDER_REVIEW"] } },
      include: {
        transaction: {
          include: {
            listing: { select: { id: true, title: true } },
            buyer: { select: { profile: { select: { displayName: true } } } },
            seller: { select: { profile: { select: { displayName: true } } } },
          },
        },
        evidence: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.report.findMany({
      where: { status: "OPEN" },
      include: {
        reporter: { select: { profile: { select: { displayName: true } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.auditLog.findMany({
      include: {
        actor: { select: { profile: { select: { displayName: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  return { disputes, reports, auditLogs };
}

export async function resolveDispute(
  disputeId: string,
  adminUserId: string,
  outcome: "COMPLETED" | "CANCELLED",
  notes: string,
) {
  await requireAdmin(adminUserId);
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: { transaction: true },
  });
  if (!dispute) throw new Error("Dispute not found.");

  const disputeStatus =
    outcome === "COMPLETED" ? "RESOLVED_COMPLETED" : "RESOLVED_CANCELLED";

  return prisma.$transaction([
    prisma.dispute.update({ where: { id: disputeId }, data: { status: disputeStatus } }),
    prisma.disputeResolution.create({
      data: { disputeId, adminUserId, outcome, notes },
    }),
    prisma.transaction.update({
      where: { id: dispute.transactionId },
      data: {
        status: outcome,
        completedAt: outcome === "COMPLETED" ? new Date() : null,
      },
    }),
    prisma.listing.update({
      where: { id: dispute.transaction.listingId },
      data: { status: outcome === "COMPLETED" ? "SOLD" : "ACTIVE" },
    }),
    prisma.transactionQueue.updateMany({
      where: { transactionId: dispute.transactionId },
      data: { status: outcome === "COMPLETED" ? "COMPLETED" : "REMOVED" },
    }),
    prisma.transactionEvent.create({
      data: {
        transactionId: dispute.transactionId,
        actorId: adminUserId,
        eventType: "DISPUTE_RESOLVED",
        summary: `Admin resolved dispute as ${outcome}.`,
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: `DISPUTE_RESOLVED_${outcome}`,
        targetType: "DISPUTE",
        targetId: disputeId,
        metadata: notes,
      },
    }),
  ]);
}

export async function moderateListing(
  listingId: string,
  adminUserId: string,
  status: ListingStatus,
) {
  await requireAdmin(adminUserId);
  return prisma.$transaction([
    prisma.listing.update({ where: { id: listingId }, data: { status } }),
    prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: `LISTING_SET_${status}`,
        targetType: "LISTING",
        targetId: listingId,
      },
    }),
  ]);
}

export async function createReport(
  reporterId: string,
  targetType: ReportTargetType,
  targetId: string,
  reason: string,
) {
  return prisma.report.create({
    data: { reporterId, targetType, targetId, reason, status: "OPEN" },
  });
}

export async function updateReportStatus(
  reportId: string,
  adminUserId: string,
  status: ReportStatus,
) {
  await requireAdmin(adminUserId);
  return prisma.$transaction([
    prisma.report.update({ where: { id: reportId }, data: { status } }),
    prisma.auditLog.create({
      data: {
        actorId: adminUserId,
        action: `REPORT_${status}`,
        targetType: "REPORT",
        targetId: reportId,
      },
    }),
  ]);
}
