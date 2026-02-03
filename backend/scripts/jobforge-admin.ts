import { jobForgeAdapter } from '../src/integrations/jobforgeAdapter.js';
import { logger } from '../src/utils/logger.js';

type ParsedArgs = Record<string, string | boolean>;

const args = process.argv.slice(2);
const command = args[0];

const parseArgs = (input: string[]): ParsedArgs => {
  const parsed: ParsedArgs = {};
  for (let i = 0; i < input.length; i += 1) {
    const token = input[i];
    if (!token.startsWith('--')) {
      continue;
    }
    const key = token.replace(/^--/, '');
    const next = input[i + 1];
    if (!next || next.startsWith('--')) {
      parsed[key] = true;
      continue;
    }
    parsed[key] = next;
    i += 1;
  }
  return parsed;
};

const usage = () => {
  console.log(`\nJobForge Admin CLI\n\nCommands:\n  submit-event --tenant TENANT --project PROJECT --event EVENT --payload '{"key":"value"}'\n  run-module --tenant TENANT --project PROJECT --module MODULE --input '{"key":"value"}'\n  view-report --tenant TENANT --project PROJECT --report REPORT\n  request-bundle --tenant TENANT --project PROJECT --report REPORT --bundle BUNDLE --confirm\n\nEnvironment:\n  JOBFORGE_INTEGRATION_ENABLED=1\n  JOBFORGE_BASE_URL=https://api.jobforge.example\n  JOBFORGE_API_KEY=...\n  JOBFORGE_TENANT_PROJECT_MAP='[{"tenantId":"t1","projectId":"p1","jobforgeTenantId":"jt1","jobforgeProjectId":"jp1"}]'\n  JOBFORGE_BUNDLE_EXECUTION_ENABLED=1 (for request-bundle)\n`);
};

const parseJson = (value: string | boolean | undefined, label: string): Record<string, unknown> => {
  if (!value || typeof value !== 'string') {
    return {};
  }
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch (error) {
    throw new Error(`${label} must be valid JSON.`);
  }
};

const requireString = (args: ParsedArgs, key: string): string => {
  const value = args[key];
  if (!value || typeof value !== 'string') {
    throw new Error(`Missing required flag --${key}.`);
  }
  return value;
};

const run = async () => {
  if (!command) {
    usage();
    process.exit(1);
  }

  const parsed = parseArgs(args.slice(1));

  try {
    switch (command) {
      case 'submit-event': {
        const tenantId = requireString(parsed, 'tenant');
        const projectId = requireString(parsed, 'project');
        const eventType = requireString(parsed, 'event');
        const payload = parseJson(parsed.payload, 'payload');
        const result = await jobForgeAdapter.submitEvent({
          tenantId,
          projectId,
          eventType,
          payload,
        });
        console.log(JSON.stringify({ status: 'submitted', result }, null, 2));
        break;
      }
      case 'run-module': {
        const tenantId = requireString(parsed, 'tenant');
        const projectId = requireString(parsed, 'project');
        const moduleId = requireString(parsed, 'module');
        const input = parseJson(parsed.input, 'input');
        const result = await jobForgeAdapter.runModuleDryRun({
          tenantId,
          projectId,
          moduleId,
          input,
        });
        console.log(JSON.stringify({ status: 'dry_run', result }, null, 2));
        break;
      }
      case 'view-report': {
        const tenantId = requireString(parsed, 'tenant');
        const projectId = requireString(parsed, 'project');
        const reportId = requireString(parsed, 'report');
        const result = await jobForgeAdapter.getReport({
          tenantId,
          projectId,
          reportId,
        });
        console.log(JSON.stringify({ status: 'ok', result }, null, 2));
        break;
      }
      case 'request-bundle': {
        const tenantId = requireString(parsed, 'tenant');
        const projectId = requireString(parsed, 'project');
        const reportId = requireString(parsed, 'report');
        const bundleId = requireString(parsed, 'bundle');
        if (!parsed.confirm) {
          throw new Error('Bundle execution requires --confirm flag.');
        }
        const result = await jobForgeAdapter.requestBundleExecution({
          tenantId,
          projectId,
          reportId,
          bundleId,
        });
        console.log(JSON.stringify({ status: 'queued', result }, null, 2));
        break;
      }
      default:
        usage();
        process.exit(1);
    }
  } catch (error) {
    logger.error('JobForge CLI command failed.', error instanceof Error ? error : undefined, {
      command,
    });
    console.error(error instanceof Error ? error.message : 'JobForge CLI command failed.');
    process.exit(1);
  }
};

run();
