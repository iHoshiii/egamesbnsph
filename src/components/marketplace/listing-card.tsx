import Link from "next/link";
import { ImageIcon, Video, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPhpFromCentavos } from "@/lib/utils/currency";

interface ListingCardMedia {
  id: string;
  mediaType: "IMAGE" | "VIDEO";
  publicUrl: string;
}

export interface ListingCardProps {
  id: string;
  title: string;
  priceCentavos: number;
  skinsCount: number | null;
  collectorLevel: string | null;
  highestRank: string | null;
  midmanPreference: string | null;
  categoryName: string;
  sellerName: string;
  media: ListingCardMedia[];
}

export function ListingCard({
  id,
  title,
  priceCentavos,
  skinsCount,
  collectorLevel,
  highestRank,
  midmanPreference,
  categoryName,
  sellerName,
  media,
}: ListingCardProps) {
  const coverImage = media.find((m) => m.mediaType === "IMAGE");
  const hasVideo = media.some((m) => m.mediaType === "VIDEO");
  const imageCount = media.filter((m) => m.mediaType === "IMAGE").length;

  return (
    <Link href={`/listings/${id}`} className="group block h-full">
      <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImage.publicUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-muted-foreground">
              <ImageIcon className="h-8 w-8 opacity-40" />
              <span className="text-xs">No preview image</span>
            </div>
          )}
          <div className="absolute left-2 top-2 flex gap-1.5">
            <Badge variant="secondary" className="bg-background/90 backdrop-blur">
              {categoryName}
            </Badge>
          </div>
          <div className="absolute bottom-2 right-2 flex gap-1.5">
            {imageCount > 0 && (
              <Badge variant="secondary" className="gap-1 bg-background/90 text-xs">
                <ImageIcon className="h-3 w-3" />
                {imageCount}
              </Badge>
            )}
            {hasVideo && (
              <Badge variant="secondary" className="gap-1 bg-background/90 text-xs">
                <Video className="h-3 w-3" />
                Video
              </Badge>
            )}
          </div>
        </div>

        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="line-clamp-2 text-base font-semibold group-hover:text-primary">
              {title}
            </CardTitle>
          </div>
          <p className="text-lg font-bold text-primary">
            {formatPhpFromCentavos(priceCentavos)}
          </p>
        </CardHeader>

        <CardContent className="flex-1 space-y-2 pb-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-1.5">
            {skinsCount !== null && (
              <Badge variant="outline" className="gap-1 font-normal">
                <Sparkles className="h-3 w-3" />
                {skinsCount} Skins
              </Badge>
            )}
            {highestRank && (
              <Badge variant="outline" className="gap-1 font-normal">
                <Trophy className="h-3 w-3" />
                {highestRank}
              </Badge>
            )}
            {collectorLevel && (
              <Badge variant="outline" className="font-normal">
                {collectorLevel}
              </Badge>
            )}
          </div>
          {midmanPreference && (
            <div className="flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{midmanPreference}</span>
            </div>
          )}
        </CardContent>

        <CardFooter className="border-t pt-3 text-xs text-muted-foreground">
          <span>Seller: {sellerName}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
