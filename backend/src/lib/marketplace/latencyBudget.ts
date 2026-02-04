import { createClient } from '@supabase/supabase-js';

const DEFAULT_MARKETPLACE_BUDGET_MS = 5000;
const MIN_MARKETPLACE_BUDGET_MS = 500;

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export function getMarketplaceBudgetMs(): number {
  const raw = process.env.MARKETPLACE_REQUEST_BUDGET_MS;
  if (!raw) return DEFAULT_MARKETPLACE_BUDGET_MS;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    return DEFAULT_MARKETPLACE_BUDGET_MS;
  }
  return Math.max(MIN_MARKETPLACE_BUDGET_MS, parsed);
}

function getTierBudgetMs(tier?: string | null): number | null {
  if (!tier) return null;
  const key = `MARKETPLACE_REQUEST_BUDGET_MS_${tier.toUpperCase()}`;
  const raw = process.env[key];
  if (!raw) return null;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    return null;
  }
  return Math.max(MIN_MARKETPLACE_BUDGET_MS, parsed);
}

export async function getMarketplaceBudgetMsForUser(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('subscription_tier')
      .eq('user_id', userId)
      .single();

    if (error) {
      return getMarketplaceBudgetMs();
    }

    const tierBudget = getTierBudgetMs(data?.subscription_tier);
    return tierBudget ?? getMarketplaceBudgetMs();
  } catch {
    return getMarketplaceBudgetMs();
  }
}

export function remainingBudgetMs(startTimeMs: number, budgetMs: number): number {
  return Math.max(0, budgetMs - (Date.now() - startTimeMs));
}

export async function withBudgetTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  if (timeoutMs <= 0) {
    throw new Error(errorMessage);
  }

  let timeoutId: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
