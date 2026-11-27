import "server-only";
import { prisma } from "@/lib/prisma";
import { createAdminClient } from "@/lib/supabase/admin";

interface ReceiptInput {
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
}

export async function submitPayment(
  transactionId: string,
  buyerId: string,
  amountCentavos: number,
  referenceNumber: string,
  receipt: ReceiptInput,
) {
  const record = await prisma.transaction.findUnique({ where: { id: transactionId } });
  if (!record || record.buyerId !== buyerId) {
    throw new Error("Only the buyer can submit payment.");
  }
  if (record.status !== "PAYMENT_PENDING") {
    throw new Error("Transaction is not awaiting payment.");
  }

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        transactionId,
        payerId: buyerId,
        amountCentavos,
        referenceNumber,
        status: "SUBMITTED",
        receipts: { create: receipt },
      },
    });
    await tx.transaction.update({
      where: { id: transactionId },
      data: { status: "PAYMENT_SUBMITTED" },
    });
    await tx.transactionEvent.create({
      data: {
        transactionId,
        actorId: buyerId,
        eventType: "PAYMENT_SUBMITTED",
        summary: `Buyer submitted payment receipt (Ref: ${referenceNumber}).`,
      },
    });
    return payment;
  });
}

export async function verifyPayment(
  paymentId: string,
  midmanUserId: string,
  decision: "VERIFIED" | "REJECTED",
  notes?: string,
) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      transaction: { include: { midmanProfile: { select: { userId: true } } } },
    },
  });

  if (!payment || payment.transaction.midmanProfile.userId !== midmanUserId) {
    throw new Error("Only the assigned midman can verify payments.");
  }
  if (payment.status !== "SUBMITTED") {
    throw new Error("Payment is not in SUBMITTED state.");
  }

  const nextTxStatus = decision === "VERIFIED" ? "PAYMENT_VERIFIED" : "PAYMENT_PENDING";
  const summary =
    decision === "VERIFIED"
      ? "Midman verified actual payment receipt."
      : `Midman rejected payment${notes ? `: ${notes}` : "."}`;

  return prisma.$transaction([
    prisma.payment.update({ where: { id: paymentId }, data: { status: decision } }),
    prisma.paymentVerification.create({
      data: { paymentId, midmanUserId, decision, notes: notes ?? null },
    }),
    prisma.transaction.update({
      where: { id: payment.transactionId },
      data: { status: nextTxStatus },
    }),
    prisma.transactionEvent.create({
      data: {
        transactionId: payment.transactionId,
        actorId: midmanUserId,
        eventType: `PAYMENT_${decision}`,
        summary,
      },
    }),
  ]);
}

export async function createSignedReceiptUrl(storagePath: string) {
  const admin = createAdminClient();
  const { data, error } = await admin.storage
    .from("private-payments")
    .createSignedUrl(storagePath, 300);
  if (error || !data) return null;
  return data.signedUrl;
}
