import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { getCurrentSessionUser } from "@/services/auth.service";
import { getAdminDashboardData, isAdminUser } from "@/services/admin.service";
import { getSignedDisputeEvidenceUrl } from "@/services/dispute.service";
import { moderateListingAction, updateReportStatusAction } from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminDisputeCard } from "@/components/admin/admin-dispute-card";

async function AdminContent() {
  const user = await getCurrentSessionUser();
  if (!user) redirect("/login?next=/admin");
  if (!(await isAdminUser(user.id))) redirect("/dashboard");

  const { disputes, reports, auditLogs } = await getAdminDashboardData();

  const disputesWithUrls = await Promise.all(
    disputes.map(async (d) => ({
      id: d.id,
      status: d.status,
      reason: d.reason,
      listingTitle: d.transaction.listing.title,
      buyerName: d.transaction.buyer.profile?.displayName ?? "Buyer",
      sellerName: d.transaction.seller.profile?.displayName ?? "Seller",
      evidence: await Promise.all(
        d.evidence.map(async (ev) => ({
          id: ev.id,
          notes: ev.notes,
          signedUrl: await getSignedDisputeEvidenceUrl(ev.storagePath),
        })),
      ),
    })),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Admin Moderation</h1>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Open Disputes ({disputesWithUrls.length})</h2>
        {disputesWithUrls.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open disputes.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {disputesWithUrls.map((d) => (<AdminDisputeCard key={d.id} dispute={d} />))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Open Reports ({reports.length})</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open reports.</p>
        ) : (
          <div className="space-y-2">
            {reports.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex flex-wrap items-center justify-between gap-4 py-3 text-xs">
                  <div>
                    <Badge variant="outline" className="mr-2">{r.targetType}</Badge>
                    <span className="font-medium">{r.reason}</span>
                    <span className="ml-2 text-muted-foreground">by {r.reporter.profile?.displayName ?? "User"}</span>
                  </div>
                  <div className="flex gap-2">
                    {r.targetType === "LISTING" && (
                      <form action={async () => { "use server"; await moderateListingAction(r.targetId, "REMOVED"); await updateReportStatusAction(r.id, "REVIEWED"); }}>
                        <Button size="sm" variant="destructive" type="submit">Remove Listing</Button>
                      </form>
                    )}
                    <form action={async () => { "use server"; await updateReportStatusAction(r.id, "DISMISSED"); }}>
                      <Button size="sm" variant="outline" type="submit">Dismiss</Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Recent Audit Logs</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-xs">
            {auditLogs.length === 0 ? (
              <p className="text-muted-foreground">No audit events recorded yet.</p>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="flex justify-between gap-2 border-b pb-1.5 last:border-0">
                  <span><strong>{log.action}</strong> ({log.targetType}) by {log.actor.profile?.displayName ?? "Admin"}</span>
                  <span className="text-muted-foreground">{log.createdAt.toLocaleString()}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-8"><div className="h-96 animate-pulse rounded-xl bg-muted" /></div>}>
      <AdminContent />
    </Suspense>
  );
}
