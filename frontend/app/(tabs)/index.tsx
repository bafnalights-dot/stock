import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DatePicker from 'react-native-date-picker';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function DailyEntryScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [productionEntries, setProductionEntries] = useState([{ item_id: '', quantity: '' }]);
  const [salesEntries, setSalesEntries] = useState([{ item_id: '', quantity: '', party_name: '' }]);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/items`);
      setItems(response.data);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const addProductionRow = () => {
    setProductionEntries([...productionEntries, { item_id: '', quantity: '' }]);
  };

  const updateProductionEntry = (index: number, field: string, value: string) => {
    const newEntries = [...productionEntries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setProductionEntries(newEntries);
  };

  const addSalesRow = () => {
    setSalesEntries([...salesEntries, { item_id: '', quantity: '', party_name: '' }]);
  };

  const updateSalesEntry = (index: number, field: string, value: string) => {
    const newEntries = [...salesEntries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setSalesEntries(newEntries);
  };

  const handleSaveProduction = async () => {
    const validEntries = productionEntries.filter(e => e.item_id && e.quantity && parseInt(e.quantity) > 0);
    if (validEntries.length === 0) {
      Alert.alert('Error', 'Please add at least one production entry');
      return;
    }

    setLoading(true);
    try {
      for (const entry of validEntries) {
        const item = items.find(i => i.id === entry.item_id);
        await axios.post(`${API_URL}/api/production`, {
          date: selectedDate.toISOString().split('T')[0],
          item_id: entry.item_id,
          item_name: item.name,
          quantity: parseInt(entry.quantity),
        });
      }
      Alert.alert('Success', 'Production entries saved!');
      setProductionEntries([{ item_id: '', quantity: '' }]);
      await loadItems();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSales = async () => {
    const validEntries = salesEntries.filter(e => e.item_id && e.quantity && parseInt(e.quantity) > 0 && e.party_name);
    if (validEntries.length === 0) {
      Alert.alert('Error', 'Please add at least one sales entry with party name');
      return;
    }

    setLoading(true);
    try {
      for (const entry of validEntries) {
        const item = items.find(i => i.id === entry.item_id);
        await axios.post(`${API_URL}/api/sales`, {
          date: selectedDate.toISOString().split('T')[0],
          item_id: entry.item_id,
          item_name: item.name,
          quantity: parseInt(entry.quantity),
          party_name: entry.party_name,
        });
      }
      Alert.alert('Success', 'Sales entries saved!');
      setSalesEntries([{ item_id: '', quantity: '', party_name: '' }]);
      await loadItems();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bafna Light's</Text>
        <Text style={styles.headerSubtitle}>Daily Production & Sales</Text>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
          <Ionicons name="calendar" size={24} color="#007AFF" />
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="construct" size={24} color="#34C759" />
            <Text style={styles.sectionTitle}>Production</Text>
          </View>

          {productionEntries.map((entry, index) => (
            <View key={index} style={styles.entryCard}>
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={entry.item_id} onValueChange={(v) => updateProductionEntry(index, 'item_id', v)}>
                  <Picker.Item label="Select Item" value="" />
                  {items.map((item) => <Picker.Item key={item.id} label={item.name} value={item.id} />)}
                </Picker>
              </View>
              <TextInput
                style={styles.quantityInput}
                placeholder="Qty"
                keyboardType="number-pad"
                value={entry.quantity}
                onChangeText={(text) => updateProductionEntry(index, 'quantity', text)}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addProductionRow}>
            <Ionicons name="add-circle" size={24} color="#34C759" />
            <Text style={styles.addButtonText}>Add More</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.saveButton, styles.productionButton]} onPress={handleSaveProduction} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save Production</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Sales</Text>
          </View>

          {salesEntries.map((entry, index) => (
            <View key={index} style={styles.entryCard}>
              <View style={styles.pickerWrapper}>
                <Picker selectedValue={entry.item_id} onValueChange={(v) => updateSalesEntry(index, 'item_id', v)}>
                  <Picker.Item label="Select Item" value="" />
                  {items.map((item) => <Picker.Item key={item.id} label={`${item.name} (${item.current_stock})`} value={item.id} />)}
                </Picker>
              </View>
              <TextInput style={styles.quantityInput} placeholder="Qty" keyboardType="number-pad" value={entry.quantity} onChangeText={(text) => updateSalesEntry(index, 'quantity', text)} />
              <TextInput style={styles.partyInput} placeholder="Party Name" value={entry.party_name} onChangeText={(text) => updateSalesEntry(index, 'party_name', text)} />
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addSalesRow}>
            <Ionicons name="add-circle" size={24} color="#007AFF" />
            <Text style={styles.addButtonText}>Add More</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.saveButton, styles.salesButton]} onPress={handleSaveSales} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Save Sales</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <DatePicker modal open={showDatePicker} date={selectedDate} mode="date" onConfirm={(date) => { setShowDatePicker(false); setSelectedDate(date); }} onCancel={() => setShowDatePicker(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: '#007AFF', padding: 24, paddingTop: 16 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  headerSubtitle: { fontSize: 16, color: '#FFF', marginTop: 4 },
  content: { flex: 1 },
  dateSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', margin: 16, padding: 16, borderRadius: 12 },
  dateText: { flex: 1, fontSize: 17, fontWeight: '600', marginLeft: 12 },
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginLeft: 8 },
  entryCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 12, marginBottom: 12 },
  pickerWrapper: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, marginBottom: 8 },
  quantityInput: { height: 50, borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, paddingHorizontal: 12, fontSize: 17, marginBottom: 8 },
  partyInput: { height: 50, borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, paddingHorizontal: 12, fontSize: 17 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, marginBottom: 12 },
  addButtonText: { fontSize: 16, fontWeight: '600', color: '#007AFF', marginLeft: 8 },
  saveButton: { padding: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  productionButton: { backgroundColor: '#34C759' },
  salesButton: { backgroundColor: '#007AFF' },
  saveButtonText: { fontSize: 18, fontWeight: '600', color: '#FFF' },
});
