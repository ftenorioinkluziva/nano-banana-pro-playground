# SaaS Integration Plan: Credits & Payments

## 1. Database Schema Update
We need to track user credits and transaction history.

### Changes to `db/schema.ts`
1.  **Update `user` table**:
    *   Add `credits` column (integer, default 0 or 10 for trial).
    *   Add `stripeCustomerId` column (text, unique).

2.  **Create `transactions` table**:
    *   `id`: uuid/text pk
    *   `userId`: fk to user
    *   `amount`: integer (positive for purchase, negative for usage)
    *   `type`: enum ('purchase', 'topup', 'usage', 'bonus', 'refund')
    *   `description`: text (e.g. "Generated Video 720p")
    *   `stripePaymentId`: text (optional)
    *   `createdAt`: timestamp

## 2. Dependencies
*   Install `stripe` package: `pnpm add stripe`
*   Add env vars:
    *   `STRIPE_SECRET_KEY`
    *   `STRIPE_WEBHOOK_SECRET`
    *   `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
    *   `STRIPE_PRICE_ID_CREDITS_PACK` (e.g. 500 credits for $10)

## 3. Stripe Integration (Backend)
### A. Checkout Session API (`app/api/stripe/checkout/route.ts`)
*   Creates a Stripe Checkout Session for a credit package.
*   Returns the checkout URL.

### B. Webhook API (`app/api/stripe/webhook/route.ts`)
*   Listens for `checkout.session.completed`.
*   Verifies signature.
*   Updates user credits in DB (`db.update(user)...`).
*   Records transaction in `transactions` table.

## 4. Usage Logic (Middleware/Guard)
We need a unified function to check and deduct credits.

### Helper: `lib/credits.ts`
*   `checkBalance(userId: string, cost: number): Promise<boolean>`
*   `deductCredits(userId: string, cost: number, description: string): Promise<void>` -> runs in transaction.

### Update Generation Endpoints
*   `app/api/generate-image/route.ts`:
    *   Cost: e.g. 5 credits.
    *   Call `deductCredits` before or after successful generation (safer to check before, deduct after success, or simpler: deduct before, refund on error).
*   `app/api/generate-video/route.ts`:
    *   Cost: e.g. 50 credits.

## 5. Rate Limiting (Protection)
We can use a simple Redis-based rate limiter (Upstash) or a DB-based one.
*   Given we are using Neon (Postgres), a DB-based sliding window is reasonable for starters, or in-memory if single instance.
*   For a robust SaaS, `upstash/ratelimit` is standard.
*   **Plan**: Implement a basic DB rate limiter using `transactions` table count or a separate `rate_limits` table if traffic is high. For now, simple user-level throttling in code is enough.

## 6. Admin & Dashboard
*   **Admin Page**: `/admin/credits`
    *   List users and credit balances.
    *   Ability to manually add credits (for support/refunds).
*   **User Dashboard**: `/settings/billing`
    *   Show current balance.
    *   "Buy Credits" button.
    *   Transaction history table.

## 7. Execution Steps for Agent
1.  **Install Stripe**: `pnpm add stripe`
2.  **Modify Schema**: Edit `db/schema.ts`, run `pnpm db:push` (or generate/migrate).
3.  **Create Transactions Table**: In schema.
4.  **Implement Credit Logic**: `lib/credits.ts`.
5.  **Setup Webhooks**: Create route handler.
6.  **Protect Endpoints**: Modify existing generation routes.
7.  **Frontend Updates**: Navigation bar (show credits), Billing page.

---
**Next Step for User**: Approve this plan and provide Stripe Keys (or use test mode keys).
