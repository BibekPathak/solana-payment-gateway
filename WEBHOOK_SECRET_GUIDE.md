# Webhook Secret Setup Guide

## What is a Webhook Secret?

A webhook secret is a secure token you create to verify that incoming webhook requests are legitimate and coming from Helius (or your trusted source). It acts as a simple authentication mechanism.

## How to Generate a Webhook Secret

### Option 1: Using Node.js (Recommended)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This generates a 64-character hexadecimal string.

### Option 2: Using PowerShell (Windows)

```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[System.BitConverter]::ToString($bytes) -replace '-', ''
```

### Option 3: Using Online Generator

Visit: https://randomkeygen.com/ and use the "CodeIgniter Encryption Keys" section.

### Option 4: Using OpenSSL

```bash
openssl rand -hex 32
```

## Example Output

```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

## How It Works

The webhook secret is used in two ways:

### 1. **Simple Header Authentication** (Current Implementation)

When Helius sends a webhook request, you can configure it to include a custom header with your secret. The webhook handler checks if the header matches your stored secret.

**In your `.env` file:**
```env
HELIUS_WEBHOOK_SECRET="your-generated-secret-here"
```

**How to use with Helius:**

When registering your webhook with Helius, you can add custom headers. However, Helius doesn't natively support custom headers in their webhook registration API. Instead, you have a few options:

#### Option A: Use URL Query Parameter (Simpler)

Modify your webhook URL to include the secret:

```
https://your-domain.com/api/webhooks/helius?secret=your-webhook-secret
```

Then update the webhook handler to check the query parameter instead of headers.

#### Option B: Verify by IP/Origin (Less Secure)

Since Helius webhooks come from known IP addresses, you could verify the request origin. However, this is less secure.

#### Option C: Use Helius Webhook ID (Recommended)

Helius assigns a unique webhook ID when you create a webhook. You can use this as part of your verification.

### 2. **HMAC Signature Verification** (More Secure - Advanced)

For production, you can implement HMAC signature verification. However, Helius doesn't send signatures by default, so you'd need to:

1. Generate a secret
2. Store it securely
3. Use it to verify requests in a custom way

## Setting Up Webhook Secret

### Step 1: Generate the Secret

Run one of the commands above to generate a random secret.

### Step 2: Add to .env File

```env
HELIUS_WEBHOOK_SECRET="a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"
```

### Step 3: Update Webhook Registration

When you register your webhook with Helius, you can include the secret in the webhook URL as a query parameter:

```typescript
import { registerHeliusWebhook } from '@/lib/helius';

const webhookSecret = process.env.HELIUS_WEBHOOK_SECRET;
const webhookUrl = `https://your-domain.com/api/webhooks/helius?secret=${webhookSecret}`;

await registerHeliusWebhook(webhookUrl, ['address1', 'address2']);
```

### Step 4: Update Webhook Handler (If Using Query Parameter)

If you want to use query parameters instead of headers, update the webhook route:

```typescript
// In app/api/webhooks/helius/route.ts
const webhookSecret = process.env.HELIUS_WEBHOOK_SECRET;
const providedSecret = request.nextUrl.searchParams.get('secret');

if (webhookSecret && providedSecret !== webhookSecret) {
  return NextResponse.json(
    { success: false, error: 'Invalid webhook secret' },
    { status: 401 }
  );
}
```

## Important Notes

### ⚠️ Security Considerations:

1. **Never commit the secret to git** - It's already in `.gitignore`
2. **Use different secrets for dev/prod** - Don't reuse secrets
3. **Rotate secrets periodically** - Change them every few months
4. **Use HTTPS** - Always use HTTPS for webhook endpoints
5. **Keep it long and random** - At least 32 characters

### 🔒 Best Practices:

- **Development**: You can skip the webhook secret for local testing
- **Production**: Always use a webhook secret
- **Rotation**: Have a plan to rotate secrets without downtime

## Current Implementation

The current implementation checks for the secret in the `x-webhook-secret` header. However, since Helius doesn't send custom headers by default, you have these options:

1. **Skip verification for now** (development only)
2. **Use query parameter** (modify the code as shown above)
3. **Use Helius webhook ID** (store the webhook ID and verify it)
4. **Implement IP whitelisting** (less secure but works)

## Quick Setup

1. **Generate secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Add to .env:**
   ```env
   HELIUS_WEBHOOK_SECRET="your-generated-secret"
   ```

3. **For development:** You can leave it empty or skip verification
4. **For production:** Implement one of the verification methods above

## Testing

To test your webhook locally, you can use a tool like:

- **ngrok** - Expose local server: `ngrok http 3000`
- **Webhook.site** - Test webhook endpoints
- **Postman** - Send test webhook requests

## Troubleshooting

### "Invalid webhook secret" error

- Check that the secret in `.env` matches what you're sending
- Verify no extra spaces or newlines
- Make sure the secret is at least 32 characters

### Webhook not receiving requests

- Check your webhook URL is accessible
- Verify Helius webhook is active in dashboard
- Check server logs for errors
- Ensure HTTPS is enabled (required for production)

## Alternative: Skip Secret for Development

If you're just developing locally, you can:

1. Leave `HELIUS_WEBHOOK_SECRET` empty in `.env`
2. The webhook will work without verification
3. **Only do this for development!**

```env
# For development - leave empty
HELIUS_WEBHOOK_SECRET=""

# For production - use a generated secret
# HELIUS_WEBHOOK_SECRET="your-secret-here"
```

