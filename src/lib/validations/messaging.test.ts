import { describe, expect, it } from "vitest";
import {
  proposeMidmanSchema,
  respondProposalSchema,
  sendMessageSchema,
} from "./messaging";

describe("messaging and proposal schemas", () => {
  const validId = "11111111-1111-4111-8111-111111111101";

  it("rejects empty or oversized messages", () => {
    expect(sendMessageSchema.safeParse({ conversationId: validId, body: "   " }).success).toBe(false);
    expect(sendMessageSchema.safeParse({ conversationId: validId, body: "Hello!" }).success).toBe(true);
  });

  it("validates midman proposal and response inputs", () => {
    expect(
      proposeMidmanSchema.safeParse({ conversationId: validId, midmanProfileId: validId }).success,
    ).toBe(true);
    expect(
      respondProposalSchema.safeParse({ proposalId: validId, decision: "ACCEPT" }).success,
    ).toBe(true);
    expect(
      respondProposalSchema.safeParse({ proposalId: validId, decision: "MAYBE" }).success,
    ).toBe(false);
  });
});
