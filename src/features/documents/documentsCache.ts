import { keyValueStore, STORAGE_KEYS } from '@/lib/storage';

import type { DocumentRecord } from './types';

/**
 * Last successfully loaded documents, per user, so the app opens instantly and
 * keeps working read-only while offline. Cleared on logout and account deletion.
 */
interface CachedDocuments {
  version: 1;
  savedAt: number;
  documents: DocumentRecord[];
}

function cacheKey(userId: string): string {
  return `${STORAGE_KEYS.documentsCachePrefix}${userId}`;
}

export async function readDocumentsCache(userId: string): Promise<CachedDocuments | null> {
  const cached = await keyValueStore.getJSON<CachedDocuments>(cacheKey(userId));
  if (!cached || cached.version !== 1 || !Array.isArray(cached.documents)) return null;
  return cached;
}

export async function writeDocumentsCache(userId: string, documents: DocumentRecord[]): Promise<void> {
  const payload: CachedDocuments = { version: 1, savedAt: Date.now(), documents };
  await keyValueStore.setJSON(cacheKey(userId), payload);
}

export async function clearAllDocumentCaches(): Promise<void> {
  await keyValueStore.removeByPrefix(STORAGE_KEYS.documentsCachePrefix);
}
