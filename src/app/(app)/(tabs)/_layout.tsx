import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';

import { Icon } from '@/components/ui/Icon';
import { useAppTheme } from '@/theme/ThemeProvider';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.separator },
        tabBarLabelStyle: { fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.dashboard'),
          tabBarButtonTestID: 'tab-dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? 'view-dashboard' : 'view-dashboard-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: t('tabs.documents'),
          tabBarButtonTestID: 'tab-documents',
          tabBarIcon: ({ color, focused }) => (
            <Icon name={focused ? 'file-document-multiple' : 'file-document-multiple-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarButtonTestID: 'tab-settings',
          tabBarIcon: ({ color, focused }) => <Icon name={focused ? 'cog' : 'cog-outline'} color={color} size={24} />,
        }}
      />
    </Tabs>
  );
}
