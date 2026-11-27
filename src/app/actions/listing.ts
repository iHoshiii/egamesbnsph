"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "@/services/auth.service";
import {
  createListing,
  updateListingStatus,
} from "@/services/listing.service";
import { createListingSchema } from "@/lib/validations/listing";
import type { ListingStatus } from "@/generated/prisma/enums";

export async function createListingAction(payload: unknown) {
  const user = await getCurrentSessionUser();
  if (!user) {
    return { error: "You must be signed in to post a listing." };
  }

  const parsed = createListingSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Please check your listing inputs.",
    };
  }

  const listing = await createListing(user.id, parsed.data);

  revalidatePath("/marketplace");
  revalidatePath("/dashboard");
  revalidatePath("/");

  return { listingId: listing.id };
}

export async function updateListingStatusAction(
  listingId: string,
  status: ListingStatus,
) {
  const user = await getCurrentSessionUser();
  if (!user) {
    redirect("/login");
  }

  await updateListingStatus(listingId, user.id, status);
  revalidatePath("/marketplace");
  revalidatePath("/dashboard");
  revalidatePath(`/listings/${listingId}`);
}
