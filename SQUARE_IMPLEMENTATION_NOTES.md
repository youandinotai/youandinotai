# Square Payment Implementation - Technical Notes

## Implementation Overview

This document provides technical details about the Square payment integration for YouAndINotAI.

## Architecture

### Payment Flow
1. **User initiates subscription** → Navigate to `/subscribe`
2. **Frontend loads Square SDK** → Dynamically loads appropriate CDN (sandbox/production)
3. **Square form renders** → Card input form attached to DOM
4. **User enters payment info** → Square tokenizes card (PCI-compliant)
5. **Token sent to backend** → POST `/api/create-subscription` with `sourceId` and `transactionId`
6. **Backend creates payment** → Square Payments API processes charge
7. **Database updated** → User's premium status and Square IDs stored
8. **Success response** → User redirected to app with premium access

### Idempotency Protection

#### Frontend (client/src/pages/subscribe.tsx)
```typescript
const [transactionId] = useState(() => {
  const stored = sessionStorage.getItem('square_txn_id');
  if (stored) return stored;
  const newId = crypto.randomUUID();
  sessionStorage.setItem('square_txn_id', newId);
  return newId;
});
```

**How it works:**
- Generates a stable UUID transaction ID per checkout session
- Stores in `sessionStorage` to survive page refreshes
- Prevents duplicate charges if user refreshes page or retries payment
- Cleared after successful payment

#### Backend (server/routes.ts)
```typescript
const idempotencyKey = `subscription-${userId}-${transactionId}`;
```

**How it works:**
- Combines user ID with client-provided transaction ID
- Creates deterministic, unique key per user + transaction
- Square's API prevents duplicate charges with same idempotency key
- Works across server restarts and retries

### Webhook Signature Verification

#### Middleware Setup (server/index.ts)
```typescript
// Apply raw body parser BEFORE json parser for webhook route
app.use('/api/webhooks/square', express.raw({ type: 'application/json' }));
app.use(express.json());
```

**Why this matters:**
- Webhook signatures are calculated over the **raw request body**
- If Express parses JSON first, the body is modified and signature fails
- Raw middleware must be applied before JSON middleware
- Only affects `/api/webhooks/square` route

#### Verification (server/routes.ts)
```typescript
const rawBody = req.body.toString('utf8'); // Raw buffer
const isValid = WebhooksHelper.isValidWebhookEventSignature(
  rawBody,
  signature,
  signatureKey,
  req.url
);
```

**How it works:**
- Receives raw buffer from Express
- Converts to UTF-8 string (exact bytes as received)
- Square's `WebhooksHelper` verifies HMAC-SHA256 signature
- Only parses JSON after signature verified
- Rejects requests with invalid signatures

## Database Schema

### Users Table
```sql
square_customer_id VARCHAR      -- Square Customer ID (e.g., "CUST_...")
square_subscription_id VARCHAR  -- Square Payment ID (currently storing payment ID)
is_premium BOOLEAN              -- Premium status flag
```

### Storage Method
```typescript
async updateUserSquareInfo(userId, customerId, subscriptionId): Promise<User> {
  // Updates:
  // - squareCustomerId
  // - squareSubscriptionId (currently payment ID)
  // - isPremium = true
  // - updatedAt
}
```

## Current Limitations & Future Enhancements

### Current Implementation: One-Time Payments

**What it does:**
- Charges $9.99 immediately when user clicks subscribe
- Creates a Square Payment (not Subscription)
- Stores payment ID as `square_subscription_id`
- Sets user to premium
- User must manually re-subscribe weekly

**What it doesn't do:**
- Automatic weekly renewals
- Subscription management in Square Dashboard
- Prorated refunds
- Subscription pause/resume

### Why One-Time Payments?

This implementation was chosen for simplicity and immediate production deployment:
- No subscription plan setup required in Square Dashboard
- No catalog item creation needed
- Immediate payment processing
- Simpler webhook handling (just payment events)

### Migrating to True Subscriptions

To implement automatic recurring billing:

1. **Square Dashboard Setup:**
   - Create subscription plan in Catalog
   - Set pricing ($9.99/week)
   - Configure billing cycles

2. **Backend Changes:**
   ```typescript
   // Replace paymentsApi.createPayment with:
   const { result } = await squareClient.subscriptionsApi.createSubscription({
     locationId: process.env.SQUARE_LOCATION_ID,
     planId: 'YOUR_PLAN_ID', // From Square Dashboard
     customerId: customerId,
     idempotencyKey: idempotencyKey,
   });
   ```

