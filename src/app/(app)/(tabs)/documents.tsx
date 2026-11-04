import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SwipeableDocumentRow } from '@/components/documents/SwipeableDocumentRow';
import { OfflineBanner } from '@/components/OfflineBanner';
import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { LargeHeader } from '@/components/ui/LargeHeader';
import { ErrorView, LoadingView } from '@/components/ui/StateViews';
import { useDocuments } from '@/features/documents/DocumentsProvider';
import {
  isStatusFilter,
  queryDocuments,
  STATUS_FILTERS,
  type SortOrder,
  type StatusFilter,
} from '@/features/documents/selectors';
import type { DocumentWithStatus } from '@/features/documents/status';
import { toAppError } from '@/lib/errors';
import { haptics } from '@/lib/haptics';
import { useAppTheme } from '@/theme/ThemeProvider';

export default function DocumentsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, spacing, radii, typography } = useAppTheme();
  const params = useLocalSearchParams<{ status?: string; ts?: string }>();
  const { items, stats, status, error, refresh, isRefreshing, deleteDocument } = useDocuments();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>(() => (isStatusFilter(params.status) ? params.status : 'all'));
  const [sort, setSort] = useState<SortOrder>('soonest');

  // Dashboard shortcuts open this tab pre-filtered (each shortcut carries a fresh `ts`).
  const paramsKey = `${params.status ?? ''}|${params.ts ?? ''}`;
  const [appliedParamsKey, setAppliedParamsKey] = useState(paramsKey);
  if (paramsKey !== appliedParamsKey) {
    setAppliedParamsKey(paramsKey);
    if (isStatusFilter(params.status)) setFilter(params.status);
  }

  const results = useMemo(
    () =>
      queryDocuments(items, {
        search,
        status: filter,
        sort,
        typeLabel: (document) => t(`documentTypes.${document.documentType}`),
      }),
    [items, search, filter, sort, t],
  );

  const openDocument = useCallback(
    (id: string) => router.push({ pathname: '/documents/[id]', params: { id } }),
    [router],
  );

  const confirmDelete = useCallback(
    (document: DocumentWithStatus) => {
      Alert.alert(t('documents.deleteTitle'), t('documents.deleteMessage', { name: document.documentName }), [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            deleteDocument(document.id)
              .then(() => haptics.success())
              .catch((cause: unknown) => Alert.alert(t('errors.title'), t(`errors.${toAppError(cause).code}`)));
          },
        },
      ]);
    },
    [deleteDocument, t],
  );

  const counts: Record<StatusFilter, number> = {
    all: stats.total,
    active: stats.active,
    expiring_soon: stats.expiring_soon,
    expired: stats.expired,
  };

  const hasFilters = search.trim().length > 0 || filter !== 'all';

  const listHeader = (
    <View style={{ gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}>
      <LargeHeader
        title={t('documents.title')}
        right={
          <IconButton
            testID="documents-add"
            icon="plus"
            variant="filled"
            accessibilityLabel={t('documents.add')}
            onPress={() => router.push('/documents/new')}
          />
        }
      />
      <OfflineBanner />
      <View
        style={[
          styles.search,
          { backgroundColor: colors.surfaceMuted, borderRadius: radii.md, paddingHorizontal: spacing.md },
        ]}
      >
        <Icon name="magnify" size={20} color={colors.textTertiary} />
        <TextInput
          testID="documents-search"
          value={search}
          onChangeText={setSearch}
          placeholder={t('documents.searchPlaceholder')}
          placeholderTextColor={colors.textTertiary}
          accessibilityLabel={t('documents.searchPlaceholder')}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          clearButtonMode="never"
          maxFontSizeMultiplier={1.6}
          style={[typography.body, styles.searchInput, { color: colors.text }]}
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} accessibilityRole="button" accessibilityLabel={t('documents.clearSearch')} hitSlop={10}>
            <Icon name="close-circle" size={18} color={colors.textTertiary} />
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {STATUS_FILTERS.map((value) => (
          <Chip
            key={value}
            testID={`filter-${value}`}
            role="radio"
            label={t(`documents.filters.${value}`)}
            count={counts[value]}
            selected={filter === value}
            onPress={() => setFilter(value)}
          />
        ))}
      </ScrollView>
      <Pressable
        testID="documents-sort"
        onPress={() => {
          haptics.selection();
          setSort((current) => (current === 'soonest' ? 'latest' : 'soonest'));
        }}
        accessibilityRole="button"
        accessibilityLabel={`${t('documents.sortLabel')}: ${sort === 'soonest' ? t('documents.sortSoonest') : t('documents.sortLatest')}`}
        hitSlop={8}
        style={({ pressed }) => [styles.sort, { opacity: pressed ? 0.6 : 1 }]}
      >
        <Icon name={sort === 'soonest' ? 'sort-calendar-ascending' : 'sort-calendar-descending'} size={20} color={colors.accent} />
        <AppText variant="subhead" tone="accent">
          {sort === 'soonest' ? t('documents.sortSoonest') : t('documents.sortLatest')}
        </AppText>
      </Pressable>
    </View>
  );

  let body;
  if (status === 'loading' || status === 'idle') {
    body = <LoadingView />;
  } else if (status === 'error' && items.length === 0) {
    body = <ErrorView code={error ?? 'generic'} onRetry={() => void refresh()} />;
  } else {
    body = (
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SwipeableDocumentRow document={item} onPress={openDocument} onDelete={confirmDelete} />
        )}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: colors.separator }]} />
        )}
        contentContainerStyle={results.length === 0 ? styles.emptyList : styles.listContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void refresh()}
            tintColor={colors.textSecondary}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={
          stats.total === 0 ? (
            <EmptyState
              icon="file-document-multiple-outline"
              title={t('documents.emptyTitle')}
              body={t('documents.emptyBody')}
              actionLabel={t('documents.add')}
              actionIcon="plus"
              onAction={() => router.push('/documents/new')}
            />
          ) : (
            <EmptyState
              icon="magnify"
              title={t('documents.noResultsTitle')}
              body={t('documents.noResultsBody')}
              secondaryActionLabel={hasFilters ? t('documents.clearFilters') : undefined}
              onSecondaryAction={() => {
                setSearch('');
                setFilter('all');
              }}
            />
          )
        }
        testID="documents-list"
      />
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.flex, { backgroundColor: colors.background }]}>
      {listHeader}
      <View style={[styles.flex, { backgroundColor: results.length ? colors.surface : colors.background }]}>{body}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 44,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
  },
  chips: {
    gap: 8,
    paddingRight: 8,
  },
  sort: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    minHeight: 32,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
  },
  listContent: {
    paddingBottom: 32,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});
