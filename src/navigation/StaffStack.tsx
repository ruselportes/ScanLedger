import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ParsedEntry } from '../types';
import CameraScreen from '../screens/staff/CameraScreen';
import ReviewScreen from '../screens/staff/ReviewScreen';
import UploadSuccessScreen from '../screens/staff/UploadSuccessScreen';
import StaffHistoryScreen from '../screens/staff/StaffHistoryScreen';

export type StaffStackParamList = {
  Camera: undefined;
  Review: { imageUri: string; parsedEntries: ParsedEntry[] };
  UploadSuccess: { total: number; entryCount: number };
  History: undefined;
};

const Stack = createNativeStackNavigator<StaffStackParamList>();

export default function StaffStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Camera" component={CameraScreen} />
      <Stack.Screen name="Review" component={ReviewScreen} />
      <Stack.Screen name="UploadSuccess" component={UploadSuccessScreen} />
      <Stack.Screen name="History" component={StaffHistoryScreen} />
    </Stack.Navigator>
  );
}
