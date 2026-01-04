export interface CronJobConfig {
  jobId: string;
  jobFunction: () => Promise<void>;
  lockTimeoutSeconds?: number;
}
