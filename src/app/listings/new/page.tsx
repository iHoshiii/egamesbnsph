import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentSessionUser } from "@/services/auth.service";
import { getListingCategories } from "@/services/listing.service";
import { ListingForm } from "@/components/marketplace/listing-form";

async function NewListingContent() {
  const user = await getCurrentSessionUser();
  if (!user) {
    redirect("/login?next=/listings/new");
  }

  const categories = await getListingCategories();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <ListingForm
        userId={user.id}
        categories={categories.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
        }))}
      />
    </div>
  );
}

export default function NewListingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-8">
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      }
    >
      <NewListingContent />
    </Suspense>
  );
}
