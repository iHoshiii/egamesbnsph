# egamesbnsph.com - Development Phasing

## 1. Current State

Phases 1 through 6 are implemented on Next.js (`16.4.6`) + TypeScript + Tailwind CSS v4 + `shadcn/ui` + Prisma 7 + Supabase + Vitest/Playwright, including route skeleton loading, rate limiting, upload validation, and RBAC tests. Remaining before production launch: fix the deferred `prisma.transaction.findMany` dev runtime error, run `npm run test:e2e`, and deploy to Vercel.

---

## 2. Immediate Next Step: Phase 1 Kickoff

1. **Create & connect Supabase project**:
   - Configure `.env.local` using `.env.example` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`).
   - Create the 4 storage buckets: `public-listings`, `private-verifications`, `private-payments`, `private-disputes`.
   - Add browser, server, and service-role Supabase clients in `src/lib/supabase/` plus session `middleware.ts`.
2. **Design & apply SQL migrations (`supabase/migrations/`)**:
   - Enforce UUID primary keys, `timestamptz` timestamps, integer centavos for PHP amounts, and Row Level Security (RLS) on all tables.
3. **Implement Auth & Profiles**:
   - Registration, login, logout, password reset, and database-backed `user_roles` (normal users act as buyer/seller; midman/admin privileges can never be self-assigned).

---

## 3. Project Phases

### Phase 1: Foundation, Auth & Database
- **Scope**:
  - Supabase client helpers (`src/lib/supabase/`) and `src/middleware.ts`.
  - Initial SQL migrations for `users`, `user_roles`, and `user_profiles` with RLS policies.
  - `(auth)/login`, `(auth)/register`, password reset, and `(dashboard)/dashboard` profile management.
  - Base `(public)` layout and navigation shell.
- **Exit Criteria**: Users can register, sign in, manage profiles, and unauthorized role escalation is blocked at the server and RLS levels.

### Phase 2: Marketplace & Midman Directory *(MVP Release 1)*
- **Scope**:
  - **Listings**: `listing_categories`, `listings`, `listing_images` tables; `public-listings` image uploads; listing creation, editing, status management (`DRAFT`, `ACTIVE`, `RESERVED`, `SOLD`, `PAUSED`, `REMOVED`); public marketplace search/filter and listing detail pages.
  - **Midman System**: `midman_profiles`, `midman_socials`, `midman_verifications`, `midman_payment_methods`, `midman_availability`; midman application flow with `private-verifications` document uploads; public verified midman directory; admin verification/suspension tools.
- **Exit Criteria**: Sellers can publish listings, users can apply to become midmen, admins can verify/revoke midmen, and buyers can browse both.

### Phase 3: Real-time Messaging & Midman Selection *(MVP Release 2, Part A)*
- **Scope**:
  - **Private Chat**: `conversations`, `conversation_members`, `messages`, `message_attachments`, `message_reads`; Supabase Realtime subscriptions with PostgreSQL fallback on reconnect; buyer-seller private chat initiated from listings.
  - **Midman Proposals**: `transaction_proposals` (`PENDING`, `ACCEPTED`, `REJECTED`, `SUPERSEDED`, `EXPIRED`); mutual acceptance enforcement requiring both buyer and seller to agree on the same `VERIFIED` midman.
- **Exit Criteria**: Buyer and seller can chat in real time, send purchase requests, and mutually select a verified midman.

### Phase 4: Transaction Room, Queue & Manual Payments *(MVP Release 2, Part B)*
- **Scope**:
  - **Transaction Room**: `transactions`, `transaction_agreements`, `transaction_events`, `transaction_queue`; 3-party group chat (buyer, seller, selected midman) with automated welcome and credential-safety warning.
  - **Midman Queue**: Atomic database queue position assignment when a midman accepts an assignment (or return to midman selection if declined).
  - **Terms & Manual Payments**: Midman sets terms and fee → buyer and seller approve → `payments`, `payment_receipts` (`private-payments` signed URLs), `payment_verifications` → midman independently verifies/rejects actual payment → seller fulfillment → buyer confirmation → `COMPLETED`.
- **Exit Criteria**: Full end-to-end transaction lifecycle works from purchase request to completion.

### Phase 5: Trust, Disputes & Admin Moderation *(MVP Release 3)*
- **Scope**:
  - **Reviews & Vouches**: `reviews` linked to `COMPLETED` transactions, midman rating aggregation, and unique public vouch links.
  - **Disputes & Moderation**: `disputes`, `dispute_evidence` (`private-disputes`), `dispute_resolutions`, `listing_reports`, `reports`, `notifications`, and `audit_logs`; admin dashboard for dispute resolution, listing/user moderation, and audit log review.
- **Exit Criteria**: Disputes freeze normal transaction progression until admin resolution; all sensitive actions are recorded in `audit_logs`.

### Phase 6: Security Hardening, E2E Testing & Launch
- **Scope**:
  - Multi-role RLS and authorization tests (Buyer, Seller, Midman, Admin) in Vitest.
  - End-to-end transaction workflow tests in Playwright (`e2e/`).
  - Rate limiting on sensitive endpoints, file upload validation checks, and Vercel + production Supabase deployment (`egamesbnsph.com`).
- **Exit Criteria**: All security, unit, and E2E checks pass and production environment is live.
