import { Search } from "lucide-react";
import { HIGHEST_RANKS } from "@/lib/validations/listing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs";

interface Category { id: string; slug: string; name: string }
interface FilterParams { q?: string; category?: string; rank?: string; minSkins?: string; maxPrice?: string }

export function MarketplaceFilters({ categories, searchParams: sp }: { categories: Category[]; searchParams: FilterParams }) {
  return (
    <form method="GET" className="mb-8 grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2 lg:grid-cols-6">
      <div className="relative lg:col-span-2">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input name="q" defaultValue={sp.q ?? ""} placeholder="Search title, collector level, rank..." className="pl-8" />
      </div>
      <select name="category" defaultValue={sp.category ?? "all"} className={selectClass}>
        <option value="all">All Categories</option>
        {categories.map((cat) => (<option key={cat.id} value={cat.slug}>{cat.name}</option>))}
      </select>
      <select name="rank" defaultValue={sp.rank ?? "all"} className={selectClass}>
        <option value="all">Any Rank</option>
        {HIGHEST_RANKS.map((rank) => (<option key={rank} value={rank}>{rank}</option>))}
      </select>
      <Input name="minSkins" type="number" min={0} defaultValue={sp.minSkins ?? ""} placeholder="Min skins" />
      <div className="flex gap-2">
        <Input name="maxPrice" type="number" min={0} defaultValue={sp.maxPrice ?? ""} placeholder="Max PHP" />
        <Button type="submit" variant="secondary">Filter</Button>
      </div>
    </form>
  );
}
