import { z } from "zod";

export const MAX_LISTING_IMAGES = 6;
export const MAX_LISTING_VIDEOS = 1;
export const MAX_IMAGE_BYTES = 500 * 1024; // 0.5 MB (500 KB)
export const MAX_VIDEO_BYTES = 15 * 1024 * 1024; // 15 MB
export const MAX_VIDEO_DURATION_SECONDS = 30;

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/webm",
] as const;

export const COLLECTOR_LEVELS = [
  "Beginner Collector",
  "Amateur Collector",
  "Expert Collector",
  "Renowned Collector",
  "Exalted Collector",
  "Mega Collector",
  "World Collector",
] as const;

export const HIGHEST_RANKS = [
  "Warrior",
  "Elite",
  "Master",
  "Grandmaster",
  "Epic",
  "Legend",
  "Mythic",
  "Mythical Honor",
  "Mythical Glory",
  "Mythical Immortal",
] as const;

export const MIDMAN_PREFERENCES = [
  "Midman Required (Buyer/Seller Mutual)",
  "Midman Preferred",
  "Open to Verified Midmen Only",
] as const;

export const listingMediaInputSchema = z.object({
  mediaType: z.enum(["IMAGE", "VIDEO"]),
  storagePath: z.string().min(1),
  publicUrl: z.string().url(),
  mimeType: z.string().min(1),
  fileSizeBytes: z.number().int().positive(),
  sortOrder: z.number().int().min(0).default(0),
});

export const createListingSchema = z
  .object({
    title: z
      .string()
      .min(4, "Title must be at least 4 characters.")
      .max(100, "Title must be 100 characters or fewer.")
      .trim(),
    categoryId: z.string().uuid("Please select a valid category."),
    pricePesos: z
      .number()
      .min(50, "Minimum price is PHP 50.")
      .max(500000, "Maximum price is PHP 500,000."),
    skinsCount: z
      .number()
      .int("Number of skins must be a whole number.")
      .min(0, "Number of skins cannot be negative.")
      .max(2000, "Number of skins looks too high.")
      .nullable()
      .optional(),
    collectorLevel: z.string().max(60).nullable().optional(),
    highestRank: z.string().max(60).nullable().optional(),
    midmanPreference: z.string().max(80).nullable().optional(),
    description: z
      .string()
      .min(10, "Please provide at least 10 characters of info.")
      .max(2000, "Description must be 2000 characters or fewer.")
      .trim(),
    media: z.array(listingMediaInputSchema).optional().default([]),
  })
  .superRefine((data, ctx) => {
    const images = data.media.filter((m) => m.mediaType === "IMAGE");
    const videos = data.media.filter((m) => m.mediaType === "VIDEO");

    if (images.length > MAX_LISTING_IMAGES) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `You can upload at most ${MAX_LISTING_IMAGES} images.`,
        path: ["media"],
      });
    }

    if (videos.length > MAX_LISTING_VIDEOS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `You can upload at most ${MAX_LISTING_VIDEOS} video.`,
        path: ["media"],
      });
    }

    for (const img of images) {
      if (img.fileSizeBytes > MAX_IMAGE_BYTES) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Each image must be 0.5 MB (500 KB) or smaller.",
          path: ["media"],
        });
      }
    }

    for (const vid of videos) {
      if (vid.fileSizeBytes > MAX_VIDEO_BYTES) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Video must be 15 MB or smaller.",
          path: ["media"],
        });
      }
    }
  });

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type ListingMediaInput = z.infer<typeof listingMediaInputSchema>;
