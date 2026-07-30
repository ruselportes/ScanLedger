import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/auth/LoginScreen';
import StaffTabs from './StaffTabs';
import OwnerTabs from './OwnerTabs';
import { Colors } from '../theme';

export default function RootNavigator() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!session ? (
        <LoginScreen />
      ) : profile?.role === 'owner' ? (
        <OwnerTabs />
      ) : (
        <StaffTabs />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: '#0A0E1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
