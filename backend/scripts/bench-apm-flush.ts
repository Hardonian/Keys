#!/usr/bin/env tsx
import { performance } from 'perf_hooks';
import type { BackgroundEventRecord } from '../src/services/apmService.js';
import { insertBackgroundEvents } from '../src/services/apmService.js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function run(): Promise<void> {
  const eventCount = 500;
  const perInsertLatencyMs = 2;
  let insertCalls = 0;

  const fakeClient = {
    from: () => ({
      insert: async (_records: BackgroundEventRecord[]) => {
        insertCalls += 1;
        await sleep(perInsertLatencyMs);
        return { error: null };
      },
    }),
  };

  const records: BackgroundEventRecord[] = Array.from({ length: eventCount }, (_, idx) => ({
    event_type: 'apm.metric',
    source: 'apm',
    event_data: { id: idx, duration: 12 },
    event_timestamp: new Date().toISOString(),
    user_id: 'system',
  }));

  insertCalls = 0;
  const legacyStart = performance.now();
  for (const record of records) {
    await fakeClient.from('background_events').insert([record]);
  }
  const legacyDuration = performance.now() - legacyStart;
  const legacyCalls = insertCalls;

  insertCalls = 0;
  const batchStart = performance.now();
  await insertBackgroundEvents(fakeClient as any, records, 200);
  const batchDuration = performance.now() - batchStart;
  const batchCalls = insertCalls;

  console.log('APM flush benchmark (simulated insert latency)');
  console.log(`Event count: ${eventCount}`);
  console.log(`Per-insert latency: ${perInsertLatencyMs}ms`);
  console.log(`Legacy duration: ${legacyDuration.toFixed(2)}ms`);
  console.log(`Legacy insert calls: ${legacyCalls}`);
  console.log(`Batch duration: ${batchDuration.toFixed(2)}ms`);
  console.log(`Batch insert calls: ${batchCalls}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
