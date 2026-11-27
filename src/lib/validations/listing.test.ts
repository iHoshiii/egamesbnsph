import { describe, expect, it } from "vitest";
import {
  createListingSchema,
  MAX_IMAGE_BYTES,
  MAX_LISTING_IMAGES,
  MAX_VIDEO_BYTES,
} from "./listing";

const baseInput = {
  title: "World Collector 400 Skins",
  categoryId: "11111111-1111-4111-8111-111111111101",
  pricePesos: 3500,
  skinsCount: 400,
  collectorLevel: "World Collector",
  highestRank: "Mythical Immortal",
  midmanPreference: "Midman Required (Buyer/Seller Mutual)",
  description: "Clean account with full emblems and recall effects.",
  media: [],
};

describe("createListingSchema", () => {
  it("allows listings with 0 media files (optional uploads)", () => {
    const res = createListingSchema.safeParse(baseInput);
    expect(res.success).toBe(true);
  });

  it("rejects more than 6 images", () => {
    const media = Array.from({ length: MAX_LISTING_IMAGES + 1 }, (_, i) => ({
      mediaType: "IMAGE" as const,
      storagePath: `u/img-${i}.jpg`,
      publicUrl: `https://example.com/img-${i}.jpg`,
      mimeType: "image/jpeg",
      fileSizeBytes: 100_000,
      sortOrder: i,
    }));

    const res = createListingSchema.safeParse({ ...baseInput, media });
    expect(res.success).toBe(false);
  });

  it("rejects images larger than 0.5 MB", () => {
    const res = createListingSchema.safeParse({
      ...baseInput,
      media: [
        {
          mediaType: "IMAGE",
          storagePath: "u/big.jpg",
          publicUrl: "https://example.com/big.jpg",
          mimeType: "image/jpeg",
          fileSizeBytes: MAX_IMAGE_BYTES + 1,
          sortOrder: 0,
        },
      ],
    });
    expect(res.success).toBe(false);
  });

  it("rejects more than 1 video or video > 15 MB", () => {
    const res = createListingSchema.safeParse({
      ...baseInput,
      media: [
        {
          mediaType: "VIDEO",
          storagePath: "u/vid.mp4",
          publicUrl: "https://example.com/vid.mp4",
          mimeType: "video/mp4",
          fileSizeBytes: MAX_VIDEO_BYTES + 1,
          sortOrder: 0,
        },
      ],
    });
    expect(res.success).toBe(false);
  });
});
