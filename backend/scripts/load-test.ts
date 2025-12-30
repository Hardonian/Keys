#!/usr/bin/env tsx
/**
 * Load testing script for key endpoints
 * Usage: npm run load-test -- --endpoint=/orchestrate-agent --concurrency=10 --requests=100
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

interface LoadTestOptions {
  endpoint: string;
  concurrency: number;
  requests: number;
  baseURL?: string;
  method?: 'GET' | 'POST';
  body?: any;
  headers?: Record<string, string>;
}

interface RequestResult {
  status: number;
  latency: number;
  error?: string;
}

async function makeRequest(
  options: LoadTestOptions,
  requestId: number
): Promise<RequestResult> {
  const startTime = performance.now();
  try {
    const response = await axios({
      method: options.method || 'POST',
      url: options.endpoint,
      baseURL: options.baseURL || 'http://localhost:3001',
      data: options.body,
      headers: {
        'Content-Type': 'application/json',
        'x-request-id': `load-test-${requestId}`,
        ...options.headers,
      },
      timeout: 30000,
    });

    const latency = performance.now() - startTime;

    return {
      status: response.status,
      latency,
    };
  } catch (error: any) {
    const latency = performance.now() - startTime;
    return {
      status: error.response?.status || 0,
      latency,
      error: error.message,
    };
  }
}

async function runLoadTest(options: LoadTestOptions): Promise<void> {
  console.log(`\n🚀 Starting load test:`);
  console.log(`   Endpoint: ${options.endpoint}`);
  console.log(`   Concurrency: ${options.concurrency}`);
  console.log(`   Total Requests: ${options.requests}\n`);

  const results: RequestResult[] = [];
  const startTime = performance.now();

  // Create batches
  const batches: number[][] = [];
  for (let i = 0; i < options.requests; i += options.concurrency) {
    const batch = [];
    for (let j = 0; j < options.concurrency && i + j < options.requests; j++) {
      batch.push(i + j);
    }
    batches.push(batch);
  }

  // Run batches sequentially
  for (const batch of batches) {
    const batchPromises = batch.map((requestId) => makeRequest(options, requestId));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Progress indicator
    process.stdout.write(`\r   Progress: ${results.length}/${options.requests}`);
  }

  const totalTime = performance.now() - startTime;

  // Calculate metrics
  const latencies = results.map((r) => r.latency).sort((a, b) => a - b);
  const errors = results.filter((r) => r.error || r.status >= 400);
  const successCount = results.length - errors.length;

  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];

  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const minLatency = Math.min(...latencies);
  const maxLatency = Math.max(...latencies);

  const errorRate = (errors.length / results.length) * 100;
  const requestsPerSecond = (results.length / totalTime) * 1000;

  // Print results
  console.log(`\n\n📊 Results:`);
  console.log(`   Total Time: ${(totalTime / 1000).toFixed(2)}s`);
  console.log(`   Requests/sec: ${requestsPerSecond.toFixed(2)}`);
  console.log(`   Success Rate: ${((successCount / results.length) * 100).toFixed(2)}%`);
  console.log(`   Error Rate: ${errorRate.toFixed(2)}%`);
  console.log(`\n   Latency (ms):`);
  console.log(`     Min: ${minLatency.toFixed(2)}`);
  console.log(`     Avg: ${avgLatency.toFixed(2)}`);
  console.log(`     P50: ${p50.toFixed(2)}`);
  console.log(`     P95: ${p95.toFixed(2)}`);
  console.log(`     P99: ${p99.toFixed(2)}`);
  console.log(`     Max: ${maxLatency.toFixed(2)}`);

  if (errors.length > 0) {
    console.log(`\n   Errors:`);
    const errorCounts: Record<string, number> = {};
    errors.forEach((e) => {
      const key = e.error || `HTTP ${e.status}`;
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });
    Object.entries(errorCounts).forEach(([error, count]) => {
      console.log(`     ${error}: ${count}`);
    });
  }

  console.log('\n');
}

// Parse CLI arguments
const args = process.argv.slice(2);
const options: LoadTestOptions = {
  endpoint: '/health',
  concurrency: 10,
  requests: 100,
  method: 'POST',
};

args.forEach((arg) => {
  if (arg.startsWith('--endpoint=')) {
    options.endpoint = arg.split('=')[1];
  } else if (arg.startsWith('--concurrency=')) {
    options.concurrency = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--requests=')) {
    options.requests = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--base-url=')) {
    options.baseURL = arg.split('=')[1];
  } else if (arg.startsWith('--method=')) {
    options.method = arg.split('=')[1] as 'GET' | 'POST';
  }
});

runLoadTest(options).catch((error) => {
  console.error('Load test failed:', error);
  process.exit(1);
});
