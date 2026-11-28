"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  COLLECTOR_LEVELS,
  HIGHEST_RANKS,
  MIDMAN_PREFERENCES,
} from "@/lib/validations/listing";

interface CategoryOption {
  id: string;
  slug: string;
  name: string;
}

interface ListingFieldsProps {
  title: string;
  setTitle: (v: string) => void;
  categoryId: string;
  setCategoryId: (v: string) => void;
  categories: CategoryOption[];
  pricePesos: string;
  setPricePesos: (v: string) => void;
  skinsCount: string;
  setSkinsCount: (v: string) => void;
  collectorLevel: string;
  setCollectorLevel: (v: string) => void;
  highestRank: string;
  setHighestRank: (v: string) => void;
  midmanPreference: string;
  setMidmanPreference: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
}

const selectClass = "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";
const textareaClass = "flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function ListingFields(props: ListingFieldsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="title">Listing Title</Label>
        <Input id="title" value={props.title} onChange={(e) => props.setTitle(e.target.value)} placeholder="e.g. Exalted Collector 320 Skins" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="categoryId">Category</Label>
        <select id="categoryId" value={props.categoryId} onChange={(e) => props.setCategoryId(e.target.value)} className={selectClass} required>
          {props.categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pricePesos">Price (PHP)</Label>
        <Input id="pricePesos" type="number" min={50} step="0.01" value={props.pricePesos} onChange={(e) => props.setPricePesos(e.target.value)} placeholder="e.g. 2500" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="skinsCount">Number of Skins</Label>
        <Input id="skinsCount" type="number" min={0} max={2000} value={props.skinsCount} onChange={(e) => props.setSkinsCount(e.target.value)} placeholder="e.g. 250" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="collectorLevel">Collector Level</Label>
        <select id="collectorLevel" value={props.collectorLevel} onChange={(e) => props.setCollectorLevel(e.target.value)} className={selectClass}>
          <option value="">Select Collector Level (optional)</option>
          {COLLECTOR_LEVELS.map((lvl) => (<option key={lvl} value={lvl}>{lvl}</option>))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="highestRank">Highest Rank</Label>
        <select id="highestRank" value={props.highestRank} onChange={(e) => props.setHighestRank(e.target.value)} className={selectClass}>
          <option value="">Select Highest Rank (optional)</option>
          {HIGHEST_RANKS.map((rank) => (<option key={rank} value={rank}>{rank}</option>))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="midmanPreference">Midman Preference</Label>
        <select id="midmanPreference" value={props.midmanPreference} onChange={(e) => props.setMidmanPreference(e.target.value)} className={selectClass}>
          {MIDMAN_PREFERENCES.map((pref) => (<option key={pref} value={pref}>{pref}</option>))}
        </select>
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="description">Other Info / Details</Label>
        <textarea id="description" rows={4} value={props.description} onChange={(e) => props.setDescription(e.target.value)} placeholder="Include emblem levels, recall/elimination effects, bind status, or any other relevant notes. Never post passwords or recovery codes." className={textareaClass} required />
      </div>
    </div>
  );
}
