"use client";

import { ImagePlus, Video, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  MAX_LISTING_IMAGES,
  MAX_LISTING_VIDEOS,
} from "@/lib/validations/listing";
import type { PendingImage, PendingVideo } from "./use-listing-media";

interface MediaUploadSectionProps {
  images: PendingImage[];
  video: PendingVideo | null;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onVideoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  onRemoveVideo: () => void;
}

export function MediaUploadSection({
  images,
  video,
  onImageSelect,
  onVideoSelect,
  onRemoveImage,
  onRemoveVideo,
}: MediaUploadSectionProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>
            Photos (Optional, {images.length}/{MAX_LISTING_IMAGES}, max 0.5 MB each)
          </Label>
          {images.length < MAX_LISTING_IMAGES && (
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent">
              <ImagePlus className="h-4 w-4" />
              Add Photos
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onImageSelect} className="hidden" />
            </label>
          )}
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((img, idx) => (
              <div key={img.previewUrl} className="relative aspect-video overflow-hidden rounded-md border bg-muted">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.previewUrl} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                <button type="button" onClick={() => onRemoveImage(idx)} className="absolute right-1 top-1 rounded-full bg-background/80 p-1 text-foreground hover:bg-destructive hover:text-destructive-foreground" title="Remove photo">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>
            Showcase Video (Optional, {video ? 1 : 0}/{MAX_LISTING_VIDEOS}, max 15 MB / 30s)
          </Label>
          {!video && (
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-accent">
              <Video className="h-4 w-4" />
              Add Video
              <input type="file" accept="video/mp4,video/webm" onChange={onVideoSelect} className="hidden" />
            </label>
          )}
        </div>

        {video && (
          <div className="relative overflow-hidden rounded-md border bg-black">
            <video src={video.previewUrl} controls className="max-h-64 w-full" />
            <button type="button" onClick={onRemoveVideo} className="absolute right-2 top-2 rounded-full bg-background/90 p-1 text-foreground hover:bg-destructive hover:text-destructive-foreground" title="Remove video">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
