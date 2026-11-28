"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  MAX_IMAGE_BYTES,
  MAX_LISTING_IMAGES,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_DURATION_SECONDS,
} from "@/lib/validations/listing";

export interface PendingImage {
  file: File;
  previewUrl: string;
}

export interface PendingVideo {
  file: File;
  previewUrl: string;
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      reject(new Error("Could not read video metadata."));
    };
    video.src = URL.createObjectURL(file);
  });
}

export function useListingMedia() {
  const [images, setImages] = useState<PendingImage[]>([]);
  const [video, setVideo] = useState<PendingVideo | null>(null);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;

    const remaining = MAX_LISTING_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`Maximum of ${MAX_LISTING_IMAGES} images allowed.`);
      return;
    }

    const accepted: PendingImage[] = [];
    for (const file of files.slice(0, remaining)) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
        toast.error(`${file.name}: Only JPG, PNG, or WebP images are allowed.`);
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast.error(`${file.name}: Image must be 0.5 MB (500 KB) or smaller.`);
        continue;
      }
      accepted.push({ file, previewUrl: URL.createObjectURL(file) });
    }

    if (files.length > remaining) {
      toast.warning(`Only ${remaining} more image(s) can be added (max ${MAX_LISTING_IMAGES}).`);
    }

    setImages((prev) => [...prev, ...accepted]);
  }

  async function handleVideoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!ALLOWED_VIDEO_TYPES.includes(file.type as (typeof ALLOWED_VIDEO_TYPES)[number])) {
      toast.error("Only MP4 or WebM videos are allowed.");
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      toast.error("Video must be 15 MB or smaller.");
      return;
    }

    try {
      const duration = await getVideoDuration(file);
      if (duration > MAX_VIDEO_DURATION_SECONDS) {
        toast.error(`Video is ${Math.round(duration)}s long. Max duration is ${MAX_VIDEO_DURATION_SECONDS}s.`);
        return;
      }
    } catch {
      toast.error("Could not validate video duration.");
      return;
    }

    if (video) URL.revokeObjectURL(video.previewUrl);
    setVideo({ file, previewUrl: URL.createObjectURL(file) });
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      return copy;
    });
  }

  function removeVideo() {
    if (video) {
      URL.revokeObjectURL(video.previewUrl);
      setVideo(null);
    }
  }

  return { images, video, handleImageSelect, handleVideoSelect, removeImage, removeVideo };
}
