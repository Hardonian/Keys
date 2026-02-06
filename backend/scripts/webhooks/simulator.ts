#!/usr/bin/env node
/**
 * Webhook Security Simulator
 * Tests webhook endpoints with various scenarios:
 * - Valid signatures
 * - Invalid signatures
 * - Duplicate deliveries
 * - Replayed events
 * - Missing signatures
 */

import crypto from 'crypto';
import http from 'http';
import readline from 'readline';

interface WebhookTestConfig {
  baseUrl: string;
  webhookSecret: string;
  githubEventHeader: string;
  githubDeliveryId: string;
}

interface TestResult {
  test: string;
  status: number;
  success: boolean;
  response: any;
  duration: number;
}

class WebhookSimulator {
  private config: WebhookTestConfig;
  private results: TestResult[] = [];

  constructor(config: Partial<WebhookTestConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || 'http://localhost:3001',
      webhookSecret: config.webhookSecret || process.env.GITHUB_WEBHOOK_SECRET || 'test-secret',
      githubEventHeader: config.githubEventHeader || 'pull_request',
      githubDeliveryId: config.githubDeliveryId || `test-${Date.now()}`,
    };
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Starting Webhook Security Tests\n');
    console.log(`📍 Target: ${this.config.baseUrl}`);
    console.log(`🔑 Secret: ${this.config.webhookSecret.substring(0, 4)}...${this.config.webhookSecret.slice(-4)}\n`);

    await this.testValidWebhook();
    await this.testInvalidSignature();
    await this.testMissingSignature();
    await this.testDuplicateDelivery();
    await this.testReplayAttack();
    await this.testMalformedPayload();
    await this.testSupabaseWebhook();
    await this.testStripeWebhook();

