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
import axios from 'axios';
import { format } from 'date-fns';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function TransactionsScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/transactions`);
      setTransactions(response.data);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const renderTransaction = ({ item }: any) => {
    const isAssembly = item.type === 'assembly';
    const icon = isAssembly ? 'construct' : 'cart';
    const color = isAssembly ? '#34C759' : '#007AFF';
    const bgColor = isAssembly ? '#E8F8EC' : '#E3F2FF';

    return (
      <View style={styles.transactionCard}>
        <View style={[styles.transactionIcon, { backgroundColor: bgColor }]}>
          <Ionicons name={icon} size={20} color={color} />
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionType}>
            {isAssembly ? 'Assembly' : 'Purchase'}
          </Text>
          <Text style={styles.transactionDate}>
            {format(new Date(item.date), 'MMM dd, yyyy HH:mm')}
          </Text>
          {isAssembly && item.details.product_name && (
            <Text style={styles.transactionDetail}>
              {item.details.quantity_produced}x {item.details.product_name}
            </Text>
          )}
          {!isAssembly && item.details.part_name && (
            <Text style={styles.transactionDetail}>
              {item.details.quantity}x {item.details.part_name}
            </Text>
          )}
        </View>
        <Text style={styles.transactionCost}>${item.cost.toFixed(2)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions</Text>
        <View style={styles.placeholder} />
      </View>

      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="receipt-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>
              Transactions will appear here as you purchase parts and assemble products
            </Text>
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
    backgroundColor: '#FF9500',
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
  placeholder: {
    width: 44,
  },
  list: {
    padding: 16,
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  transactionType: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  transactionDate: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  transactionDetail: {
    fontSize: 14,
    color: '#000000',
    marginTop: 4,
  },
  transactionCost: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
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
    textAlign: 'center',
  },
});
