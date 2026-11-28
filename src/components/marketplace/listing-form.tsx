"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { createListingAction } from "@/app/actions/listing";
import { MAX_LISTING_IMAGES, MAX_LISTING_VIDEOS, MIDMAN_PREFERENCES, type ListingMediaInput } from "@/lib/validations/listing";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useListingMedia } from "./use-listing-media";
import { MediaUploadSection } from "./media-upload-section";
import { ListingFields } from "./listing-fields";

interface CategoryOption { id: string; slug: string; name: string }

async function uploadMediaFiles(userId: string, images: { file: File }[], video: { file: File } | null): Promise<ListingMediaInput[]> {
  const supabase = createClient();
  const uploaded: ListingMediaInput[] = [];

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const ext = img.file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("public-listings").upload(path, img.file, { contentType: img.file.type, upsert: false });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    const { data: pub } = supabase.storage.from("public-listings").getPublicUrl(path);
    uploaded.push({ mediaType: "IMAGE", storagePath: path, publicUrl: pub.publicUrl, mimeType: img.file.type, fileSizeBytes: img.file.size, sortOrder: i });
  }

  if (video) {
    const ext = video.file.name.split(".").pop() ?? "mp4";
    const path = `${userId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("public-listings").upload(path, video.file, { contentType: video.file.type, upsert: false });
    if (error) throw new Error(`Video upload failed: ${error.message}`);
    const { data: pub } = supabase.storage.from("public-listings").getPublicUrl(path);
    uploaded.push({ mediaType: "VIDEO", storagePath: path, publicUrl: pub.publicUrl, mimeType: video.file.type, fileSizeBytes: video.file.size, sortOrder: uploaded.length });
  }

  return uploaded;
}

export function ListingForm({ userId, categories }: { userId: string; categories: CategoryOption[] }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [pricePesos, setPricePesos] = useState("");
  const [skinsCount, setSkinsCount] = useState("");
  const [collectorLevel, setCollectorLevel] = useState("");
  const [highestRank, setHighestRank] = useState("");
  const [midmanPreference, setMidmanPreference] = useState<string>(MIDMAN_PREFERENCES[0]);
  const [description, setDescription] = useState("");
  const media = useListingMedia();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const numericPrice = Number(pricePesos);
    if (!Number.isFinite(numericPrice) || numericPrice < 50) { toast.error("Please enter a valid price (minimum PHP 50)."); return; }
    setSubmitting(true);
    try {
      const uploadedMedia = await uploadMediaFiles(userId, media.images, media.video);
      const result = await createListingAction({
        title, categoryId, pricePesos: numericPrice,
        skinsCount: skinsCount.trim() === "" ? null : Number(skinsCount),
        collectorLevel: collectorLevel || null, highestRank: highestRank || null,
        midmanPreference: midmanPreference || null, description, media: uploadedMedia,
      });
      if (result.error) { toast.error(result.error); setSubmitting(false); return; }
      toast.success("Listing published!");
      router.push(`/listings/${result.listingId}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish listing.");
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create a Marketplace Listing</CardTitle>
        <CardDescription>
          Fill in your Mobile Legends listing details. Media uploads are optional (up to {MAX_LISTING_IMAGES} photos at 0.5 MB each, {MAX_LISTING_VIDEOS} video at 15 MB / 30s).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <ListingFields
            title={title} setTitle={setTitle} categoryId={categoryId} setCategoryId={setCategoryId}
            categories={categories} pricePesos={pricePesos} setPricePesos={setPricePesos}
            skinsCount={skinsCount} setSkinsCount={setSkinsCount} collectorLevel={collectorLevel}
            setCollectorLevel={setCollectorLevel} highestRank={highestRank} setHighestRank={setHighestRank}
            midmanPreference={midmanPreference} setMidmanPreference={setMidmanPreference}
            description={description} setDescription={setDescription}
          />
          <MediaUploadSection
            images={media.images} video={media.video}
            onImageSelect={media.handleImageSelect} onVideoSelect={media.handleVideoSelect}
            onRemoveImage={media.removeImage} onRemoveVideo={media.removeVideo}
          />
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Publishing Listing...</>) : "Publish Listing"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
