import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import ResponsiveContainer from './src/components/ResponsiveContainer';
import './global.css';

export default function App() {
  return (
    <SafeAreaProvider>
      <ResponsiveContainer>
        <AppNavigator />
      </ResponsiveContainer>
    </SafeAreaProvider>
  );
}

