import { Suspense } from "react";
import { ShieldCheck, Star, ExternalLink, Wallet } from "lucide-react";
import { getVerifiedMidmen } from "@/services/midman.service";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

async function MidmenDirectoryContent() {
  const midmen = await getVerifiedMidmen();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="h-4 w-4" />
          Admin-Verified Directory
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          Verified Midmen
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          All midmen listed here are manually verified by the platform
          administrator. Both buyer and seller must agree on the same midman
          before a transaction room is created.
        </p>
      </div>

      {midmen.length === 0 ? (
        <div className="rounded-xl border border-dashed py-16 text-center text-sm text-muted-foreground">
          No verified midmen are currently listed.
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {midmen.map((mm) => (
            <Card key={mm.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-1.5 text-lg">
                      {mm.displayName}
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    </CardTitle>
                    <CardDescription>
                      @{mm.user.profile?.username ?? "midman"}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      mm.availabilityStatus === "AVAILABLE"
                        ? "default"
                        : "secondary"
                    }
                  >
                    {mm.availabilityStatus}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-4 text-sm">
                {mm.bio && (
                  <p className="text-muted-foreground">{mm.bio}</p>
                )}

                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1 font-medium">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    {Number(mm.ratingAverage).toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">
                    {mm.completedCount} completed trades
                  </span>
                </div>

                <div className="rounded-lg bg-muted/60 p-3 text-xs">
                  <p className="font-medium text-foreground">Fee Schedule</p>
                  <p className="mt-0.5 text-muted-foreground">
                    {mm.feeDescription}
                  </p>
                </div>

                {mm.paymentMethods.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-1.5 text-xs font-medium">
                      <Wallet className="h-3.5 w-3.5" />
                      Payment Channels
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {mm.paymentMethods.map((pm) => (
                        <Badge key={pm.id} variant="outline" className="text-xs font-normal">
                          {pm.methodName} ({pm.accountNumberMasked})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {mm.socials.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-xs font-medium">Official Socials</p>
                    <div className="flex flex-wrap gap-2">
                      {mm.socials.map((s) => (
                        <a
                          key={s.id}
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {s.platform}
                          {s.handle ? ` (${s.handle})` : ""}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MidmenPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <MidmenDirectoryContent />
    </Suspense>
  );
}
