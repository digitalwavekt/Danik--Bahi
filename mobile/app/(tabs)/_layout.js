// app/(tabs)/_layout.js
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';

export default function TabsLayout() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated()) return <Redirect href="/login" />;

  const canEdit = ['super_admin', 'society_admin', 'editor'].includes(user?.role);
  const canReport = ['super_admin', 'society_admin', 'auditor'].includes(user?.role);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#24784a',
        tabBarInactiveTintColor: '#a8a29e',
        tabBarStyle: { backgroundColor: '#fff', borderTopColor: '#e7e5e4', height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        headerStyle: { backgroundColor: '#0b2318' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 16 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Ionicons name="grid-outline" size={22} color={color} /> }}
      />
      <Tabs.Screen
        name="entries"
        options={{ title: 'Entries', tabBarIcon: ({ color }) => <Ionicons name="document-text-outline" size={22} color={color} /> }}
      />
      {canEdit && (
        <Tabs.Screen
          name="new-entry"
          options={{ title: 'Add Entry', tabBarIcon: ({ color }) => <Ionicons name="add-circle-outline" size={22} color={color} /> }}
        />
      )}
      {canReport && (
        <Tabs.Screen
          name="reports"
          options={{ title: 'Reports', tabBarIcon: ({ color }) => <Ionicons name="bar-chart-outline" size={22} color={color} /> }}
        />
      )}
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} /> }}
      />
    </Tabs>
  );
}
