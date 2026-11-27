"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "@/services/auth.service";
import {
  getOrCreateDirectConversation,
  sendMessage,
} from "@/services/messaging.service";
import { proposeMidman, respondToProposal } from "@/services/proposal.service";
import {
  proposeMidmanSchema,
  respondProposalSchema,
  sendMessageSchema,
} from "@/lib/validations/messaging";

export async function startConversationAction(listingId: string) {
  const user = await getCurrentSessionUser();
  if (!user) {
    redirect(`/login?next=/listings/${listingId}`);
  }

  const conversationId = await getOrCreateDirectConversation(user.id, listingId);
  redirect(`/messages/${conversationId}`);
}

export async function sendMessageAction(conversationId: string, body: string) {
  const user = await getCurrentSessionUser();
  if (!user) {
    return { error: "You must be signed in to send messages." };
  }

  const parsed = sendMessageSchema.safeParse({ conversationId, body });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid message." };
  }

  const message = await sendMessage(
    parsed.data.conversationId,
    user.id,
    parsed.data.body,
  );
  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  return { message };
}

export async function proposeMidmanAction(
  conversationId: string,
  midmanProfileId: string,
) {
  const user = await getCurrentSessionUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const parsed = proposeMidmanSchema.safeParse({ conversationId, midmanProfileId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid proposal." };
  }

  try {
    const proposal = await proposeMidman(
      parsed.data.conversationId,
      user.id,
      parsed.data.midmanProfileId,
    );
    revalidatePath(`/messages/${conversationId}`);
    return { proposal };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to propose midman." };
  }
}

export async function respondProposalAction(
  proposalId: string,
  decision: "ACCEPT" | "REJECT",
  conversationId: string,
) {
  const user = await getCurrentSessionUser();
  if (!user) {
    return { error: "You must be signed in." };
  }

  const parsed = respondProposalSchema.safeParse({ proposalId, decision });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid response." };
  }

  try {
    const proposal = await respondToProposal(
      parsed.data.proposalId,
      user.id,
      parsed.data.decision,
    );
    revalidatePath(`/messages/${conversationId}`);
    return { proposal };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to respond." };
  }
}
