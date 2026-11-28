
# MLBNSPH.com - Technology Stack

## 1. Stack Overview

The project will use a modern web development stack with Supabase as the backend platform.

The architecture will follow a **Modular Monolith** approach. The frontend and backend operations will initially live in one Next.js application.

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js (App Router) | Frontend and backend application |
| Language | TypeScript | Application logic and type safety |
| Styling | Tailwind CSS | Responsive UI styling |
| UI Components | shadcn/ui | Reusable interface components |
| Database | Supabase PostgreSQL | Relational database |
| Authentication | Supabase Auth | Registration, login, and sessions |
| Realtime | Supabase Realtime | Chat and live transaction updates |
| Storage | Supabase Storage | Listing images and private attachments |
| Hosting | Vercel | Application deployment |
| Version Control | GitHub | Source code management |
| Validation | Zod | Server and form validation |
| Forms | React Hook Form | Form management |
| Icons | Lucide React | Interface icons |
| Date Utilities | date-fns | Date formatting and calculations |
| Unit Testing | Vitest | Testing business logic |
| Component Testing | React Testing Library | UI component testing |
| E2E Testing | Playwright | End-to-end workflow testing |

## 2. Frontend

### Next.js

Use Next.js with the App Router.

Responsibilities:

- Public landing page.
- Marketplace browsing.
- Listing details.
- User authentication pages.
- Buyer and seller dashboards.
- Midman dashboard.
- Admin dashboard.
- Messaging interface.
- Transaction room.
- Server Actions and Route Handlers.

Next.js will handle both the frontend and initial backend operations.

A separate Node.js backend or FastAPI service is not required for the first version.

### TypeScript

Use TypeScript throughout the application.

Requirements:

- Enable strict TypeScript settings.
- Define shared types for database entities.
- Avoid unnecessary use of `any`.
- Keep types organized and reusable.

### Tailwind CSS

Use Tailwind CSS for:

- Layout.
- Responsive design.
- Colors and themes.
- Spacing.
- Typography.
- Component styling.

### shadcn/ui

Use shadcn/ui for reusable components such as:

- Buttons.
- Dialogs.
- Dropdown menus.
- Forms.
- Tables.
- Tabs.
- Cards.
- Alerts.
- Toast notifications.
- Badges.

Components should follow a consistent design system.

## 3. Backend and Database

### Supabase

Supabase will provide the initial backend infrastructure.

Services:

1. PostgreSQL database.
2. Authentication.
3. Realtime subscriptions.
4. File storage.
5. Row Level Security.

### PostgreSQL

Use PostgreSQL as the primary database.

Database conventions:

- UUID for primary keys.
- `timestamptz` for timestamps.
- Integer centavos for monetary values.
- Foreign keys for relationships.
- Database constraints for data integrity.
- Indexes for frequently queried columns.
- Transactions for critical operations.

Example:

PHP 1,500.00 should be stored as:

`150000`

Do not use floating-point values for financial amounts.

### Suggested Database Modules

**Identity**
- users
- user_roles
- user_profiles

**Midman**
- midman_profiles
- midman_socials
- midman_verifications
- midman_payment_methods
- midman_availability

**Marketplace**
- listing_categories
- listings
- listing_images
- listing_reports

**Messaging**
- conversations
- conversation_members
- messages
- message_attachments
- message_reads

**Transactions**
- transactions
- transaction_proposals
- transaction_agreements
- transaction_events
- transaction_queue

**Payments**
- payments
- payment_receipts
- payment_verifications

**Reviews and Disputes**
- reviews
- disputes
- dispute_evidence
- dispute_resolutions

**Administration**
- notifications
- reports
- audit_logs

The final database schema should be implemented through SQL migrations.

## 4. Authentication and Authorization

Use Supabase Auth for:

- Registration.
- Login.
- Logout.
- Password reset.
- Session management.

Application permissions should be stored and enforced through database-backed roles and capabilities.

Important rules:

- Ordinary users can act as buyers and sellers.
- Midman privileges require admin verification.
- Admin privileges must never be self-assigned.
- Never trust role values submitted by the browser.
- Validate authorization on the server.
- Enforce database access through RLS.

## 5. Realtime System

Use Supabase Realtime for:

- New chat messages.
- Transaction group chat.
- Message read updates.
- Transaction status changes.
- Queue updates.
- In-app notifications.

Important:

PostgreSQL remains the permanent source of truth.

Realtime is only responsible for delivering updates. When a user reconnects, the application must fetch persisted records to ensure no updates were missed.

## 6. File Storage

