import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/features/auth/AuthProvider';
import { localToday, toISODate, type CalendarDate } from '@/lib/dates';
import { AppError, toAppError, type AppErrorCode } from '@/lib/errors';

import { clearAllDocumentCaches, readDocumentsCache, writeDocumentsCache } from './documentsCache';
import { documentsRepository } from './documentsRepository';
import { computeStats, decorateDocuments, type DocumentStats } from './selectors';
import type { DocumentWithStatus } from './status';
import type { DocumentInput, DocumentRecord } from './types';

type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface DocumentsContextValue {
  status: LoadStatus;
  /** Raw records, sorted by expiration date. */
  documents: DocumentRecord[];
  /** Records decorated with days remaining and status for "today". */
  items: DocumentWithStatus[];
  stats: DocumentStats;
  /** Error from the last refresh, if any. */
  error: AppErrorCode | null;
  /** True when the list comes from the local cache because the server couldn't be reached (yet). */
  isShowingCachedData: boolean;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  createDocument: (input: DocumentInput) => Promise<DocumentRecord>;
  updateDocument: (id: string, input: Partial<DocumentInput>) => Promise<DocumentRecord>;
  deleteDocument: (id: string) => Promise<void>;
  getDocument: (id: string) => DocumentWithStatus | undefined;
}

interface DocumentsState {
  /** The user these documents belong to. */
  owner: string | null;
  documents: DocumentRecord[];
  status: LoadStatus;
  error: AppErrorCode | null;
  isShowingCachedData: boolean;
}

const DocumentsContext = createContext<DocumentsContextValue | null>(null);

function initialState(owner: string | null): DocumentsState {
  return { owner, documents: [], status: owner ? 'loading' : 'idle', error: null, isShowingCachedData: false };
}

function sortDocuments(documents: DocumentRecord[]): DocumentRecord[] {
  return [...documents].sort(
    (a, b) => a.expirationDate.localeCompare(b.expirationDate) || a.createdAt.localeCompare(b.createdAt),
  );
}

/** Re-renders when the calendar day changes (e.g. app left open past midnight). */
function useToday(): CalendarDate {
  const [today, setToday] = useState(() => localToday());
  useEffect(() => {
    const check = () => {
      const now = localToday();
      setToday((current) => (toISODate(current) === toISODate(now) ? current : now));
    };
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') check();
    });
    const interval = setInterval(check, 60_000);
    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, []);
  return today;
}

export function DocumentsProvider({ children }: { children: ReactNode }) {
  const { user, isSignedIn } = useAuth();
  const userId = isSignedIn ? (user?.id ?? null) : null;

  const [state, setState] = useState<DocumentsState>(() => initialState(userId));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const today = useToday();

  // A different user (login/logout): start from a clean slate immediately, during render.
  if (state.owner !== userId) {
    setState(initialState(userId));
  }

  /** Applies a change only if the data still belongs to `ownerId` (ignores late responses). */
  const applyFor = useCallback((ownerId: string, change: (current: DocumentsState) => DocumentsState) => {
    setState((current) => (current.owner === ownerId ? change(current) : current));
  }, []);

  const fetchFromServer = useCallback(
    async (ownerId: string) => {
      try {
        const fresh = await documentsRepository.list();
        applyFor(ownerId, (current) => ({
          ...current,
          documents: sortDocuments(fresh),
          status: 'ready',
          error: null,
          isShowingCachedData: false,
        }));
      } catch (cause) {
        const code = toAppError(cause).code;
        applyFor(ownerId, (current) => ({
          ...current,
          error: code,
          isShowingCachedData: current.status === 'ready',
          status: current.status === 'ready' ? 'ready' : 'error',
        }));
      }
    },
    [applyFor],
  );

  // Initial load: cached documents first (instant, works offline), then the server.
  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    void (async () => {
      const cached = await readDocumentsCache(userId);
      if (cancelled) return;
      if (cached) {
        applyFor(userId, (current) =>
          current.status === 'loading'
            ? { ...current, documents: sortDocuments(cached.documents), status: 'ready', isShowingCachedData: true }
            : current,
        );
      }
      await fetchFromServer(userId);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, applyFor, fetchFromServer]);

  // Refresh when the app returns to the foreground (another device may have changed data).
  useEffect(() => {
    if (!userId) return undefined;
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') void fetchFromServer(userId);
    });
    return () => subscription.remove();
  }, [userId, fetchFromServer]);

  // Persist the last known list for offline use.
  useEffect(() => {
    if (state.owner && state.status === 'ready') void writeDocumentsCache(state.owner, state.documents);
  }, [state.owner, state.status, state.documents]);

  // Never leave a previous user's documents on the device after logout or account deletion.
  const previousUser = useRef<string | null>(null);
  useEffect(() => {
    if (previousUser.current && !userId) void clearAllDocumentCaches();
    previousUser.current = userId;
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsRefreshing(true);
    try {
      await fetchFromServer(userId);
    } finally {
      setIsRefreshing(false);
    }
  }, [userId, fetchFromServer]);

  const requireUser = useCallback((): string => {
    if (!userId) throw new AppError('sessionExpired');
    return userId;
  }, [userId]);

  const createDocument = useCallback(
    async (input: DocumentInput) => {
      const ownerId = requireUser();
      const created = await documentsRepository.create(input, ownerId);
      applyFor(ownerId, (current) => ({
        ...current,
        status: 'ready',
        documents: sortDocuments([...current.documents.filter((doc) => doc.id !== created.id), created]),
      }));
      return created;
    },
    [applyFor, requireUser],
  );

  const updateDocument = useCallback(
    async (id: string, input: Partial<DocumentInput>) => {
      const ownerId = requireUser();
      const updated = await documentsRepository.update(id, input);
      applyFor(ownerId, (current) => ({
        ...current,
        documents: sortDocuments(current.documents.map((doc) => (doc.id === id ? updated : doc))),
      }));
      return updated;
    },
    [applyFor, requireUser],
  );

  const deleteDocument = useCallback(
    async (id: string) => {
      const ownerId = requireUser();
      await documentsRepository.remove(id);
      applyFor(ownerId, (current) => ({
        ...current,
        documents: current.documents.filter((doc) => doc.id !== id),
      }));
    },
    [applyFor, requireUser],
  );

  const items = useMemo(() => decorateDocuments(state.documents, today), [state.documents, today]);
  const stats = useMemo(() => computeStats(items), [items]);
  const getDocument = useCallback((id: string) => items.find((item) => item.id === id), [items]);

  const value = useMemo<DocumentsContextValue>(
    () => ({
      status: state.status,
      documents: state.documents,
      items,
      stats,
      error: state.error,
      isShowingCachedData: state.isShowingCachedData,
      isRefreshing,
      refresh,
      createDocument,
      updateDocument,
      deleteDocument,
      getDocument,
    }),
    [state, items, stats, isRefreshing, refresh, createDocument, updateDocument, deleteDocument, getDocument],
  );

  return <DocumentsContext.Provider value={value}>{children}</DocumentsContext.Provider>;
}

export function useDocuments(): DocumentsContextValue {
  const context = useContext(DocumentsContext);
  if (!context) throw new Error('useDocuments must be used inside <DocumentsProvider>');
  return context;
}
