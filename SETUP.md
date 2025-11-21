# Setup Guide

This guide will help you set up the Solana Payment Gateway from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ and npm/yarn
- **PostgreSQL** database (local or cloud)
- **Redis** server (local or cloud)
- A **Solana wallet** for the cold wallet address

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up PostgreSQL Database

Create a new PostgreSQL database:

```sql
CREATE DATABASE payment_gateway;
```

Or use a cloud provider like:
- [Supabase](https://supabase.com)
- [Neon](https://neon.tech)
- [Railway](https://railway.app)

### 3. Set Up Redis

**Local Redis:**
```bash
# macOS
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo systemctl start redis

# Windows
# Download from https://redis.io/download
```

**Cloud Redis:**
- [Redis Cloud](https://redis.com/cloud/)
- [Upstash](https://upstash.com)

### 4. Configure Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Database (replace with your PostgreSQL connection string)
DATABASE_URL="postgresql://user:password@localhost:5432/payment_gateway"

# Redis (replace with your Redis connection string)
REDIS_URL="redis://localhost:6379"

# Solana Configuration
SOLANA_RPC_URL="https://api.devnet.solana.com"  # Use mainnet-beta for production
SOLANA_NETWORK="devnet"  # Use mainnet-beta for production
COLD_WALLET_ADDRESS="your-cold-wallet-solana-address"

# Encryption Secret (generate a random 32+ character string)
ENCRYPTION_SECRET="your-super-secret-encryption-key-min-32-chars"

# Helius (Optional but recommended)
HELIUS_API_KEY="your-helius-api-key"
HELIUS_WEBHOOK_SECRET="your-webhook-secret"
SWEEP_THRESHOLD="0.1"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Generate Encryption Secret:**
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use an online generator
# https://randomkeygen.com/
```

### 5. Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# Or create a migration
npm run db:migrate
```

### 6. Set Up Solana Wallet

**For Development (Devnet):**
1. Install Solana CLI: https://docs.solana.com/cli/install-solana-cli-tools
2. Generate a keypair: `solana-keygen new`
3. Airdrop test SOL: `solana airdrop 2 <your-address> --url devnet`
4. Use this address as your `COLD_WALLET_ADDRESS`

**For Production (Mainnet):**
1. Use a hardware wallet or secure key management
2. Never store private keys in environment variables
3. Use the public address as `COLD_WALLET_ADDRESS`

### 7. Set Up Helius Webhooks (Optional but Recommended)

1. Sign up at [Helius](https://www.helius.dev/)
2. Get your API key
3. Deploy your application
4. Register webhooks using the Helius API:

```typescript
import { registerHeliusWebhook } from '@/lib/helius';

await registerHeliusWebhook(
  'https://your-domain.com/api/webhooks/helius',
  ['address1', 'address2'] // Payment addresses to monitor
);
```

### 8. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000` to see the payment gateway.

## Testing

### Test Payment Flow

1. Create a payment with a small amount (e.g., 0.01 SOL)
2. Copy the payment address
3. Send SOL to that address from another wallet
4. Watch the payment status update automatically

### Test on Devnet

```bash
# Get test SOL
solana airdrop 1 <your-test-wallet> --url devnet

# Send test payment
solana transfer <payment-address> 0.01 --url devnet
```

## Production Deployment

### 1. Environment Setup

- Use production database (PostgreSQL)
- Use production Redis
- Set `SOLANA_NETWORK="mainnet-beta"`
- Use mainnet RPC endpoint
- Set strong `ENCRYPTION_SECRET`
- Configure `COLD_WALLET_ADDRESS` with production wallet

### 2. Security Checklist

- [ ] Strong encryption secret (32+ characters)
- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] Redis password set
- [ ] Webhook signature verification enabled
- [ ] Rate limiting configured
- [ ] Monitoring and alerts set up

### 3. Deployment Options

- **Vercel**: Easy Next.js deployment
- **Railway**: Full-stack deployment with database
- **AWS/GCP/Azure**: Enterprise deployment
- **Docker**: Containerized deployment

### 4. Database Migrations

```bash
npm run db:migrate
```

### 5. Monitor

- Set up error tracking (Sentry, etc.)
- Monitor payment status
- Track sweep transactions
- Alert on failures

## Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -h localhost -U user -d payment_gateway

# Check Prisma connection
npm run db:studio
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli ping

# Check Redis logs
redis-cli monitor
```

### Solana RPC Issues

- Check RPC endpoint is accessible
- Verify network (devnet/mainnet) matches
- Check rate limits on free RPC endpoints
- Consider using Helius or other premium RPC providers

### Key Management Issues

- Verify `ENCRYPTION_SECRET` is set
- Check Redis is accessible
- Verify database has key parts
- Check encryption/decryption functions

## Next Steps

- Read the [README.md](./README.md) for API documentation
- Review security best practices
- Set up monitoring and alerts
- Configure webhooks for production
- Test thoroughly before going live

## Support

For issues or questions:
- Check the [README.md](./README.md)
- Review error logs
- Test with devnet first
- Verify all environment variables are set correctly

