import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet } from 'react-native';
import StaffStack from './StaffStack';
import StaffHistoryScreen from '../screens/staff/StaffHistoryScreen';
import { Colors, FontSize } from '../theme';

const Tab = createBottomTabNavigator();

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <View style={[styles.tabIcon, focused && styles.tabIconActive]}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
    </View>
  );
}

export default function StaffTabs() {
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
        name="ScanTab"
        component={StaffStack}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ focused }) => <TabIcon icon="📷" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="HistoryTab"
        component={StaffHistoryScreen}
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ focused }) => <TabIcon icon="📋" focused={focused} />,
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
