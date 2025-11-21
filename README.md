# Solana Payment Gateway

A secure, production-ready crypto payment gateway for Solana with advanced private key management, automated address sweeping, and Helius indexer integration.

## Features

- 🔐 **Advanced Key Management**: Key splitting across database and Redis for enhanced security
- 🔄 **Helius Integration**: Automated address monitoring via Helius webhooks
- 💰 **Auto-Sweeping**: Automatic fund transfer to cold wallet after payment confirmation
- 🛡️ **Secure Storage**: Encrypted key parts with AES-256-GCM encryption
- 📊 **Payment Tracking**: Real-time payment status monitoring
- 🎨 **Modern UI**: Beautiful, responsive payment interface with QR codes

## Architecture

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│   Prisma    │     │   Redis     │
│     API     │     │   (Postgres)│     │  (Key Parts)│
└──────┬──────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│   Solana    │     │   Helius    │
│   Network   │◀────│  Webhooks   │
└─────────────┘     └─────────────┘
```

## Prerequisites

- Node.js 18+ and npm/yarn
- PostgreSQL database
- Redis server
- Solana wallet (for cold wallet)
- Helius API key (optional, for webhooks)

## Installation

1. **Clone and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/payment_gateway"

# Redis
REDIS_URL="redis://localhost:6379"

# Solana
SOLANA_RPC_URL="https://api.devnet.solana.com"
SOLANA_NETWORK="devnet"
COLD_WALLET_ADDRESS="your-cold-wallet-address"

# Encryption
ENCRYPTION_SECRET="your-32-character-encryption-secret"

# Helius (Optional)
HELIUS_API_KEY="your-helius-api-key"
HELIUS_WEBHOOK_SECRET="your-webhook-secret"
SWEEP_THRESHOLD="0.1"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

3. **Set up the database:**

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Or run migrations
npm run db:migrate
```

4. **Start the development server:**

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Usage

### Creating a Payment

1. Navigate to the home page
2. Enter the payment amount in SOL
3. Optionally add merchant ID and order ID
4. Click "Create Payment"
5. A unique payment address will be generated
6. Share the QR code or address with the payer

### Payment Flow

1. **Payment Creation**: System generates a unique Solana address
2. **Address Monitoring**: Helius webhooks monitor the address for incoming transactions
3. **Payment Confirmation**: When payment is detected, status updates to "completed"
4. **Auto-Sweep**: Funds are automatically transferred to the cold wallet
5. **Status Updates**: Real-time status updates via polling or webhooks

### Webhook Setup

To enable Helius webhooks:

1. Deploy your application and get the webhook URL
2. Use the Helius API to register webhooks for your payment addresses
3. The webhook endpoint is available at `/api/webhooks/helius`

Example webhook registration:

```typescript
import { registerHeliusWebhook } from '@/lib/helius';

await registerHeliusWebhook(
  'https://your-domain.com/api/webhooks/helius',
  ['payment-address-1', 'payment-address-2']
);
```

## API Endpoints

### `POST /api/payments/create`

Create a new payment.

**Request:**
```json
{
  "amount": 0.1,
  "currency": "SOL",
  "merchantId": "merchant-123",
  "orderId": "order-456"
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "payment-id",
    "amount": 0.1,
    "currency": "SOL",
    "address": "Solana-address",
    "status": "pending"
  }
}
```

### `GET /api/payments/[id]`

Get payment details by ID.

### `GET /api/payments/status/[address]`

Get payment status by address (includes current balance).

### `POST /api/webhooks/helius`

Helius webhook endpoint for address monitoring.

## Security Considerations

1. **Key Management**: 
   - Keys are split and stored across database and Redis
   - All key parts are encrypted using AES-256-GCM
   - Consider implementing Shamir's Secret Sharing for production

2. **Environment Variables**:
   - Never commit `.env` files
   - Use strong encryption secrets
   - Rotate keys regularly

3. **Cold Wallet**:
   - Store cold wallet private key securely offline
   - Use hardware wallets for production

4. **Webhook Security**:
   - Verify webhook signatures
   - Use HTTPS for webhook endpoints
   - Implement rate limiting

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Database studio
npm run db:studio
```

## Production Deployment

1. Set up PostgreSQL and Redis in production
2. Configure environment variables
3. Set up Helius webhooks
4. Deploy to Vercel, AWS, or your preferred platform
5. Configure SSL/HTTPS
6. Set up monitoring and alerts

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

