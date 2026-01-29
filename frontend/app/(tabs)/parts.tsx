import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStockStore } from '../../store/stockStore';

export default function PartsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const { parts, loadParts } = useStockStore();
  const router = useRouter();

  useEffect(() => {
    loadParts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadParts();
    setRefreshing(false);
  };

  const renderPart = ({ item }: any) => (
    <View style={styles.partCard}>
      <View style={styles.partHeader}>
        <View style={styles.partIcon}>
          <Ionicons name="cube" size={24} color="#007AFF" />
        </View>
        <View style={styles.partInfo}>
          <Text style={styles.partName}>{item.name}</Text>
          {item.category && (
            <Text style={styles.partCategory}>{item.category}</Text>
          )}
        </View>
        {item.is_low_stock && (
          <View style={styles.lowStockBadge}>
            <Ionicons name="warning" size={16} color="#FFFFFF" />
          </View>
        )}
      </View>
      
      <View style={styles.partDetails}>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Stock:</Text>
          <Text style={[styles.detailValue, item.is_low_stock && styles.lowStockText]}>
            {item.quantity}
          </Text>
        </View>
        {item.supplier_name && (
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Supplier:</Text>
            <Text style={styles.detailValue}>{item.supplier_name}</Text>
          </View>
        )}
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Price:</Text>
          <Text style={styles.detailValue}>${item.purchase_price.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Parts Inventory</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/parts/add')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{parts.length}</Text>
          <Text style={styles.statLabel}>Total Parts</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, styles.lowStockText]}>
            {parts.filter((p) => p.is_low_stock).length}
          </Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
      </View>

      <FlatList
        data={parts}
        renderItem={renderPart}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>No parts yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first part</Text>
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
    backgroundColor: '#007AFF',
    padding: 24,
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 34,
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
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E5EA',
    marginHorizontal: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 4,
  },
  lowStockText: {
    color: '#FF3B30',
  },
  list: {
    padding: 16,
  },
  partCard: {
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
  partHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  partIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partInfo: {
    flex: 1,
    marginLeft: 12,
  },
  partName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  partCategory: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  lowStockBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  partDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 15,
    color: '#8E8E93',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
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
