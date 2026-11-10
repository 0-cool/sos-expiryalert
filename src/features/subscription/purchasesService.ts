import Purchases, {
  type CustomerInfo,
  type CustomerInfoUpdateListener,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';
import { Platform } from 'react-native';

import { revenueCatAndroidKey, revenueCatIosKey } from '@/lib/env';

let isConfigured = false;
let currentUserId: string | null = null;
let identityUpdate = Promise.resolve();

function getApiKey(): string {
  if (Platform.OS === 'ios') return revenueCatIosKey;
  if (Platform.OS === 'android') return revenueCatAndroidKey;
  return '';
}

export function configure(): boolean {
  if (isConfigured) return true;
  const apiKey = getApiKey();
  if (!apiKey) return false;

  Purchases.configure({ apiKey });
  isConfigured = true;
  return true;
}

export async function logIn(userId: string): Promise<void> {
  if (!configure()) return;
  if (currentUserId === userId) return identityUpdate;

  currentUserId = userId;
  const nextIdentityUpdate = identityUpdate
    .catch(() => undefined)
    .then(() => Purchases.logIn(userId))
    .then(() => undefined);
  identityUpdate = nextIdentityUpdate.catch((error: unknown) => {
    if (currentUserId === userId) currentUserId = null;
    throw error;
  });
  return identityUpdate;
}

export async function logOut(): Promise<void> {
  if (!isConfigured || currentUserId === null) return identityUpdate;

  currentUserId = null;
  identityUpdate = identityUpdate
    .catch(() => undefined)
    .then(() => Purchases.logOut())
    .then(() => undefined);
  return identityUpdate;
}

export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!configure()) return null;
  await identityUpdate;
  return Purchases.getOfferings();
}

export async function purchase(pkg: PurchasesPackage): Promise<CustomerInfo> {
  if (!configure()) throw new Error('RevenueCat is not configured.');
  await identityUpdate;
  const result = await Purchases.purchasePackage(pkg);
  return result.customerInfo;
}

export async function restore(): Promise<CustomerInfo> {
  if (!configure()) throw new Error('RevenueCat is not configured.');
  await identityUpdate;
  return Purchases.restorePurchases();
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configure()) return null;
  await identityUpdate;
  return Purchases.getCustomerInfo();
}

export async function getManagementUrl(): Promise<string | null> {
  const customerInfo = await getCustomerInfo();
  return customerInfo?.managementURL ?? null;
}

export function addCustomerInfoUpdateListener(listener: CustomerInfoUpdateListener): void {
  if (configure()) Purchases.addCustomerInfoUpdateListener(listener);
}

export function removeCustomerInfoUpdateListener(listener: CustomerInfoUpdateListener): void {
  if (isConfigured) Purchases.removeCustomerInfoUpdateListener(listener);
}
