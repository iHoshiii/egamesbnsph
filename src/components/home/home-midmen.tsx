import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { getVerifiedMidmen } from "@/services/midman.service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export async function HomeMidmen() {
  const midmen = await getVerifiedMidmen();
  const featured = midmen.slice(0, 3);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Verified Midmen</h2>
          <p className="text-sm text-muted-foreground">Admin-verified coordinators ready to guide your trade.</p>
        </div>
        <Link href="/midmen"><Button variant="ghost" className="gap-1.5">View directory<ArrowRight className="h-4 w-4" /></Button></Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((mm) => (
          <Card key={mm.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-1.5 text-base">
                  {mm.displayName}
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                </CardTitle>
                <Badge variant={mm.availabilityStatus === "AVAILABLE" ? "default" : "secondary"}>{mm.availabilityStatus}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-muted-foreground">
              <p>{mm.feeDescription}</p>
              <p className="font-medium text-foreground">{mm.completedCount} completed trades · ★ {Number(mm.ratingAverage).toFixed(2)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
