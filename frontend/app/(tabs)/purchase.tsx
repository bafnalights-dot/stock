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

export default function PurchaseScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [selectedPart, setSelectedPart] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);

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

  const selectedItem = items.find(i => i.id === selectedItemId);

  const handleSavePurchase = async () => {
    if (!selectedItemId || !selectedPart || !quantity || parseFloat(quantity) <= 0) {
      Alert.alert('Error', 'Please fill all fields with valid data');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/purchases`, {
        date: selectedDate.toISOString().split('T')[0],
        item_id: selectedItemId,
        part_name: selectedPart,
        quantity: parseFloat(quantity),
      });

      Alert.alert('Success', `Purchase recorded: ${quantity} ${selectedPart}`);
      setSelectedItemId('');
      setSelectedPart('');
      setQuantity('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Purchase Entry</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.formCard}>
          <Text style={styles.sectionHeader}>📅 Purchase Date</Text>
          
          <View style={styles.dateInputContainer}>
            <Text style={styles.label}>Day *</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="DD"
              keyboardType="number-pad"
              maxLength={2}
              value={selectedDate.getDate().toString().padStart(2, '0')}
              onChangeText={(text) => {
                const day = parseInt(text) || 1;
                const newDate = new Date(selectedDate);
                newDate.setDate(Math.min(Math.max(day, 1), 31));
                setSelectedDate(newDate);
              }}
            />
            
            <Text style={styles.label}>Month *</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="MM"
              keyboardType="number-pad"
              maxLength={2}
              value={(selectedDate.getMonth() + 1).toString().padStart(2, '0')}
              onChangeText={(text) => {
                const month = parseInt(text) || 1;
                const newDate = new Date(selectedDate);
                newDate.setMonth(Math.min(Math.max(month, 1), 12) - 1);
                setSelectedDate(newDate);
              }}
            />
            
            <Text style={styles.label}>Year *</Text>
            <TextInput
              style={styles.dateInput}
              placeholder="YYYY"
              keyboardType="number-pad"
              maxLength={4}
              value={selectedDate.getFullYear().toString()}
              onChangeText={(text) => {
                const year = parseInt(text) || 2026;
                const newDate = new Date(selectedDate);
                newDate.setFullYear(year);
                setSelectedDate(newDate);
              }}
            />
          </View>
          
          <View style={styles.dateDisplay}>
            <Text style={styles.dateDisplayText}>
              Selected: {selectedDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          </View>

          <Text style={styles.label}>Select Item *</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={selectedItemId}
              onValueChange={(value) => {
                setSelectedItemId(value);
                setSelectedPart('');
              }}
            >
              <Picker.Item label="Choose item..." value="" />
              {items.map((item) => (
                <Picker.Item key={item.id} label={item.name} value={item.id} />
              ))}
            </Picker>
          </View>

          {selectedItem && (
            <>
              <Text style={styles.label}>Select Part *</Text>
              <View style={styles.pickerWrapper}>
                <Picker
                  selectedValue={selectedPart}
                  onValueChange={(value) => setSelectedPart(value)}
                >
                  <Picker.Item label="Choose part..." value="" />
                  {selectedItem.parts.map((part: any, index: number) => (
                    <Picker.Item key={index} label={part.part_name} value={part.part_name} />
                  ))}
                </Picker>
              </View>
            </>
          )}

          <Text style={styles.label}>Quantity *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter quantity"
            keyboardType="decimal-pad"
            value={quantity}
            onChangeText={setQuantity}
          />

          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSavePurchase}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="cart" size={20} color="#FFF" />
                <Text style={styles.saveButtonText}>Record Purchase</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#007AFF" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>How it works:</Text>
            <Text style={styles.infoText}>
              1. Select item (e.g., 24w SL){'\n'}
              2. Choose the part you purchased{'\n'}
              3. Enter quantity{'\n'}
              4. Part stock will be updated automatically
            </Text>
          </View>
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
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: '#34C759', padding: 24, paddingTop: 16 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  content: { flex: 1, padding: 16 },
  formCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16 },
  dateSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F2F2F7', padding: 16, borderRadius: 12, marginBottom: 16 },
  dateText: { flex: 1, fontSize: 17, fontWeight: '600', marginLeft: 12 },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  pickerWrapper: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, marginBottom: 8 },
  input: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, padding: 12, fontSize: 17 },
  saveButton: { backgroundColor: '#34C759', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  saveButtonDisabled: { backgroundColor: '#C7C7CC' },
  saveButtonText: { fontSize: 18, fontWeight: '600', color: '#FFF', marginLeft: 8 },
  infoCard: { backgroundColor: '#E3F2FF', padding: 16, borderRadius: 12, flexDirection: 'row' },
  infoTextContainer: { flex: 1, marginLeft: 12 },
  infoTitle: { fontSize: 16, fontWeight: '600', color: '#007AFF', marginBottom: 4 },
  infoText: { fontSize: 14, color: '#007AFF', lineHeight: 20 },
});
