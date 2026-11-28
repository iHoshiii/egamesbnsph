"use server";

import { revalidatePath } from "next/cache";
import { getCurrentSessionUser } from "@/services/auth.service";
import {
  approveTransactionTerms,
  confirmReceiptAndComplete,
  markFulfillmentSubmitted,
  midmanRespondAssignment,
  setTransactionTerms,
} from "@/services/transaction-workflow.service";
import { submitPayment, verifyPayment } from "@/services/payment.service";
import {
  fulfillSchema,
  setTermsSchema,
  submitPaymentSchema,
  verifyPaymentSchema,
} from "@/lib/validations/transaction";
import { pesosToCentavos } from "@/lib/utils/currency";
import { checkRateLimit } from "@/lib/utils/rate-limit";
import { validateUploadFile } from "@/lib/validations/upload";

export async function respondAssignmentAction(transactionId: string, accept: boolean) {
  const user = await getCurrentSessionUser();
  if (!user) return { error: "Sign in required." };
  try {
    await midmanRespondAssignment(transactionId, user.id, accept);
    revalidatePath(`/transactions/${transactionId}`);
    revalidatePath("/transactions");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Action failed." };
  }
}

export async function setTermsAction(payload: unknown) {
  const user = await getCurrentSessionUser();
  if (!user) return { error: "Sign in required." };
  const parsed = setTermsSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid terms." };

  try {
    await setTransactionTerms(
      parsed.data.transactionId,
      user.id,
      pesosToCentavos(parsed.data.agreedAmountPesos),
      pesosToCentavos(parsed.data.midmanFeePesos),
      parsed.data.termsNotes,
    );
    revalidatePath(`/transactions/${parsed.data.transactionId}`);
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to set terms." };
  }
}

export async function approveTermsAction(transactionId: string) {
  const user = await getCurrentSessionUser();
  if (!user) return { error: "Sign in required." };
  try {
    await approveTransactionTerms(transactionId, user.id);
    revalidatePath(`/transactions/${transactionId}`);
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to approve terms." };
  }
}

export async function submitPaymentAction(payload: unknown) {
  const user = await getCurrentSessionUser();
  if (!user) return { error: "Sign in required." };
  const parsed = submitPaymentSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid payment." };

  const rl = checkRateLimit(`payment:${user.id}`, 5, 60_000);
  if (!rl.allowed) return { error: "Too many payment submissions. Wait a minute." };

  const uploadCheck = validateUploadFile({
    storagePath: parsed.data.storagePath,
    mimeType: parsed.data.mimeType,
    fileSizeBytes: parsed.data.fileSizeBytes,
  });
  if (!uploadCheck.success) {
    return { error: uploadCheck.error.issues[0]?.message ?? "Invalid receipt file." };
  }

  try {
    await submitPayment(
      parsed.data.transactionId,
      user.id,
      pesosToCentavos(parsed.data.amountPesos),
      parsed.data.referenceNumber,
      {
        storagePath: parsed.data.storagePath,
        mimeType: parsed.data.mimeType,
        fileSizeBytes: parsed.data.fileSizeBytes,
      },
    );
    revalidatePath(`/transactions/${parsed.data.transactionId}`);
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to submit payment." };
  }
}

export async function verifyPaymentAction(payload: unknown, transactionId: string) {
  const user = await getCurrentSessionUser();
  if (!user) return { error: "Sign in required." };
  const parsed = verifyPaymentSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  try {
    await verifyPayment(parsed.data.paymentId, user.id, parsed.data.decision, parsed.data.notes);
    revalidatePath(`/transactions/${transactionId}`);
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to verify payment." };
  }
}

export async function submitFulfillmentAction(payload: unknown) {
  const user = await getCurrentSessionUser();
  if (!user) return { error: "Sign in required." };
  const parsed = fulfillSchema.safeParse(payload);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid input." };

  try {
    await markFulfillmentSubmitted(parsed.data.transactionId, user.id, parsed.data.fulfillmentNotes);
    revalidatePath(`/transactions/${parsed.data.transactionId}`);
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to submit fulfillment." };
  }
}

export async function confirmReceiptAction(transactionId: string) {
  const user = await getCurrentSessionUser();
  if (!user) return { error: "Sign in required." };
  try {
    await confirmReceiptAndComplete(transactionId, user.id);
    revalidatePath(`/transactions/${transactionId}`);
    revalidatePath("/transactions");
    revalidatePath("/marketplace");
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to complete." };
  }
}
