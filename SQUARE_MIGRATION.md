# Square Payment Migration Guide

## Overview
YouAndINotAI has been migrated from Stripe to Square for payment processing. All subscription and payment functionality now uses Square's payment infrastructure.

## Environment Variables Required

### Backend Environment Variables (.env)
```bash
# Square Payment Configuration (Production)
SQUARE_ACCESS_TOKEN=your_production_access_token
SQUARE_WEBHOOK_SIGNATURE_KEY=your_webhook_signature_key

# Node Environment
NODE_ENV=production  # Use 'production' for live payments, 'development' for testing
```

### Frontend Environment Variables
Add these to your `.env` file with `VITE_` prefix for frontend access:

```bash
# Square Web Payments SDK Configuration
VITE_SQUARE_APPLICATION_ID=your_application_id
VITE_SQUARE_LOCATION_ID=your_location_id
```

## How to Get Square Credentials

### 1. Square Access Token
1. Log in to [Square Developer Dashboard](https://developer.squareup.com/)
2. Navigate to your application
3. Go to "Credentials" tab
4. Copy your **Production Access Token** (starts with `EAAAE...`)
5. Set as `SQUARE_ACCESS_TOKEN` in your `.env` file

### 2. Application ID
1. In the same "Credentials" tab
2. Copy your **Production Application ID** (starts with `sq0idp-...` or similar)
3. Set as `VITE_SQUARE_APPLICATION_ID`

### 3. Location ID
1. Go to [Square Dashboard](https://squareup.com/dashboard/)
2. Navigate to "Locations" in your account
3. Select your business location
4. Copy the Location ID
5. Set as `VITE_SQUARE_LOCATION_ID`

### 4. Webhook Signature Key
1. In [Square Developer Dashboard](https://developer.squareup.com/)
2. Go to your application's "Webhooks" tab
3. Create a new webhook subscription pointing to: `https://youandinotai.com/api/webhooks/square`
4. Subscribe to these events:
   - `payment.created`
   - `payment.updated`
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
5. Copy the **Signature Key** shown after creating the webhook
6. Set as `SQUARE_WEBHOOK_SIGNATURE_KEY` in your `.env` file

## Database Changes

### Schema Updates
The following database schema changes have been applied:

**Users Table:**
- Added: `square_customer_id` (VARCHAR) - Stores Square customer ID
- Added: `square_subscription_id` (VARCHAR) - Stores Square subscription/payment ID
- Deprecated: `stripe_customer_id`, `stripe_subscription_id` (kept for data migration, can be removed later)

**Subscriptions Table:**
- Added: `square_subscription_id` (VARCHAR)
- Deprecated: `stripe_subscription_id`

### Migration Command
Database schema changes have been applied using:
```bash
npm run db:push --force
```

## API Changes

### Backend Routes Updated
1. **POST /api/create-subscription**
   - Now uses Square Payments API
   - Creates customer if needed
   - Processes payment using Square Web Payments SDK token
   - Returns payment status and IDs

2. **POST /api/cancel-subscription**
   - Cancels Square payment/subscription
   - Updates user premium status

3. **GET /api/subscription-status**
   - Returns Square subscription ID instead of Stripe

### Frontend Integration
The subscription page (`client/src/pages/subscribe.tsx`) has been completely rewritten to use:
- Square Web Payments SDK (loaded from CDN)
- Card tokenization using Square's secure payment form
- Direct integration with backend Square API

## Pricing
Current subscription pricing: **$9.99/week**

## Production Checklist

### Before Going Live:
- [ ] Set `NODE_ENV=production` in backend environment
- [ ] Set `SQUARE_ACCESS_TOKEN` with production credentials (not sandbox)
- [ ] Set `SQUARE_WEBHOOK_SIGNATURE_KEY` with production webhook signature
- [ ] Set `VITE_SQUARE_APPLICATION_ID` with production application ID
- [ ] Set `VITE_SQUARE_LOCATION_ID` with correct location
- [ ] Verify Square Web Payments SDK URL auto-switches to production (built-in)
- [ ] Configure webhook in Square Dashboard:
  - Webhook URL: `https://youandinotai.com/api/webhooks/square`
  - Events: payment.created, payment.updated, subscription.*
- [ ] Test payment flow end-to-end with real card
- [ ] Verify webhook receives and processes events correctly
- [ ] Monitor webhook logs for proper signature verification

### Security Notes
- Never commit Square credentials to version control
- Use environment variables for all sensitive data
- Production access tokens should only be used in production environment
- Keep sandbox credentials separate from production

## Testing in Sandbox Mode

For testing, use sandbox credentials:
1. Set `NODE_ENV=development`
2. Use sandbox access token from Square Developer Dashboard
3. Use sandbox application ID
4. Keep Square SDK URL as `https://sandbox.web.squarecdn.com/v1/square.js`

## Support
- Square API Documentation: https://developer.squareup.com/docs
- Square Payment Forms: https://developer.squareup.com/docs/web-payments/overview
- Square Support: https://squareup.com/help

## Notes
- Square uses payment intents for one-time and recurring payments
- Subscriptions in Square work differently than Stripe (may need to set up in Square Dashboard)
- The current implementation creates one-time payments; for true recurring subscriptions, consider using Square's Subscriptions API
