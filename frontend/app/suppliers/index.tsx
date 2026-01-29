import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStockStore } from '../../store/stockStore';

export default function SuppliersScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { suppliers, loadSuppliers } = useStockStore();
  const router = useRouter();

  useEffect(() => {
    loadSuppliers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSuppliers();
    setRefreshing(false);
  };

  const renderSupplier = ({ item }: any) => (
    <View style={styles.supplierCard}>
      <View style={styles.supplierIcon}>
        <Ionicons name="business" size={24} color="#5856D6" />
      </View>
      <View style={styles.supplierInfo}>
        <Text style={styles.supplierName}>{item.name}</Text>
        {item.contact_info && (
          <Text style={styles.supplierContact} numberOfLines={2}>
            {item.contact_info}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Suppliers</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/suppliers/add')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={suppliers}
        renderItem={renderSupplier}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>No suppliers yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add a supplier</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    backgroundColor: '#5856D6',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    padding: 16,
  },
  supplierCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  supplierIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supplierInfo: {
    flex: 1,
    marginLeft: 12,
  },
  supplierName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  supplierContact: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#C7C7CC',
    marginTop: 8,
  },
});
