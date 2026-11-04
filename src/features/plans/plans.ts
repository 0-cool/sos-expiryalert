/**
 * Subscription plans — architecture seam for a future release.
 *
 * The MVP has NO paywall: every user gets the full app. When subscriptions are
 * added (e.g. with RevenueCat or StoreKit/Play Billing), resolve the user's plan
 * from the store entitlement and flip `PLAN_LIMITS_ENFORCED` to true. All limit
 * checks already go through `canAddDocument` / `canCustomizeReminders`.
 */
export type PlanId = 'free' | 'premium' | 'family';

export interface PlanDefinition {
  id: PlanId;
  /** Hypothesis to validate — not shown in the MVP UI. */
  priceUsdPerYear: number;
  maxDocuments: number;
  customReminders: boolean;
  familyProfiles: boolean;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: { id: 'free', priceUsdPerYear: 0, maxDocuments: 5, customReminders: false, familyProfiles: false },
  premium: {
    id: 'premium',
    priceUsdPerYear: 9.99,
    maxDocuments: Number.POSITIVE_INFINITY,
    customReminders: true,
    familyProfiles: false,
  },
  family: {
    id: 'family',
    priceUsdPerYear: 19.99,
    maxDocuments: Number.POSITIVE_INFINITY,
    customReminders: true,
    familyProfiles: true,
  },
};

/** MVP: limits are defined but not enforced. */
export const PLAN_LIMITS_ENFORCED = false;

export function canAddDocument(plan: PlanId, currentCount: number, enforced = PLAN_LIMITS_ENFORCED): boolean {
  if (!enforced) return true;
  return currentCount < PLANS[plan].maxDocuments;
}

export function canCustomizeReminders(plan: PlanId, enforced = PLAN_LIMITS_ENFORCED): boolean {
  if (!enforced) return true;
  return PLANS[plan].customReminders;
}

/** Until subscriptions exist, everyone is on the free plan with limits disabled. */
export function getCurrentPlan(): PlanId {
  return 'free';
}