    this.printSummary();
  }

  private generateSignature(payload: string): string {
    const hmac = crypto.createHmac('sha256', this.config.webhookSecret);
    return `sha256=${hmac.update(payload, 'utf8').digest('hex')}`;
  }

  private async makeRequest(
    path: string,
    payload: any,
    additionalHeaders: Record<string, string> = {}
  ): Promise<{ status: number; body: any; duration: number }> {
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const headers: Record<string, string | number> = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payloadStr),
      'x-github-delivery': this.config.githubDeliveryId,
      'x-github-event': this.config.githubEventHeader,
      'x-hub-signature-256': this.generateSignature(payloadStr),
      ...additionalHeaders,
    };

    const startTime = Date.now();

    return new Promise((resolve) => {
    const url = new URL(path, this.config.baseUrl);
    const port = url.port ? parseInt(url.port, 10) : 3001;
    const options: http.RequestOptions = {
      hostname: url.hostname,
      port,
      path: url.pathname,
      method: 'POST',
      headers,
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          const duration = Date.now() - startTime;
          try {
            resolve({
              status: res.statusCode || 500,
              body: JSON.parse(data),
              duration,
            });
          } catch {
            resolve({
              status: res.statusCode || 500,
              body: data,
              duration,
            });
          }
        });
      });

      req.on('error', (e) => {
        const duration = Date.now() - startTime;
        resolve({
          status: 0,
          body: { error: e.message },
          duration,
        });
      });

      req.write(payloadStr);
      req.end();
    });
  }

  private async testValidWebhook(): Promise<void> {
    console.log('📝 Test: Valid webhook signature');

    const payload = {
      action: 'opened',
      pull_request: {
        number: 123,
        title: 'Test PR',
        head: { ref: 'feature-branch' },
        base: { ref: 'main' },
      },
      repository: { full_name: 'owner/repo' },
      sender: { login: 'test-user' },
    };

    const result = await this.makeRequest('/webhooks/code-repo', payload);
    this.recordResult('Valid Signature', result, true);
  }

  private async testInvalidSignature(): Promise<void> {
    console.log('📝 Test: Invalid webhook signature');

    const payload = {
      action: 'opened',
      pull_request: { number: 456 },
    };

    const result = await this.makeRequest('/webhooks/code-repo', payload, {
      'x-hub-signature-256': 'sha256=invalid_signature_12345',
    });

    this.recordResult('Invalid Signature', result, result.status === 401);
  }

  private async testMissingSignature(): Promise<void> {
    console.log('📝 Test: Missing webhook signature');

    const payload = {
      action: 'closed',
      pull_request: { number: 789 },
    };

    const result = await this.makeRequest('/webhooks/code-repo', payload, {
      'x-hub-signature-256': '',
    });

    this.recordResult('Missing Signature', result, result.status === 401);
  }

  private async testDuplicateDelivery(): Promise<void> {
    console.log('📝 Test: Duplicate webhook delivery');

    const deliveryId = `dup-test-${Date.now()}`;
    const payload = {
      action: 'synchronize',
      pull_request: { number: 111 },
    };

    const payloadStr = JSON.stringify(payload);
    const signature = this.generateSignature(payloadStr);

    const firstRequest = await this.makeRequest('/webhooks/code-repo', payloadStr, {
      'x-hub-signature-256': signature,
      'x-github-delivery': deliveryId,
    });

    const duplicateRequest = await this.makeRequest('/webhooks/code-repo', payloadStr, {
      'x-hub-signature-256': signature,
      'x-github-delivery': deliveryId,
    });

    const success = duplicateRequest.body.duplicate === true;
    this.recordResult('Duplicate Detection', duplicateRequest, success);

    if (!success) {
      console.log(`  ⚠️  First request status: ${firstRequest.status}`);
      console.log(`  ⚠️  Duplicate request status: ${duplicateRequest.status}`);
    }
  }

  private async testReplayAttack(): Promise<void> {
    console.log('📝 Test: Replay attack (stale timestamp)');

    const oldPayload = {
      action: 'opened',
      repository: { updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
    };

    const result = await this.makeRequest('/webhooks/code-repo', oldPayload);
    const success = result.status === 400;

    this.recordResult('Replay Protection', result, success);
  }

  private async testMalformedPayload(): Promise<void> {
    console.log('📝 Test: Malformed JSON payload');

    const result = await this.makeRequest('/webhooks/code-repo', 'not valid json', {
      'x-hub-signature-256': 'sha256=malformed',
    });

    this.recordResult('Malformed Payload', result, result.status >= 400);
  }

  private async testSupabaseWebhook(): Promise<void> {
    console.log('📝 Test: Supabase webhook');

    const payload = {
      id: `supabase-test-${Date.now()}`,
      event_type: 'INSERT',
      table: 'users',
      record: { id: '123', email: 'test@example.com' },
    };

    const result = await this.makeRequest('/webhooks/supabase', payload);

    this.recordResult('Supabase Webhook', result, result.status === 200);
  }

  private async testStripeWebhook(): Promise<void> {
    console.log('📝 Test: Stripe webhook');

    const stripePayload = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          customer: 'cus_test',
          amount_total: 2999,
        },
      },
    };

    const stripeSignature = 't=1234567890,v1=abc123';
    const result = await this.makeRequest('/billing/webhook', stripePayload, {
      'stripe-signature': stripeSignature,
    });

    this.recordResult('Stripe Webhook', result, result.status >= 400);
  }

  private recordResult(testName: string, result: any, expected: boolean): void {
    const success = expected ? result.status >= 200 && result.status < 300 : result.status >= 400;
    const statusIcon = success ? '✅' : '❌';

    console.log(`  ${statusIcon} ${testName}: ${result.status} (${result.duration}ms)`);

    this.results.push({
      test: testName,
      status: result.status,
      success,
      response: result.body,
      duration: result.duration,
    });

    if (!success) {
      console.log(`     Response: ${JSON.stringify(result.body).substring(0, 200)}`);
    }
  }

  private printSummary(): Promise<void> {
    return new Promise((resolve) => {
      console.log('\n📊 Test Summary\n');

      const passed = this.results.filter((r) => r.success).length;
      const failed = this.results.filter((r) => !r.success).length;
      const total = this.results.length;

      console.log(`  ✅ Passed: ${passed}/${total}`);
      console.log(`  ❌ Failed: ${failed}/${total}`);
      console.log(`  ⏱️  Total Duration: ${this.results.reduce((acc, r) => acc + r.duration, 0)}ms\n`);

      if (failed > 0) {
        console.log('  Failed Tests:');
        this.results
          .filter((r) => !r.success)
          .forEach((r) => {
            console.log(`    - ${r.test}: ${r.status}`);
          });
      }

      console.log('');
      resolve();
    });
  }

  async runInteractive(): Promise<void> {
    console.log('🎮 Interactive Webhook Simulator\n');
    console.log('Available commands:');
    console.log('  1. Test valid webhook');
    console.log('  2. Test duplicate delivery');
    console.log('  3. Test replay attack');
    console.log('  4. Test invalid signature');
    console.log('  5. Run all tests');
    console.log('  6. Show summary');
    console.log('  7. Exit\n');

    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const askQuestion = () => {
      rl.question('Select a test (1-7): ', async (answer) => {
        switch (answer.trim()) {
          case '1':
            await this.testValidWebhook();
            break;
          case '2':
            await this.testDuplicateDelivery();
            break;
          case '3':
            await this.testReplayAttack();
            break;
          case '4':
            await this.testInvalidSignature();
            break;
          case '5':
            await this.runAllTests();
            break;
          case '6':
            this.printSummary();
            break;
          case '7':
            console.log('👋 Goodbye!');
            rl.close();
            return;
          default:
            console.log('Invalid selection. Please try again.');
        }

        askQuestion();
      });
    };

    askQuestion();
  }
}

async function main() {
  const args = process.argv.slice(2);
  const interactive = args.includes('--interactive');
  const config: Partial<WebhookTestConfig> = {
    baseUrl: process.env.WEBHOOK_BASE_URL || 'http://localhost:3001',
    webhookSecret: process.env.WEBHOOK_SECRET || 'test-secret',
  };

  const simulator = new WebhookSimulator(config);

  if (interactive) {
    await simulator.runInteractive();
  } else {
    await simulator.runAllTests();
  }
}

main().catch(console.error);