Use Supabase Storage.

Suggested buckets:

| Bucket | Access | Purpose |
|---|---|---|
| public-listings | Public read, controlled write | Listing images |
| private-verifications | Private | Midman verification documents |
| private-payments | Private | Payment receipts |
| private-disputes | Private | Dispute evidence |

Security requirements:

- Validate file types.
- Limit file sizes.
- Restrict uploads to authorized users.
- Use private storage for sensitive documents.
- Generate signed URLs for private files.
- Do not rely on hidden URLs as a security mechanism.
- Never store passwords, OTPs, or recovery codes.

## 7. Hosting and Deployment

### Vercel

Use Vercel to deploy the Next.js application.

Initial deployment:

1. Create a GitHub repository.
2. Push the Next.js project.
3. Connect GitHub to Vercel.
4. Configure environment variables.
5. Deploy the application.
6. Connect the custom domain when ready.

### Supabase

Use Supabase for the database and backend services.

Create separate development and production environments when the application is ready for real users.

### GitHub

Use GitHub for:

- Source code.
- Version control.
- Branch management.
- Pull requests.
- Issue tracking.
- Deployment integration.

Never commit API keys or environment secrets.

## 8. Environment Variables

Example `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
```

Important:

- Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.
- The service-role key is secret and must only be used in trusted server-side code.
- Never import the service-role key into client components.
- Add `.env.local` to `.gitignore`.
- Create an `.env.example` containing variable names but no secrets.

## 9. Suggested Project Structure

```text
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── marketplace/
│   │   └── midmen/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── listings/
│   │   ├── messages/
│   │   └── transactions/
│   ├── midman/
│   ├── admin/
│   └── api/
├── components/
│   ├── ui/
│   ├── marketplace/
│   ├── messaging/
│   ├── transaction/
│   └── midman/
├── lib/
│   ├── supabase/
│   ├── validations/
│   └── utils/
├── services/
│   ├── auth.service.ts
│   ├── listing.service.ts
│   ├── messaging.service.ts
│   ├── midman.service.ts
│   ├── transaction.service.ts
│   ├── payment.service.ts
│   └── notification.service.ts
├── types/
└── middleware.ts
```

Keep business logic inside service modules rather than placing it directly in UI components.

## 10. Security Requirements

Security must be implemented from the beginning.

- Enable RLS on all tables exposed through Supabase.
- Restrict messages to conversation members.
- Restrict transaction data to authorized participants.
- Protect payment receipts and verification documents.
- Protect dispute evidence.
- Validate all mutations on the server.
- Apply rate limits to sensitive endpoints.
- Protect administrative routes.
- Prevent unauthorized role assignment.
- Record important administrative actions.
- Test access using different user accounts and roles.

## 11. Initial Budget

The goal is to minimize expenses during development.

| Service | Initial Plan |
|---|---|
| GitHub | Free |
| Supabase | Free tier |
| Vercel | Free tier where eligible |
| Domain | Paid separately |
| SMS | Not included |
| Email | Optional future feature |

Important considerations:

- Free tiers have usage limits.
- Supabase Free may pause inactive projects.
- Vercel Hobby has commercial-use restrictions.
- Free hosting is not guaranteed permanent production hosting.
- Review current provider pricing and terms before public commercial operation.

## 12. Technologies Not Needed Initially

Avoid unnecessary infrastructure.

Do not introduce these without a clear technical requirement:

- Separate Node.js backend.
- FastAPI.
- Redis.
- Kafka.
- Kubernetes.
- Microservices.
- Custom WebSocket server.
- Automated escrow.
- Payment gateway.
- AI moderation service.

Start with Next.js and Supabase. Add infrastructure only when actual requirements justify it.

## 13. Recommended Development Order

1. Initialize Next.js with TypeScript.
2. Install and configure Tailwind CSS.
3. Set up shadcn/ui.
4. Create a Supabase project.
5. Configure environment variables.
6. Design the database schema.
7. Create SQL migrations.
8. Implement authentication.
9. Implement RLS policies.
10. Build marketplace features.
11. Build midman management.
12. Build messaging.
13. Build transaction management.
14. Implement payment records and manual verification.
15. Implement reviews and disputes.
16. Perform security and end-to-end testing.
17. Deploy the application.

## 14. Policy Reminder

The original marketplace concept involves Mobile Legends account transactions. The publisher's Terms of Service may prohibit selling, trading, transferring, or sharing accounts.

Do not enable real account trading until the activity has been confirmed as permitted or authorized.

Keep the marketplace architecture configurable for permitted goods and services.
