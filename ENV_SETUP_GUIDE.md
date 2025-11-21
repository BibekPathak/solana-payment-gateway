# Environment Variables Setup Guide

This guide will help you obtain all the required environment variables for the Solana Payment Gateway.

## 1. Cold Wallet Address

The cold wallet is where all collected payments will be automatically swept (transferred) to. This should be a secure wallet that you control.

### Option A: Create a New Solana Wallet (Recommended for Development)

**Using Solana CLI:**

1. **Install Solana CLI:**
   ```bash
   # Windows (PowerShell)
   sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
   
   # Or download from: https://docs.solana.com/cli/install-solana-cli-tools
   ```

2. **Generate a new keypair:**
   ```bash
   solana-keygen new --outfile ~/cold-wallet-keypair.json
   ```

3. **Get the public address:**
   ```bash
   solana-keygen pubkey ~/cold-wallet-keypair.json
   ```

4. **For Devnet (Testing):**
   ```bash
   # Set to devnet
   solana config set --url devnet
   
   # Airdrop test SOL
   solana airdrop 2 $(solana-keygen pubkey ~/cold-wallet-keypair.json) --url devnet
   ```

5. **Copy the address** - This is your `COLD_WALLET_ADDRESS`

**Using Phantom Wallet (Browser Extension):**

1. Install [Phantom Wallet](https://phantom.app/)
2. Create a new wallet
3. Go to Settings → Display Private Key (or just copy the public address)
4. Copy the public address - This is your `COLD_WALLET_ADDRESS`

**Using Solflare Wallet:**

1. Install [Solflare Wallet](https://solflare.com/)
2. Create a new wallet
3. Copy the public address - This is your `COLD_WALLET_ADDRESS`

### Option B: Use Existing Wallet

If you already have a Solana wallet, just copy its public address.

### ⚠️ Security Notes:

- **For Development:** Use a test wallet on devnet
- **For Production:** 
  - Use a hardware wallet (Ledger, Trezor)
  - Never store private keys in environment variables
  - Only use the public address in `.env`
  - Keep private keys offline and secure

---

## 2. Encryption Secret

The encryption secret is used to encrypt/decrypt key parts stored in the database and Redis. It must be at least 32 characters long.

### Generate Encryption Secret

**Option A: Using Node.js (Recommended):**

```bash
# In your terminal
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

This will output a 64-character hexadecimal string (32 bytes).

**Option B: Using PowerShell (Windows):**

```powershell
# Generate random bytes
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[System.BitConverter]::ToString($bytes) -replace '-', ''
```

**Option C: Using Online Generator:**

Visit: https://randomkeygen.com/ and use the "CodeIgniter Encryption Keys" section.

**Option D: Using OpenSSL:**

```bash
openssl rand -hex 32
```

### Example Output:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

**Copy this value** - This is your `ENCRYPTION_SECRET`

### ⚠️ Important:
- **Never share this secret**
- **Never commit it to git** (it's already in `.gitignore`)
- **Use different secrets for development and production**
- **Store it securely** - if lost, you cannot decrypt existing keys

---

## 3. Helius API Key

Helius provides enhanced Solana RPC and webhook services. It's optional but highly recommended for production.

### Step 1: Sign Up for Helius

1. Go to [https://www.helius.dev/](https://www.helius.dev/)
2. Click **"Get Started"** or **"Sign Up"**
3. Create an account (you can use GitHub, Google, or email)

### Step 2: Get Your API Key

1. After signing up, go to your **Dashboard**
2. Navigate to **"API Keys"** section
3. Click **"Create API Key"** or use the default one
4. **Copy the API key** - This is your `HELIUS_API_KEY`

### Step 3: Set Up Webhook Secret (Optional)

1. In your Helius dashboard, go to **"Webhooks"**
2. When creating a webhook, you can set a secret
3. **Copy the secret** - This is your `HELIUS_WEBHOOK_SECRET`

### Free Tier:

Helius offers a free tier with:
- 100,000 credits per month
- Enhanced APIs
- Webhook support
- Perfect for development and small projects

### Alternative: Use Public RPC (No API Key Needed)

If you don't want to use Helius, you can use public Solana RPC endpoints:

```env
# For Devnet
SOLANA_RPC_URL="https://api.devnet.solana.com"

# For Mainnet (free but rate-limited)
SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"
```

However, Helius provides:
- Better reliability
- Higher rate limits
- Enhanced transaction parsing
- Webhook support for real-time monitoring

---

## Complete .env File Example

After obtaining all values, your `.env` file should look like this:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/payment_gateway"

# Redis
REDIS_URL="redis://localhost:6379"

# Solana
SOLANA_RPC_URL="https://api.devnet.solana.com"
SOLANA_NETWORK="devnet"
COLD_WALLET_ADDRESS="7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"

# Encryption
ENCRYPTION_SECRET="a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"

# Helius (Optional but recommended)
HELIUS_API_KEY="04634f39-4521-4fee-9d0f-6a45b2917f20"
HELIUS_WEBHOOK_SECRET="your-webhook-secret-here"
SWEEP_THRESHOLD="0.1"

# Next.js
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## Quick Setup Commands

### Generate Encryption Secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Get Solana Wallet Address:
```bash
# If using Solana CLI
solana-keygen new
solana-keygen pubkey ~/.config/solana/id.json
```

### Test Your Setup:

1. **Test Database Connection:**
   ```bash
   npm run db:studio
   ```

2. **Test Redis Connection:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

3. **Test Solana Connection:**
   ```bash
   solana balance --url devnet
   ```

---

## Troubleshooting

### "Invalid encryption secret"
- Make sure it's at least 32 characters
- Use hexadecimal format (0-9, a-f)
- No spaces or special characters

### "Invalid wallet address"
- Solana addresses are base58 encoded
- Should be 32-44 characters long
- Test with: `solana address` command

### "Helius API key invalid"
- Check you copied the full key
- No extra spaces
- Make sure your Helius account is active

---

## Next Steps

After setting up your `.env` file:

1. **Initialize Database:**
   ```bash
   npm run db:generate
   npm run db:push
   ```

2. **Start Development Server:**
   ```bash
   npm run dev
   ```

3. **Test Payment Flow:**
   - Create a payment
   - Send test SOL to the payment address
   - Verify it's detected and swept

For more details, see [SETUP.md](./SETUP.md)

