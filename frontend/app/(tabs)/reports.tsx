import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ReportsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [partStocks, setPartStocks] = useState<any[]>([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedPartItemId, setSelectedPartItemId] = useState('');
  const [itemDetails, setItemDetails] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'summary' | 'details'>('summary');

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

  const loadItemDetails = async (itemId: string) => {
    if (!itemId) {
      setItemDetails(null);
      return;
    }
    
    try {
      const response = await axios.get(`${API_URL}/api/reports/item-details/${itemId}`);
      setItemDetails(response.data);
      setViewMode('details');
    } catch (error) {
      console.error('Error loading item details:', error);
      Alert.alert('Error', 'Failed to load item details');
    }
  };

  const handleDeleteProduction = async (productionId: string, itemName: string, quantity: number) => {
    Alert.alert(
      'Delete Production',
      `Delete ${quantity} units of ${itemName} production?\\n\\nThis will reverse stock changes.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/production/${productionId}`);
              Alert.alert('Success', 'Production deleted successfully!');
              await loadData();
              if (selectedItemId) {
                await loadItemDetails(selectedItemId);
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete production');
            }
          },
        },
      ]
    );
  };

  const handleDeleteSale = async (saleId: string, itemName: string, quantity: number) => {
    Alert.alert(
      'Delete Sale',
      `Delete sale of ${quantity} units of ${itemName}?\\n\\nThis will restore stock.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/api/sales/${saleId}`);
              Alert.alert('Success', 'Sale deleted successfully!');
              await loadData();
              if (selectedItemId) {
                await loadItemDetails(selectedItemId);
              }
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.detail || 'Failed to delete sale');
            }
          },
        },
      ]
    );
  };

  const handleDownloadExcel = async () => {
    try {
      setDownloading(true);
      Alert.alert('Preparing', 'Creating Excel report...');
      
      const timestamp = new Date().getTime();
      const filename = `bafna_lights_${timestamp}.xlsx`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      const downloadResult = await FileSystem.downloadAsync(
        `${API_URL}/api/export/excel`,
        fileUri
      );

      if (downloadResult.status === 200) {
        // Check if file was created
        const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
        
        if (fileInfo.exists) {
          // Try to share
          const canShare = await Sharing.isAvailableAsync();
          if (canShare) {
            await Sharing.shareAsync(downloadResult.uri);
            Alert.alert('Success', 'Report downloaded!');
          } else {
            Alert.alert('Saved', `File saved to:\n${downloadResult.uri}\n\nYou can find it in your device files.`);
          }
        } else {
          throw new Error('File was not created');
        }
      } else {
        throw new Error(`Server error: ${downloadResult.status}`);
      }
    } catch (error: any) {
      console.error('Download error:', error);
      Alert.alert(
        'Download Failed', 
        `Please try again. If the problem persists, contact support.\n\nError: ${error.message}`
      );
    } finally {
      setDownloading(false);
    }
  };

  const handleEmailReport = async () => {
    try {
      setEmailing(true);
      Alert.alert('Sending', 'Preparing and sending email report...');
      
      const response = await axios.post(`${API_URL}/api/email-report`);
      
      if (response.data.success) {
        Alert.alert('Success', response.data.message);
      } else {
        throw new Error('Email sending failed');
      }
    } catch (error: any) {
      console.error('Email error:', error);
      Alert.alert(
        'Email Failed', 
        `Failed to send email report. Please try again.\n\nError: ${error.response?.data?.detail || error.message}`
      );
    } finally {
      setEmailing(false);
    }
  };

  const lowStockItems = items.filter(item => item.current_stock < 10);

  if (viewMode === 'details' && itemDetails) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setViewMode('summary')} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Item Details</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.detailsCard}>
            <Text style={styles.detailsItemName}>{itemDetails.item.name}</Text>
            <Text style={styles.detailsCategory}>{itemDetails.item.category}</Text>
            <View style={styles.stockRow}>
              <Text style={styles.stockLabel}>Current Stock:</Text>
              <Text style={styles.stockValue}>{itemDetails.item.current_stock} units</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Production History ({itemDetails.production.length})</Text>
            {itemDetails.production.length === 0 ? (
              <Text style={styles.emptyText}>No production records</Text>
            ) : (
              itemDetails.production.map((prod: any) => (
                <View key={prod.id} style={styles.historyCard}>
                  <View style={styles.historyRow}>
                    <View style={styles.historyContent}>
                      <View style={styles.historyHeader}>
                        <Ionicons name="construct" size={20} color="#34C759" />
                        <Text style={styles.historyDate}>{prod.date}</Text>
                      </View>
                      <Text style={styles.historyQty}>Produced: {prod.quantity} units</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteProduction(prod.id, itemDetails.item.name, prod.quantity)}
                    >
                      <Ionicons name="trash" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sales History ({itemDetails.sales.length})</Text>
            {itemDetails.sales.length === 0 ? (
              <Text style={styles.emptyText}>No sales records</Text>
            ) : (
              itemDetails.sales.map((sale: any) => (
                <View key={sale.id} style={styles.historyCard}>
                  <View style={styles.historyRow}>
                    <View style={styles.historyContent}>
                      <View style={styles.historyHeader}>
                        <Ionicons name="cash" size={20} color="#007AFF" />
                        <Text style={styles.historyDate}>{sale.date}</Text>
                      </View>
                      <Text style={styles.historyQty}>Sold: {sale.quantity} units</Text>
                      <Text style={styles.historyParty}>To: {sale.party_name}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteSale(sale.id, itemDetails.item.name, sale.quantity)}
                    >
                      <Ionicons name="trash" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

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

        <View style={styles.filterCard}>
          <Text style={styles.filterLabel}>View Item Details:</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedItemId}
              onValueChange={(value) => {
                setSelectedItemId(value);
                if (value) {
                  loadItemDetails(value);
                }
              }}
            >
              <Picker.Item label="Select an item..." value="" />
              {items.map((item) => (
                <Picker.Item key={item.id} label={item.name} value={item.id} />
              ))}
            </Picker>
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
          {items.length === 0 ? (
            <Text style={styles.emptyText}>No items added yet. Go to Items tab to add products.</Text>
          ) : (
            items.map((item) => (
              <View key={item.id} style={styles.stockCard}>
                <View style={styles.stockInfo}>
                  <Text style={styles.stockName}>{item.name}</Text>
                  <Text style={styles.stockCategory}>{item.category}</Text>
                </View>
                <View style={[styles.stockBadge, item.current_stock < 10 && styles.lowStockBadge]}>
                  <Text style={styles.stockValue}>{item.current_stock}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Parts Stock</Text>
          
          <View style={styles.filterCard}>
            <Text style={styles.filterLabel}>Filter by Item:</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedPartItemId}
                onValueChange={(value) => setSelectedPartItemId(value)}
              >
                <Picker.Item label="All Parts" value="" />
                {items.map((item) => (
                  <Picker.Item key={item.id} label={item.name} value={item.id} />
                ))}
              </Picker>
            </View>
          </View>

          {partStocks.length === 0 ? (
            <Text style={styles.emptyText}>No parts in stock. Add items to create parts automatically.</Text>
          ) : (
            (() => {
              const selectedItem = items.find(i => i.id === selectedPartItemId);
              const filteredParts = selectedPartItemId 
                ? partStocks.filter(part => 
                    selectedItem?.parts.some((p: any) => p.part_name === part.part_name)
                  )
                : partStocks;

              return filteredParts.length === 0 ? (
                <Text style={styles.emptyText}>No parts found for this item.</Text>
              ) : (
                filteredParts.map((part) => (
                  <View key={part.id} style={styles.stockCard}>
                    <Text style={styles.stockName}>{part.part_name}</Text>
                    <View style={[styles.stockBadge, part.current_stock < 50 && styles.lowStockBadge]}>
                      <Text style={styles.stockValue}>{part.current_stock}</Text>
                    </View>
                  </View>
                ))
              );
            })()
          )}
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
            Excel report includes: Finished Goods, Parts, Production, Sales, and Purchase reports
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: '#5856D6', padding: 24, paddingTop: 16, flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF', flex: 1, textAlign: 'center' },
  backButton: { width: 44, height: 44, justifyContent: 'center' },
  placeholder: { width: 44 },
  content: { flex: 1, padding: 16 },
  statsGrid: { flexDirection: 'row', marginBottom: 16 },
  statCard: { flex: 1, backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginHorizontal: 4, alignItems: 'center' },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#000', marginTop: 8 },
  statLabel: { fontSize: 14, color: '#8E8E93', marginTop: 4 },
  filterCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16 },
  filterLabel: { fontSize: 17, fontWeight: '600', marginBottom: 12 },
  pickerWrapper: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8 },
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
  emptyText: { fontSize: 15, color: '#8E8E93', fontStyle: 'italic', textAlign: 'center', paddingVertical: 20 },
  detailsCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 12, marginBottom: 16 },
  detailsItemName: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  detailsCategory: { fontSize: 16, color: '#8E8E93', marginTop: 4, marginBottom: 16 },
  stockRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E5EA' },
  stockLabel: { fontSize: 17, color: '#000' },
  historyCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12 },
  historyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  historyContent: { flex: 1 },
  historyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  historyDate: { fontSize: 16, fontWeight: '600', marginLeft: 8, color: '#000' },
  historyQty: { fontSize: 15, color: '#000', marginLeft: 28 },
  historyParty: { fontSize: 14, color: '#8E8E93', marginLeft: 28, marginTop: 4 },
  deleteButton: { padding: 8, marginLeft: 12 },
});
