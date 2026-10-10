import React from 'react';
import { View, StyleSheet } from 'react-native';

export default function ResponsiveContainer({ children }) {
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#F8F9FE',
  },
});
