import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ReportsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [partStocks, setPartStocks] = useState<any[]>([]);
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsRes, partsRes] = await Promise.all([
        axios.get(`${API_URL}/api/items`),
        axios.get(`${API_URL}/api/part-stocks`),
      ]);
      setItems(itemsRes.data);
      setPartStocks(partsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      Alert.alert('Preparing Report', 'Creating Excel file...');

      const timestamp = new Date().getTime();
      const filename = `bafna_lights_${timestamp}.xlsx`;
      const fileUri = FileSystem.documentDirectory + filename;

      const downloadResult = await FileSystem.downloadAsync(
        `${API_URL}/api/export/excel`,
        fileUri
      );

      if (downloadResult.status === 200) {
        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(downloadResult.uri, {
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            dialogTitle: 'Export Bafna Lights Report',
            UTI: 'com.microsoft.excel.xlsx',
          });
          Alert.alert('Success', 'Report exported successfully!');
        } else {
          Alert.alert('Export Complete', `File saved to: ${downloadResult.uri}`);
        }
      } else {
        throw new Error('Download failed');
      }
    } catch (error: any) {
      Alert.alert('Export Failed', error.message || 'Could not export data');
    } finally {
      setDownloading(false);
    }
  };

  const lowStockItems = items.filter(item => item.current_stock < 10);
  const lowStockParts = partStocks.filter(part => part.current_stock < 50);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stock Reports</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="bulb" size={32} color="#FF9500" />
            <Text style={styles.statValue}>{items.length}</Text>
            <Text style={styles.statLabel}>Total Items</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="cube" size={32} color="#34C759" />
            <Text style={styles.statValue}>{partStocks.length}</Text>
            <Text style={styles.statLabel}>Total Parts</Text>
          </View>
        </View>

        {lowStockItems.length > 0 && (
          <View style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={24} color="#FF3B30" />
              <Text style={styles.alertTitle}>Low Stock Items ({lowStockItems.length})</Text>
            </View>
            {lowStockItems.map((item) => (
              <Text key={item.id} style={styles.alertItem}>
                • {item.name}: {item.current_stock} units
              </Text>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Finished Goods Stock</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.stockCard}>
              <View style={styles.stockInfo}>
                <Text style={styles.stockName}>{item.name}</Text>
                <Text style={styles.stockCategory}>{item.category}</Text>
              </View>
              <View style={[styles.stockBadge, item.current_stock < 10 && styles.lowStockBadge]}>
                <Text style={styles.stockValue}>{item.current_stock}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parts Stock</Text>
          {partStocks.map((part) => (
            <View key={part.id} style={styles.stockCard}>
              <Text style={styles.stockName}>{part.part_name}</Text>
              <View style={[styles.stockBadge, part.current_stock < 50 && styles.lowStockBadge]}>
                <Text style={styles.stockValue}>{part.current_stock}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.downloadButton, downloading && styles.downloadButtonDisabled]}
          onPress={handleDownloadExcel}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="download" size={24} color="#FFF" />
              <Text style={styles.downloadButtonText}>Download Excel Report</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#007AFF" />
          <Text style={styles.infoText}>
            Excel report includes: Finished Goods Stock, Parts Stock, Production Report, Sales Report, and Purchase Report
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: '#5856D6', padding: 24, paddingTop: 16 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  content: { flex: 1, padding: 16 },
  statsGrid: { flexDirection: 'row', marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginHorizontal: 4, alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#000', marginTop: 8 },
  statLabel: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  alertCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: '#FF3B30' },
  alertHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  alertTitle: { fontSize: 18, fontWeight: '600', color: '#FF3B30', marginLeft: 8 },
  alertItem: { fontSize: 15, color: '#000', marginVertical: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  stockCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stockInfo: { flex: 1 },
  stockName: { fontSize: 17, fontWeight: '600', color: '#000' },
  stockCategory: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
  stockBadge: { backgroundColor: '#34C759', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  lowStockBadge: { backgroundColor: '#FF3B30' },
  stockValue: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  downloadButton: { backgroundColor: '#5856D6', padding: 18, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 16 },
  downloadButtonDisabled: { backgroundColor: '#C7C7CC' },
  downloadButtonText: { fontSize: 18, fontWeight: '600', color: '#FFF', marginLeft: 8 },
  infoBox: { flexDirection: 'row', backgroundColor: '#E3F2FF', padding: 16, borderRadius: 12, marginBottom: 24 },
  infoText: { flex: 1, fontSize: 14, color: '#007AFF', marginLeft: 12, lineHeight: 20 },
});
