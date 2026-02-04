#!/usr/bin/env tsx
import { performance } from 'perf_hooks';
import { ExpiringCache } from '../src/utils/expiringCache.js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const sampleConfig = {
  config: {
    version: 1,
    tokens: { radius: '0.5rem' },
    banner: { enabled: false, tone: 'info', text: '', href: null, dismissible: true },
    features: {},
    sections: {},
    copy: {},
  },
  updatedAt: new Date().toISOString(),
};

async function run(): Promise<void> {
  const iterations = 200;
  const simulatedDbLatencyMs = 12;
  let loaderCalls = 0;

  const loader = async () => {
    loaderCalls += 1;
    await sleep(simulatedDbLatencyMs);
    return sampleConfig;
  };

  const noCacheStart = performance.now();
  for (let i = 0; i < iterations; i += 1) {
    await loader();
  }
  const noCacheDuration = performance.now() - noCacheStart;

  loaderCalls = 0;
  const cache = new ExpiringCache(loader, {
    maxAgeMs: 30_000,
    staleWhileRevalidateMs: 300_000,
  });

  const cacheStart = performance.now();
  for (let i = 0; i < iterations; i += 1) {
    await cache.get();
  }
  const cacheDuration = performance.now() - cacheStart;

  console.log('UI config cache benchmark');
  console.log(`Iterations: ${iterations}`);
  console.log(`Simulated DB latency: ${simulatedDbLatencyMs}ms`);
  console.log(`No cache duration: ${noCacheDuration.toFixed(2)}ms`);
  console.log(`Cache duration: ${cacheDuration.toFixed(2)}ms`);
  console.log(`Cache loader calls: ${loaderCalls}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
