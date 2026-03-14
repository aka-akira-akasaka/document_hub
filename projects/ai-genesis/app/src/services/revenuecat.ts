import Purchases, { LOG_LEVEL, type PurchasesPackage } from 'react-native-purchases';
import Constants from 'expo-constants';
import { PRODUCT_IDS } from '../types';

const REVENUECAT_IOS_KEY = Constants.expoConfig?.extra?.revenuecatApiKey as string;

export function initRevenueCat(userId: string): void {
  Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({ apiKey: REVENUECAT_IOS_KEY, appUserID: userId });
}

/**
 * 現在のサブスクリプション状態を確認する
 */
export async function checkSubscriptionStatus(): Promise<'free' | 'pro'> {
  const customerInfo = await Purchases.getCustomerInfo();
  const hasActivePro =
    customerInfo.entitlements.active['pro'] !== undefined;
  return hasActivePro ? 'pro' : 'free';
}

/**
 * 購入可能なパッケージ一覧を取得する
 */
export async function getOfferings(): Promise<PurchasesPackage[]> {
  const offerings = await Purchases.getOfferings();
  if (!offerings.current) return [];
  return offerings.current.availablePackages;
}

/**
 * パッケージを購入する
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<'pro'> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  const hasActivePro = customerInfo.entitlements.active['pro'] !== undefined;
  if (!hasActivePro) throw new Error('購入は完了しましたが、プロの有効化に失敗しました');
  return 'pro';
}

/**
 * 購入を復元する
 */
export async function restorePurchases(): Promise<'free' | 'pro'> {
  const customerInfo = await Purchases.restorePurchases();
  const hasActivePro = customerInfo.entitlements.active['pro'] !== undefined;
  return hasActivePro ? 'pro' : 'free';
}

export { PRODUCT_IDS };
