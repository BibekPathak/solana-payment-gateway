import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;

export async function getRedisClient() {
  if (redisClient) {
    return redisClient;
  }

  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  });

  client.on('error', (err) => console.error('Redis Client Error', err));

  await client.connect();
  redisClient = client;

  return client;
}

export async function closeRedisConnection() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// Key management functions
export async function storeKeyPart(keyPartIndex: number | string, encryptedPart: string) {
  const client = await getRedisClient();
  const key = typeof keyPartIndex === 'number' 
    ? `keypart:${keyPartIndex}` 
    : keyPartIndex;
  await client.setEx(
    key,
    86400 * 30, // 30 days TTL
    encryptedPart
  );
}

export async function getKeyPart(keyPartIndex: number | string): Promise<string | null> {
  const client = await getRedisClient();
  const key = typeof keyPartIndex === 'number' 
    ? `keypart:${keyPartIndex}` 
    : keyPartIndex;
  return await client.get(key);
}

export async function deleteKeyPart(keyPartIndex: number | string) {
  const client = await getRedisClient();
  const key = typeof keyPartIndex === 'number' 
    ? `keypart:${keyPartIndex}` 
    : keyPartIndex;
  await client.del(key);
}

// Payment address tracking
export async function trackPaymentAddress(address: string, paymentId: string) {
  const client = await getRedisClient();
  await client.setEx(`payment:${address}`, 3600, paymentId); // 1 hour TTL
}

export async function getPaymentByAddress(address: string): Promise<string | null> {
  const client = await getRedisClient();
  return await client.get(`payment:${address}`);
}

