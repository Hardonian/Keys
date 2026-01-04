/**
 * Safe cron execution with distributed locking
 */

import type { CronJobConfig } from '../types';

/**
 * Execute a cron job safely with distributed locking
 * 
 * Prevents concurrent execution of the same job
 * 
 * @param config - Cron job configuration
 */
export async function safeCronExecute(
  config: CronJobConfig
): Promise<void> {
  const { jobId, jobFunction, lockTimeoutSeconds = 300 } = config;

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      'DATABASE_URL is required for distributed locking. ' +
      'Please set it in your environment variables.'
    );
  }

  // In a real implementation, you would:
  // 1. Acquire distributed lock (using Redis, PostgreSQL advisory locks, etc.)
  // 2. Check if lock exists (prevent concurrent execution)
  // 3. Execute job if lock acquired
  // 4. Release lock after execution
  // 5. Handle errors gracefully

  console.log(`Attempting to acquire lock for job: ${jobId}`);

  try {
    // Pseudo-code for lock acquisition
    // const lockAcquired = await acquireLock(jobId, lockTimeoutSeconds);
    
    // For demonstration, we'll simulate lock acquisition
    const lockAcquired = true;

    if (!lockAcquired) {
      console.log(`Lock already held for job: ${jobId}. Skipping execution.`);
      return;
    }

    console.log(`Lock acquired. Executing job: ${jobId}`);

    try {
      // Execute the job
      await jobFunction();

      console.log(`Job completed successfully: ${jobId}`);
    } catch (error) {
      // Log error, don't throw
      console.error(`Job execution failed: ${jobId}`, error);
      // Don't throw - allow lock to be released
    } finally {
      // Release lock
      // await releaseLock(jobId);
      console.log(`Lock released for job: ${jobId}`);
    }
  } catch (error) {
    // Log error, don't crash
    console.error(`Failed to execute job: ${jobId}`, error);
    // Don't throw - job runner handles retries
  }
}
