import { describe, expect, it } from "vitest";
import {
  MAX_RECEIPT_BYTES,
  setTermsSchema,
  submitPaymentSchema,
  verifyPaymentSchema,
} from "./transaction";

describe("transaction and payment schemas", () => {
  const validId = "11111111-1111-4111-8111-111111111101";

  it("validates transaction terms", () => {
    expect(
      setTermsSchema.safeParse({
        transactionId: validId,
        agreedAmountPesos: 2500,
        midmanFeePesos: 50,
        termsNotes: "Buyer pays fee, handoff after verification.",
      }).success,
    ).toBe(true);
  });

  it("rejects oversized payment receipts", () => {
    expect(
      submitPaymentSchema.safeParse({
        transactionId: validId,
        amountPesos: 2550,
        referenceNumber: "GC123456",
        storagePath: "u/r.png",
        mimeType: "image/png",
        fileSizeBytes: MAX_RECEIPT_BYTES + 1,
      }).success,
    ).toBe(false);
  });

  it("validates payment verification decisions", () => {
    expect(
      verifyPaymentSchema.safeParse({ paymentId: validId, decision: "VERIFIED" }).success,
    ).toBe(true);
    expect(
      verifyPaymentSchema.safeParse({ paymentId: validId, decision: "PENDING" }).success,
    ).toBe(false);
  });
});
