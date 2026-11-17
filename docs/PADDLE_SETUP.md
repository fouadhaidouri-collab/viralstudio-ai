# Paddle Billing — Sandbox test setup

ViralStudio uses Paddle's official hosted Paddle Checkout. The application checkout flow is intentionally locked to **Paddle Sandbox** during testing. Do not copy Sandbox credentials into Live settings or switch the application to Live until the account and domain are approved and a separate go-live review is completed.

## Vercel environment variables

Set these for the Preview environment used by this test branch. The existing Preview client token and six Sandbox price IDs are already configured; add the Sandbox API key and the new Preview webhook secret:

- `PADDLE_ENVIRONMENT=sandbox`
- `NEXT_PUBLIC_PADDLE_TEST_CLIENT_TOKEN`: Sandbox client-side token
- `PADDLE_TEST_API_KEY`: Sandbox API key with `transaction.write` permission
- `PADDLE_TEST_WEBHOOK_SECRET`: signing secret from the new Sandbox notification destination created for this Preview branch
- `PADDLE_TEST_PRICE_ID_BEGINNER`
- `PADDLE_TEST_PRICE_ID_BUILDER`
- `PADDLE_TEST_PRICE_ID_CREATOR`
- `PADDLE_TEST_PRICE_ID_PRO`
- `PADDLE_TEST_PRICE_ID_ELITE`
- `PADDLE_TEST_PRICE_ID_ULTIMATE`

The six prices must be active, one-time USD prices and match the credit pack catalog in `app/api/payments/paddle/create/route.js`.

## Paddle Sandbox configuration

1. In the Paddle Sandbox dashboard, create or select the ViralStudio AI Credits product and its six one-time prices.
2. Under Checkout settings, configure the Sandbox Default Payment Link to an HTTPS page on the test domain.
3. Create a Sandbox notification destination pointing to:

   `https://viralstudio-ai-git-feat-p-203b7d-fouadhaidouri-collabs-projects.vercel.app/api/webhooks/paddletest`

4. Subscribe to `transaction.completed`, `transaction.payment_failed`, and `transaction.canceled`.
5. Copy the destination secret into `PADDLE_TEST_WEBHOOK_SECRET`.

## Payment flow

1. The authenticated server creates a local pending payment record.
2. The server creates a Paddle Sandbox transaction through `POST https://sandbox-api.paddle.com/transactions`, with the catalog price ID and local transaction metadata.
3. Paddle.js opens the official hosted checkout using the returned Paddle transaction ID.
4. Credits are added only after the signed Sandbox `transaction.completed` webhook passes transaction, currency, and amount checks.
5. A credit-ledger entry prevents duplicate credit grants when Paddle retries a webhook.
6. Failed or canceled transactions are marked failed and receive no credits.

## Historical data and Live isolation

Legacy provider endpoints are retired from the application, but historical payment rows and credit-ledger entries are retained. The existing Live Paddle webhook and Live credentials are not modified by this Sandbox rebuild. Do not deploy this test branch to Production.
