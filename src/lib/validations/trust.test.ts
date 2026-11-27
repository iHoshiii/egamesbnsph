import { describe, expect, it } from "vitest";
import {
  createReportSchema,
  createReviewSchema,
  MAX_EVIDENCE_BYTES,
  addEvidenceSchema,
  openDisputeSchema,
  resolveDisputeSchema,
} from "./trust";

describe("trust, dispute, and admin schemas", () => {
  const validId = "11111111-1111-4111-8111-111111111101";

  it("validates ratings between 1 and 5", () => {
    expect(
      createReviewSchema.safeParse({
        transactionId: validId,
        rating: 5,
        comment: "Smooth and fast midman!",
      }).success,
    ).toBe(true);
    expect(
      createReviewSchema.safeParse({
        transactionId: validId,
        rating: 6,
        comment: "Invalid rating",
      }).success,
    ).toBe(false);
  });

  it("validates dispute opening, evidence size, and resolution", () => {
    expect(
      openDisputeSchema.safeParse({
        transactionId: validId,
        reason: "Seller did not deliver the agreed account details.",
      }).success,
    ).toBe(true);
    expect(
      addEvidenceSchema.safeParse({
        disputeId: validId,
        storagePath: "u/ev.png",
        mimeType: "image/png",
        fileSizeBytes: MAX_EVIDENCE_BYTES + 1,
      }).success,
    ).toBe(false);
    expect(
      resolveDisputeSchema.safeParse({
        disputeId: validId,
        outcome: "CANCELLED",
        notes: "Refund buyer due to non-delivery.",
      }).success,
    ).toBe(true);
  });

  it("validates listing reports", () => {
    expect(
      createReportSchema.safeParse({
        targetType: "LISTING",
        targetId: validId,
        reason: "Suspicious duplicate screenshots.",
      }).success,
    ).toBe(true);
  });
});
