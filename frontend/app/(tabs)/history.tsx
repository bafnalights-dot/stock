import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function HistoryScreen() {
  const [production, setProduction] = useState<any[]>([]);
  const [sales, setSales] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prodRes, salesRes] = await Promise.all([
        axios.get(`${API_URL}/api/production`),
        axios.get(`${API_URL}/api/sales`),
      ]);
      setProduction(prodRes.data);
      setSales(salesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDeleteProduction = async (id: string, itemName: string, quantity: number) => {
    Alert.alert(
      'Delete Production',
      `Delete ${quantity} units of ${itemName}?\n\nParts will be added back to inventory.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/production/${id}`);
              Alert.alert('Success', 'Production deleted and stock updated!');
              await loadData();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const handleDeleteSale = async (id: string, itemName: string, quantity: number) => {
    Alert.alert(
      'Delete Sale',
      `Delete sale of ${quantity} units of ${itemName}?\n\nStock will be restored.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/sales/${id}`);
              Alert.alert('Success', 'Sale deleted and stock restored!');
              await loadData();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Edit History</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Production Records ({production.length})</Text>
          {production.length === 0 ? (
            <Text style={styles.emptyText}>No production records</Text>
          ) : (
            production.map((prod) => (
              <View key={prod.id} style={styles.card}>
                <View style={styles.cardContent}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="construct" size={24} color="#34C759" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{prod.item_name}</Text>
                    <Text style={styles.cardDate}>{prod.date}</Text>
                    <Text style={styles.cardQty}>Produced: {prod.quantity} units</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteProduction(prod.id, prod.item_name, prod.quantity)}
                  >
                    <Ionicons name="trash" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sales Records ({sales.length})</Text>
          {sales.length === 0 ? (
            <Text style={styles.emptyText}>No sales records</Text>
          ) : (
            sales.map((sale) => (
              <View key={sale.id} style={styles.card}>
                <View style={styles.cardContent}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="cash" size={24} color="#007AFF" />
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{sale.item_name}</Text>
                    <Text style={styles.cardDate}>{sale.date}</Text>
                    <Text style={styles.cardQty}>Sold: {sale.quantity} units</Text>
                    <Text style={styles.cardParty}>To: {sale.party_name}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteSale(sale.id, sale.item_name, sale.quantity)}
                  >
                    <Ionicons name="trash" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#FF9500" />
          <Text style={styles.infoText}>
            Deleting a record will automatically reverse the stock changes. Pull down to refresh.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: '#FF9500', padding: 24, paddingTop: 16 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  content: { flex: 1 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12, color: '#000' },
  card: { backgroundColor: '#FFF', borderRadius: 12, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  cardContent: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F2F2F7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#000', marginBottom: 4 },
  cardDate: { fontSize: 14, color: '#8E8E93', marginBottom: 4 },
  cardQty: { fontSize: 15, color: '#000', fontWeight: '500' },
  cardParty: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
  deleteButton: { padding: 8 },
  emptyText: { fontSize: 15, color: '#8E8E93', textAlign: 'center', paddingVertical: 40, fontStyle: 'italic' },
  infoBox: { flexDirection: 'row', backgroundColor: '#FFF3E0', padding: 16, borderRadius: 12, margin: 16, alignItems: 'center' },
  infoText: { flex: 1, fontSize: 14, color: '#FF9500', marginLeft: 12, lineHeight: 20 },
});
