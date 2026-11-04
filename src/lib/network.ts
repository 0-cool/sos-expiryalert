import { useNetworkState } from 'expo-network';

/**
 * True only when the device positively reports no connectivity.
 * Unknown states count as online so we never block the user by mistake;
 * real failures are still caught and reported when a request fails.
 */
export function useIsOffline(): boolean {
  const state = useNetworkState();
  return state.isConnected === false || state.isInternetReachable === false;
}
