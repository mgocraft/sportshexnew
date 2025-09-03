
# SportsHex Pro Admin (Embedded Stripe + Admin)

Features
- Embedded Stripe Payment Element on /pay
- Webhook: payment_intent.succeeded inserts orders
- Free-text "note" on purchase
- Weighted scoring (orders.factor) for longshots vs favorites
- Admin page to set result (hit/miss) and factor
- Weighted leaderboard

## .env.local
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_ADMIN_KEY=changeme_admin_key

## Dev
1) Supabase: run data/schema.sql
2) Stripe CLI:
   stripe login
   stripe listen --events payment_intent.succeeded --forward-to localhost:3000/api/webhook
3) npm i && npm run dev
4) Visit /admin?key=changeme_admin_key to edit orders
