import { z } from "zod";

export const sendMessageSchema = z.object({
  conversationId: z.string().uuid("Invalid conversation ID."),
  body: z
    .string()
    .trim()
    .min(1, "Message cannot be empty.")
    .max(2000, "Message must be 2000 characters or fewer."),
});

export const proposeMidmanSchema = z.object({
  conversationId: z.string().uuid("Invalid conversation ID."),
  midmanProfileId: z.string().uuid("Please select a valid midman."),
});

export const respondProposalSchema = z.object({
  proposalId: z.string().uuid("Invalid proposal ID."),
  decision: z.enum(["ACCEPT", "REJECT"]),
});
