import { Keypair } from '@solana/web3.js';
import { getKeyPart, storeKeyPart } from './redis';
import { prisma } from './db';
import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

// Encryption key derived from environment variable
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('ENCRYPTION_SECRET environment variable is required');
  }
  return crypto.pbkdf2Sync(secret, 'salt', ITERATIONS, KEY_LENGTH, 'sha512');
}

export function encrypt(text: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

export function decrypt(encryptedText: string): string {
  const key = getEncryptionKey();
  const parts = encryptedText.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const tag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

// Split private key into parts using simple splitting (for production, use Shamir's Secret Sharing)
export function splitKey(privateKey: Uint8Array, numParts: number = 3): string[] {
  const keyString = Buffer.from(privateKey).toString('base64');
  const partLength = Math.ceil(keyString.length / numParts);
  const parts: string[] = [];

  for (let i = 0; i < numParts; i++) {
    const start = i * partLength;
    const end = Math.min(start + partLength, keyString.length);
    parts.push(keyString.slice(start, end));
  }

  return parts;
}

// Reconstruct private key from parts
export function reconstructKey(parts: string[]): Uint8Array {
  const keyString = parts.join('');
  return new Uint8Array(Buffer.from(keyString, 'base64'));
}

// Store key parts across DB and Redis
export async function storeSplitKey(keypair: Keypair, numParts: number = 3) {
  const privateKey = keypair.secretKey;
  const parts = splitKey(privateKey, numParts);

  // Store first part in DB (encrypted)
  const encryptedPart0 = encrypt(parts[0]);
  await prisma.keyPart.upsert({
    where: { keyPartIndex: 0 },
    update: { encryptedPart: encryptedPart0 },
    create: {
      keyPartIndex: 0,
      encryptedPart: encryptedPart0,
    },
  });

  // Store remaining parts in Redis (encrypted)
  for (let i = 1; i < parts.length; i++) {
    const encryptedPart = encrypt(parts[i]);
    await storeKeyPart(i, encryptedPart);
  }

  return keypair.publicKey.toBase58();
}

// Retrieve and reconstruct key
export async function retrieveKey(): Promise<Keypair | null> {
  try {
    // Get first part from DB
    const keyPart0 = await prisma.keyPart.findUnique({
      where: { keyPartIndex: 0 },
    });

    if (!keyPart0) {
      return null;
    }

    const part0 = decrypt(keyPart0.encryptedPart);
    const parts = [part0];

    // Get remaining parts from Redis
    let i = 1;
    while (true) {
      const part = await getKeyPart(i);
      if (!part) break;
      parts.push(decrypt(part));
      i++;
    }

    if (parts.length < 2) {
      throw new Error('Not enough key parts found');
    }

    const privateKey = reconstructKey(parts);
    return Keypair.fromSecretKey(privateKey);
  } catch (error) {
    console.error('Error retrieving key:', error);
    return null;
  }
}

// Generate a new payment address from the master key
export async function generatePaymentAddress(): Promise<{ address: string; keypair: Keypair }> {
  const keypair = Keypair.generate();
  const address = keypair.publicKey.toBase58();

  // Store this address's encrypted private key in Redis for sweeping
  const encryptedKey = encrypt(Buffer.from(keypair.secretKey).toString('base64'));
  const { storeKeyPart } = await import('./redis');
  await storeKeyPart(`address:${address}`, encryptedKey);
  
  await prisma.paymentAddress.create({
    data: {
      address,
      keyPartId: address, // Use address as identifier
    },
  });

  return { address, keypair };
}

// Retrieve keypair for a payment address (for sweeping)
export async function getAddressKeypair(address: string): Promise<Keypair | null> {
  try {
    const { getKeyPart } = await import('./redis');
    const encryptedKey = await getKeyPart(`address:${address}`);
    
    if (!encryptedKey) {
      return null;
    }

    const keyString = decrypt(encryptedKey);
    const privateKey = new Uint8Array(Buffer.from(keyString, 'base64'));
    return Keypair.fromSecretKey(privateKey);
  } catch (error) {
    console.error('Error retrieving address keypair:', error);
    return null;
  }
}

