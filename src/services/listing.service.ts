import "server-only";
import { prisma } from "@/lib/prisma";
import {
  createListingSchema,
  type CreateListingInput,
} from "@/lib/validations/listing";
import { pesosToCentavos } from "@/lib/utils/currency";
import type { ListingStatus } from "@/generated/prisma/enums";

export async function getListingCategories() {
  return prisma.listingCategory.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

export interface ListingFilters {
  query?: string;
  categorySlug?: string;
  minSkins?: number;
  highestRank?: string;
  maxPriceCentavos?: number;
}

export async function getActiveListings(filters: ListingFilters = {}) {
  const where: Record<string, unknown> = {
    status: "ACTIVE",
  };

  if (filters.query && filters.query.trim().length > 0) {
    const q = filters.query.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { collectorLevel: { contains: q, mode: "insensitive" } },
      { highestRank: { contains: q, mode: "insensitive" } },
    ];
  }

  if (filters.categorySlug && filters.categorySlug !== "all") {
    where.category = { slug: filters.categorySlug };
  }

  if (typeof filters.minSkins === "number" && filters.minSkins > 0) {
    where.skinsCount = { gte: filters.minSkins };
  }

  if (filters.highestRank && filters.highestRank !== "all") {
    where.highestRank = filters.highestRank;
  }

  if (
    typeof filters.maxPriceCentavos === "number" &&
    filters.maxPriceCentavos > 0
  ) {
    where.priceCentavos = { lte: filters.maxPriceCentavos };
  }

  return prisma.listing.findMany({
    where,
    include: {
      category: true,
      media: { orderBy: { sortOrder: "asc" } },
      seller: {
        select: {
          id: true,
          profile: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getListingById(id: string) {
  return prisma.listing.findUnique({
    where: { id },
    include: {
      category: true,
      media: { orderBy: { sortOrder: "asc" } },
      seller: {
        select: {
          id: true,
          profile: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true,
              bio: true,
            },
          },
        },
      },
    },
  });
}

export async function getUserListings(sellerId: string) {
  return prisma.listing.findMany({
    where: {
      sellerId,
      status: { not: "REMOVED" },
    },
    include: {
      category: true,
      media: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createListing(sellerId: string, rawInput: CreateListingInput) {
  const input = createListingSchema.parse(rawInput);

  return prisma.listing.create({
    data: {
      sellerId,
      categoryId: input.categoryId,
      title: input.title,
      description: input.description,
      priceCentavos: pesosToCentavos(input.pricePesos),
      status: "ACTIVE",
      skinsCount: input.skinsCount ?? null,
      collectorLevel: input.collectorLevel || null,
      highestRank: input.highestRank || null,
      midmanPreference: input.midmanPreference || null,
      media: {
        createMany: {
          data: input.media.map((m, idx) => ({
            mediaType: m.mediaType,
            storagePath: m.storagePath,
            publicUrl: m.publicUrl,
            mimeType: m.mimeType,
            fileSizeBytes: m.fileSizeBytes,
            sortOrder: m.sortOrder ?? idx,
          })),
        },
      },
    },
    include: {
      media: true,
      category: true,
    },
  });
}

export async function updateListingStatus(
  listingId: string,
  sellerId: string,
  status: ListingStatus,
) {
  const existing = await prisma.listing.findUnique({
    where: { id: listingId },
    select: { sellerId: true },
  });

  if (!existing || existing.sellerId !== sellerId) {
    throw new Error("Unauthorized or listing not found.");
  }

  return prisma.listing.update({
    where: { id: listingId },
    data: { status },
  });
}
