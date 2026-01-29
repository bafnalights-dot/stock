import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DailyEntryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bafna Light's</Text>
        <Text style={styles.subtitle}>Daily Production & Sales</Text>
      </View>
      <ScrollView style={styles.content}>
        <Text style={styles.text}>Daily Entry Screen - Coming Soon</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: '#007AFF', padding: 24 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFFFFF' },
  subtitle: { fontSize: 16, color: '#FFFFFF', marginTop: 4 },
  content: { flex: 1, padding: 16 },
  text: { fontSize: 18, color: '#000' },
});
