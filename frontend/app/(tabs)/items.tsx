import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function ItemsScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Street Light',
    opening_stock: '0',
  });
  const [parts, setParts] = useState([{ part_name: '', quantity_needed: '1' }]);

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

  const addPartRow = () => {
    setParts([...parts, { part_name: '', quantity_needed: '1' }]);
  };

  const updatePart = (index: number, field: string, value: string) => {
    const newParts = [...parts];
    newParts[index] = { ...newParts[index], [field]: value };
    setParts(newParts);
  };

  const removePart = (index: number) => {
    if (parts.length > 1) {
      setParts(parts.filter((_, i) => i !== index));
    }
  };

  const handleSaveItem = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Please enter item name');
      return;
    }

    const validParts = parts.filter(p => p.part_name && parseFloat(p.quantity_needed) > 0);
    if (validParts.length === 0) {
      Alert.alert('Error', 'Please add at least one part');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/items`, {
        name: formData.name,
        category: formData.category,
        opening_stock: parseFloat(formData.opening_stock),
        parts: validParts.map(p => ({
          part_name: p.part_name,
          quantity_needed: parseFloat(p.quantity_needed),
        })),
      });

      Alert.alert('Success', 'Item added successfully!');
      setFormData({ name: '', category: 'Street Light', opening_stock: '0' });
      setParts([{ part_name: '', quantity_needed: '1' }]);
      setShowForm(false);
      await loadItems();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Items Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? "close" : "add"} size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Add New Item</Text>

            <Text style={styles.label}>Item Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 24w SL, 50w FL"
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
            />

            <Text style={styles.label}>Category *</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <Picker.Item label="Street Light" value="Street Light" />
                <Picker.Item label="Flood Light" value="Flood Light" />
              </Picker>
            </View>

            <Text style={styles.label}>Opening Stock</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              keyboardType="number-pad"
              value={formData.opening_stock}
              onChangeText={(text) => setFormData({ ...formData, opening_stock: text })}
            />

            <Text style={styles.label}>Parts Required *</Text>
            {parts.map((part, index) => (
              <View key={index} style={styles.partRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="Part name (e.g., Body, Lens)"
                  value={part.part_name}
                  onChangeText={(text) => updatePart(index, 'part_name', text)}
                />
                <TextInput
                  style={[styles.input, { width: 70, marginRight: 8 }]}
                  placeholder="Qty"
                  keyboardType="number-pad"
                  value={part.quantity_needed}
                  onChangeText={(text) => updatePart(index, 'quantity_needed', text)}
                />
                {parts.length > 1 && (
                  <TouchableOpacity onPress={() => removePart(index)}>
                    <Ionicons name="close-circle" size={28} color="#FF3B30" />
                  </TouchableOpacity>
                )}
              </View>
            ))}

            <TouchableOpacity style={styles.addPartButton} onPress={addPartRow}>
              <Ionicons name="add-circle" size={20} color="#007AFF" />
              <Text style={styles.addPartText}>Add Part</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSaveItem}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Item</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.itemsList}>
          <Text style={styles.listTitle}>All Items ({items.length})</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                </View>
                <View style={styles.stockBadge}>
                  <Text style={styles.stockText}>{item.current_stock}</Text>
                </View>
              </View>
              <Text style={styles.partsText}>Parts: {item.parts.length} items</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { backgroundColor: '#FF9500', padding: 24, paddingTop: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#FFF' },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  formCard: { backgroundColor: '#FFF', margin: 16, padding: 16, borderRadius: 12 },
  formTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  label: { fontSize: 15, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8, padding: 12, fontSize: 17 },
  pickerWrapper: { borderWidth: 1, borderColor: '#E5E5EA', borderRadius: 8 },
  partRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  addPartButton: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  addPartText: { fontSize: 16, color: '#007AFF', marginLeft: 8 },
  saveButton: { backgroundColor: '#FF9500', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 16 },
  saveButtonDisabled: { backgroundColor: '#C7C7CC' },
  saveButtonText: { fontSize: 18, fontWeight: '600', color: '#FFF' },
  itemsList: { padding: 16 },
  listTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  itemCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 12 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  itemName: { fontSize: 18, fontWeight: '600' },
  itemCategory: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
  stockBadge: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  stockText: { fontSize: 16, fontWeight: 'bold', color: '#FFF' },
  partsText: { fontSize: 14, color: '#8E8E93' },
});
