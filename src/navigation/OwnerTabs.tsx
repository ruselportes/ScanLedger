import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import DashboardScreen from '../screens/owner/DashboardScreen';
import OwnerHistoryScreen from '../screens/owner/OwnerHistoryScreen';
import StaffManagementScreen from '../screens/owner/StaffManagementScreen';
import OwnerSettingsScreen from '../screens/owner/OwnerSettingsScreen';
import { Colors, FontSize } from '../theme';

const Tab = createBottomTabNavigator();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
  );
}

export default function OwnerTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ focused }) => <TabIcon icon="📊" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="History"
        component={OwnerHistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ focused }) => <TabIcon icon="📚" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Staff"
        component={StaffManagementScreen}
        options={{
          tabBarLabel: 'Staff',
          tabBarIcon: ({ focused }) => <TabIcon icon="👥" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={OwnerSettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#111827',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
  },
  tabLabel: { fontSize: FontSize.xs, fontWeight: '600' },
  tabIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: { backgroundColor: 'rgba(0,229,160,0.12)' },
});
