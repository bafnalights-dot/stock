import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
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

  // Production entries for today
  const [productionEntries, setProductionEntries] = useState([
    { item_id: '', quantity: '' },
  ]);

  // Sales entries for today
  const [salesEntries, setSalesEntries] = useState([
    { item_id: '', quantity: '', party_name: '' },
  ]);

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

  const removeProductionRow = (index: number) => {
    const newEntries = productionEntries.filter((_, i) => i !== index);
    setProductionEntries(newEntries);
  };

  const updateProductionEntry = (index: number, field: string, value: string) => {
    const newEntries = [...productionEntries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setProductionEntries(newEntries);
  };

  const addSalesRow = () => {
    setSalesEntries([...salesEntries, { item_id: '', quantity: '', party_name: '' }]);
  };

  const removeSalesRow = (index: number) => {
    const newEntries = salesEntries.filter((_, i) => i !== index);
    setSalesEntries(newEntries);
  };

  const updateSalesEntry = (index: number, field: string, value: string) => {
    const newEntries = [...salesEntries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setSalesEntries(newEntries);
  };

  const handleSaveProduction = async () => {
    const validEntries = productionEntries.filter(
      (e) => e.item_id && e.quantity && parseInt(e.quantity) > 0
    );

    if (validEntries.length === 0) {
      Alert.alert('Error', 'Please add at least one production entry');
      return;
    }

    setLoading(true);
    try {
      for (const entry of validEntries) {
        const item = items.find((i) => i.id === entry.item_id);
        await axios.post(`${API_URL}/api/production`, {
          date: selectedDate.toISOString().split('T')[0],
          item_id: entry.item_id,
          item_name: item.name,
          quantity: parseInt(entry.quantity),
        });
      }

      Alert.alert('Success', `${validEntries.length} production entries saved!`);
      setProductionEntries([{ item_id: '', quantity: '' }]);
      await loadItems();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail?.message || 'Failed to save production entries'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSales = async () => {
    const validEntries = salesEntries.filter(
      (e) => e.item_id && e.quantity && parseInt(e.quantity) > 0 && e.party_name
    );

    if (validEntries.length === 0) {
      Alert.alert('Error', 'Please add at least one sales entry with party name');
      return;
    }

    setLoading(true);
    try {
      for (const entry of validEntries) {
        const item = items.find((i) => i.id === entry.item_id);
        await axios.post(`${API_URL}/api/sales`, {
          date: selectedDate.toISOString().split('T')[0],
          item_id: entry.item_id,
          item_name: item.name,
          quantity: parseInt(entry.quantity),
          party_name: entry.party_name,
        });
      }

      Alert.alert('Success', `${validEntries.length} sales entries saved!`);
      setSalesEntries([{ item_id: '', quantity: '', party_name: '' }]);
      await loadItems();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.detail || 'Failed to save sales entries'
      );
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
        {/* Date Selector */}
        <TouchableOpacity
          style={styles.dateSelector}
          onPress={() => setShowDatePicker(true)}
        >
          <Ionicons name="calendar" size={24} color="#007AFF" />
          <Text style={styles.dateText}>
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'short',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#8E8E93" />
        </TouchableOpacity>

        {/* Production Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="construct" size={24} color="#34C759" />
            <Text style={styles.sectionTitle}>Today's Production</Text>
          </View>

          {productionEntries.map((entry, index) => (
            <View key={index} style={styles.entryCard}>
              <View style={styles.entryRow}>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={entry.item_id}
                    onValueChange={(value) => updateProductionEntry(index, 'item_id', value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Item" value="" />
                    {items.map((item) => (
                      <Picker.Item key={item.id} label={item.name} value={item.id} />
                    ))}
                  </Picker>
                </View>
                <TextInput
                  style={styles.quantityInput}
                  placeholder="Qty"
                  keyboardType="number-pad"
                  value={entry.quantity}
                  onChangeText={(text) => updateProductionEntry(index, 'quantity', text)}
                />
                {productionEntries.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeProductionRow(index)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={28} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addProductionRow}>
            <Ionicons name="add-circle" size={24} color="#34C759" />
            <Text style={styles.addButtonText}>Add More Items</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, styles.productionButton]}
            onPress={handleSaveProduction}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Production</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Sales Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="cash" size={24} color="#007AFF" />
            <Text style={styles.sectionTitle}>Today's Sales</Text>
          </View>

          {salesEntries.map((entry, index) => (
            <View key={index} style={styles.entryCard}>
              <View style={styles.entryRow}>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={entry.item_id}
                    onValueChange={(value) => updateSalesEntry(index, 'item_id', value)}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select Item" value="" />
                    {items.map((item) => (
                      <Picker.Item
                        key={item.id}
                        label={`${item.name} (${item.current_stock})`}
                        value={item.id}
                      />
                    ))}
                  </Picker>
                </View>
                <TextInput
                  style={styles.quantityInput}
                  placeholder="Qty"
                  keyboardType="number-pad"
                  value={entry.quantity}
                  onChangeText={(text) => updateSalesEntry(index, 'quantity', text)}
                />
                {salesEntries.length > 1 && (
                  <TouchableOpacity
                    onPress={() => removeSalesRow(index)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close-circle" size={28} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={styles.partyInput}
                placeholder="Party/Customer Name"
                value={entry.party_name}
                onChangeText={(text) => updateSalesEntry(index, 'party_name', text)}
              />
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addSalesRow}>
            <Ionicons name="add-circle" size={24} color="#007AFF" />
            <Text style={styles.addButtonText}>Add More Items</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, styles.salesButton]}
            onPress={handleSaveSales}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Sales</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <DatePicker
        modal
        open={showDatePicker}
        date={selectedDate}
        mode="date"
        onConfirm={(date) => {
          setShowDatePicker(false);
          setSelectedDate(date);
        }}
        onCancel={() => setShowDatePicker(false)}
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
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dateText: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 12,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginLeft: 8,
  },
  entryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    overflow: 'hidden',
    marginRight: 8,
  },
  picker: {
    height: 50,
  },
  quantityInput: {
    width: 80,
    height: 50,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 17,
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
  },
  removeButton: {
    marginLeft: 8,
  },
  partyInput: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 17,
    backgroundColor: '#FFFFFF',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginBottom: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  productionButton: {
    backgroundColor: '#34C759',
  },
  salesButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
