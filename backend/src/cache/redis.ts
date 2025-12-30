import Redis from 'ioredis';
import { logger } from '../utils/logger';

let redisClient: Redis | null = null;

export function initRedis(): Redis | null {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.warn('Redis URL not configured, caching disabled');
    return null;
  }

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number): number => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      reconnectOnError: (err: Error): boolean => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          return true;
        }
        return false;
      },
    });

    redisClient.on('error', (err: Error) => {
      logger.error('Redis connection error', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected');
    });

    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis', error as Error);
    return null;
  }
}

export function getRedis(): Redis | null {
  if (!redisClient) {
    return initRedis();
  }
  return redisClient;
}

export async function getCache<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) {
    return null;
  }

  try {
    const data = await redis.get(key);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as T;
  } catch (error) {
    logger.error('Cache get error', error as Error, { key });
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    return false;
  }

  try {
    const serialized = JSON.stringify(value);
    if (ttlSeconds) {
      await redis.setex(key, ttlSeconds, serialized);
    } else {
      await redis.set(key, serialized);
    }
    return true;
  } catch (error) {
    logger.error('Cache set error', error as Error, { key });
    return false;
  }
}

export async function deleteCache(key: string): Promise<boolean> {
  const redis = getRedis();
  if (!redis) {
    return false;
  }

  try {
    await redis.del(key);
    return true;
  } catch (error) {
    logger.error('Cache delete error', error as Error, { key });
    return false;
  }
}

export async function deleteCachePattern(pattern: string): Promise<number> {
  const redis = getRedis();
  if (!redis) {
    return 0;
  }

  try {
    const keys = await redis.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }
    return await redis.del(...keys);
  } catch (error) {
    logger.error('Cache delete pattern error', error as Error, { pattern });
    return 0;
  }
}

// Cache key generators
export const cacheKeys = {
  userProfile: (userId: string) => `user:profile:${userId}`,
  vibeConfig: (userId: string) => `user:vibe:${userId}`,
  promptAtoms: () => 'prompt:atoms:all',
  promptAtom: (atomId: string) => `prompt:atom:${atomId}`,
  promptAssembly: (userId: string, taskHash: string) => `prompt:assembly:${userId}:${taskHash}`,
};