3. **Cancel Endpoint Update:**
   ```typescript
   // Replace paymentsApi.cancelPayment with:
   await squareClient.subscriptionsApi.cancelSubscription(
     user.squareSubscriptionId
   );
   ```

4. **Webhook Events to Handle:**
   - `subscription.created`
   - `subscription.updated` (renewals)
   - `subscription.canceled`
   - `invoice.payment_made`
   - `invoice.payment_failed`

5. **Database Schema:**
   - Add `subscription_period_start` and `subscription_period_end`
   - Track renewal dates
   - Add `payment_id` separate from `subscription_id`

## Security Features

### ✅ Implemented

1. **Idempotency Keys**
   - Client-generated stable UUIDs
   - Stored in sessionStorage
   - Combined with user ID on backend
   - Prevents duplicate charges on retries

2. **Webhook Signature Verification**
   - HMAC-SHA256 signatures
   - Raw body preservation
   - Square's official WebhooksHelper
   - Rejects tampered/spoofed events

3. **Card Data Security**
   - Square Web Payments SDK handles card data
   - Card details never touch your servers
   - PCI DSS compliant tokenization
   - HTTPS required for production

4. **Environment Separation**
   - Development uses sandbox
   - Production uses live credentials
   - Automatic CDN switching
   - Environment variable validation

### ⚠️ Recommended Additions

1. **Event ID Deduplication**
   ```typescript
   // Store processed event IDs to prevent replay attacks
   const processedEvents = new Set<string>();
   
   if (processedEvents.has(event.event_id)) {
     return res.json({ received: true, duplicate: true });
   }
   processedEvents.add(event.event_id);
   ```

2. **Rate Limiting**
   ```typescript
   // Prevent abuse of subscription endpoint
   import rateLimit from 'express-rate-limit';
   
   const subscriptionLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 5, // 5 attempts per window
   });
   
   app.post('/api/create-subscription', subscriptionLimiter, ...);
   ```

3. **Payment Logging**
   ```typescript
   // Log all payment attempts for audit trail
   await db.insert(paymentLogs).values({
     userId,
     transactionId,
     paymentId,
     amount: 999,
     status: paymentStatus,
     timestamp: new Date(),
   });
   ```

## Testing

### Development (Sandbox)
```bash
NODE_ENV=development
SQUARE_ACCESS_TOKEN=sandbox_token
VITE_SQUARE_APPLICATION_ID=sandbox_app_id
```

**Test Cards:**
- Success: `4111 1111 1111 1111`
- Declined: `4000 0000 0000 0002`
- CVV: any 3 digits
- Exp: any future date
- ZIP: any 5 digits

### Production
```bash
NODE_ENV=production
SQUARE_ACCESS_TOKEN=production_token
VITE_SQUARE_APPLICATION_ID=production_app_id
```

**Real Card Required** - Test with small amount first

## Troubleshooting

### Payment Not Processing
- Check browser console for Square SDK errors
- Verify `VITE_SQUARE_APPLICATION_ID` and `VITE_SQUARE_LOCATION_ID`
- Ensure production credentials match environment
- Check network tab for API errors

### isPremium Not Set
- Verify payment status is `COMPLETED`
- Check database: `SELECT * FROM users WHERE id = 'user_id'`
- Review application logs for errors
- Confirm `updateUserSquareInfo` was called

### Webhook Not Receiving Events
- Verify webhook URL is publicly accessible (not localhost)
- Check Square Developer Dashboard for delivery status
- Review webhook signature key matches
- Check application logs for signature errors

### Duplicate Charges
- Check sessionStorage has `square_txn_id`
- Verify backend receives `transactionId` in request
- Check Square Dashboard for payment idempotency key
- Look for errors in payment creation

## Monitoring

### Key Metrics
- Payment success rate
- Failed payments (card declines vs errors)
- Webhook delivery success
- Premium activation rate
- Average time to premium conversion

### Logs to Monitor
```bash
# Success
"Payment completed for customer: CUST_..."
"Square webhook event received: payment.created"

# Errors
"Invalid webhook signature"
"Failed to create subscription"
"Transaction ID required"
```

---

**Last Updated:** October 21, 2025  
**Implementation Version:** 1.0 (One-Time Payments)
